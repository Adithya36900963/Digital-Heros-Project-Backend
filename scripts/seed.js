import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { Charity } from '../src/models/Charity.js';
import { User } from '../src/models/User.js';
import { Score } from '../src/models/Score.js';
import { Subscription } from '../src/models/Subscription.js';
import { Donation } from '../src/models/Donation.js';
import { Draw } from '../src/models/Draw.js';
import { Winner } from '../src/models/Winner.js';
import { Payment } from '../src/models/Payment.js';
import { createActiveSubscription } from '../src/controllers/subscriptionController.js';

async function seed() {
  await connectDb();

  // ✅ wipe all collections
  await Promise.all([
    User.deleteMany({}),
    Charity.deleteMany({}),
    Score.deleteMany({}),
    Subscription.deleteMany({}),
    Donation.deleteMany({}),
    Draw.deleteMany({}),
    Winner.deleteMany({}),
    Payment.deleteMany({})
  ]);

  // ✅ minimal charity (needed for reference)
  const charities = await Charity.insertMany([
    {
      name: 'Adithya Trust',
      slug: 'default-charity',
      description: 'Default seed charity',
      category: 'General',
      country: 'India',
      websiteUrl: 'https://digitalheroes.co.in',
      imageUrls: [],
      isFeatured: true
    }
  ]);

  // ✅ ONLY THESE TWO USERS
  const [admin, user] = await User.insertMany([
    {
      name: 'Digital Heroes Admin',
      email: '23bq1a4747@gmail.com',
      passwordHash: await User.hashPassword('Adi143Rupa@369@'),
      role: 'admin',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      selectedCharity: charities[0]._id,
      charityContributionPercentage: 10
    },
    {
      name: 'Adithya',
      email: 'adithyaseshuvardhan0963@gmail.com',
      passwordHash: await User.hashPassword('Adithya@369@'),
      role: 'subscriber',
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      selectedCharity: charities[0]._id,
      charityContributionPercentage: 15
    }
  ]);

  await createActiveSubscription({ user, plan: 'monthly', provider: 'manual' });

  console.log('Seed complete');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});