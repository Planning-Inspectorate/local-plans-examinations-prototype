const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const uploadMiqsRouter = require('./_upload-miqs');
const uploadMainModsRouter = require('./_upload-main-mods');

// Fields that get seeded/cleared as the examination status changes.
// Session dates use the 'd/M/yyyy' format expected by formatDateForDisplay in _routes.js.
const EXAMINATION_STATUS_FIELDS = [
	'examinationEstimatedDate',
	'examinationActualDate',
	'examiningInspector1Name',
	'examiningInspector2Name',
	'examiningInspector3Name',
	'examiningInspectorAppointmentDate',
	'examinationWebsite',
	'hearings',
	'planPauseDate',
	'planPauseEndDate',
	'qaDate',
	'qaInspector1Name',
	'qaInspector2Name',
	'qaInspector3Name',
	'qaReportSentDate',
	'qaPanelResponseDate',
	'factCheckReceivedDate',
	'factCheckDueDate',
	'factCheckActualDate',
	'factCheckReceivedFromLpaDate',
	'finalReportIssueDate',
	'soundUnsound',
	'soundUnsoundDate',
	'letterSentToMhclgDate',
	'letterIssueDate',
	'adoptionDate',
	'approvedForCilDate'
];

function clearExaminationStatusFields(req) {
	EXAMINATION_STATUS_FIELDS.forEach((field) => {
		delete req.session[field];
	});

	delete req.session[uploadMiqsRouter.MIQ_DOCS_KEY];
	if (req.session.data) {
		delete req.session.data[uploadMiqsRouter.MIQ_DOCS_KEY];
	}

	delete req.session[uploadMainModsRouter.MAIN_MODS_DOCS_KEY];
	if (req.session.data) {
		delete req.session.data[uploadMainModsRouter.MAIN_MODS_DOCS_KEY];
	}
}

router.get('/set-status', (req, res) => {
	let state = req.query.state || 'submission-pending';
	if (state === 'exam-pending') state = 'submission-pending';
	if (state === 'hearing-pending') state = 'submission-received';

	const returnUrl = req.query.returnUrl || `${req.baseUrl}/examination`;

	clearExaminationStatusFields(req);

	const states = [
		'submission-pending',
		'submission-received',
		'exam-in-progress',
		'paused',
		'qa',
		'fact-check',
		'report-issued',
		'plan-adopted'
	];
	const stateIndex = states.indexOf(state);
	const reachedState = (name) => stateIndex >= states.indexOf(name);

	// Submission pending: Action on LPA to prepare examination documents after GW3 report.
	req.session.examinationEstimatedDate = '15/10/2026';
	req.session.examinationWebsite = 'https://www.example-council.gov.uk/local-plan-examination';

	// Submission received: LPA has submitted documents and on CO to assign Inspector (inspector and hearing not set up yet).
	if (reachedState('submission-received')) {
		req.session.examinationActualDate = '20/9/2026';
	}

	// Exam in progress: Inspector assigned, MIQ documents uploaded, and hearing set up. Inspector is completing final examination and report.
	if (reachedState('exam-in-progress') || reachedState('paused') || reachedState('qa') || reachedState('fact-check') || reachedState('report-issued') || reachedState('plan-adopted')) {
		req.session.examiningInspector1Name = 'Jane Smith';
		req.session.examiningInspectorAppointmentDate = '22/9/2026';

		const miqDocuments = [
			{
				originalname: 'Matters_and_Issues_Questions.pdf',
				filename: 'miq-status-seed-1',
				size: 184000,
				uploadedAt: new Date().toISOString()
			}
		];
		req.session[uploadMiqsRouter.MIQ_DOCS_KEY] = miqDocuments;
		if (req.session.data) {
			req.session.data[uploadMiqsRouter.MIQ_DOCS_KEY] = miqDocuments;
		}

		req.session.hearings = [
			{
				startDate: '20/10/2026',
				endDate: '22/10/2026',
				time: '10:00',
				estimatedDays: '3',
				actualDuration: reachedState('qa') ? '3 days' : '',
				isVirtual: 'In-person',
				venue: 'Town Hall Conference Room',
				hasAddress: 'Yes',
				address: {
					line1: '42 High Street',
					town: 'Manchester',
					postcode: 'M1 1AB'
				}
			}
		];

		const mainModsDocuments = [
			{
				originalname: 'Main_Modifications.pdf',
				filename: 'main-mods-status-seed-1',
				size: 212000,
				uploadedAt: new Date().toISOString()
			}
		];
		req.session[uploadMainModsRouter.MAIN_MODS_DOCS_KEY] = mainModsDocuments;
		if (req.session.data) {
			req.session.data[uploadMainModsRouter.MAIN_MODS_DOCS_KEY] = mainModsDocuments;
		}
	}

	// Paused: Inspector input Pause date.
	if (state === 'paused') {
		req.session.planPauseDate = '1/8/2026';
		req.session.planPauseEndDate = '1/11/2026';
	}

	// QA: Inspector has uploaded final report; QA in progress with additional inspectors.
	if (reachedState('qa')) {
		req.session.qaDate = '20/8/2026';
		req.session.qaInspector1Name = 'David Brown';
		req.session.qaReportSentDate = '25/8/2026';
	}

	// Fact check: After marking QA complete, LPA can draw attention to errors in the report.
	if (reachedState('fact-check')) {
		req.session.qaPanelResponseDate = '28/8/2026';
		req.session.factCheckReceivedDate = '1/9/2026';
		req.session.factCheckDueDate = '8/9/2026';
		req.session.factCheckActualDate = '5/9/2026';
		req.session.factCheckReceivedFromLpaDate = '6/9/2026';
	}

	// Report issued: Once LPA has received Final report and Sound/Unsound result.
	if (reachedState('report-issued')) {
		req.session.letterSentToMhclgDate = '10/9/2026';
		req.session.letterIssueDate = '12/9/2026';
		req.session.soundUnsound = 'Sound';
		req.session.soundUnsoundDate = '15/9/2026';
		req.session.finalReportIssueDate = '15/9/2026';
	}

	// Plan adopted: Once Adoption date has been input in the BO.
	if (reachedState('plan-adopted')) {
		req.session.adoptionDate = '1/10/2026';
		req.session.approvedForCilDate = '5/10/2026';
	}

	req.session.examinationV3StatusState = state;
	req.session.data.examinationV3StatusState = state;

	req.session.save((error) => {
		if (error) {
			return res.status(500).send('Unable to save examination status');
		}
		res.redirect(returnUrl);
	});
});

module.exports = router;
