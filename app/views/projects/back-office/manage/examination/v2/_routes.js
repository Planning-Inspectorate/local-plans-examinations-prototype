const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.use('/', require('./_add-hearing-estimates'));

module.exports = router;