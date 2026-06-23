import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('Error: MONGODB_URI is not defined in environment variables.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      dbName: 'japanese_dictionary'
    });

    console.log(`MongoDB Connected: ${conn.connection.host}, DB: ${conn.connection.db?.databaseName}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    console.error(`Please check if your current IP is whitelisted on MongoDB Atlas or if your local MongoDB is running.`);
    // Do not run process.exit(1) to let the server start and mongoose attempt automatic reconnection in background.
  }
};
