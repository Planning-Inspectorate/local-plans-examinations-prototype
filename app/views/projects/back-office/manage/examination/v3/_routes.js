const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');
const uploadMiqsRouter = require('./_upload-miqs');
const uploadMainModsRouter = require('./_upload-main-mods');
const { getPlanStatusClasses } = require('../../../../../../routes/projects/back-office/plan-status-classes');

const EXAMINATION_STATUS_LABELS = {
	'exam-pending': 'Exam pending',
	'hearing-pending': 'Hearing pending',
	'exam-in-progress': 'Exam in progress',
	'qa': 'QA',
	'fact-check': 'Fact check'
};

function getExaminationStatusText(session) {
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

	const headerStatusText = getExaminationStatusText(req.session);

	res.render('projects/back-office/manage/examination/v3/examination', {
		caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
		planTitle: req.session.data?.planTitle || req.session.planTitle || '',
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
		hearings: ensureHearings(req.session),
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
		letterSentToMhclgDate: formatDateForDisplay(req.session.letterSentToMhclgDate) || '-',
		letterIssueDate: formatDateForDisplay(req.session.letterIssueDate) || '-',
		qaDate: formatDateForDisplay(req.session.qaDate) || '-',
		qaInspector1Name: req.session.qaInspector1Name || '-',
		qaInspector2Name: req.session.qaInspector2Name || '-',
		qaInspector3Name: req.session.qaInspector3Name || '-',
		qaReportSentDate: formatDateForDisplay(req.session.qaReportSentDate) || '-',
		qaPanelResponseDate: formatDateForDisplay(req.session.qaPanelResponseDate) || '-',
		factCheckReceivedDate: formatDateForDisplay(req.session.factCheckReceivedDate) || '-',
		factCheckDueDate: formatDateForDisplay(req.session.factCheckDueDate) || '-',
		factCheckActualDate: formatDateForDisplay(req.session.factCheckActualDate) || '-',
		factCheckReceivedFromLpaDate: formatDateForDisplay(req.session.factCheckReceivedFromLpaDate) || '-',
		finalReportIssueDate: formatDateForDisplay(req.session.finalReportIssueDate) || '-',
		planPauseDate: formatDateForDisplay(req.session.planPauseDate) || '-',
		planPauseEndDate: formatDateForDisplay(req.session.planPauseEndDate) || '-',
		withdrawnDate: formatDateForDisplay(req.session.withdrawnDate) || '-',
		planSoundness: req.session.planSoundness || '-',
		soundUnsoundDate: formatDateForDisplay(req.session.soundUnsoundDate) || '-',
		adoptionDate: formatDateForDisplay(req.session.adoptionDate) || '-',
		approvedForCilDate: formatDateForDisplay(req.session.approvedForCilDate) || '-'
	});

	req.session.save();
});

router.get('/examination.html', (req, res) => {
	res.redirect('/projects/back-office/manage/examination/v3/examination');
});

// Mount local examination routes.
router.use('/', require('./_add-hearing-estimates'));
router.use('/', require('./_add-hearing'));
router.use('/', require('./_cancel-hearing'));
router.use('/', require('./_edit-hearing'));
router.use('/', require('./_edit-hearing-estimates'));
router.use('/', uploadMiqsRouter);
router.use('/', uploadMainModsRouter);
router.use('/', require('./_set-status'));
module.exports = router;