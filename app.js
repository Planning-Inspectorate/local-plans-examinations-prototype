const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();


// Add middleware to parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: false }));

// Serve GOV.UK assets from node_modules
govukAssetsPath = path.join(__dirname, 'node_modules/govuk-frontend/dist/govuk/assets');
app.use('/assets', express.static(govukAssetsPath));

// Example: serve static files from your app/assets directory
app.use('/public', express.static(path.join(__dirname, 'app/assets')));


// Register LPA routes
const lpaRoutes = require('./app/lpaRoutes');
app.use('/', lpaRoutes);

// Register Portal routes
const portalRoutes = require('./app/routes/portal');
app.use('/', portalRoutes);

// Example: set up a simple route
app.get('/', (req, res) => {
  res.send('Prototype Home. Add your routes and views!');
});

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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
