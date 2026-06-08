const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Mount local examination routes.
router.use('/', require('./_add-hearing-estimates'));
router.use('/', require('./_add-hearing'));
router.use('/', require('./_cancel-hearing'));
router.use('/', require('./_edit-hearing'));
router.use('/', require('./_edit-hearing-estimates'));
module.exports = router;