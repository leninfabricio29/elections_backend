import * as express from 'express';
const cors = require('cors');
import * as dotenv from 'dotenv';
import { connectDB } from './config/database/db-config';

// Rutas (importa tus rutas reales aquí)
//import authRoutes from './routes/auth.routes';
// import electionRoutes from './routes/election.routes'; // etc.

dotenv.config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Rutas base
// app.use('/api/auth', authRoutes);
// app.use('/api/elections', electionRoutes); // etc.

export default app;

// compilerOptions": {
//     // ...other options
//     "esModuleInterop":
