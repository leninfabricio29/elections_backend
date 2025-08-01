import * as express from 'express';
const cors = require('cors');
import * as dotenv from 'dotenv';
import { connectDB } from './config/database/db-config';

// Importar rutas
import userRoutes from './routes/user.routes';
import electionRoutes from './routes/election.routes';
import candidateRoutes from './routes/candidate.routes';
import partyRoutes from './routes/party.routes';
import voteRoutes from './routes/vote.routes';
import voterRoutes from './routes/voter.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Importar middlewares
import { errorHandler, notFoundHandler, requestLogger, validatePagination } from './middlewares/error.middleware';

dotenv.config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Middlewares globales
app.use(requestLogger);
app.use(validatePagination);

// Configurar rutas
app.use('/api/users', userRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/voters', voterRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware para rutas no encontradas
app.use(notFoundHandler);

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler);

export default app;

// compilerOptions": {
//     // ...other options
//     "esModuleInterop":
