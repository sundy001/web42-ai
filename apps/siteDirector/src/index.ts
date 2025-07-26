import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { databaseStore, getHealthStatus } from './stores/index.js';

const app = express();
const PORT = 3002; // Default port for Site Director

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const healthStatus = await getHealthStatus();
  const statusCode = healthStatus.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// API routes
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'Site Director API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Site Director',
    description: 'Express server for web42-ai platform',
    endpoints: {
      health: '/health',
      api: '/api/v1/status',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  const isDevelopment = false; // Disable detailed error messages in production
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Site Director server...');
  try {
    await databaseStore.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server with database initialization
async function startServer() {
  try {
    await databaseStore.connect();
    
    app.listen(PORT, () => {
      const config = databaseStore.getConfig();
      console.log(`🚀 Site Director server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API status: http://localhost:${PORT}/api/v1/status`);
      console.log(`💾 Database: ${config.databaseName} on ${config.uri}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Export database access for other modules
export function getDatabase() {
  return databaseStore.getDatabase();
}

export default app;