import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorMiddleware';

// Import Routes
import wordRoutes from './routes/wordRoutes';
import groupRoutes from './routes/groupRoutes';
import searchRoutes from './routes/searchRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import historyRoutes from './routes/historyRoutes';
import aiRoutes from './routes/aiRoutes';

// Load environmental variables - looks for .env in the backend/ directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') }); // fallback for ts-node-dev

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to Database
connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for the single-user app setup, or restrict to http://localhost:5173
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log basic requests in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/words', wordRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);

// Base healthcheck route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Japanese Learning Dictionary API' });
});

// Error handling middleware (MUST be registered last)
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
