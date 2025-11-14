const { createServer } = require('node:http');

const { parseUserAgentBowser } = require('./parsers/bowserParser');          // bowser wrapper
const { parseUserAgentUAParser } = require('./parsers/uaParser');       // ua-parser-js wrapper
const { parseUserAgentExpressUseragent } = require('./parsers/expressUseragentParser'); // express-useragent wrapper
const { parseUserAgentMyUaParser } = require('./parsers/myUaParser');     // my-ua-parser wrapper

const { parseUserAgentDetectBrowser } = require('./parsers/detectBrowserParser'); // detect-browser wrapper
const { parseUserAgentUseragent } = require('./parsers/useragentParser'); // new useragent wrapper
const { parseUserAgentDeviceDetector } = require('./parsers/deviceDetectorParser'); // device-detector-js wrapper
const { parseUserAgentDevice } = require('./parsers/deviceParser');           // device wrapper

const hostname = '127.0.0.1';
const port = 3000;

const server = createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    // Original echo/pong
    res.write(`Method: ${req.method}\n`);
    res.write(`URL: ${req.url}\n`);
    res.write(`Headers: ${JSON.stringify(req.headers, null, 2)}\n\n`);
    res.write(`Body:\n${body}\n\n`);

    const ua = req.headers['user-agent'] || '';

    // bowser parsed info
    try {
      const bowserInfo = parseUserAgentBowser(ua);
      res.write('bowser Parsed Info:\n');
      res.write(JSON.stringify(bowserInfo, null, 2));
      res.write('\n\n');
    } catch (err) {
      res.write('bowser Parsed Info:\n');
      res.write(JSON.stringify({ error: String(err) }, null, 2));
      res.write('\n\n');
    }

    // ua-parser-js parsed info
    try {
      const uaInfo = parseUserAgentUAParser(ua);
      res.write('ua-parser-js Parsed Info:\n');
      res.write(JSON.stringify(uaInfo, null, 2));
      res.write('\n\n');
    } catch (err) {
      res.write('ua-parser-js Parsed Info:\n');
      res.write(JSON.stringify({ error: String(err) }, null, 2));
      res.write('\n\n');
    }

    // express-useragent parsed info
    try {
      const euInfo = parseUserAgentExpressUseragent(ua);
      res.write('express-useragent Parsed Info:\n');
      res.write(JSON.stringify(euInfo, null, 2));
      res.write('\n\n');
    } catch (err) {
      res.write('express-useragent Parsed Info:\n');
      res.write(JSON.stringify({ error: String(err) }, null, 2));
      res.write('\n\n');
    }

    // my-ua-parser parsed info
    try {
      const myUaInfo = parseUserAgentMyUaParser(ua);
      res.write('my-ua-parser Parsed Info:\n');
      res.write(JSON.stringify(myUaInfo, null, 2));
      res.write('\n\n');
    } catch (err) {
      res.write('my-ua-parser Parsed Info:\n');
      res.write(JSON.stringify({ error: String(err) }, null, 2));
      res.write('\n\n');
    }


    // NOT ACTIVE
    /*
        // detect-browser parsed info
        try {
          const dbInfo = parseUserAgentDetectBrowser(ua);
          res.write('detect-browser Parsed Info:\n');
          res.write(JSON.stringify(dbInfo, null, 2));
          res.write('\n\n');
        } catch (err) {
          res.write('detect-browser Parsed Info:\n');
          res.write(JSON.stringify({ error: String(err) }, null, 2));
          res.write('\n\n');
        }
    
        // useragent parsed info
        try {
          const uaUseragentInfo = parseUserAgentUseragent(ua);
          res.write('useragent Parsed Info:\n');
          res.write(JSON.stringify(uaUseragentInfo, null, 2));
        } catch (err) {
          res.write('useragent Parsed Info:\n');
          res.write(JSON.stringify({ error: String(err) }, null, 2));
        }
    
        // device-detector-js parsed info
        try {
          const ddInfo = parseUserAgentDeviceDetector(ua);
          res.write('device-detector-js Parsed Info:\n');
          res.write(JSON.stringify(ddInfo, null, 2));
          res.write('\n\n');
        } catch (err) {
          res.write('device-detector-js Parsed Info:\n');
          res.write(JSON.stringify({ error: String(err) }, null, 2));
          res.write('\n\n');
        }
    
        // device parsed info
        try {
          const deviceInfo = parseUserAgentDevice(ua);
          res.write('device Parsed Info:\n');
          res.write(JSON.stringify(deviceInfo, null, 2));
          res.write('\n\n');
        } catch (err) {
          res.write('device Parsed Info:\n');
          res.write(JSON.stringify({ error: String(err) }, null, 2));
          res.write('\n\n');
        }    
    */

    res.end();
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
