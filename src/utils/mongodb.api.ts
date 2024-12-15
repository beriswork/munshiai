import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

let cachedClient: MongoClient | null = null
let cachedDb: any = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = new MongoClient(uri, options)
  await client.connect()
  const db = client.db(process.env.MONGODB_DB)

  cachedClient = client
  cachedDb = db

  return { client, db }
} 