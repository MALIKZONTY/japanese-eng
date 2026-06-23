"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('Error: MONGODB_URI is not defined in environment variables.');
            process.exit(1);
        }
        const conn = await mongoose_1.default.connect(mongoURI, {
            dbName: 'japanese_dictionary'
        });
        console.log(`MongoDB Connected: ${conn.connection.host}, DB: ${conn.connection.db?.databaseName}`);
    }
    catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error(`Please check if your current IP is whitelisted on MongoDB Atlas or if your local MongoDB is running.`);
        // Do not run process.exit(1) to let the server start and mongoose attempt automatic reconnection in background.
    }
};
exports.connectDB = connectDB;
