import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './config/env.js';
import { adminRouter } from './routes/adminRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { charityRouter } from './routes/charityRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { drawRouter } from './routes/drawRoutes.js';
import { scoreRouter } from './routes/scoreRoutes.js';
import { subscriptionRouter } from './routes/subscriptionRoutes.js';
import { winnerRouter } from './routes/winnerRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

const allowedOrigins = new Set([
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]);

/* ---------------------- SWAGGER CONFIG ---------------------- */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Heroes API',
      version: '1.0.0',
      description: 'API documentation for Digital Heroes backend',
    },
    servers: [
      {
        url: `http://localhost:${env.port || 3000}`,
      },
    ],
  },
  apis: ['./routes/**/*.js'], // supports nested route files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
/* ----------------------------------------------------------- */

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ✅ Swagger BEFORE rate limiter (so docs won't get blocked)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use('/uploads', express.static(path.resolve('uploads')));

/* ---------------------- HEALTH CHECK ---------------------- */
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', service: 'digital-heroes-backend' });
});

/* ---------------------- ROUTES ---------------------- */
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/scores', scoreRouter);
app.use('/api/charities', charityRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/draws', drawRouter);
app.use('/api/winners', winnerRouter);
app.use('/api/admin', adminRouter);

/* ---------------------- ERROR HANDLING ---------------------- */
app.use(notFound);
app.use(errorHandler);
