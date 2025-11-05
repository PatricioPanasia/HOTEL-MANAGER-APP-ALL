// Vercel serverless entry point for the backend.
// It reuses the Express app without starting a server.
const app = require('../app');

module.exports = (req, res) => app(req, res);
