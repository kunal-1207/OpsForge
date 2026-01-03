const express = require('express');
const winston = require('winston');
const client = require('prom-client');
const axios = require('axios');
require('dotenv').config();

// Create express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Prometheus metrics setup
const register = new client.Registry();

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const businessMetric = new client.Counter({
  name: 'business_operations_total',
  help: 'Total number of business operations performed',
  labelNames: ['operation'],
  registers: [register]
});

// Register default metrics
register.setDefaultLabels({
  app: 'api-service'
});

// Health check endpoints
app.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', (req, res) => {
  // In a real application, you might check database connections, etc.
  logger.info('Readiness check endpoint called');
  res.status(200).json({ 
    status: 'ready', 
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// API endpoints
app.get('/api/status', (req, res) => {
  const start = Date.now();
  
  logger.info('Status endpoint called', { 
    method: req.method, 
    url: req.url,
    userAgent: req.get('User-Agent'),
    correlationId: req.headers['x-correlation-id'] || 'N/A'
  });

  // Record metrics
  const duration = (Date.now() - start) / 1000;
  httpRequestDuration
    .labels(req.method, '/api/status', 200)
    .observe(duration);
  httpRequestTotal
    .labels(req.method, '/api/status', 200)
    .inc();
  businessMetric
    .labels('status_check')
    .inc();

  res.json({ 
    status: 'API service is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Endpoint to trigger background job
app.post('/api/job', async (req, res) => {
  const start = Date.now();
  const correlationId = req.headers['x-correlation-id'] || Date.now().toString();
  
  logger.info('Job creation endpoint called', { 
    method: req.method, 
    url: req.url,
    correlationId: correlationId
  });

  try {
    // Simulate calling the worker service
    const response = await axios.post('http://worker-service:3001/job', {
      data: req.body,
      correlationId: correlationId
    }, {
      timeout: 5000
    });

    // Record metrics
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, '/api/job', 200)
      .observe(duration);
    httpRequestTotal
      .labels(req.method, '/api/job', 200)
      .inc();
    businessMetric
      .labels('job_creation')
      .inc();

    res.status(201).json({
      message: 'Job created successfully',
      jobId: response.data.jobId,
      correlationId: correlationId
    });
  } catch (error) {
    logger.error('Error creating job', { 
      error: error.message, 
      correlationId: correlationId 
    });

    // Record error metrics
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, '/api/job', 500)
      .observe(duration);
    httpRequestTotal
      .labels(req.method, '/api/job', 500)
      .inc();

    res.status(500).json({
      error: 'Failed to create job',
      correlationId: correlationId
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.url,
    method: req.method 
  });
  
  res.status(500).json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`API service listening on port ${PORT}`);
});

module.exports = server;