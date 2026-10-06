const govukPrototypeKit = require('govuk-prototype-kit');
const { DateTime } = require('luxon');
const router = govukPrototypeKit.requests.setupRouter();

const DEFAULT_RETURN_PATH = '/examination';
const DATE_FORMAT = 'd/M/yyyy';
const WITHDRAWAL_EVIDENCE_KEY = 'withdrawalSupportingEvidence';

function parseDateFields(day, month, year) {
	if (!day || !month || !year) return '';
	return `${parseInt(day, 10)}/${parseInt(month, 10)}/${year}`;
}

function resolveReturnUrl(req, value) {
	return value || `${req.baseUrl}${DEFAULT_RETURN_PATH}`;
}

function stepUrl(req, path, returnUrl) {
	return `${req.baseUrl}${path}?returnUrl=${encodeURIComponent(resolveReturnUrl(req, returnUrl))}`;
}

const historicalPauseFields = [
	{ path: 'plan-pause', field: 'date', value: 'planPauseDate', input: 'plan-pause-date' },
	{ path: 'plan-pause-reason', field: 'reason', value: 'planPauseReason', input: 'plan-pause-reason' },
	{ path: 'plan-pause-actual-end', field: 'actualEndDate', value: 'planPauseActualEndDate', input: 'plan-pause-actual-end-date' },
	{ path: 'plan-pause-decision', field: 'decision', value: 'planPauseDecision', input: 'plan-pause-decision' },
	{ path: 'plan-pause-decision-reason', field: 'decisionReason', value: 'planPauseDecisionReason', input: 'plan-pause-decision-reason' }
];

historicalPauseFields.forEach(({ path, field, value, input }) => {
	router.get([`/${path}`, `/${path}.html`], (req, res, next) => {
		if (req.query.pauseIndex === undefined) return next();
		const pauseIndex = Number(req.query.pauseIndex);
		const pause = Number.isInteger(pauseIndex) && pauseIndex >= 0 && req.query.pauseIndex !== ''
			? req.session.examinationV6PauseHistory?.[pauseIndex] : null;
		if (!pause) return res.status(404).send('Pause not found');
		res.render(`projects/back-office/manage/examination/v6/${path}`, {
			planPauseDecision: pause.decision || '',
			pauseResolved: pause.decision === 'Resolved' && !!pause.actualEndDate,
			[value]: pause[field] || '',
			pauseIndex,
			returnUrl: resolveReturnUrl(req, req.query.returnUrl)
		});
	});

	router.post([`/${path}`, `/${path}.html`], (req, res, next) => {
		if (req.body.pauseIndex === undefined || req.body.pauseIndex === '') return next();
		const pauseIndex = Number(req.body.pauseIndex);
		const pause = Number.isInteger(pauseIndex) && pauseIndex >= 0
			? req.session.examinationV6PauseHistory?.[pauseIndex] : null;
		if (!pause) return res.status(404).send('Pause not found');
		if (field === 'decision') {
			if (!['Resolved', 'Withdrawn'].includes(req.body[input])) return res.status(400).send('Choose a pause outcome');
			pause.decision = req.body[input];
			pause.status = pause.decision === 'Resolved' ? 'resolved' : 'withdrawn';
		} else if (field === 'date' || field === 'actualEndDate') {
			pause[field] = parseDateFields(req.body[`${input}-day`], req.body[`${input}-month`], req.body[`${input}-year`]) || pause[field] || '';
		} else {
			pause[field] = (req.body[input] || '').trim();
		}
		req.session.save(() => res.redirect(resolveReturnUrl(req, req.body.returnUrl)));
	});
});

router.get(['/plan-pause', '/plan-pause.html'], (req, res) => {
	const newPause = req.query.newPause === 'true';
	res.render('projects/back-office/manage/examination/v6/plan-pause', {
		planPauseDate: newPause ? req.session.examinationV6PauseDraft?.date || '' : (req.session.planPauseDate && req.session.planPauseDate !== '-' ? req.session.planPauseDate : ''),
		newPause,
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.get(['/withdrawn-date', '/withdrawn-date.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v6/withdrawn-date', {
		withdrawnDate: req.session.withdrawnDate || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post(['/withdrawn-date', '/withdrawn-date.html'], (req, res) => {
	const {
		'withdrawn-date-day': day,
		'withdrawn-date-month': month,
		'withdrawn-date-year': year,
		returnUrl
	} = req.body;

	req.session.withdrawnDate = parseDateFields(day, month, year) || req.session.withdrawnDate || '';
	req.session.save(() => {
		res.redirect(stepUrl(req, '/withdrawal-reason', returnUrl));
	});
});

router.post('/plan-pause', (req, res) => {
	const {
		'plan-pause-date-day': day,
		'plan-pause-date-month': month,
		'plan-pause-date-year': year,
		returnUrl
	} = req.body;

	const newPause = req.body.newPause === 'true';
	if (newPause) {
		req.session.examinationV6PauseDraft = { date: parseDateFields(day, month, year) };
	} else {
		req.session.planPauseDate = parseDateFields(day, month, year) || req.session.planPauseDate || '';
		delete req.session.planPauseEndDate;
	}

	req.session.save(() => {
		res.redirect(`${stepUrl(req, '/plan-pause-reason', returnUrl)}${newPause ? '&newPause=true' : ''}`);
	});
});

router.get(['/plan-pause-reason', '/plan-pause-reason.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v6/plan-pause-reason', {
		planPauseReason: req.query.newPause === 'true' ? '' : req.session.planPauseReason || '',
		newPause: req.query.newPause === 'true',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-reason', (req, res) => {
	const { 'plan-pause-reason': reason, returnUrl } = req.body;

	if (req.body.newPause === 'true') {
		const draft = req.session.examinationV6PauseDraft;
		if (!draft?.date) return res.redirect(resolveReturnUrl(req, returnUrl));
		if (!Array.isArray(req.session.examinationV6PauseHistory)) req.session.examinationV6PauseHistory = [];
		if (req.session.planPauseDate && req.session.planPauseDate !== '-') {
			req.session.examinationV6PauseHistory.push({
				date: req.session.planPauseDate,
				reason: req.session.planPauseReason || '',
				actualEndDate: req.session.planPauseActualEndDate || '',
				decision: req.session.planPauseDecision || '',
				decisionReason: req.session.planPauseDecisionReason || '',
				status: req.session.planPauseStatusState || ''
			});
		}
		req.session.planPauseDate = draft.date;
		delete req.session.planPauseActualEndDate;
		delete req.session.planPauseEndDate;
		delete req.session.examinationV6PauseDraft;
	}
	req.session.planPauseReason = (reason || '').trim();

	// Remember the pre-pause examination status so a resolved pause can revert to it.
	if (req.session.planPauseStatusState !== 'paused') {
		req.session.planPauseStatusBefore = req.session.examinationV3StatusState || 'exam-in-progress';
	}
	req.session.planPauseStatusState = 'paused';
	req.session.examinationV3StatusState = 'paused';
	if (req.session.data) req.session.data.examinationV3StatusState = 'paused';
	delete req.session.planPauseDecision;
	delete req.session.planPauseDecisionReason;

	req.session.save(() => {
		res.redirect(resolveReturnUrl(req, returnUrl));
	});
});

router.get(['/plan-pause-actual-end', '/plan-pause-actual-end.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v6/plan-pause-actual-end', {
		planPauseActualEndDate: req.session.planPauseActualEndDate || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post(['/plan-pause-actual-end', '/plan-pause-actual-end.html'], (req, res) => {
	const {
		'plan-pause-actual-end-date-day': day,
		'plan-pause-actual-end-date-month': month,
		'plan-pause-actual-end-date-year': year,
		returnUrl
	} = req.body;

	req.session.planPauseActualEndDate = parseDateFields(day, month, year) || req.session.planPauseActualEndDate || '';
	req.session.planPauseDecision = 'Resolved';
	req.session.save(() => {
		res.redirect(stepUrl(req, '/plan-pause-decision-reason', returnUrl));
	});
});

router.get(['/plan-pause-decision', '/plan-pause-decision.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v6/plan-pause-decision', {
		planPauseDecision: req.session.planPauseDecision || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-decision', (req, res) => {
	const { 'plan-pause-decision': decision, returnUrl } = req.body;

	req.session.planPauseDecision = decision || req.session.planPauseDecision || '';

	req.session.save(() => {
		if (req.session.planPauseDecision === 'Withdrawn') {
			return res.redirect(`${stepUrl(req, '/withdrawal-reason', returnUrl)}&fromPause=true`);
		}
		res.redirect(stepUrl(req, '/plan-pause-decision-reason', returnUrl));
	});
});

router.get('/withdrawal-reason', (req, res) => {
	res.render('projects/back-office/manage/examination/v6/withdrawal-reason', {
		withdrawalReason: req.session.planPauseDecisionReason || '',
		returnUrl: resolveReturnUrl(req, req.query.returnUrl),
		fromPause: req.query.fromPause === 'true'
	});
});

router.post('/withdrawal-reason', (req, res) => {
	req.session.planPauseDecisionReason = (req.body['withdrawal-reason'] || '').trim();
	req.session.planPauseDecision = 'Withdrawn';
	req.session.save(() => {
		res.redirect(stepUrl(req, '/withdrawal-evidence', req.body.returnUrl));
	});
});

router.get('/withdrawal-evidence', (req, res) => {
	res.render('projects/back-office/manage/examination/v6/withdrawal-evidence', {
		caseRef: req.session.currentCaseRef || '',
		uploadedDocuments: req.session[WITHDRAWAL_EVIDENCE_KEY] || [],
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/withdrawal-evidence', (req, res) => {
	const fileData = req.session.data && req.session.data.fileData;
	try {
		req.session[WITHDRAWAL_EVIDENCE_KEY] = typeof fileData === 'string' ? JSON.parse(fileData) : (fileData || []);
	} catch (error) {
		req.session[WITHDRAWAL_EVIDENCE_KEY] = [];
	}
	req.session.save(() => {
		res.redirect(stepUrl(req, '/withdrawal-check-answers', req.body.returnUrl));
	});
});

router.get('/withdrawal-check-answers', (req, res) => {
	const withdrawnDate = DateTime.fromFormat(req.session.withdrawnDate || '', DATE_FORMAT);
	res.render('projects/back-office/manage/examination/v6/withdrawal-check-answers', {
		withdrawnDate: withdrawnDate.isValid ? withdrawnDate.toFormat('d MMMM yyyy') : (req.session.withdrawnDate || ''),
		withdrawalReason: req.session.planPauseDecisionReason || '',
		uploadedDocuments: req.session[WITHDRAWAL_EVIDENCE_KEY] || [],
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/withdrawal-check-answers', (req, res) => {
	req.session.planPauseDecision = 'Withdrawn';
	req.session.planPauseStatusState = 'withdrawn';
	req.session.examinationV3StatusState = 'withdrawn';
	if (req.session.data) req.session.data.examinationV3StatusState = 'withdrawn';
	req.session.withdrawnDate = req.session.withdrawnDate || DateTime.now().toFormat(DATE_FORMAT);
	req.session.save(() => {
		res.redirect(resolveReturnUrl(req, req.body.returnUrl));
	});
});

router.get(['/plan-pause-decision-reason', '/plan-pause-decision-reason.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v6/plan-pause-decision-reason', {
		planPauseDecision: req.session.planPauseDecision || '',
		planPauseDecisionReason: req.session.planPauseDecisionReason || '',
		pauseResolved: req.session.planPauseDecision === 'Resolved' && !!req.session.planPauseActualEndDate,
		returnUrl: resolveReturnUrl(req, req.query.returnUrl)
	});
});

router.post('/plan-pause-decision-reason', (req, res) => {
	const { 'plan-pause-decision-reason': reason, returnUrl } = req.body;

	req.session.planPauseDecisionReason = (reason || '').trim();

	if (req.session.planPauseDecision === 'Withdrawn') {
		req.session.planPauseStatusState = 'withdrawn';
		req.session.examinationV3StatusState = 'withdrawn';
		if (req.session.data) req.session.data.examinationV3StatusState = 'withdrawn';
		req.session.withdrawnDate = req.session.withdrawnDate || DateTime.now().toFormat(DATE_FORMAT);
	} else if (req.session.planPauseDecision === 'Resolved') {
		req.session.planPauseStatusState = 'resolved';
		req.session.examinationV3StatusState = req.session.planPauseStatusBefore || req.session.examinationV3StatusState || 'exam-in-progress';
		if (req.session.data) req.session.data.examinationV3StatusState = req.session.examinationV3StatusState;
		delete req.session.planPauseStatusBefore;
	}

	req.session.save(() => {
		res.redirect(resolveReturnUrl(req, returnUrl));
	});
});

module.exports = router;
