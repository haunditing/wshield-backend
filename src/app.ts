import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import routes from './routes';

const app = express();

// Middlewares Globales
app.use(helmet());
app.use(cors());
app.use(express.json());
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rutas
app.use('/api', routes);

// Manejo de Errores
app.use(errorHandler);

export default app;