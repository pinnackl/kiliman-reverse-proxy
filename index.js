'use strict';

const http = require('http'),
      httpProxy = require('http-proxy'),
      HttpProxyRules = require('http-proxy-rules');

// Load config
const config = require('./config/config.json');

// Get the port from config
const port = config.port;

// Read all matching path from the database
// ...
const rules = {};

// Set up proxy rules instance
const proxyRules = new HttpProxyRules({
  rules: rules
});

// Create reverse proxy instance
const proxy = httpProxy.createProxy({ws: true});

// Create http server that leverages reverse proxy instance
// and proxy rules to proxy requests to different targets
const httpd = http.createServer(function(req, res) {
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('The request url and path did not match any of the listed rules!');
});

// Listen to the HTTP UPGRADE event, so we can proxyfy the request to the web socket
httpd.on('upgrade', function (req, res) {
  let target = proxyRules.match(req);
  if (target) {
    // Proxyfy the request to the right websocket server
    // As Horizon need to match the "/horizon" path, we append it to the end of the taget server
    return proxy.ws(req, res, {
      target: `${target}/horizon`
    });
  }
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('{error: "unmatched"}');
  return;
});

httpd.listen(port);