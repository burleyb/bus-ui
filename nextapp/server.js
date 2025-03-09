const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const httpProxy = require('http-proxy');
const tls = require('tls');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.crt'),
  // Explicitly set TLS options
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3',
  ciphers: tls.DEFAULT_CIPHERS,
  secureProtocol: 'TLSv1_2_method'
};

// Create agent with specific SSL config
const https = require('https');
const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 3000,
  maxSockets: 25,
  maxFreeSockets: 10,
  timeout: 30000,
  secureProtocol: 'TLSv1_2_method',
  ciphers: tls.DEFAULT_CIPHERS,
  rejectUnauthorized: false,
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3'
});

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,
  agent: agent,
  xfwd: true,
  autoRewrite: true,
  followRedirects: true,
  timeout: 30000,
  proxyTimeout: 30000
});

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    
    if (req.url.startsWith('/prod/api/')) {
      // Set headers for CloudFront
      req.headers['User-Agent'] = 'Mozilla/5.0';
      req.headers['Accept'] = '*/*';
      req.headers['Accept-Encoding'] = 'gzip, deflate, br';
      req.headers['Connection'] = 'keep-alive';
      req.headers['Cache-Control'] = 'no-cache';
      
      proxy.web(req, res, {
        target: 'https://server-18-172-170-14.sea73.r.cloudfront.net',
        headers: {
          host: 'server-18-172-170-14.sea73.r.cloudfront.net'
        },
        agent: agent,
        secure: false,
        preserveHeaderKeyCase: true,
        prependPath: false
      });
    } else {
      handle(req, res, parsedUrl);
    }
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });

  // Error handling with retry logic
  proxy.on('error', (err, req, res) => {
    console.error('Proxy error:', err);
    
    // Implement basic retry logic
    if (!req.retryCount || req.retryCount < 3) {
      req.retryCount = (req.retryCount || 0) + 1;
      console.log(`Retrying request (attempt ${req.retryCount})...`);
      
      // Small delay before retry
      setTimeout(() => {
        proxy.web(req, res, {
          target: 'https://server-18-172-170-14.sea73.r.cloudfront.net',
          agent: agent
        });
      }, 1000 * req.retryCount); // Exponential backoff
    } else {
      res.writeHead(500, {
        'Content-Type': 'text/plain'
      });
      res.end('Proxy error after 3 retry attempts');
    }
  });

  proxy.on('proxyReq', (proxyReq, req, res) => {
    console.log('Proxy request:', req.url);
  });

  proxy.on('proxyRes', (proxyRes, req, res) => {
    console.log('Proxy response status:', proxyRes.statusCode);
  });

  // Cleanup
  const cleanup = () => {
    proxy.close(() => {
      agent.destroy();
      process.exit(0);
    });
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
});
