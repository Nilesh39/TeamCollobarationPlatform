import { createApp } from './app';
import { env } from './config/env.config';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 AI WORK OS Backend Service Started`);
  console.log(`📡 Port:        http://localhost:${env.PORT}`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health:      http://localhost:${env.PORT}/api/v1/health`);
  console.log(`=========================================`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log('\n🛑 Gracefully shutting down AI WORK OS server...');
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
