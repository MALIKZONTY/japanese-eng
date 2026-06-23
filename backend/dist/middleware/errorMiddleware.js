"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
/**
 * Express error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);
    // Default to 500 server error
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message || 'Internal Server Error';
    // Handle Mongoose duplicate key error (11000)
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyPattern || {})[0] || 'field';
        message = `Duplicate value error: A record with that ${field} already exists.`;
    }
    // Handle Mongoose cast error (invalid Object ID)
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ID format for path: ${err.path}`;
    }
    // Handle Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(', ');
    }
    res.status(statusCode).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};
exports.errorHandler = errorHandler;
