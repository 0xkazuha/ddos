const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.set('trust proxy', true);
app.disable('x-powered-by');

const requestLogs = [];
const MAX_LOGS = 5000;

let stats = {
  totalRequests: 0,
  startTime: Date.now(),
  uniqueIPs: new Set(),
  requestsByIP: {},
  requestsByEndpoint: {},
  totalBytesReceived: 0,
  totalBytesSent: 0
};

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
}

function calculateRequestSize(req) {
  let size = 0;
  size += Buffer.byteLength(req.method + ' ' + req.url + ' HTTP/1.1\r\n');
  Object.keys(req.headers).forEach(key => {
    size += Buffer.byteLength(key + ': ' + req.headers[key] + '\r\n');
  });
  size += 2;
  if (req.body) {
    size += Buffer.byteLength(JSON.stringify(req.body));
  }
  return size;
}

app.use((req, res, next) => {
  const startTime = Date.now();
  const ip = getClientIP(req);
  const requestSize = calculateRequestSize(req);
  
  stats.totalRequests++;
  stats.uniqueIPs.add(ip);
  stats.totalBytesReceived += requestSize;
  stats.requestsByIP[ip] = (stats.requestsByIP[ip] || 0) + 1;
  stats.requestsByEndpoint[req.path] = (stats.requestsByEndpoint[req.path] || 0) + 1;

  const originalSend = res.send;
  res.send = function(data) {
    const responseSize = Buffer.byteLength(data || '');
    stats.totalBytesSent += responseSize;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      ip: ip,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'] || 'unknown',
      requestSize: requestSize,
      responseSize: responseSize,
      responseTime: Date.now() - startTime,
      statusCode: res.statusCode,
      headers: req.headers
    };

    requestLogs.push(logEntry);
    if (requestLogs.length > MAX_LOGS) {
      requestLogs.shift();
    }

    console.log(`[${logEntry.timestamp}] ${ip} - ${req.method} ${req.path} - ${res.statusCode} - ${logEntry.responseTime}ms`);

    return originalSend.call(this, data);
  };

  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'running' });
});

app.get('/test', (req, res) => {
  res.json({ ok: true });
});

app.post('/test', (req, res) => {
  res.json({ ok: true, data: req.body });
});

app.get('/api/stats', (req, res) => {
  const uptime = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  const rps = (stats.totalRequests / (Date.now() - stats.startTime) * 1000).toFixed(2);
  
  const topIPs = Object.entries(stats.requestsByIP)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, requests: count }));

  const topEndpoints = Object.entries(stats.requestsByEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({ endpoint, requests: count }));

  res.json({
    uptime: `${uptime}s`,
    totalRequests: stats.totalRequests,
    uniqueIPs: stats.uniqueIPs.size,
    requestsPerSecond: rps,
    totalBytesReceived: stats.totalBytesReceived,
    totalBytesSent: stats.totalBytesSent,
    totalDataTransfer: `${((stats.totalBytesReceived + stats.totalBytesSent) / 1024 / 1024).toFixed(2)} MB`,
    topIPs: topIPs,
    topEndpoints: topEndpoints,
    recentRequestsCount: requestLogs.length
  });
});

app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;
  const ip = req.query.ip;
  const method = req.query.method;

  let filteredLogs = [...requestLogs];

  if (ip) {
    filteredLogs = filteredLogs.filter(log => log.ip === ip);
  }

  if (method) {
    filteredLogs = filteredLogs.filter(log => log.method === method);
  }

  const paginatedLogs = filteredLogs
    .reverse()
    .slice(offset, offset + limit);

  res.json({
    total: filteredLogs.length,
    limit: limit,
    offset: offset,
    logs: paginatedLogs
  });
});

app.get('/api/logs/export', (req, res) => {
  const logFile = path.join(__dirname, '../logs', `logs-${Date.now()}.json`);
  
  const exportData = {
    exportTime: new Date().toISOString(),
    stats: {
      totalRequests: stats.totalRequests,
      uniqueIPs: stats.uniqueIPs.size,
      uptime: ((Date.now() - stats.startTime) / 1000).toFixed(2) + 's'
    },
    logs: requestLogs
  };

  fs.writeFileSync(logFile, JSON.stringify(exportData, null, 2));

  res.json({
    message: 'Logs exported successfully',
    file: logFile,
    logsCount: requestLogs.length
  });
});

app.post('/api/stats/reset', (req, res) => {
  const oldStats = {
    totalRequests: stats.totalRequests,
    uniqueIPs: stats.uniqueIPs.size
  };

  stats = {
    totalRequests: 0,
    startTime: Date.now(),
    uniqueIPs: new Set(),
    requestsByIP: {},
    requestsByEndpoint: {},
    totalBytesReceived: 0,
    totalBytesSent: 0
  };

  requestLogs.length = 0;

  res.json({
    message: 'Stats reset successfully',
    previousStats: oldStats
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

app.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces = require('os').networkInterfaces();
  const addresses = [];
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });
  
  console.log(`\nServer running on:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Local:   http://127.0.0.1:${PORT}`);
  
  if (addresses.length > 0) {
    addresses.forEach(addr => {
      console.log(`  Network: http://${addr}:${PORT}`);
    });
  }
  
  console.log(`\nAPI Endpoints:`);
  console.log(`  Stats: /api/stats`);
  console.log(`  Logs:  /api/logs\n`);
});

process.on('SIGINT', () => {
  console.log(`\nTotal Requests: ${stats.totalRequests} | Unique IPs: ${stats.uniqueIPs.size} | Uptime: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s\n`);
  process.exit(0);
});
