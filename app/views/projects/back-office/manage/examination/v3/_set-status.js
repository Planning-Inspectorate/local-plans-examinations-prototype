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
	'qaDate',
	'qaInspector1Name',
	'qaInspector2Name',
	'qaInspector3Name',
	'qaReportSentDate',
	'qaPanelResponseDate',
	'factCheckReceivedDate',
	'factCheckDueDate',
	'factCheckActualDate',
	'factCheckReceivedFromLpaDate'
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
	const state = req.query.state || 'exam-pending';
	const returnUrl = req.query.returnUrl || `${req.baseUrl}/examination`;

	clearExaminationStatusFields(req);

	const states = ['exam-pending', 'hearing-pending', 'exam-in-progress', 'qa', 'fact-check'];
	const stateIndex = states.indexOf(state);
	const reachedState = (name) => stateIndex >= states.indexOf(name);

	// Exam pending: only the estimated date and examination website are populated.
	req.session.examinationEstimatedDate = '15/10/2026';
	req.session.examinationWebsite = 'https://www.example-council.gov.uk/local-plan-examination';

	// Hearing pending: add received date, inspectors, MIQ documents and a hearing with a future date.
	if (reachedState('hearing-pending')) {
		req.session.examinationActualDate = '20/9/2026';
		req.session.examiningInspector1Name = 'Jane Smith';
		req.session.examiningInspectorAppointmentDate = '1/9/2026';

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
	}

	// Exam in progress: same as above, but the hearing date has now passed and main mods have been issued.
	if (reachedState('exam-in-progress')) {
		req.session.hearings = [
			{
				...req.session.hearings[0],
				startDate: '10/8/2026',
				endDate: '12/8/2026',
				actualDuration: '3 days'
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

	// QA: the inspector has uploaded their report and it has been sent for QA.
	if (reachedState('qa')) {
		req.session.qaDate = '20/8/2026';
		req.session.qaInspector1Name = 'David Brown';
		req.session.qaReportSentDate = '25/8/2026';
	}

	// Fact check: fact check has been completed.
	if (reachedState('fact-check')) {
		req.session.factCheckReceivedDate = '1/9/2026';
		req.session.factCheckDueDate = '8/9/2026';
		req.session.factCheckActualDate = '5/9/2026';
		req.session.factCheckReceivedFromLpaDate = '6/9/2026';
	}

	req.session.examinationV3StatusState = state;

	req.session.save(() => {
		res.redirect(returnUrl);
	});
});

module.exports = router;
