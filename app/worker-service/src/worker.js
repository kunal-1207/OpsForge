const Queue = require('bull');
const winston = require('winston');
const client = require('prom-client');
require('dotenv').config();

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'worker-service' },
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
const jobProcessingDuration = new client.Histogram({
  name: 'job_processing_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['job_type', 'status'],
  registers: [register]
});

const jobProcessedTotal = new client.Counter({
  name: 'jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['job_type', 'status'],
  registers: [register]
});

const jobQueueSize = new client.Gauge({
  name: 'job_queue_size',
  help: 'Current size of the job queue',
  registers: [register]
});

// Register default metrics
register.setDefaultLabels({
  app: 'worker-service'
});

// Create Redis connection for Bull queue
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const jobQueue = new Queue('job processing', redisUrl);

// Health check variables
let isHealthy = true;
let lastProcessed = new Date();

// Health check endpoint (using express for this)
const express = require('express');
const app = express();
const PORT = process.env.WORKER_PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  logger.info('Worker health check endpoint called');
  res.status(200).json({ 
    status: isHealthy ? 'healthy' : 'unhealthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    lastProcessed: lastProcessed.toISOString()
  });
});

app.get('/ready', (req, res) => {
  logger.info('Worker readiness check endpoint called');
  res.status(200).json({ 
    status: 'ready', 
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Update queue size metric
    const queueCount = await jobQueue.getWaitingCount();
    jobQueueSize.set(queueCount);
    
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Endpoint to add job to queue
app.post('/job', (req, res) => {
  const correlationId = req.headers['x-correlation-id'] || Date.now().toString();
  
  logger.info('Job submission endpoint called', { 
    correlationId: correlationId,
    data: req.body
  });

  // Add job to queue
  jobQueue.add('process-job', { 
    data: req.body, 
    correlationId: correlationId,
    timestamp: new Date().toISOString()
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }).then(job => {
    logger.info('Job added to queue', { jobId: job.id, correlationId: correlationId });
    res.status(201).json({ 
      jobId: job.id, 
      correlationId: correlationId,
      message: 'Job queued successfully'
    });
  }).catch(err => {
    logger.error('Error adding job to queue', { 
      error: err.message, 
      correlationId: correlationId 
    });
    
    isHealthy = false;
    res.status(500).json({ 
      error: 'Failed to queue job',
      correlationId: correlationId
    });
  });
});

// Process jobs from queue
jobQueue.process('process-job', async (job) => {
  const startTime = Date.now();
  logger.info('Processing job', { 
    jobId: job.id, 
    data: job.data,
    attempts: job.attemptsMade
  });

  try {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    // Simulate occasional failures for demonstration purposes
    if (Math.random() < 0.1) { // 10% failure rate for demo
      throw new Error('Simulated processing failure');
    }
    
    // Record metrics for successful processing
    const duration = (Date.now() - startTime) / 1000;
    jobProcessingDuration
      .labels('process-job', 'success')
      .observe(duration);
    jobProcessedTotal
      .labels('process-job', 'success')
      .inc();
    
    lastProcessed = new Date();
    isHealthy = true;
    
    logger.info('Job completed successfully', { 
      jobId: job.id, 
      correlationId: job.data.correlationId,
      duration: duration 
    });
    
    return { status: 'completed', jobId: job.id };
  } catch (error) {
    // Record metrics for failed processing
    const duration = (Date.now() - startTime) / 1000;
    jobProcessingDuration
      .labels('process-job', 'error')
      .observe(duration);
    jobProcessedTotal
      .labels('process-job', 'error')
      .inc();
    
    logger.error('Job processing failed', { 
      jobId: job.id, 
      correlationId: job.data.correlationId,
      error: error.message,
      attempts: job.attemptsMade
    });
    
    isHealthy = false;
    throw error; // This will trigger retry logic
  }
});

// Listen for queue events
jobQueue.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

jobQueue.on('failed', (job, err) => {
  logger.error('Job failed after all retries', { 
    jobId: job?.id, 
    error: err.message,
    attempts: job?.attemptsMade
  });
});

jobQueue.on('error', (err) => {
  logger.error('Queue error', { error: err.message });
  isHealthy = false;
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down worker gracefully');
  jobQueue.close().then(() => {
    logger.info('Worker queue closed, terminating process');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down worker gracefully');
  jobQueue.close().then(() => {
    logger.info('Worker queue closed, terminating process');
    process.exit(0);
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Worker service listening on port ${PORT}`);
});

module.exports = { jobQueue };