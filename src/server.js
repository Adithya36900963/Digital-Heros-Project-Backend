import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`Digital Heroes API running on http://localhost:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
