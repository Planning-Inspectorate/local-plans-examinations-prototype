
//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const {
  PLAN_STATUS_CLASS_MAP,
  getPlanStatusClasses
} = require('./routes/projects/back-office/plan-status-classes');

const defaultWorkflowNavVersions = {
  overview: 'v2',
  timetable: 'v1',
  gw1: 'v1',
  gw2: 'v3',
  gw3: 'v2',
  examination: 'v3',
  documents: 'v1',
  updates: 'v2'
};

const workflowNavSections = Object.keys(defaultWorkflowNavVersions);

function getWorkflowNavQueryOverrides(query = {}) {
  return workflowNavSections.reduce((overrides, section) => {
    const queryKey = `nav-${section}`;
    const value = query[queryKey];

    if (typeof value === 'string' && /^v\d+$/.test(value)) {
      overrides[section] = value;
    }

    return overrides;
  }, {});
}

router.use((req, res, next) => {
  res.locals.currentPath = req.originalUrl || req.url || '';
  const versionMatch = (res.locals.currentPath || '').match(/\/v(\d+)(?:\/|$)/);
  res.locals.urlVersion = versionMatch ? `v${versionMatch[1]}` : '';

  if (req.query.clearNavVersions === '1' && req.session) {
    delete req.session.workflowNavVersionOverrides;
  }

  const queryOverrides = getWorkflowNavQueryOverrides(req.query);
  if (Object.keys(queryOverrides).length && req.session) {
    req.session.workflowNavVersionOverrides = {
      ...(req.session.workflowNavVersionOverrides || {}),
      ...queryOverrides
    };
  }

  const sessionOverrides = req.session?.workflowNavVersionOverrides || {};
  res.locals.workflowNavVersions = {
    ...defaultWorkflowNavVersions,
    ...sessionOverrides
  };
  next();
});

// Make header data consistent across all back-office pages, including dynamic _routes.
router.use((req, res, next) => {
  const sessionData = req.session?.data || {};
  const resolvedCaseRef = req.session?.currentCaseRef || '';
  const resolvedPlanTitle = req.session?.planTitle || '';
  const resolvedStatus = req.session?.planStatus || sessionData.planStatus || 'Submitted';
  const resolvedStatusClasses = sessionData.planStatusClasses || getPlanStatusClasses(resolvedStatus);

  res.locals.caseRef = resolvedCaseRef;
  res.locals.planTitle = resolvedPlanTitle;
  res.locals.headerCaseRef = resolvedCaseRef;
  res.locals.headerPlanTitle = resolvedPlanTitle;
  res.locals.planStatus = resolvedStatus;
  res.locals.planStatusClassMap = sessionData.planStatusClassMap || PLAN_STATUS_CLASS_MAP;
  res.locals.headerStatus = {
    text: resolvedStatus,
    classes: resolvedStatusClasses
  };

  if (!req.session.data) req.session.data = {};
  req.session.data.planStatusClassMap = res.locals.planStatusClassMap;

  next();
});


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
router.use('/', require('./routes/create-case-v2'));
router.use('/', require('./routes/create-case-v4'));
router.use('/', require('./routes/projects/back-office/manage'));
router.use('/', require('./routes/reps'));
router.use('/', require('./views/projects/front-office/gw2/archive/test-1/_routes'));
router.use('/', require('./views/projects/front-office/gw2/archive/v4/_routes'));

// Import routes from different prototype folders
router.use("/:projects/:service/:prototype/:journey/v:version", (req, res, next) => {
  try {
    res.locals.location = `${req.params.projects}/${req.params.service}/${req.params.prototype}/${req.params.journey}/v${req.params.version}/`
    return require(`./views/${req.params.projects}/${req.params.service}/${req.params.prototype}/${req.params.journey}/v${req.params.version}/_routes`)(req, res, next)
  } catch (e) {
    console.log('Dynamic route loader miss (4-level):', e.message)
    next()
  }
})

router.use("/:projects/:service/:prototype/v:version", (req, res, next) => {
  try {
    res.locals.location = `${req.params.projects}/${req.params.service}/${req.params.prototype}/v${req.params.version}/`
    return require(`./views/${req.params.projects}/${req.params.service}/${req.params.prototype}/v${req.params.version}/_routes`)(req, res, next)
  } catch (e) {
    console.log('Dynamic route loader miss (3-level):', e.message)
    next()
  }
})

// If you have other feature routers that also export Router objects,
// mount them like this (and make sure they export a Router, not a function):
// router.use('/', require('./routes/create-case'));
// router.use('/', require('./routes/reps'));

// Keep any small, one-off routes here if you need them, for example:
// router.get('/start', (req, res) => res.render('start'));

module.exports = router;
