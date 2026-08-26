import { MongoClient } from 'mongodb'
import crypto from 'crypto'

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017')
  await client.connect()

  const clientId = 'dds_client_demoshop'
  const clientSecret = 'dds_secret_demoshop'
  const clientSecretHash = crypto.createHash('sha256').update(clientSecret).digest('hex')

  const appDoc = {
    applicationId: 'app_demoshop',
    name: 'DemoShop',
    clientId,
    clientSecret,
    clientSecretHash,
    status: 'active',
    allowedOrigins: ['http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://127.0.0.1:5175'],
    callbackUrls: ['http://localhost:5175/callback'],
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  for (const dbName of ['dds_auth', 'dds-auth']) {
    const db = client.db(dbName)
    await db.collection('applications').updateOne(
      { clientId },
      { $set: appDoc },
      { upsert: true }
    )
  }

  console.log('✓ DemoShop application correctly seeded into MongoDB!')
  await client.close()
}

main().catch(console.error)
