const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Tell Express to trust the X-Forwarded-Proto header
app.set('trust proxy', 1);

// Disable HTTPS redirect for local development EARLY - MUST be first middleware
app.use((req, res, next) => {
  // Force HTTP protocol
  req.headers['x-forwarded-proto'] = 'http';
  req.protocol = 'http';
  req.secure = false;
  
  // Remove any HSTS and HTTPS-forcing headers
  res.removeHeader('Strict-Transport-Security');
  res.setHeader('Strict-Transport-Security', 'max-age=0');
  
  // Prevent other HTTPS-forcing headers
  res.removeHeader('Content-Security-Policy');
  
  next();
});

// Override res.redirect to prevent HTTPS redirects
app.use((req, res, next) => {
  const originalRedirect = res.redirect;
  res.redirect = function(code, url) {
    // Handle both redirect(url) and redirect(code, url) signatures
    if (typeof code === 'string') {
      url = code;
      code = 302;
    }
    
    // Convert HTTPS to HTTP
    if (typeof url === 'string' && url.startsWith('https://')) {
      url = url.replace('https://', 'http://');
      console.log('Converting HTTPS redirect to HTTP:', url);
    }
    
    return originalRedirect.call(this, code, url);
  };
  
  // Also override res.location which is sometimes used
  const originalLocation = res.location;
  res.location = function(url) {
    if (typeof url === 'string' && url.startsWith('https://')) {
      url = url.replace('https://', 'http://');
      console.log('Converting HTTPS location to HTTP:', url);
    }
    return originalLocation.call(this, url);
  };
  
  next();
});

// Add middleware to parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: false }));

// Serve GOV.UK assets from node_modules
govukAssetsPath = path.join(__dirname, 'node_modules/govuk-frontend/dist/govuk/assets');
app.use('/assets', express.static(govukAssetsPath));

// Example: serve static files from your app/assets directory
app.use('/public', express.static(path.join(__dirname, 'app/assets')));



// Add session middleware
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Ensure req.session.data is always an object
app.use((req, res, next) => {
  if (!req.session.data) req.session.data = {};
  next();
});

// Register Portal routes
const portalRoutes = require('./app/routes/portal');
app.use('/', portalRoutes);

// Register Manage routes
const manageRoutes = require('./app/routes/projects/back-office/manage');
app.use('/', manageRoutes);

// Example: set up a simple route
app.get('/', (req, res) => {
  res.send('Prototype Home. Add your routes and views!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
