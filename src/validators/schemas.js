import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB id');
const scoreDate = z.coerce.date();

export const authSchemas = {
  register: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      selectedCharity: objectId.optional(),
      charityContributionPercentage: z.number().min(10).max(100).optional(),
      country: z.string().min(2).max(3).optional()
    })
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  }),
  verifyEmail: z.object({
    body: z.object({
      token: z.string().min(20)
    })
  }),
  resendVerification: z.object({
    body: z.object({
      email: z.string().email()
    })
  })
};

export const scoreSchemas = {
  create: z.object({
    body: z.object({
      value: z.number().int().min(1).max(45),
      playedAt: scoreDate,
      notes: z.string().max(500).optional()
    })
  }),
  update: z.object({
    params: z.object({ id: objectId }),
    body: z.object({
      value: z.number().int().min(1).max(45).optional(),
      playedAt: scoreDate.optional(),
      notes: z.string().max(500).optional()
    })
  }),
  id: z.object({ params: z.object({ id: objectId }) })
};

export const charitySchemas = {
  create: z.object({
    body: z.object({
      name: z.string().min(2),
      slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
      description: z.string().min(10),
      category: z.string().optional(),
      country: z.string().optional(),
      websiteUrl: z.string().url().optional(),
      imageUrls: z.array(z.string().url()).optional(),
      upcomingEvents: z.array(z.object({
        title: z.string(),
        startsAt: scoreDate.optional(),
        location: z.string().optional(),
        url: z.string().url().optional()
      })).optional(),
      isFeatured: z.boolean().optional(),
      isActive: z.boolean().optional()
    })
  }),
  update: z.object({
    params: z.object({ id: objectId }),
    body: z.record(z.any())
  }),
  id: z.object({ params: z.object({ id: objectId }) })
};

export const subscriptionSchemas = {
  checkout: z.object({
    body: z.object({
      plan: z.enum(['monthly', 'yearly'])
    })
  }),
  razorpayOrder: z.object({
    body: z.object({
      plan: z.enum(['monthly', 'yearly'])
    })
  }),
  razorpayVerify: z.object({
    body: z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1)
    })
  }),
  manualActivate: z.object({
    body: z.object({
      userId: objectId,
      plan: z.enum(['monthly', 'yearly']),
      months: z.number().int().min(1).max(24).optional()
    })
  })
};

export const drawSchemas = {
  run: z.object({
    body: z.object({
      month: z.number().int().min(1).max(12),
      year: z.number().int().min(2020).max(2100),
      logic: z.enum(['random', 'algorithmic']).default('random')
    })
  }),
  id: z.object({ params: z.object({ id: objectId }) })
};

export const winnerSchemas = {
  id: z.object({ params: z.object({ id: objectId }) }),
  review: z.object({
    params: z.object({ id: objectId }),
    body: z.object({
      status: z.enum(['approved', 'rejected']),
      note: z.string().max(1000).optional()
    })
  })
};
