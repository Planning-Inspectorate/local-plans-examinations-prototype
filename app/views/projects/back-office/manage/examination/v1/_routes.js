const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Mount local examination v1 routes.
router.use('/', require('./_add-hearing-estimates'));

module.exports = router;