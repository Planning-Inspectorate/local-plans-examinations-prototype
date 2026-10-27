const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

function formatDateForDisplay(dateValue) {
	if (!dateValue || dateValue === '-') return '-';

	const value = String(dateValue);
	const slashDate = DateTime.fromFormat(value, 'd/M/yyyy');
	if (slashDate.isValid) return slashDate.toFormat('d MMMM yyyy');

	const isoDate = DateTime.fromISO(value);
	if (isoDate.isValid) return isoDate.toFormat('d MMMM yyyy');

	return value;
}

router.use((req, res, next) => {
	res.locals.caseRef = req.session.data?.currentCaseRef || req.session.currentCaseRef || '';
	res.locals.timetablePauseHistory = (req.session.examinationV6PauseHistory || []).map((pause) => ({
		...pause,
		date: formatDateForDisplay(pause.date),
		actualEndDate: formatDateForDisplay(pause.actualEndDate)
	}));
	res.locals.timetableCurrentPause = {
		date: formatDateForDisplay(req.session.planPauseDate),
		reason: req.session.planPauseReason || '-',
		actualEndDate: formatDateForDisplay(req.session.planPauseActualEndDate || req.session.planPauseEndDate),
		status: req.session.planPauseStatusState || ''
	};
	const currentCaseRef = req.session.currentCaseRef || '';
	res.locals.gateway3SubmissionDecisionDates = Object.entries(req.session.gw3v5IssuedDecisions || {})
		.filter(([version, decision]) => ['1', '2', '3'].includes(version) && currentCaseRef && decision.caseRef === currentCaseRef)
		.map(([version, decision]) => ({
			submissionNumber: version,
			outcome: decision.outcome || '-',
			date: formatDateForDisplay(decision.date)
		}));
	next();
});

module.exports = router;
