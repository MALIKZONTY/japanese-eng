"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const errorMiddleware_1 = require("./middleware/errorMiddleware");
// Import Routes
const wordRoutes_1 = __importDefault(require("./routes/wordRoutes"));
const groupRoutes_1 = __importDefault(require("./routes/groupRoutes"));
const searchRoutes_1 = __importDefault(require("./routes/searchRoutes"));
const favoriteRoutes_1 = __importDefault(require("./routes/favoriteRoutes"));
const historyRoutes_1 = __importDefault(require("./routes/historyRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
// Load environmental variables - looks for .env in the backend/ directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../backend/.env') }); // fallback for ts-node-dev
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Connect to Database
(0, db_1.connectDB)();
// Middlewares
app.use((0, cors_1.default)({
    origin: '*', // Allow all origins for the single-user app setup, or restrict to http://localhost:5173
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Log basic requests in development
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// Mount Routes
app.use('/api/words', wordRoutes_1.default);
app.use('/api/groups', groupRoutes_1.default);
app.use('/api/search', searchRoutes_1.default);
app.use('/api/favorites', favoriteRoutes_1.default);
app.use('/api/history', historyRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
// Base healthcheck route
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to Japanese Learning Dictionary API' });
});
// Error handling middleware (MUST be registered last)
app.use(errorMiddleware_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
