import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { Charity } from '../src/models/Charity.js';
import { Donation } from '../src/models/Donation.js';
import { Draw } from '../src/models/Draw.js';
import { Score } from '../src/models/Score.js';
import { Subscription } from '../src/models/Subscription.js';
import { User } from '../src/models/User.js';
import { Winner } from '../src/models/Winner.js';
import { Payment } from '../src/models/Payment.js';
import { createActiveSubscription } from '../src/controllers/subscriptionController.js';

async function seed() {
  await connectDb();

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

  const charities = await Charity.insertMany([
    {
      name: 'Fairways for Futures',
      slug: 'fairways-for-futures',
      description: 'Funding youth mentoring, education access, and community wellbeing programs.',
      category: 'Youth',
      country: 'GB',
      websiteUrl: 'https://digitalheroes.co.in',
      imageUrls: ['https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a'],
      isFeatured: true,
      upcomingEvents: [{ title: 'Impact Golf Day', startsAt: new Date('2026-06-15'), location: 'London' }]
    },
    {
      name: 'Second Chance Sports Trust',
      slug: 'second-chance-sports-trust',
      description: 'Helping people rebuild confidence through sport, coaching, and mental-health support.',
      category: 'Health',
      country: 'GB',
      websiteUrl: 'https://digitalheroes.co.in',
      imageUrls: ['https://images.unsplash.com/photo-1511632765486-a01980e01a18'],
      isFeatured: false
    }
  ]);

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

  await Score.insertMany([
    { user: user._id, value: 32, playedAt: new Date('2026-04-01') },
    { user: user._id, value: 28, playedAt: new Date('2026-04-04') },
    { user: user._id, value: 41, playedAt: new Date('2026-04-08') },
    { user: user._id, value: 36, playedAt: new Date('2026-04-12') },
    { user: user._id, value: 22, playedAt: new Date('2026-04-16') }
  ]);

  console.log('Seed complete');
  


  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
