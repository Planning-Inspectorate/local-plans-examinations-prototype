const express = require('express');
const path = require('path');
const app = express();

// Serve GOV.UK assets from node_modules
govukAssetsPath = path.join(__dirname, 'node_modules/govuk-frontend/dist/govuk/assets');
app.use('/assets', express.static(govukAssetsPath));

// Example: serve static files from your app/assets directory
app.use('/public', express.static(path.join(__dirname, 'app/assets')));

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
