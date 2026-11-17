import { createApiApp } from '../server/app.js';

// Vercel Serverless Function entrypoint exporting the Express API app
const app = createApiApp();

export default app;
