const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { applyStatusEvent } = require('../../../../../../routes/projects/back-office/status-flow');

function formatDateForDisplay(dateString) {
	if (!dateString || dateString === '-') return '-';

	const ddmmyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (ddmmyyMatch) {
		const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const day = parseInt(ddmmyyMatch[1], 10);
		const month = parseInt(ddmmyyMatch[2], 10);
		const year = ddmmyyMatch[3];
		return `${day} ${months[month]} ${year}`;
	}

	return dateString;
}

function formatTimestampForDisplay(timestamp) {
	if (!timestamp || timestamp === '-') return '-';

	const parsed = new Date(timestamp);
	if (Number.isNaN(parsed.getTime())) return '-';

	return parsed.toLocaleDateString('en-GB', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

function getSignedSlaDocumentsFromFileData(req) {
	let uploadedDocuments = [];
	const fileDataSource = (req.session && req.session.data && req.session.data.fileData)
		|| (req.body && req.body.fileData);

	if (!fileDataSource) return uploadedDocuments;

	try {
		const fileData = typeof fileDataSource === 'string'
			? JSON.parse(fileDataSource)
			: fileDataSource;

		if (Array.isArray(fileData)) {
			uploadedDocuments = fileData.map((file) => {
				let size = 0;
				if (req.session.data && req.session.data.fileSizeMap && req.session.data.fileSizeMap[file.name]) {
					size = req.session.data.fileSizeMap[file.name];
				}

				return {
					originalname: file.name,
					filename: file.id,
					size,
					uploadedAt: file.uploadedAt || new Date().toISOString()
				};
			});
		}
	} catch (error) {
		uploadedDocuments = [];
	}

	return uploadedDocuments;
}

function buildFooterLinks() {
	return [
		{
			text: 'Initial',
			href: '/projects/back-office/manage/GW1/v2/set-state?state=initial&returnUrl=/projects/back-office/manage/GW1/v2/gateway-1'
		},
				{
			text: 'Reset status flow',
			href: '/projects/back-office/manage/GW1/v2/reset-status-flow?returnUrl=/projects/back-office/manage/GW1/v2/gateway-1'
		},
		{
			text: 'SLA uploaded',
			href: '/projects/back-office/manage/GW1/v2/set-state?state=confirmed&returnUrl=/projects/back-office/manage/GW1/v2/gateway-1'
		},
		{
			text: 'View status debug',
			href: '/projects/back-office/manage/status-debug'
		}
	];
}

function getSignedSlaReceivedDateFromUpload(req, uploadedDocuments) {
	const uploadTimestamp = req.session.gw1v2SignedSlaUploadedAt
		|| (uploadedDocuments[0] && uploadedDocuments[0].uploadedAt)
		|| new Date().toISOString();

	const uploadDate = new Date(uploadTimestamp);
	const effectiveDate = Number.isNaN(uploadDate.getTime()) ? new Date() : uploadDate;
	const day = String(effectiveDate.getDate()).padStart(2, '0');
	const month = String(effectiveDate.getMonth() + 1).padStart(2, '0');
	const year = String(effectiveDate.getFullYear());

	return `${day}/${month}/${year}`;
}

function getDateInputValues(dateString) {
	const match = String(dateString || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	if (!match) {
		return { day: '', month: '', year: '' };
	}

	return {
		day: match[1],
		month: match[2],
		year: match[3]
	};
}

function getDateFromValues(day, month, year) {
	if (!day || !month || !year) return '';

	const parsedDay = parseInt(day, 10);
	const parsedMonth = parseInt(month, 10);
	if (Number.isNaN(parsedDay) || Number.isNaN(parsedMonth)) return '';

	return `${String(parsedDay).padStart(2, '0')}/${String(parsedMonth).padStart(2, '0')}/${year}`;
}

function getInputDateFromStoredValue(storedValue) {
	const value = String(storedValue || '').trim();
	if (!value || value === '-') return '';

	if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(value)) {
		return value;
	}

	const parts = value.split(' ');
	if (parts.length !== 3) return '';

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

	const day = String(parseInt(parts[0], 10)).padStart(2, '0');
	const month = monthMap[parts[1]] || '';
	const year = parts[2];

	if (!month || Number.isNaN(parseInt(day, 10)) || !/^\d{4}$/.test(year)) return '';

	return `${day}/${month}/${year}`;
}

function setGw1V2ScenarioState(req, state) {
	const noticeOfIntentionDate = '01/08/2026';
	const expectedDate = '15/08/2026';
	const slaSentDate = '16/08/2026';
	const receivedDate = '18/08/2026';
	const uploadedAt = '2026-08-18T10:30:00.000Z';
	const demoDocument = {
		originalname: 'signed-sla.pdf',
		filename: 'signed-sla-demo',
		size: 245760,
		uploadedAt
	};

	delete req.session.gw1v2SignedSlaDocuments;
	delete req.session.gw1v2PendingSignedSlaDocuments;
	delete req.session.gw1v2SignedSlaUploadedAt;
	delete req.session.gw1v2PendingSlaReceivedDate;
	delete req.session.gateway1SignedSlaFilename;
	delete req.session.noticeOfIntentionDate;
	delete req.session.gateway1EstimatedDate;
	delete req.session.gateway1ActualDate;
	delete req.session.gateway1SlaSentDate;
	delete req.session.gateway1SlaReceivedDate;
	delete req.session.gateway1DsaCheck;
	delete req.session.gateway1DsaCheck;

	req.session.noticeOfIntentionDate = noticeOfIntentionDate;
	req.session.gateway1EstimatedDate = expectedDate;

	if (!req.session.data) {
		req.session.data = {};
	}

	if (state === 'initial') {
		applyStatusEvent(req, 'SLA_PENDING', { force: true, source: 'GW1 scenario initial' });
		return;
	}

	if (state === 'uploaded-pending-confirm') {
		req.session.gw1v2PendingSignedSlaDocuments = [demoDocument];
		req.session.gw1v2SignedSlaUploadedAt = uploadedAt;
		req.session.gateway1SignedSlaFilename = demoDocument.originalname;
		applyStatusEvent(req, 'SLA_PENDING', { force: true, source: 'GW1 scenario uploaded pending confirm' });
		return;
	}

	if (state === 'confirmed') {
		req.session.gw1v2SignedSlaDocuments = [demoDocument];
		req.session.gateway1SignedSlaFilename = demoDocument.originalname;
		req.session.gateway1SlaSentDate = slaSentDate;
		req.session.gateway1SlaReceivedDate = receivedDate;
		req.session.gateway1DsaCheck = 'Yes';
		applyStatusEvent(req, 'SLA_CONFIRMED', { force: true, source: 'GW1 scenario confirmed' });
		return;
	}

	applyStatusEvent(req, 'SLA_PENDING', { force: true, source: 'GW1 scenario defaulted to initial' });
}

router.get('/set-state', (req, res) => {
	const state = String(req.query.state || 'initial');
	const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';

	setGw1V2ScenarioState(req, state);
	res.redirect(returnUrl);
});

router.get('/gateway-1', (req, res) => {
	const notificationMessage = req.session.notificationMessage || '';
	delete req.session.notificationMessage;

	const signedSlaDocuments = Array.isArray(req.session.gw1v2SignedSlaDocuments)
		? req.session.gw1v2SignedSlaDocuments
		: [];

	if (signedSlaDocuments.length === 0) {
		applyStatusEvent(req, 'SLA_PENDING', { res, source: 'GW1 v2 overview GET' });
	}

	res.render('projects/back-office/manage/GW1/v2/gateway-1', {
		caseRef: req.session.currentCaseRef || '',
		planTitle: req.session.planTitle || '',
		footerLinks: buildFooterLinks(),
		notificationMessage,
		noticeOfIntentionDate: formatDateForDisplay(req.session.noticeOfIntentionDate) || '-',
		gateway1EstimatedDate: formatDateForDisplay(req.session.gateway1EstimatedDate) || '-',
		gateway1ActualDate: formatDateForDisplay(req.session.gateway1ActualDate) || '-',
		gateway1SlaSentDate: formatDateForDisplay(req.session.gateway1SlaSentDate) || '-',
		gateway1SlaReceivedDate: formatDateForDisplay(req.session.gateway1SlaReceivedDate) || '-',
		gateway1DsaCheck: req.session.gateway1DsaCheck || '-',
		signedSlaDocuments,
		signedSlaFilename: req.session.gateway1SignedSlaFilename || '-'
	});
});

router.get('/gateway-1.html', (req, res) => {
	res.redirect('/projects/back-office/manage/GW1/v2/gateway-1');
});

router.get('/change-notice-date', (req, res) => {
	res.render('projects/back-office/manage/GW1/v2/change-notice-date', {
		caseRef: req.session.currentCaseRef || '',
		footerLinks: buildFooterLinks(),
		returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1',
		noticeOfIntentionDate: getInputDateFromStoredValue(req.session.noticeOfIntentionDate)
	});
});

router.get('/change-notice-date.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/change-notice-date?returnUrl=${returnUrl}`);
});

router.post('/change-notice-date', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	const dateValue = getDateFromValues(
		(req.body['notice-of-intention-date-day'] || '').trim(),
		(req.body['notice-of-intention-date-month'] || '').trim(),
		(req.body['notice-of-intention-date-year'] || '').trim()
	);

	req.session.noticeOfIntentionDate = dateValue || '-';
	res.redirect(returnUrl);
});

router.get('/gateway-1-estimated', (req, res) => {
	res.render('projects/back-office/manage/GW1/v2/gateway-1-estimated', {
		caseRef: req.session.currentCaseRef || '',
		footerLinks: buildFooterLinks(),
		returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1',
		noticeOfIntentionDate: getInputDateFromStoredValue(req.session.gateway1EstimatedDate)
	});
});

router.get('/gateway-1-estimated.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-estimated?returnUrl=${returnUrl}`);
});

router.post('/gateway-1-estimated', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	const dateValue = getDateFromValues(
		(req.body['notice-of-intention-date-day'] || '').trim(),
		(req.body['notice-of-intention-date-month'] || '').trim(),
		(req.body['notice-of-intention-date-year'] || '').trim()
	);

	req.session.gateway1EstimatedDate = dateValue || '-';
	res.redirect(returnUrl);
});

router.get('/gateway-1-sla-sent', (req, res) => {
	res.render('projects/back-office/manage/GW1/v2/gateway-1-sla-sent', {
		caseRef: req.session.currentCaseRef || '',
		footerLinks: buildFooterLinks(),
		returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1',
		noticeOfIntentionDate: getInputDateFromStoredValue(req.session.gateway1SlaSentDate)
	});
});

router.get('/gateway-1-sla-sent.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-sla-sent?returnUrl=${returnUrl}`);
});

router.post('/gateway-1-sla-sent', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	const dateValue = getDateFromValues(
		(req.body['notice-of-intention-date-day'] || '').trim(),
		(req.body['notice-of-intention-date-month'] || '').trim(),
		(req.body['notice-of-intention-date-year'] || '').trim()
	);

	req.session.gateway1SlaSentDate = dateValue || '-';
	res.redirect(returnUrl);
});

router.get('/gateway-1-dsa-check', (req, res) => {
	res.render('projects/back-office/manage/GW1/v2/gateway-1-dsa-check', {
		caseRef: req.session.currentCaseRef || '',
		footerLinks: buildFooterLinks(),
		returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1',
		gateway1DsaCheck: req.session.gateway1DsaCheck || ''
	});
});

router.get('/gateway-1-dsa-check.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-dsa-check?returnUrl=${returnUrl}`);
});

router.post('/gateway-1-dsa-check', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	req.session.gateway1DsaCheck = req.body['dsa-check'] || '-';
	res.redirect(returnUrl);
});

router.get('/gateway-1-signed-sla-upload', (req, res) => {
	const signedSlaDocuments = Array.isArray(req.session.gw1v2SignedSlaDocuments)
		? req.session.gw1v2SignedSlaDocuments
		: [];

	res.render('projects/back-office/manage/GW1/v2/gateway-1-signed-sla-upload', {
		caseRef: req.session.currentCaseRef || '',
		showUploadError: req.query.error === 'missing-docs',
		returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1',
		signedSlaDocuments
	});
});

router.get('/gateway-1-signed-sla-upload.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-upload?returnUrl=${returnUrl}`);
});

router.post('/gateway-1-signed-sla-upload', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	const uploadedDocuments = getSignedSlaDocumentsFromFileData(req);

	if (uploadedDocuments.length === 0) {
		const nextReturnUrl = encodeURIComponent(returnUrl);
		return res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-upload?returnUrl=${nextReturnUrl}&error=missing-docs`);
	}

	req.session.gw1v2PendingSignedSlaDocuments = uploadedDocuments;
	req.session.gw1v2SignedSlaUploadedAt = uploadedDocuments[0].uploadedAt || new Date().toISOString();

	const nextReturnUrl = encodeURIComponent(returnUrl);
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check?returnUrl=${nextReturnUrl}`);
});

router.get('/gateway-1-signed-sla-check', (req, res) => {
	const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	const transientDocuments = getSignedSlaDocumentsFromFileData(req);
	const pendingDocuments = Array.isArray(req.session.gw1v2PendingSignedSlaDocuments)
		? req.session.gw1v2PendingSignedSlaDocuments
		: [];
	const storedDocuments = Array.isArray(req.session.gw1v2SignedSlaDocuments)
		? req.session.gw1v2SignedSlaDocuments
		: [];
	const uploadedDocuments = pendingDocuments.length > 0
		? pendingDocuments
		: (transientDocuments.length > 0 ? transientDocuments : storedDocuments);
	const uploadedDocumentsForDisplay = uploadedDocuments.map((doc) => ({
		...doc,
		uploadedAtDisplay: formatTimestampForDisplay(doc.uploadedAt)
	}));
	const slaReceivedDateRaw = req.session.gw1v2PendingSlaReceivedDate
		|| getSignedSlaReceivedDateFromUpload(req, uploadedDocuments);
	const encodedReturnUrl = encodeURIComponent(returnUrl);
	const checkPageUrl = `/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check?returnUrl=${encodedReturnUrl}`;

	if (uploadedDocuments.length === 0) {
		const nextReturnUrl = encodeURIComponent(returnUrl);
		return res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-upload?returnUrl=${nextReturnUrl}&error=missing-docs`);
	}

	res.render('projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check', {
		caseRef: req.session.currentCaseRef || '',
		footerLinks: buildFooterLinks(),
		returnUrl,
		uploadedDocuments: uploadedDocumentsForDisplay,
		slaReceivedDatePreview: formatDateForDisplay(slaReceivedDateRaw),
		slaReceivedDateValues: getDateInputValues(slaReceivedDateRaw),
		slaReceivedDateChangeUrl: `/projects/back-office/manage/GW1/v2/gateway-1-sla-received-date?returnUrl=${encodeURIComponent(checkPageUrl)}`,
		totalFiles: uploadedDocuments.length
	});
});

router.get('/gateway-1-sla-received-date', (req, res) => {
	const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check?returnUrl=/projects/back-office/manage/GW1/v2/gateway-1';
	const transientDocuments = getSignedSlaDocumentsFromFileData(req);
	const pendingDocuments = Array.isArray(req.session.gw1v2PendingSignedSlaDocuments)
		? req.session.gw1v2PendingSignedSlaDocuments
		: [];
	const storedDocuments = Array.isArray(req.session.gw1v2SignedSlaDocuments)
		? req.session.gw1v2SignedSlaDocuments
		: [];
	const uploadedDocuments = pendingDocuments.length > 0
		? pendingDocuments
		: (transientDocuments.length > 0 ? transientDocuments : storedDocuments);

	if (uploadedDocuments.length === 0) {
		const nextReturnUrl = encodeURIComponent(returnUrl);
		return res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-upload?returnUrl=${nextReturnUrl}&error=missing-docs`);
	}

	const baseDate = req.session.gw1v2PendingSlaReceivedDate
		|| req.session.gateway1SlaReceivedDate
		|| getSignedSlaReceivedDateFromUpload(req, uploadedDocuments);

	res.render('projects/back-office/manage/GW1/v2/gateway-1-sla-received-date', {
		caseRef: req.session.currentCaseRef || '',
		footerLinks: buildFooterLinks(),
		returnUrl,
		slaReceivedDateValues: getDateInputValues(baseDate)
	});
});

router.get('/gateway-1-sla-received-date.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check?returnUrl=/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-sla-received-date?returnUrl=${returnUrl}`);
});

router.post('/gateway-1-sla-received-date', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check?returnUrl=/projects/back-office/manage/GW1/v2/gateway-1';
	const day = (req.body['sla-received-day'] || '').trim();
	const month = (req.body['sla-received-month'] || '').trim();
	const year = (req.body['sla-received-year'] || '').trim();
	const overrideDate = getDateFromValues(day, month, year);

	if (overrideDate) {
		req.session.gw1v2PendingSlaReceivedDate = overrideDate;
	} else {
		delete req.session.gw1v2PendingSlaReceivedDate;
	}

	res.redirect(returnUrl);
});

router.get('/gateway-1-signed-sla-check.html', (req, res) => {
	const returnUrl = encodeURIComponent(req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1');
	res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-check?returnUrl=${returnUrl}`);
});

router.post('/gateway-1-signed-sla-check', (req, res) => {
	const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	const transientDocuments = getSignedSlaDocumentsFromFileData(req);
	const pendingDocuments = Array.isArray(req.session.gw1v2PendingSignedSlaDocuments)
		? req.session.gw1v2PendingSignedSlaDocuments
		: [];
	const storedDocuments = Array.isArray(req.session.gw1v2SignedSlaDocuments)
		? req.session.gw1v2SignedSlaDocuments
		: [];
	const uploadedDocuments = pendingDocuments.length > 0
		? pendingDocuments
		: (transientDocuments.length > 0 ? transientDocuments : storedDocuments);

	if (uploadedDocuments.length === 0) {
		const nextReturnUrl = encodeURIComponent(returnUrl);
		return res.redirect(`/projects/back-office/manage/GW1/v2/gateway-1-signed-sla-upload?returnUrl=${nextReturnUrl}&error=missing-docs`);
	}

	req.session.gw1v2SignedSlaDocuments = uploadedDocuments;
	req.session.gateway1SignedSlaFilename = uploadedDocuments[0].originalname;

	const overrideDay = (req.body['sla-received-day'] || '').trim();
	const overrideMonth = (req.body['sla-received-month'] || '').trim();
	const overrideYear = (req.body['sla-received-year'] || '').trim();
	const postedOverrideDate = getDateFromValues(overrideDay, overrideMonth, overrideYear);
	const sessionOverrideDate = req.session.gw1v2PendingSlaReceivedDate;

	if (postedOverrideDate) {
		req.session.gateway1SlaReceivedDate = postedOverrideDate;
	} else if (sessionOverrideDate) {
		req.session.gateway1SlaReceivedDate = sessionOverrideDate;
	} else {
		req.session.gateway1SlaReceivedDate = getSignedSlaReceivedDateFromUpload(req, uploadedDocuments);
	}

	delete req.session.gw1v2PendingSignedSlaDocuments;
	delete req.session.gw1v2SignedSlaUploadedAt;
	delete req.session.gw1v2PendingSlaReceivedDate;
	applyStatusEvent(req, 'SLA_CONFIRMED', { res, source: 'GW1 signed SLA confirmation POST' });

	req.session.notificationMessage = 'Signed SLA uploaded. LPA can proceed to Gateway 2 submission.';

	if (req.session && req.session.data) {
		req.session.data.fileData = '';
		req.session.data.fileSizeMap = {};
	}

	res.redirect(returnUrl);
});

router.get('/reset-status-flow', (req, res) => {
	const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW1/v2/gateway-1';
	applyStatusEvent(req, 'FLOW_RESET', { res, source: 'GW1 reset status flow GET' });

	delete req.session.gw1v2SignedSlaDocuments;
	delete req.session.gw1v2PendingSignedSlaDocuments;
	delete req.session.gw1v2SignedSlaUploadedAt;
	delete req.session.gw1v2PendingSlaReceivedDate;
	delete req.session.gateway1SignedSlaFilename;
	delete req.session.gateway1SlaReceivedDate;

	delete req.session.gw2v3WorkshopDocuments;
	delete req.session.gw2v4IssueReportDocuments;
	delete req.session.gw2v4ReportIssued;
	delete req.session.gw2v4UploadReturnTo;

	delete req.session.gateway2WorkshopDate;
	delete req.session.gateway2WorkshopVenue;
	delete req.session.gateway2ReportIssuedDate;
	delete req.session.gateway2ReportPublishedDate;

	delete req.session.hearings;
	delete req.session.hearingStartDate;
	delete req.session.hearingTime;
	delete req.session.hearingEndTime;
	delete req.session.hearingEstimatedDays;
	delete req.session.hearingActualDuration;
	delete req.session.hearingEndDate;
	delete req.session.hearingIsVirtual;
	delete req.session.hearingHasVirtualMeetingLink;
	delete req.session.hearingVirtualMeetingLink;
	delete req.session.hearingVenue;
	delete req.session.hearingAddress;
	delete req.session.hearingHasAddress;

	if (req.session.data) {
		req.session.data.planStatus = 'Awaiting signed SLA';
		delete req.session.data.planStatusClasses;
		delete req.session.data.gw1v2SignedSlaDocuments;
		delete req.session.data.gw1v2PendingSignedSlaDocuments;
		delete req.session.data.gw1v2SignedSlaUploadedAt;
		delete req.session.data.gw1v2PendingSlaReceivedDate;
		delete req.session.data.gateway1SignedSlaFilename;
		delete req.session.data.noticeOfIntentionDate;
		delete req.session.data.gateway1EstimatedDate;
		delete req.session.data.gateway1ActualDate;
		delete req.session.data.gateway1SlaSentDate;
		delete req.session.data.gateway1SlaReceivedDate;
		delete req.session.data.gateway1DsaCheck;

		delete req.session.data.gw2v3WorkshopDocuments;
		delete req.session.data.gw2v4IssueReportDocuments;
		delete req.session.data.gw2v4ReportIssued;

		delete req.session.data.gateway2WorkshopDate;
		delete req.session.data.gateway2WorkshopVenue;
		delete req.session.data.gateway2ReportIssuedDate;
		delete req.session.data.gateway2ReportPublishedDate;

		delete req.session.data.hearings;
		delete req.session.data.hearingStartDate;
		delete req.session.data.hearingTime;
		delete req.session.data.hearingEndTime;
		delete req.session.data.hearingEstimatedDays;
		delete req.session.data.hearingActualDuration;
		delete req.session.data.hearingEndDate;
		delete req.session.data.hearingIsVirtual;
		delete req.session.data.hearingHasVirtualMeetingLink;
		delete req.session.data.hearingVirtualMeetingLink;
		delete req.session.data.hearingVenue;
		delete req.session.data.hearingAddress;
		delete req.session.data.hearingHasAddress;

		delete req.session.data.fileData;
		delete req.session.data.fileSizeMap;
	}

	req.session.notificationMessage = 'Case status flow reset to Awaiting signed SLA.';

	res.redirect(returnUrl);
});

module.exports = router;
