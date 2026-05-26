import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    console.log(`Connecting to custom MongoDB at: ${uri}`);
    try {
      await mongoose.connect(uri);
      console.log('Connected to custom MongoDB database.');
    } catch (err) {
      console.error('Failed to connect to custom MongoDB database:', err.message);
      throw err;
    }
  } else {
    console.log('No MONGODB_URI provided in environment. Initializing in-memory MongoDB...');
    try {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`In-memory MongoDB server running at: ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log('Connected to in-memory MongoDB successfully.');
    } catch (err) {
      console.error('Failed to initialize in-memory MongoDB:', err.message);
      throw err;
    }
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
      console.log('In-memory MongoDB stopped.');
    }
  } catch (err) {
    console.error('Error during database disconnect:', err.message);
  }
}
