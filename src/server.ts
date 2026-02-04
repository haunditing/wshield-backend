import app from './app';
import { connectDB } from './config/database';
import { env } from './config/env';

const startServer = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${env.PORT}`);
    console.log(`🔧 Ambiente: ${env.NODE_ENV}`);
  });
};

startServer();