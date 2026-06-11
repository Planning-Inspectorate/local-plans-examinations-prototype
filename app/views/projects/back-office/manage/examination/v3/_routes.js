const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

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

router.use((req, res, next) => {
	res.locals.basePath = req.baseUrl || '';
	next();
});

// Main examination page (both /examination and /examination.html)
router.get('/examination', (req, res) => {
	const notificationMessage = req.session.notificationMessage || '';
	delete req.session.notificationMessage;

	res.render('projects/back-office/manage/examination/v3/examination', {
		caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
		planTitle: req.session.data?.planTitle || req.session.planTitle || '',
		notificationMessage: notificationMessage,
		examinationEstimatedDate: formatDateForDisplay(req.session.examinationEstimatedDate) || '-',
		examinationActualDate: formatDateForDisplay(req.session.examinationActualDate) || '-',
		examiningInspector1Name: req.session.examiningInspector1Name || '-',
		examiningInspector2Name: req.session.examiningInspector2Name || '-',
		examiningInspector3Name: req.session.examiningInspector3Name || '-',
		examiningInspectorAppointmentDate: formatDateForDisplay(req.session.examiningInspectorAppointmentDate) || '-',
		examinationWebsite: req.session.examinationWebsite || '-',
		hearings: Array.isArray(req.session.hearings) ? req.session.hearings : [],
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
module.exports = router;