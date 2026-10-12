const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.use((req, res, next) => {
	res.locals.caseRef = req.session.data?.currentCaseRef || req.session.currentCaseRef || '';
	next();
});

module.exports = router;
