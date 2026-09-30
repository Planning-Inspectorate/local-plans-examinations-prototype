const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

// Standalone MIQ (Matters and Issues Questions) document upload flow.
// This is intentionally separate from the GW2 workshop documents upload
// flow and must not share session keys or routes with it.
const MIQ_DOCS_KEY = 'examinationV3MiqDocuments';

function getMiqDocsKey(hearingIndex) {
	return hearingIndex === 0 ? MIQ_DOCS_KEY : `${MIQ_DOCS_KEY}-${hearingIndex}`;
}

function getHearingIndex(req) {
	const rawIndex = req.body?.hearingIndex ?? req.query.hearingIndex ?? '0';
	const hearingIndex = Number(rawIndex);
	return /^\d+$/.test(String(rawIndex)) && (hearingIndex === 0 || hearingIndex < (req.session.hearings?.length || 0))
		? hearingIndex : -1;
}

function miqPath(req, path, hearingIndex) {
	return `${req.baseUrl}/upload/miq/${path}${hearingIndex ? `?hearingIndex=${hearingIndex}` : ''}`;
}

function formatReceivedDate(uploadedAt) {
	if (!uploadedAt) return '';
	const parsed = DateTime.fromISO(uploadedAt);
	return parsed.isValid ? parsed.toFormat('d MMMM yyyy') : '';
}

function escapeHtml(value) {
	return String(value || '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function parseFileData(req) {
	if (!(req.session.data && req.session.data.fileData)) return [];
	try {
		const fileData = typeof req.session.data.fileData === 'string'
			? JSON.parse(req.session.data.fileData)
			: req.session.data.fileData;
		return Array.isArray(fileData) ? fileData : [];
	} catch (e) {
		return [];
	}
}

function getUploadedMiqDocumentsFromFileData(req) {
	if (!(req.session.data && req.session.data.fileData)) return [];

	try {
		const fileData = typeof req.session.data.fileData === 'string'
			? JSON.parse(req.session.data.fileData)
			: req.session.data.fileData;

		if (!Array.isArray(fileData)) return [];

		return fileData.map((file) => {
			let size = 0;
			if (req.session.data.fileSizeMap && req.session.data.fileSizeMap[file.name]) {
				size = req.session.data.fileSizeMap[file.name];
			}

			return {
				originalname: file.name,
				filename: file.id,
				size
			};
		});
	} catch (e) {
		return [];
	}
}

function getMiqDocuments(req, hearingIndex = 0) {
	const docsKey = getMiqDocsKey(hearingIndex);
	if (Array.isArray(req.session[docsKey])) {
		return req.session[docsKey];
	}

	if (req.session.data && Array.isArray(req.session.data[docsKey])) {
		req.session[docsKey] = req.session.data[docsKey];
		return req.session[docsKey];
	}

	return [];
}

function mergeMiqDocuments(req, hearingIndex) {
	const docsKey = getMiqDocsKey(hearingIndex);
	const existingDocuments = getMiqDocuments(req, hearingIndex);
	const currentBatch = getUploadedMiqDocumentsFromFileData(req);
	const nowIso = new Date().toISOString();

	const merged = [...existingDocuments];
	currentBatch.forEach((doc) => {
		const existingIndex = merged.findIndex(
			(item) => item.filename === doc.filename || (item.originalname === doc.originalname && item.size === doc.size)
		);

		if (existingIndex === -1) {
			merged.push({ ...doc, uploadedAt: nowIso });
		} else if (!merged[existingIndex].uploadedAt) {
			merged[existingIndex].uploadedAt = nowIso;
		}
	});

	req.session[docsKey] = merged;
	if (req.session.data) {
		req.session.data[docsKey] = merged;
	}

	return merged;
}

function findMiqDocumentByFilename(req, filename, hearingIndex) {
	if (!filename) return null;

	const storedDocuments = getMiqDocuments(req, hearingIndex);
	const storedMatch = storedDocuments.find((doc) => doc.filename === filename);
	if (storedMatch) return storedMatch;

	const currentBatch = getUploadedMiqDocumentsFromFileData(req);
	return currentBatch.find((doc) => doc.filename === filename) || null;
}

function removeMiqDocumentByFilename(req, filename, hearingIndex) {
	if (!filename) return;

	const docsKey = getMiqDocsKey(hearingIndex);
	const existingDocuments = getMiqDocuments(req, hearingIndex);
	const updatedDocuments = existingDocuments.filter((doc) => doc.filename !== filename);
	req.session[docsKey] = updatedDocuments;

	if (req.session.data) {
		req.session.data[docsKey] = updatedDocuments;

		const fileData = parseFileData(req);
		const updatedFileData = fileData.filter((file) => file.id !== filename);
		req.session.data.fileData = updatedFileData;
	}
}

function removeHearingMiqDocuments(req, removedIndex, hearingCount) {
	for (let index = removedIndex; index < hearingCount - 1; index++) {
		const documents = getMiqDocuments(req, index + 1);
		const docsKey = getMiqDocsKey(index);
		req.session[docsKey] = documents;
		if (req.session.data) req.session.data[docsKey] = documents;
	}
	const lastKey = getMiqDocsKey(hearingCount - 1);
	delete req.session[lastKey];
	if (req.session.data) delete req.session.data[lastKey];
}

router.use('/upload/miq', (req, res, next) => {
	if (getHearingIndex(req) === -1) return res.redirect(`${req.baseUrl}/examination`);
	next();
});

router.get('/upload/miq/upload-bo', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	res.render('projects/back-office/manage/examination/v5/upload/miq/upload-bo', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a development plan',
		uploadedDocuments: getMiqDocuments(req, hearingIndex),
		hearingIndex
	});
});

router.get('/upload/miq/upload-bo.html', (req, res) => {
	res.redirect(miqPath(req, 'upload-bo', getHearingIndex(req)));
});

router.post('/upload/miq/upload-bo', (req, res) => {
	req.session.save(() => {
		res.redirect(miqPath(req, 'check-answers', getHearingIndex(req)));
	});
});

router.get('/upload/miq/check-answers', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	const transientDocuments = getUploadedMiqDocumentsFromFileData(req);
	const uploadedDocuments = transientDocuments.length > 0 ? transientDocuments : getMiqDocuments(req, hearingIndex);
	const documentListHtml = uploadedDocuments
		.map((doc) => `<li><a class="govuk-link" href="/projects/back-office/manage/documents/download/${encodeURIComponent(doc.filename)}">${escapeHtml(doc.originalname)}</a></li>`)
		.join('');
	const documentListClass = uploadedDocuments.length > 1 ? ' govuk-list--bullet' : '';
	const checkAnswerRows = [
		{
			key: { text: 'Documents' },
			value: { html: `<ul class="govuk-list${documentListClass}">${documentListHtml}</ul>` },
			actions: {
				items: [
					{
						href: miqPath(req, 'upload-bo', hearingIndex),
						text: 'Change',
						visuallyHiddenText: 'MIQ documents'
					}
				]
			}
		}
	];

	res.render('projects/back-office/manage/examination/v5/upload/miq/check-answers', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a local plan',
		uploadedDocuments,
		totalFiles: uploadedDocuments.length,
		checkAnswerRows,
		hearingIndex
	});
});

router.get('/upload/miq/check-answers.html', (req, res) => {
	res.redirect(miqPath(req, 'check-answers', getHearingIndex(req)));
});

router.post('/upload/miq/check-answers', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	if (!req.session.data) req.session.data = {};
	const currentBatch = getUploadedMiqDocumentsFromFileData(req);
	const uploadedCount = currentBatch.length;
	mergeMiqDocuments(req, hearingIndex);

	const safeCount = uploadedCount > 0 ? uploadedCount : 0;
	req.session.notificationMessage = `${safeCount} MIQ document${safeCount === 1 ? '' : 's'} uploaded`;

	delete req.session.data.fileData;
	delete req.session.data.fileSizeMap;

	req.session.save(() => {
		res.redirect(`${req.baseUrl}/examination`);
	});
});

router.get('/upload/miq/manage', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	const notificationMessage = req.session.notificationMessage || '';
	delete req.session.notificationMessage;

	const managedDocuments = getMiqDocuments(req, hearingIndex).map((doc) => ({
		originalname: doc.originalname,
		fileHref: `/projects/back-office/manage/documents/download/${encodeURIComponent(doc.filename)}`,
		receivedDate: formatReceivedDate(doc.receivedDate || doc.uploadedAt),
		removeHref: `remove-confirm?filename=${encodeURIComponent(doc.filename)}&hearingIndex=${hearingIndex}`
	}));

	res.render('projects/back-office/manage/examination/v5/upload/miq/manage', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a development plan',
		notificationMessage,
		managedDocuments,
		hearingIndex
	});

	req.session.save();
});

router.get('/upload/miq/remove-confirm', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	const filename = req.query.filename || '';
	const document = findMiqDocumentByFilename(req, filename, hearingIndex);

	if (!filename || !document) {
		return res.redirect(miqPath(req, 'manage', hearingIndex));
	}

	res.render('projects/back-office/manage/examination/v5/upload/miq/remove-confirm', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a development plan',
		filename,
		documentName: document.originalname,
		hearingIndex
	});
});

router.post('/upload/miq/remove-confirm', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	const filename = req.body.filename || '';
	const action = req.body.action || 'cancel';

	if (action === 'remove') {
		removeMiqDocumentByFilename(req, filename, hearingIndex);
		req.session.notificationMessage = 'Document removed';
	}

	req.session.save(() => {
		res.redirect(miqPath(req, 'manage', hearingIndex));
	});
});

router.get('/upload/miq/clear-uploads', (req, res) => {
	const hearingIndex = getHearingIndex(req);
	const docsKey = getMiqDocsKey(hearingIndex);
	if (req.session && req.session.data) {
		delete req.session.data.fileData;
		delete req.session.data.fileSizeMap;
		delete req.session.data[docsKey];
	}
	if (req.session) {
		delete req.session[docsKey];
	}

	req.session.save(() => {
		res.redirect(miqPath(req, 'upload-bo', hearingIndex));
	});
});

module.exports = router;
module.exports.MIQ_DOCS_KEY = MIQ_DOCS_KEY;
module.exports.getMiqDocuments = getMiqDocuments;
module.exports.removeHearingMiqDocuments = removeHearingMiqDocuments;
