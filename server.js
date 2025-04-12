const express = require('express');
const client = require('prom-client');

const app = express();
const register = client.register;

// Enable collection of default metrics (Node.js process, memory, etc.)
client.collectDefaultMetrics();

// ========== Custom Metrics ==========

// Total number of requests received
const requestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'code'],
});

// Duration of HTTP requests in seconds
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5],
});

// Request size in bytes
const httpRequestSizeBytes = new client.Summary({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP request in bytes',
  labelNames: ['method', 'route'],
});

// Number of requests in flight
const inFlightRequests = new client.Gauge({
  name: 'http_in_flight_requests',
  help: 'Number of HTTP requests currently in flight',
});

// Simulated error counter
const errorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of simulated errors',
  labelNames: ['route'],
});

// ========== Metrics Endpoint ==========
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ========== Application Endpoints ==========

// Example: /hello route with metrics tracking
app.get('/hello', async (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  inFlightRequests.inc();

  // Simulated delay and logic
  setTimeout(() => {
    inFlightRequests.dec();
    requestCounter.inc({ method: req.method, route: '/hello', code: 200 });
    httpRequestSizeBytes.observe({ method: req.method, route: '/hello' }, JSON.stringify(req.body || {}).length);
    end({ method: req.method, route: '/hello', code: 200 });

    res.send('Hello from the metrics server!');
  }, Math.random() * 1000);
});

// Example: /error route that simulates an error
app.get('/error', async (req, res) => {
  errorCounter.inc({ route: '/error' });
  requestCounter.inc({ method: req.method, route: '/error', code: 500 });
  res.status(500).send('Simulated error occurred');
});

// ========== Start Server ==========
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
