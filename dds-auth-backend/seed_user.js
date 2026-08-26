import { MongoClient } from 'mongodb'

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017')
  await client.connect()

  for (const dbName of ['dds_auth', 'dds-auth']) {
    const db = client.db(dbName)
    const existing = await db.collection('users').findOne({ mobileId: '+918637628773' })
    const userId = existing?.userId || `usr_${Date.now()}`

    const userDoc = {
      userId,
      mobileId: '+918637628773',
      phoneNumber: '8637628773',
      countryCode: '+91',
      phoneVerified: true,
      name: 'Test Mobile User',
      displayName: 'Test Mobile User',
      email: 'user@example.com',
      status: 'active',
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    }

    await db.collection('users').updateOne(
      { mobileId: '+918637628773' },
      { $set: userDoc },
      { upsert: true }
    )
  }

  console.log('✓ Test user (+918637628773) correctly seeded into MongoDB!')
  await client.close()
}

main().catch(console.error)
