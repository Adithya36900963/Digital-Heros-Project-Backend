import { app } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

function startServer() {
  return new Promise((resolve, reject) => {
    const onError = (err) => reject(err);
    const server = app.listen(env.port, () => {
      server.off('error', onError);
      console.log(`Digital Heroes API running on http://localhost:${env.port}`);
      resolve(server);
    });

    server.once('error', onError);
  });
}

async function bootstrap() {
  await connectDb();
  await startServer();
}

bootstrap().catch((err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${env.port} is already in use. Stop the existing process on that port or change PORT in .env.`);
  } else {
    console.error('Failed to start server:', err);
  }
  process.exit(1);
});
