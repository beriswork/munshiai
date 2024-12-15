import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local')
}

const uri = process.env.MONGODB_URI
const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 50
}

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const client = new MongoClient(uri, options)
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  clientPromise = client.connect()
}

export default clientPromise 