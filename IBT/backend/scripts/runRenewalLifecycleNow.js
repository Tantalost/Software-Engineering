import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import { processContractRenewalLifecycle } from '../utils/cleanUP.js';

const waitForDb = async () => {
  if (mongoose.connection.readyState === 1) return;

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for MongoDB connection.'));
    }, 15000);

    mongoose.connection.once('connected', () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};

const run = async () => {
  try {
    await connectDB();
    await waitForDb();

    const result = await processContractRenewalLifecycle();
    console.log('[RENEWAL TEST] Result:', JSON.stringify(result));
  } catch (error) {
    console.error('[RENEWAL TEST] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
};

run();
