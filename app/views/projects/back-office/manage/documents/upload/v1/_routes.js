const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Documents upload v1 has no dynamic routes
module.exports = router;
