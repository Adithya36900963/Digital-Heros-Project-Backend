import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { User } from '../src/models/User.js';

async function run() {
  await connectDb();
  const result = await User.updateMany(
    { isEmailVerified: { $ne: true } },
    {
      $set: {
        isEmailVerified: true,
        emailVerifiedAt: new Date()
      },
      $unset: {
        emailVerificationTokenHash: '',
        emailVerificationExpiresAt: ''
      }
    }
  );

  console.log(`Marked ${result.modifiedCount} existing users as verified.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
