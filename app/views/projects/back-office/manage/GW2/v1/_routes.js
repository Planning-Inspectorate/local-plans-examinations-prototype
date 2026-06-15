const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

// Gateway 2 v1 has no dynamic routes
module.exports = router;
