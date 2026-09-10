const govukPrototypeKit = require('govuk-prototype-kit');
const { DateTime } = require('luxon');
const router = govukPrototypeKit.requests.setupRouter();

const DEFAULT_RETURN_PATH = '/examination';
const DATE_FORMAT = 'd/M/yyyy';

function parseDateFields(day, month, year) {
	if (!day || !month || !year) return '';
	return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
}

function addSixMonths(dateString) {
	const parsed = DateTime.fromFormat(dateString || '', DATE_FORMAT);
	return parsed.isValid ? parsed.plus({ months: 6 }).toFormat(DATE_FORMAT) : '';
}

function resolveReturnUrl(req, value) {
	return value || `${req.baseUrl}${DEFAULT_RETURN_PATH}`;
}

function stepUrl(req, path, returnUrl) {
	return `${req.baseUrl}${path}?returnUrl=${encodeURIComponent(resolveReturnUrl(req, returnUrl))}`;
}

router.get(['/plan-pause', '/plan-pause.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v5/plan-pause', {
		planPauseDate: req.session.planPauseDate && req.session.planPauseDate !== '-' ? req.session.planPauseDate : '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause', (req, res) => {
	const {
		'plan-pause-date-day': day,
		'plan-pause-date-month': month,
		'plan-pause-date-year': year,
		returnUrl
	} = req.body;

	req.session.planPauseDate = parseDateFields(day, month, year) || req.session.planPauseDate || '';
	req.session.planPauseEndDate = addSixMonths(req.session.planPauseDate);

	req.session.save(() => {
		res.redirect(stepUrl(req, '/plan-pause-reason', returnUrl));
	});
});

router.get(['/plan-pause-reason', '/plan-pause-reason.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v5/plan-pause-reason', {
		planPauseReason: req.session.planPauseReason || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-reason', (req, res) => {
	const { 'plan-pause-reason': reason, returnUrl } = req.body;

	req.session.planPauseReason = (reason || '').trim();

	// Remember the pre-pause examination status so a resolved pause can revert to it.
	if (req.session.planPauseStatusState !== 'paused') {
		req.session.planPauseStatusBefore = req.session.examinationV3StatusState || '';
	}
	req.session.planPauseStatusState = 'paused';
	delete req.session.planPauseDecision;
	delete req.session.planPauseDecisionReason;

	req.session.save(() => {
		res.redirect(resolveReturnUrl(req, returnUrl));
	});
});

router.get(['/plan-pause-end', '/plan-pause-end.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v5/plan-pause-end', {
		planPauseEndDate: req.session.planPauseEndDate && req.session.planPauseEndDate !== '-' ? req.session.planPauseEndDate : '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-end', (req, res) => {
	const {
		'plan-pause-end-date-day': day,
		'plan-pause-end-date-month': month,
		'plan-pause-end-date-year': year,
		returnUrl
	} = req.body;

	req.session.planPauseEndDate = parseDateFields(day, month, year) || req.session.planPauseEndDate || '';

	req.session.save(() => {
		res.redirect(stepUrl(req, '/plan-pause-decision', returnUrl));
	});
});

router.get(['/plan-pause-decision', '/plan-pause-decision.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v5/plan-pause-decision', {
		planPauseDecision: req.session.planPauseDecision || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-decision', (req, res) => {
	const { 'plan-pause-decision': decision, returnUrl } = req.body;

	req.session.planPauseDecision = decision || req.session.planPauseDecision || '';

	req.session.save(() => {
		res.redirect(stepUrl(req, '/plan-pause-decision-reason', returnUrl));
	});
});

router.get(['/plan-pause-decision-reason', '/plan-pause-decision-reason.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v5/plan-pause-decision-reason', {
		planPauseDecision: req.session.planPauseDecision || '',
		planPauseDecisionReason: req.session.planPauseDecisionReason || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-decision-reason', (req, res) => {
	const { 'plan-pause-decision-reason': reason, returnUrl } = req.body;

	req.session.planPauseDecisionReason = (reason || '').trim();

	if (req.session.planPauseDecision === 'Withdrawn') {
		req.session.planPauseStatusState = 'withdrawn';
		req.session.withdrawnDate = req.session.planPauseEndDate || req.session.withdrawnDate || '';
	} else if (req.session.planPauseDecision === 'Resolved') {
		req.session.planPauseStatusState = 'resolved';
		req.session.examinationV3StatusState = req.session.planPauseStatusBefore || req.session.examinationV3StatusState || '';
	}

	req.session.save(() => {
		res.redirect(resolveReturnUrl(req, returnUrl));
	});
});

module.exports = router;
