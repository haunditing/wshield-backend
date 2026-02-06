import app from "./app";
import { connectDB } from "./config/database";
import { env } from "./config/env";

const startServer = async () => {
  await connectDB();

  // Agregamos '0.0.0.0' aquí 👇
  app.listen(Number(env.PORT), "0.0.0.0", () => {
    console.log(`🚀 Servidor accesible en red local y emuladores`);
    console.log(`🔗 Local: http://localhost:${env.PORT}`);
    console.log(`📱 Android Emulator: http://10.0.2.2:${env.PORT}`);
  });
};

startServer();

export default app;
