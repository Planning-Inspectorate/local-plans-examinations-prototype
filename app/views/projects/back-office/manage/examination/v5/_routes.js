const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');
const uploadMiqsRouter = require('./_upload-miqs');
const uploadMainModsRouter = require('./_upload-main-mods');
const uploadExaminationReportRouter = require('./_upload-examination-report');
const uploadFinalReportRouter = require('./_upload-final-report');
const { getPlanStatusClasses } = require('../../../../../../routes/projects/back-office/plan-status-classes');

const EXAMINATION_STATUS_LABELS = {
	'exam-pending': 'Exam pending',
	'hearing-pending': 'Hearing pending',
	'exam-in-progress': 'Exam in progress',
	'qa': 'QA',
	'fact-check': 'Fact check',
		'report-issued': 'Report issued',
		'plan-adopted': 'Plan adopted'
};

router.use((req, res, next) => {
	if (req.method === 'POST') {
		const redirect = res.redirect.bind(res);
		res.redirect = (...args) => {
			if (!req.session.notificationMessage) req.session.notificationMessage = 'Changes saved';
			return redirect(...args);
		};
	}
	next();
});

function getExaminationStatusText(session) {
	if (session.planPauseStatusState === 'withdrawn') {
		return 'Withdrawn';
	}

	if (session.planPauseStatusState === 'paused') {
		return 'Paused';
	}

	return EXAMINATION_STATUS_LABELS[session.examinationV3StatusState] || 'Exam pending';
}

function formatTimestampForDisplay(timestamp) {
	if (!timestamp) return '-';

	const parsed = DateTime.fromISO(timestamp);
	return parsed.isValid ? parsed.toFormat('d MMMM yyyy') : '-';
}

function formatDateForDisplay(dateString) {
	if (!dateString) return '';
	try {
		const parsed = DateTime.fromFormat(dateString, 'd/M/yyyy');
		if (parsed.isValid) {
			return parsed.toFormat('d MMMM yyyy');
		}
		return dateString;
	} catch (e) {
		return dateString;
	}
}

function hasLegacyHearingData(session) {
	const fields = [
		session.hearingStartDate,
		session.hearingTime,
		session.hearingEstimatedDays,
		session.hearingActualDuration,
		session.hearingEndDate,
		session.hearingVenue,
		session.hearingVirtualMeetingLink
	];

	return fields.some((value) => value && value !== '-');
}

function ensureHearings(session) {
	if (Array.isArray(session.hearings) && session.hearings.length) {
		return session.hearings;
	}

	if (Array.isArray(session.data?.hearings) && session.data.hearings.length) {
		session.hearings = session.data.hearings;
		return session.hearings;
	}

	if (!hasLegacyHearingData(session)) {
		session.hearings = [];
		return session.hearings;
	}

	const legacyHearing = {
		startDate: session.hearingStartDate || '',
		time: session.hearingTime || '',
		estimatedDays: session.hearingEstimatedDays || '',
		actualDuration: session.hearingActualDuration || '',
		endDate: session.hearingEndDate || '',
		isVirtual: session.hearingIsVirtual || '',
		hasVirtualMeetingLink: session.hearingHasVirtualMeetingLink || 'No',
		virtualMeetingLink: session.hearingVirtualMeetingLink || '',
		venue: session.hearingVenue || '-',
		address: session.hearingAddress || {},
		hasAddress: session.hearingHasAddress || 'No'
	};

	session.hearings = [legacyHearing];
	if (session.data) {
		session.data.hearings = session.hearings;
	}

	return session.hearings;
}

router.use((req, res, next) => {
	res.locals.basePath = req.baseUrl || '';
	next();
});

// Main examination page (both /examination and /examination.html)
router.get('/examination', (req, res) => {
	const notificationMessage = req.session.notificationMessage || '';
	delete req.session.notificationMessage;

	const miqDocuments = uploadMiqsRouter.getMiqDocuments(req);
	const latestMiqDocument = miqDocuments.length ? miqDocuments[miqDocuments.length - 1] : null;

	const mainModsDocuments = uploadMainModsRouter.getMainModsDocuments(req);
	const latestMainModsDocument = mainModsDocuments.length ? mainModsDocuments[mainModsDocuments.length - 1] : null;
	const examinationReportDocuments = uploadExaminationReportRouter.getDocuments(req);
	const latestExaminationReportDocument = examinationReportDocuments.length ? examinationReportDocuments[examinationReportDocuments.length - 1] : null;
	const finalReportDocuments = uploadFinalReportRouter.getDocuments(req);
	const latestFinalReportDocument = finalReportDocuments.length ? finalReportDocuments[finalReportDocuments.length - 1] : null;
	const examinationInspectors = getExaminingInspectors(req).map((inspector) => ({
		...inspector,
		dateAppointed: formatDateForDisplay(inspector.dateAppointed) || '-'
	}));
	const qaInspectors = getQaInspectors(req).map((inspector) => ({
		...inspector,
		dateAppointed: formatDateForDisplay(inspector.dateAppointed) || '-'
	}));
	const hearingsForDisplay = ensureHearings(req.session).map((hearing) => ({
		...hearing,
		startDate: formatDateForDisplay(hearing.startDate) || '-',
		endDate: formatDateForDisplay(hearing.endDate) || '-'
	}));

	const headerStatusText = getExaminationStatusText(req.session);

	res.render('projects/back-office/manage/examination/v5/examination', {
		caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
		planTitle: req.session.data?.planTitle || req.session.planTitle || '',
		examinationInspectors,
		qaInspectors,
		examinationStatusState: req.session.examinationV3StatusState || '',
		notificationMessage: notificationMessage,
		headerStatusText: headerStatusText,
		headerStatusClasses: getPlanStatusClasses(headerStatusText),
		examinationEstimatedDate: formatDateForDisplay(req.session.examinationEstimatedDate) || '-',
		examinationActualDate: formatDateForDisplay(req.session.examinationActualDate) || '-',
		examiningInspector1Name: req.session.examiningInspector1Name || '-',
		examiningInspector2Name: req.session.examiningInspector2Name || '-',
		examiningInspector3Name: req.session.examiningInspector3Name || '-',
		examiningInspectorAppointmentDate: formatDateForDisplay(req.session.examiningInspectorAppointmentDate) || '-',
		examinationWebsite: req.session.examinationWebsite || '-',
		hearings: hearingsForDisplay,
		miqDocumentsSummary: {
			count: miqDocuments.length,
			latestUploadedAtDisplay: latestMiqDocument ? formatTimestampForDisplay(latestMiqDocument.uploadedAt) : '-',
			hasDocuments: miqDocuments.length > 0
		},
		mainModsDocumentsSummary: {
			count: mainModsDocuments.length,
			latestUploadedAtDisplay: latestMainModsDocument ? formatTimestampForDisplay(latestMainModsDocument.uploadedAt) : '-',
			hasDocuments: mainModsDocuments.length > 0
		},
		examinationReportSummary: {
			count: examinationReportDocuments.length,
			latestUploadedAtDisplay: latestExaminationReportDocument ? formatTimestampForDisplay(latestExaminationReportDocument.uploadedAt) : '-',
			hasDocuments: examinationReportDocuments.length > 0
		},
		finalReportSummary: {
			count: finalReportDocuments.length,
			latestUploadedAtDisplay: latestFinalReportDocument ? formatTimestampForDisplay(latestFinalReportDocument.uploadedAt) : '-',
			hasDocuments: finalReportDocuments.length > 0
		},
		letterSentToMhclgDate: formatDateForDisplay(req.session.letterSentToMhclgDate) || '-',
		letterIssueDate: formatDateForDisplay(req.session.letterIssueDate) || '-',
		qaDate: formatDateForDisplay(req.session.qaDate) || '-',
		qaInspector1Name: req.session.qaInspector1Name || '-',
		qaInspector2Name: req.session.qaInspector2Name || '-',
		qaInspector3Name: req.session.qaInspector3Name || '-',
		qaReportSentDate: formatDateForDisplay(req.session.qaReportSentDate) || '-',
		qaPanelResponseDate: formatDateForDisplay(req.session.qaPanelResponseDate) || '-',
		factCheckReceivedDate: formatDateForDisplay(req.session.factCheckReceivedDate) || '-',
		factCheckActualDate: formatDateForDisplay(req.session.factCheckActualDate) || '-',
		factCheckReceivedFromLpaDate: formatDateForDisplay(req.session.factCheckReceivedFromLpaDate) || '-',
		finalReportIssueDate: formatDateForDisplay(req.session.finalReportIssueDate) || '-',
		planPauseDate: formatDateForDisplay(req.session.planPauseDate) || '-',
		planPauseReason: req.session.planPauseReason || '-',
		planPauseEndDate: formatDateForDisplay(req.session.planPauseEndDate) || '-',
		planPauseActualEndDate: formatDateForDisplay(req.session.planPauseActualEndDate) || '-',
		planPauseDecision: req.session.planPauseDecision || '-',
		planPauseDecisionReason: req.session.planPauseDecisionReason || '-',
		planPauseStatusState: req.session.planPauseStatusState || '',
		withdrawnDate: formatDateForDisplay(req.session.withdrawnDate) || '-',
		planSoundness: req.session.planSoundness || '-',
		soundUnsoundDate: formatDateForDisplay(req.session.soundUnsoundDate) || '-',
		adoptionDate: formatDateForDisplay(req.session.adoptionDate) || '-',
		approvedForCilDate: formatDateForDisplay(req.session.approvedForCilDate) || '-'
	});

	req.session.save();
});

router.get('/examination.html', (req, res) => {
	res.redirect('/projects/back-office/manage/examination/v5/examination');
});

router.get(['/adoption-date', '/adoption-date.html'], (req, res) => {
	res.render('projects/back-office/manage/examination/v5/adoption-date', {
		noticeOfIntentionDate: req.session.adoptionDate || '',
		returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
	});
});

router.post(['/adoption-date', '/adoption-date.html'], (req, res) => {
	const { 'adoption-date-day': day, 'adoption-date-month': month, 'adoption-date-year': year, returnUrl } = req.body;
	const date = DateTime.fromObject({ day: Number(day), month: Number(month), year: Number(year) });
	if (date.isValid) {
		req.session.adoptionDate = date.toFormat('d/M/yyyy');
		req.session.examinationV3StatusState = 'plan-adopted';
	}
	res.redirect(returnUrl || `${req.baseUrl}/examination`);
});

function getQaInspectors(req) {
	if (Array.isArray(req.session.qaInspectors)) return req.session.qaInspectors;
	const inspectors = [1, 2, 3]
		.map((number) => req.session[`qaInspector${number}Name`])
		.filter((name) => name && name !== '-')
		.map((name, index) => ({ name, dateAppointed: index === 0 ? req.session.qaInspectorAppointmentDate || '' : '' }));
	req.session.qaInspectors = inspectors;
	return inspectors;
}

function addInspectorRoutes(prefix, sessionKey, pagePrefix, checkTemplate, dateTemplate) {
	router.get(`/${prefix}`, (req, res) => {
		const editIndex = req.query.edit;
		const inspectors = sessionKey === 'qaInspectors' ? getQaInspectors(req) : getExaminingInspectors(req);
		res.render(`projects/back-office/manage/examination/v5/${pagePrefix}`, {
			inspector: editIndex !== undefined ? inspectors[Number(editIndex)] || {} : {},
			editIndex: editIndex !== undefined ? editIndex : '',
			returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
		});
	});

	router.post(`/${prefix}`, (req, res) => {
		const name = (req.body.name || '').trim();
		const inspectors = sessionKey === 'qaInspectors' ? getQaInspectors(req) : getExaminingInspectors(req);
		const editIndex = req.body.editIndex;
		if (!name) return res.redirect(`${req.baseUrl}/${prefix}?edit=${editIndex || ''}`);
		if (editIndex !== '') inspectors[Number(editIndex)] = { ...inspectors[Number(editIndex)], name };
		else inspectors.push({ name, dateAppointed: DateTime.now().toFormat('d MMMM yyyy') });
		req.session[sessionKey] = inspectors;
		req.session.save(() => res.redirect(`${req.baseUrl}/${prefix}s/check-answers?returnUrl=${encodeURIComponent(req.body.returnUrl || `${req.baseUrl}/examination`)}`));
	});

	router.get(`/${prefix}s/check-answers`, (req, res) => {
		const inspectors = sessionKey === 'qaInspectors' ? getQaInspectors(req) : getExaminingInspectors(req);
		res.render(`projects/back-office/manage/examination/v5/${checkTemplate}`, {
			inspector: inspectors[inspectors.length - 1] || {},
			index: inspectors.length - 1,
			returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
		});
	});

	router.post(`/${prefix}s/check-answers`, (req, res) => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
	router.get(`/${prefix}/:index/appointed-date`, (req, res) => {
		const inspectors = sessionKey === 'qaInspectors' ? getQaInspectors(req) : getExaminingInspectors(req);
		const inspector = inspectors[Number(req.params.index)] || {};
		res.render(`projects/back-office/manage/examination/v5/${dateTemplate}`, { index: req.params.index, dateParts: inspector.dateAppointed ? inspector.dateAppointed.split(' ') : ['', '', ''], returnUrl: req.query.returnUrl || `${req.baseUrl}/${prefix}s/check-answers` });
	});
	router.post(`/${prefix}/:index/appointed-date`, (req, res) => {
		const inspectors = sessionKey === 'qaInspectors' ? getQaInspectors(req) : getExaminingInspectors(req);
		const inspector = inspectors[Number(req.params.index)];
		const date = DateTime.fromObject({ day: Number(req.body.day), month: Number(req.body.month), year: Number(req.body.year) });
		if (inspector && date.isValid) inspector.dateAppointed = date.toFormat('d MMMM yyyy');
		res.redirect(req.body.returnUrl || `${req.baseUrl}/${prefix}s/check-answers`);
	});
	router.get(`/${prefix}/:index/remove`, (req, res) => {
		const inspectors = sessionKey === 'qaInspectors' ? getQaInspectors(req) : getExaminingInspectors(req);
		inspectors.splice(Number(req.params.index), 1);
		res.redirect(req.query.returnUrl || `${req.baseUrl}/examination`);
	});
}

router.get('/qa-inspector', (req, res) => {
	const editIndex = req.query.edit;
	const inspectors = getQaInspectors(req);
	res.render('projects/back-office/manage/examination/v5/qa-inspector', {
		inspector: editIndex !== undefined ? inspectors[Number(editIndex)] || {} : {},
		editIndex: editIndex !== undefined ? editIndex : '',
		returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
	});
});

router.post('/qa-inspector', (req, res) => {
	const name = (req.body.name || '').trim();
	const inspectors = getQaInspectors(req);
	const editIndex = req.body.editIndex;
	if (!name) return res.redirect(`${req.baseUrl}/qa-inspector?edit=${editIndex || ''}`);
	if (editIndex !== undefined && editIndex !== '') inspectors[Number(editIndex)] = { ...inspectors[Number(editIndex)], name };
	else inspectors.push({ name, dateAppointed: DateTime.now().toFormat('d MMMM yyyy') });
	req.session.qaInspectors = inspectors;
	req.session.notificationMessage = 'QA inspector added';
	const checkAnswersUrl = `${req.baseUrl}/qa-inspectors/check-answers?returnUrl=${encodeURIComponent(req.body.returnUrl || `${req.baseUrl}/examination`)}`;
	req.session.save((error) => {
		if (error) return res.status(500).send('Unable to save QA inspector');
		res.redirect(checkAnswersUrl);
	});
});

router.get('/qa-inspectors/check-answers', (req, res) => {
	const inspectors = getQaInspectors(req);
	res.render('projects/back-office/manage/examination/v5/qa-inspectors-check-answers', {
		inspector: inspectors[inspectors.length - 1] || {},
		index: inspectors.length - 1,
		returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
	});
});

router.post('/qa-inspectors/check-answers', (req, res) => {
	res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`);
});

router.get('/qa-inspector/:index/appointed-date', (req, res) => {
	const inspector = getQaInspectors(req)[Number(req.params.index)] || {};
	res.render('projects/back-office/manage/examination/v5/qa-inspector-appointed-date', {
		index: req.params.index,
		dateParts: inspector.dateAppointed ? inspector.dateAppointed.split(' ') : ['', '', ''],
		returnUrl: req.query.returnUrl || `${req.baseUrl}/qa-inspectors/check-answers`
	});
});

router.post('/qa-inspector/:index/appointed-date', (req, res) => {
	const inspector = getQaInspectors(req)[Number(req.params.index)];
	const date = DateTime.fromObject({ day: Number(req.body.day), month: Number(req.body.month), year: Number(req.body.year) });
	if (inspector && date.isValid) inspector.dateAppointed = date.toFormat('d MMMM yyyy');
	res.redirect(req.body.returnUrl || `${req.baseUrl}/qa-inspectors/check-answers`);
});

router.get('/qa-inspector/:index/remove', (req, res) => {
	if (Array.isArray(req.session.qaInspectors)) req.session.qaInspectors.splice(Number(req.params.index), 1);
	res.redirect(req.query.returnUrl || `${req.baseUrl}/examination`);
});

function getExaminingInspectors(req) {
	if (Array.isArray(req.session.examinationInspectors)) return req.session.examinationInspectors;
	const inspectors = [1, 2, 3]
		.map((number) => req.session[`examiningInspector${number}Name`])
		.filter((name) => name && name !== '-')
		.map((name, index) => ({
			name,
			dateAppointed: index === 0 ? req.session.examiningInspectorAppointmentDate || '' : ''
		}));
	req.session.examinationInspectors = inspectors;
	return inspectors;
}

router.get('/inspectors/check-answers', (req, res) => {
	const inspectors = getExaminingInspectors(req);
	res.render('projects/back-office/manage/examination/v5/inspectors-check-answers', {
		inspector: inspectors[inspectors.length - 1] || {},
		index: inspectors.length - 1,
		returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
	});
});

router.post('/inspectors/check-answers', (req, res) => {
	res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`);
});

router.get('/inspector', (req, res) => {
	const editIndex = req.query.edit;
	const inspectors = getExaminingInspectors(req);
	res.render('projects/back-office/manage/examination/v5/inspector', {
		inspector: editIndex !== undefined ? inspectors[Number(editIndex)] || {} : {},
		editIndex: editIndex !== undefined ? editIndex : '',
		returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
	});
});

router.post('/inspector', (req, res) => {
	const name = (req.body.name || '').trim();
	const inspectors = getExaminingInspectors(req);
	const editIndex = req.body.editIndex;
	if (!name) return res.redirect(`${req.baseUrl}/inspector?edit=${editIndex || ''}`);
	if (editIndex !== '') inspectors[Number(editIndex)] = { ...inspectors[Number(editIndex)], name };
	else inspectors.push({ name, dateAppointed: DateTime.now().toFormat('d MMMM yyyy') });
	req.session.examinationInspectors = inspectors;
	req.session.notificationMessage = 'Inspector added';
	req.session.save(() => res.redirect(`${req.baseUrl}/inspectors/check-answers?returnUrl=${encodeURIComponent(req.body.returnUrl || `${req.baseUrl}/examination`)}`));
});

router.post('/inspector/remove', (req, res) => {
	const inspectors = getExaminingInspectors(req);
	inspectors.splice(Number(req.body.index), 1);
	req.session.examinationInspectors = inspectors;
	req.session.save(() => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
});

router.get('/final-report/sound-unsound', (req, res) => {
	res.render('projects/back-office/manage/examination/v5/sound-unsound', {
		caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
		planType: req.session.planSoundness || '',
		finalReport: true,
		returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
	});
});

router.post('/final-report/sound-unsound', (req, res) => {
	const soundness = (req.body['plan-soundness'] || '').trim();
	const returnUrl = req.body.returnUrl || `${req.baseUrl}/examination`;

	if (soundness) {
		const capitalized = soundness.charAt(0).toUpperCase() + soundness.slice(1);
		req.session.planSoundness = capitalized;
		req.session.soundUnsoundDate = req.session.soundUnsoundDate || new Date().toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
		if (capitalized === 'Sound') {
			delete req.session.planPauseStatusState;
		} else if (capitalized === 'Unsound') {
			req.session.planPauseStatusState = 'withdrawn';
			req.session.withdrawnDate = req.session.withdrawnDate || new Date().toLocaleDateString('en-GB');
		}
	}

	req.session.save(() => {
		res.redirect(`${req.baseUrl}/upload/final-report/upload-bo?returnUrl=${encodeURIComponent(returnUrl)}`);
	});
});

// Mount local examination routes.
router.use('/', require('./_add-hearing-estimates'));
router.use('/', require('./_add-hearing'));
router.use('/', require('./_cancel-hearing'));
router.use('/', require('./_edit-hearing'));
router.use('/', require('./_edit-hearing-estimates'));
router.use('/', require('./_plan-pause'));
router.use('/', uploadMiqsRouter);
router.use('/', uploadMainModsRouter);
router.use('/', uploadExaminationReportRouter);
router.use('/', uploadFinalReportRouter);
router.use('/', require('./_set-status'));
module.exports = router;