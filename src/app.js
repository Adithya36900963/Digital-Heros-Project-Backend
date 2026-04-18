import express from 'express';
import cors from 'cors';
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

/* ✅ CREATE APP FIRST */
export const app = express();

/* ---------------------- CORS ---------------------- */

const allowedOrigins = [
  env.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // allow Render testing
    }
  },
  credentials: true
}));

/* ---------------------- SWAGGER ---------------------- */

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Digital Heroes API',
      version: '1.0.0'
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL ||
             `http://localhost:${env.port || 3000}`
      }
    ]
  },
  apis: ['./routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/* ---------------------- MIDDLEWARE ---------------------- */

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300
}));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/uploads', express.static(path.resolve('uploads')));

/* ---------------------- HEALTH CHECK ---------------------- */

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
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