/**
 * MongoDB Local → MongoDB Atlas Migration Script
 * DDS Auth Platform — by Zogoal
 *
 * Usage:
 *   node scripts/migrate_mongo_to_atlas.js [--target=<ATLAS_URI>]
 *
 * Environment variables:
 *   SOURCE_MONGODB_URI (default: mongodb://127.0.0.1:27017/dds_auth)
 *   TARGET_MONGODB_URI or MONGODB_URI (if Atlas connection string)
 */

import { MongoClient } from 'mongodb'

function sanitizeUri(uri) {
  if (!uri) return '(none)'
  try {
    return uri.replace(/\/\/(.*):(.*)@/, '//***:***@')
  } catch {
    return '(hidden)'
  }
}

async function main() {
  const args = process.argv.slice(2)
  let targetUriFromArg = null
  for (const arg of args) {
    if (arg.startsWith('--target=')) {
      targetUriFromArg = arg.split('=')[1]
    }
  }

  const sourceUri = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27017/dds_auth'
  let targetUri = targetUriFromArg || process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI

  // If MONGODB_URI points to localhost, do not use it as target
  if (targetUri && (targetUri.includes('127.0.0.1') || targetUri.includes('localhost'))) {
    targetUri = null
  }

  console.log('')
  console.log('╔══════════════════════════════════════════════════════╗')
  console.log('║  DDS Auth — MongoDB Local → Atlas Migration Utility  ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Source Database: Local MongoDB (${sourceUri})`)
  console.log(`Target Database: ${targetUri ? 'MongoDB Atlas (' + sanitizeUri(targetUri) + ')' : 'Inspection Mode (No Atlas URI provided)'}`)
  console.log('')

  // 1. Connect to Local Source Database
  const sourceClient = new MongoClient(sourceUri)
  await sourceClient.connect()
  const sourceDb = sourceClient.db('dds_auth')

  const collections = await sourceDb.listCollections().toArray()
  console.log('--- LOCAL DATABASE INSPECTION ---')
  const localSummary = {}

  for (const col of collections) {
    const count = await sourceDb.collection(col.name).countDocuments()
    localSummary[col.name] = count
    console.log(`  Collection [${col.name.padEnd(22)}]: ${count} documents`)
  }
  console.log('')

  if (!targetUri) {
    console.log('ℹ No MongoDB Atlas TARGET_MONGODB_URI provided.')
    console.log('  To run migration to Atlas, execute:')
    console.log('  node scripts/migrate_mongo_to_atlas.js --target="mongodb+srv://<user>:<pass>@<cluster>/dds_auth"')
    console.log('')
    await sourceClient.close()
    return
  }

  // 2. Connect to Target Atlas Database
  console.log('--- CONNECTING TO MONGODB ATLAS ---')
  const targetClient = new MongoClient(targetUri)
  await targetClient.connect()
  const targetDbName = 'dds_auth'
  const targetDb = targetClient.db(targetDbName)
  console.log(`✓ Connected to MongoDB Atlas (${targetDbName})`)
  console.log('')

  console.log('--- MIGRATING COLLECTIONS ---')
  const atlasSummary = {}

  for (const col of collections) {
    const colName = col.name
    const docs = await sourceDb.collection(colName).find({}).toArray()

    if (docs.length === 0) {
      atlasSummary[colName] = 0
      console.log(`  Collection [${colName.padEnd(22)}]: 0 documents to migrate`)
      continue
    }

    // Bulk upsert preserving exact _id, ObjectIds, and document structure
    const operations = docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true
      }
    }))

    const result = await targetDb.collection(colName).bulkWrite(operations)
    const atlasCount = await targetDb.collection(colName).countDocuments()
    atlasSummary[colName] = atlasCount

    console.log(`  Collection [${colName.padEnd(22)}]: Migrated ${docs.length} docs (Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}) | Total Atlas: ${atlasCount}`)
  }

  console.log('')
  console.log('--- MIGRATION SUMMARY ---')
  console.table(
    Object.keys(localSummary).map((col) => ({
      Collection: col,
      'Local Count': localSummary[col],
      'Atlas Count': atlasSummary[col] || 0,
      Status: localSummary[col] === (atlasSummary[col] || 0) ? '✓ MATCHED' : '⚠ DIFFERENCE'
    }))
  )

  await sourceClient.close()
  await targetClient.close()
  console.log('')
  console.log('✓ Migration completed successfully.')
}

main().catch((err) => {
  console.error('✗ Migration failed:', err.message)
  process.exit(1)
})
