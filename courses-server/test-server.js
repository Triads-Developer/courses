const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const { setupSSL } = require('./config/ssl');
const DataLoader = require('./utils/data_loader');
const FileWatcher = require('./utils/data_watcher');
const createCourseRoutes = require('./routes/courses');
const createMetadataRoutes = require('./routes/metadata');

console.log('Testing server startup...');

const app = express();
const port = 3001; // Use different port for testing

// Setup SSL
const { sslOptions, useSSL } = setupSSL();
console.log(`SSL setup complete: ${useSSL ? 'enabled' : 'disabled'}`);

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

console.log('Data loader initialized');

// Load initial data
dataLoader.loadCourseData().catch(error => {
  console.error('Failed to load course data:', error);
}).finally(() => {
  console.log('Data loading complete');
  // Set up file watcher after initial data load
  fileWatcher.setupFileWatcher();
});

// Setup routes
app.use('/api/courses', createCourseRoutes(dataLoader));
app.use('/api/courses', createMetadataRoutes(dataLoader));

console.log('Routes configured');

// Create server
let server;
try {
  if (useSSL && sslOptions) {
    server = https.createServer(sslOptions, app);
    console.log(`HTTPS server configured for port ${port}`);
  } else {
    server = http.createServer(app);
    console.log(`HTTP server configured for port ${port}`);
  }
} catch (error) {
  console.error('Error creating server:', error);
  process.exit(1);
}

// Start server
server.listen(port, () => {
  console.log(`✅ Server started successfully on port ${port}`);
  console.log('🎉 Modular server structure is working!');
  
  // Clean up after 5 seconds
  setTimeout(() => {
    console.log('Shutting down test server...');
    fileWatcher.cleanupFileWatcher();
    server.close(() => {
      console.log('Test server closed');
      process.exit(0);
    });
  }, 5000);
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
