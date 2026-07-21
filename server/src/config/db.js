import mongoose from 'mongoose';
import env from './env.js';

let cached = global._mongooseCache;
let mongodServer;

export async function connectDB() {
  if (cached) return cached;

  let uri = env.mongoUri;

  // On Vercel without a real MONGODB_URI, auto-start an in-memory MongoDB
  if (!process.env.MONGODB_URI && process.env.VERCEL) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongodServer = await MongoMemoryServer.create({
      instance: { dbName: 'tourmate' },
    });
    uri = mongodServer.getUri();
    console.log('[db] Using in-memory MongoDB (no MONGODB_URI set)');
  }

  cached = await mongoose.connect(uri);
  global._mongooseCache = cached;
  console.log(`[db] Connected to MongoDB at ${uri}`);
  return cached;
}

export default connectDB;
