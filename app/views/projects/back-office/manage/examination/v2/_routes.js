const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();



function parseDateFields(day, month, year) {
	if (!day || !month || !year) {
		return '';
	}

	const months = [
		'',
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const monthName = /^\d+$/.test(month)
		? months[parseInt(month, 10)] || month
		: month;

	return `${parseInt(day, 10)} ${monthName} ${year}`;
}

function getDateParts(value) {
	if (!value || value === '-') {
		return { day: '', month: '', year: '' };
	}

	const parts = value.includes('/') ? value.split('/') : value.split(' ');
	const day = parts[0] || '';
	const monthRaw = parts[1] || '';
	const year = parts[2] || '';
	const monthMap = {
		January: '01',
		February: '02',
		March: '03',
		April: '04',
		May: '05',
		June: '06',
		July: '07',
		August: '08',
		September: '09',
		October: '10',
		November: '11',
		December: '12'
	};

	let month = monthMap[monthRaw] || monthRaw;
	if (/^\d$/.test(month)) {
		month = `0${month}`;
	}

	return { day, month, year };
}

function formatDateForDisplay(dateString) {
	if (!dateString || dateString === '-') {
		return '-';
	}

	if (dateString.includes(' ')) {
		return dateString;
	}

	const [day, month, year] = dateString.split('/');
	if (!day || !month || !year) {
		return dateString;
	}

	return parseDateFields(day, month, year) || dateString;
}

function getReturnUrl(req) {
	return req.query.returnUrl || req.body.returnUrl || '/projects/back-office/manage/examination/v2/examination-hearings-flat';
}

function createEmptyHearing() {
	return {
		startDate: '',
		time: '',
		estimatedDays: '',
		actualDuration: '',
		endDate: '',
		venue: '',
		address: {},
		virtualMeetingLink: ''
	};
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
	
// only initialise array, do NOT auto-create data
if (!Array.isArray(session.hearings)) {
    session.hearings = [];
}



	return session.hearings;
}

function syncLegacyFromHearings(session) {
	const hearings = ensureHearings(session);
	const latest = hearings.length ? hearings[hearings.length - 1] : null;

	if (!latest) {
		session.hearingStartDate = '-';
		session.hearingTime = '-';
		session.hearingEstimatedDays = '-';
		session.hearingActualDuration = '-';
		session.hearingEndDate = '-';
		session.hearingVenue = '-';
		session.hearingAddress = {};
		session.hearingVirtualMeetingLink = '-';
		return;
	}

	session.hearingStartDate = latest.startDate || '-';
	session.hearingTime = latest.time || '-';
	session.hearingEstimatedDays = latest.estimatedDays || '-';
	session.hearingActualDuration = latest.actualDuration || '-';
	session.hearingEndDate = latest.endDate || '-';
	session.hearingVenue = latest.venue || '-';
	session.hearingAddress = latest.address || {};
	session.hearingVirtualMeetingLink = latest.virtualMeetingLink || '-';
}

function getHearingIndex(req) {
	const raw = req.query.hearingIndex ?? req.body.hearingIndex;
	const parsed = Number.parseInt(raw, 10);
	return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function getOrCreateHearingForWrite(session, hearingIndex) {
	const hearings = ensureHearings(session);
	if (hearingIndex !== null && hearingIndex < hearings.length) {
		return { hearing: hearings[hearingIndex], hearingIndex };
	}

	const newHearing = createEmptyHearing();
	hearings.push(newHearing);
	return { hearing: newHearing, hearingIndex: hearings.length - 1 };
}

function buildAddHearingViewModelFromHearing(hearing) {
	const startDate = getDateParts(hearing.startDate || '');
	const endDate = getDateParts(hearing.endDate || '');
	const timeParts = (hearing.time || '').split(':');

	return {
		date: startDate,
		time: {
			hour: timeParts[0] || '',
			minute: timeParts[1] || ''
		},
		estimatedDuration: hearing.estimatedDays || '',
		actualDuration: hearing.actualDuration || '',
		endDate,
		venue: hearing.venue || '',
		virtualMeetingLink: hearing.virtualMeetingLink || '',
		address: hearing.address || {}
	};
}

function getHearingForRead(session, hearingIndex) {
	const hearings = ensureHearings(session);
	if (hearingIndex !== null && hearingIndex < hearings.length) {
		return { hearing: hearings[hearingIndex], hearingIndex };
	}

	return { hearing: createEmptyHearing(), hearingIndex: null };
}

router.get('/examination-hearings-flat', (req, res) => {
	const notificationMessage = req.session.notificationMessage || '';
	delete req.session.notificationMessage;

	const hearings = ensureHearings(req.session);
	let hearingsForView = hearings.map((hearing, index) => ({
		index,
		label: `Hearing ${index + 1}`,
		canCancel: true,
		startDate: formatDateForDisplay(hearing.startDate) || '-',
		time: hearing.time || '-',
		estimatedDuration: hearing.estimatedDays || '-',
		actualDuration: hearing.actualDuration || '-',
		endDate: formatDateForDisplay(hearing.endDate) || '-',
        venue: hearing.venue || '-',
        address: hearing.address || '-',
		virtualMeetingLink: hearing.virtualMeetingLink || '-'
	}));

	if (hearingsForView.length === 0) {
		hearingsForView = [{
			index: null,
			label: 'Hearing 1',
			canCancel: false,
			startDate: '-',
			time: '-',
			estimatedDuration: '-',
			actualDuration: '-',
			endDate: '-',
			venue: '-',
			address: {},
			virtualMeetingLink: '-'
		}];
	}

	res.render('projects/back-office/manage/examination/v2/examination-hearings-flat', {
		caseRef: req.session.currentCaseRef || '',
		planTitle: req.session.planTitle || '',
		notificationMessage,
		hearings: hearingsForView,
		examinationEstimatedDate: formatDateForDisplay(req.session.examinationEstimatedDate) || '-',
		examinationActualDate: formatDateForDisplay(req.session.examinationActualDate) || '-',
		examiningInspector1Name: req.session.examiningInspector1Name || '-',
		examiningInspector2Name: req.session.examiningInspector2Name || '-',
		examiningInspector3Name: req.session.examiningInspector3Name || '-',
		examiningInspectorAppointmentDate: formatDateForDisplay(req.session.examiningInspectorAppointmentDate) || '-',
		examinationWebsite: req.session.examinationWebsite || '-',
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
});

router.get('/cancel-hearing', (req, res) => {
	const returnUrl = getReturnUrl(req);
	const hearingIndex = getHearingIndex(req);
	const hearings = ensureHearings(req.session);
	const hearingNumber = hearingIndex !== null ? hearingIndex + 1 : '';
	const isValidHearing = hearingIndex !== null && hearingIndex < hearings.length;

	res.render('projects/back-office/manage/examination/v2/cancel-hearing/index', {
		returnUrl,
		hearingIndex,
		hearingNumber,
		isValidHearing
	});
});

router.post('/cancel-hearing', (req, res) => {
	const returnUrl = getReturnUrl(req);
	const hearingIndex = getHearingIndex(req);
	const hearings = ensureHearings(req.session);

	if (hearingIndex === null || hearingIndex >= hearings.length) {
		req.session.notificationMessage = 'Unable to cancel hearing';
		return res.redirect(returnUrl);
	}

	hearings.splice(hearingIndex, 1);
	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = `Hearing ${hearingIndex + 1} cancelled`;
	res.redirect(returnUrl);
});

router.get('/add-hearing/index', (req, res) => {
    const { hearing, hearingIndex } = getHearingForRead(req.session, getHearingIndex(req));
    console.log();
	res.render('projects/back-office/manage/examination/v2/add-hearing/index', {
		addHearing: buildAddHearingViewModelFromHearing(hearing),
		returnUrl: getReturnUrl(req),
		hearingIndex
	});
});

router.post('/add-hearing/index', (req, res) => {
	const { 'hearing-date-day': day, 'hearing-date-month': month, 'hearing-date-year': year, 'hearing-time-hour': hourRaw, 'hearing-time-minute': minuteRaw } = req.body;
	const returnUrl = getReturnUrl(req);
	const { hearing } = getOrCreateHearingForWrite(req.session, getHearingIndex(req));

	hearing.startDate = parseDateFields(day, month, year) || hearing.startDate || '';

	const hour = (hourRaw || '').trim();
	const minute = (minuteRaw || '').trim();
	if (hour || minute) {
		hearing.time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
	}

	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = 'Hearing details updated';
	res.redirect(returnUrl);
});

router.get('/add-hearing/est-duration', (req, res) => {
	const { hearing, hearingIndex } = getHearingForRead(req.session, getHearingIndex(req));
	res.render('projects/back-office/manage/examination/v2/add-hearing/est-duration', {
		addHearing: buildAddHearingViewModelFromHearing(hearing),
		returnUrl: getReturnUrl(req),
		hearingIndex
	});
});

router.post('/add-hearing/est-duration', (req, res) => {
	const returnUrl = getReturnUrl(req);
	const { hearing } = getOrCreateHearingForWrite(req.session, getHearingIndex(req));
	hearing.estimatedDays = (req.body.estimatedDuration || '').trim() || '';

	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = 'Hearing details updated';
	res.redirect(returnUrl);
});

router.get('/add-hearing/actual-duration', (req, res) => {
	const { hearing, hearingIndex } = getHearingForRead(req.session, getHearingIndex(req));
	res.render('projects/back-office/manage/examination/v2/add-hearing/actual-duration', {
		addHearing: buildAddHearingViewModelFromHearing(hearing),
		returnUrl: getReturnUrl(req),
		hearingIndex
	});
});

router.post('/add-hearing/actual-duration', (req, res) => {
	const returnUrl = getReturnUrl(req);
	const { hearing } = getOrCreateHearingForWrite(req.session, getHearingIndex(req));
	hearing.actualDuration = (req.body.actualDuration || '').trim() || '';

	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = 'Hearing details updated';
	res.redirect(returnUrl);
});

router.get('/add-hearing/end-date', (req, res) => {
	const { hearing, hearingIndex } = getHearingForRead(req.session, getHearingIndex(req));
	res.render('projects/back-office/manage/examination/v2/add-hearing/end-date', {
		addHearing: buildAddHearingViewModelFromHearing(hearing),
		returnUrl: getReturnUrl(req),
		hearingIndex
	});
});

router.post('/add-hearing/end-date', (req, res) => {
	const { 'hearing-end-date-day': day, 'hearing-end-date-month': month, 'hearing-end-date-year': year } = req.body;
	const returnUrl = getReturnUrl(req);
	const { hearing } = getOrCreateHearingForWrite(req.session, getHearingIndex(req));

	hearing.endDate = parseDateFields(day, month, year) || hearing.endDate || '';

	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = 'Hearing details updated';
	res.redirect(returnUrl);
});

router.get('/add-hearing/address', (req, res) => {
	const { hearing, hearingIndex } = getHearingForRead(req.session, getHearingIndex(req));
	res.render('projects/back-office/manage/examination/v2/add-hearing/address', {
		addHearing: buildAddHearingViewModelFromHearing(hearing),
		returnUrl: getReturnUrl(req),
		hearingIndex
	});
});

router.post('/add-hearing/address', (req, res) => {
	const returnUrl = getReturnUrl(req);
	const { hearing } = getOrCreateHearingForWrite(req.session, getHearingIndex(req));
	const venue = (req.body['hearing-venue'] || '').trim();
	const line1 = (req.body['hearing-address-line1'] || '').trim();
	const line2 = (req.body['hearing-address-line2'] || '').trim();
	const town = (req.body['hearing-address-town'] || '').trim();
	const postcode = (req.body['hearing-address-postcode'] || '').trim();

	hearing.venue = venue;
	hearing.address = { line1, line2, town, postcode };

	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = 'Hearing details updated';
	res.redirect(returnUrl);
});

router.get('/add-hearing/virtual-meeting', (req, res) => {
	const { hearing, hearingIndex } = getHearingForRead(req.session, getHearingIndex(req));
	res.render('projects/back-office/manage/examination/v2/add-hearing/virtual-meeting', {
		addHearing: buildAddHearingViewModelFromHearing(hearing),
		returnUrl: getReturnUrl(req),
		hearingIndex
	});
});

router.post('/add-hearing/virtual-meeting', (req, res) => {
	const returnUrl = getReturnUrl(req);
	const { hearing } = getOrCreateHearingForWrite(req.session, getHearingIndex(req));
	hearing.virtualMeetingLink = (req.body.virtualMeetingLink || '').trim();

	syncLegacyFromHearings(req.session);
	req.session.notificationMessage = 'Hearing details updated';
	res.redirect(returnUrl);
});

module.exports = router;
