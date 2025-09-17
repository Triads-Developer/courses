const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { setupSSL } = require('./config/ssl');
const DataLoader = require('./utils/data_loader');
const FileWatcher = require('./utils/data_watcher');
const createCourseRoutes = require('./routes/courses');
const createMetadataRoutes = require('./routes/metadata');

const app = express();
const port = process.env.PORT || 3000;

// Setup SSL
const { sslOptions, useSSL } = setupSSL();

// Setup middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Initialize data loader
const dataLoader = new DataLoader();
const fileWatcher = new FileWatcher(dataLoader);

// Load initial data
dataLoader.loadCourseData().catch(error => {
  console.error('Failed to load course data:', error);
  // Continue running server even if data loading fails
}).finally(() => {
  // Set up file watcher after initial data load
  fileWatcher.setupFileWatcher();
});

// Setup routes
app.use('/api/courses', createCourseRoutes(dataLoader));
app.use('/api/courses', createMetadataRoutes(dataLoader));

// Validate port number
const validatedPort = parseInt(port);
if (isNaN(validatedPort) || validatedPort < 1 || validatedPort > 65535) {
  console.error('Invalid port number:', port);
  process.exit(1);
}

// Create server based on SSL availability with error handling
let server;
try {
  if (useSSL && sslOptions) {
    server = https.createServer(sslOptions, app);
    console.log(`HTTPS server configured for port ${validatedPort}`);
  } else {
    server = http.createServer(app);
    console.log(`HTTP server configured for port ${validatedPort}`);
  }
} catch (error) {
  console.error('Error creating server:', error);
  process.exit(1);
}

// Add error handling for server
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${validatedPort} is already in use`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Start server with error handling
server.listen(validatedPort, () => {
  console.log(`Server started successfully on port ${validatedPort}`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  fileWatcher.cleanupFileWatcher();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  fileWatcher.cleanupFileWatcher();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  fileWatcher.cleanupFileWatcher();
  server.close(() => {
    console.log('Server closed due to uncaught exception');
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  fileWatcher.cleanupFileWatcher();
  server.close(() => {
    console.log('Server closed due to unhandled rejection');
    process.exit(1);
  });
});