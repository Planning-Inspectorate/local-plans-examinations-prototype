
//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Debug middleware - log session data on every request
router.use((req, res, next) => {
  console.log('\n--- Session Data ---');
  console.log('URL:', req.url);
  console.log('Session data:', req.session.data);
  console.log('------------------\n');
  next();
});

// uploads handling (available if any routes need it)
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Mount feature routers that export an Express Router object
router.use('/', require('./routes/portal'));
router.use('/', require('./routes/create-case'));
router.use('/', require('./routes/reps'));

// If you have other feature routers that also export Router objects,
// mount them like this (and make sure they export a Router, not a function):
// router.use('/', require('./routes/create-case'));
// router.use('/', require('./routes/reps'));

// Keep any small, one-off routes here if you need them, for example:
// router.get('/start', (req, res) => res.render('start'));

module.exports = router;
