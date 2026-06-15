const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Documents v1 has no dynamic routes
module.exports = router;
