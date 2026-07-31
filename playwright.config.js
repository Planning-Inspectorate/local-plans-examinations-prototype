module.exports = {
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
    viewport: { width: 1440, height: 2200 }
  },
  timeout: 60000
};
