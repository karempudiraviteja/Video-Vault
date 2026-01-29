import mongoose from 'mongoose';
import config from './index.js';

/**
 * Initialize MongoDB connection
 */
export const initializeDatabase = async () => {
  try {
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * Close database connection
 */
export const closeDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB:', error.message);
  }
};

export default { initializeDatabase, closeDatabase };
