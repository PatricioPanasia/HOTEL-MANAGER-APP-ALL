// Vercel serverless entry point for the backend.
// It reuses the Express app without starting a server.
const app = require('../app');

// Export the Express app as a Vercel serverless function
module.exports = app;
