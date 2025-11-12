const { JSDOM } = require('jsdom');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const deviceJsPath = path.join(__dirname, 'Device.js');
const deviceJsSource = readFileSync(deviceJsPath, 'utf8');

function parseUserAgent(userAgent) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head></head><body></body></html>`, {
    url: 'https://localhost/'
  });

  const window = dom.window;
  window.navigator.userAgent = userAgent || '';
  window.screen = window.screen || { width: 1920, height: 1080 };

  const context = vm.createContext(window);
  vm.runInContext(deviceJsSource, context, { filename: 'Device.js' });

  const d = window.Device;
  if (!d) throw new Error('Device did not attach to window');

  return {
    os: d.OS,
    browser: d.browser,
    mobile: d.isMobile,
    desktop: d.isDesktop,
    tablet: d.isTablet,
    resolution: d.resolution,
    orientation: d.orientation
  };
}

module.exports = { parseUserAgent };
