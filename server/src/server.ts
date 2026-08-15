import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env.config';
import { startSelfPing } from './utils/selfPing';

const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`\n🚀 AcademyOps Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    console.log(`🔗 API Base Endpoint: http://localhost:${env.PORT}/api/v1`);
    console.log(`🏫 Institute: ${env.INSTITUTE_NAME}\n`);

    // Start 14-minute self-ping keep-alive service
    startSelfPing();
  });

  const handleUnhandledRejection = (err: Error) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  };

  process.on('unhandledRejection', handleUnhandledRejection);
};

startServer();
