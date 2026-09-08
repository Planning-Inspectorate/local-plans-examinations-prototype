const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

// Standalone Main Modifications document upload flow.
// This is intentionally separate from the MIQ and GW2 workshop documents
// upload flows and must not share session keys or routes with them.
const MAIN_MODS_DOCS_KEY = 'examinationV3MainModsDocuments';

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

function getUploadedMainModsDocumentsFromFileData(req) {
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

function getMainModsDocuments(req) {
	if (Array.isArray(req.session[MAIN_MODS_DOCS_KEY])) {
		return req.session[MAIN_MODS_DOCS_KEY];
	}

	if (req.session.data && Array.isArray(req.session.data[MAIN_MODS_DOCS_KEY])) {
		req.session[MAIN_MODS_DOCS_KEY] = req.session.data[MAIN_MODS_DOCS_KEY];
		return req.session[MAIN_MODS_DOCS_KEY];
	}

	return [];
}

function mergeMainModsDocuments(req) {
	const existingDocuments = Array.isArray(req.session[MAIN_MODS_DOCS_KEY]) ? req.session[MAIN_MODS_DOCS_KEY] : [];
	const currentBatch = getUploadedMainModsDocumentsFromFileData(req);
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

	req.session[MAIN_MODS_DOCS_KEY] = merged;
	if (req.session.data) {
		req.session.data[MAIN_MODS_DOCS_KEY] = merged;
	}

	return merged;
}

function findMainModsDocumentByFilename(req, filename) {
	if (!filename) return null;

	const storedDocuments = Array.isArray(req.session[MAIN_MODS_DOCS_KEY]) ? req.session[MAIN_MODS_DOCS_KEY] : [];
	const storedMatch = storedDocuments.find((doc) => doc.filename === filename);
	if (storedMatch) return storedMatch;

	const currentBatch = getUploadedMainModsDocumentsFromFileData(req);
	return currentBatch.find((doc) => doc.filename === filename) || null;
}

function removeMainModsDocumentByFilename(req, filename) {
	if (!filename) return;

	const existingDocuments = Array.isArray(req.session[MAIN_MODS_DOCS_KEY]) ? req.session[MAIN_MODS_DOCS_KEY] : [];
	const updatedDocuments = existingDocuments.filter((doc) => doc.filename !== filename);
	req.session[MAIN_MODS_DOCS_KEY] = updatedDocuments;

	if (req.session.data) {
		req.session.data[MAIN_MODS_DOCS_KEY] = updatedDocuments;

		const fileData = parseFileData(req);
		const updatedFileData = fileData.filter((file) => file.id !== filename);
		req.session.data.fileData = updatedFileData;
	}
}

router.get('/upload/main-mods/upload-bo', (req, res) => {
	res.render('projects/back-office/manage/examination/v5/upload/main-mods/upload-bo', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a local plan',
		uploadedDocuments: getMainModsDocuments(req)
	});
});

router.get('/upload/main-mods/upload-bo.html', (req, res) => {
	res.redirect(`${req.baseUrl}/upload/main-mods/upload-bo`);
});

router.post('/upload/main-mods/upload-bo', (req, res) => {
	req.session.save(() => {
		res.redirect(`${req.baseUrl}/upload/main-mods/check-answers`);
	});
});

router.get('/upload/main-mods/check-answers', (req, res) => {
	const transientDocuments = getUploadedMainModsDocumentsFromFileData(req);
	const uploadedDocuments = transientDocuments.length > 0 ? transientDocuments : getMainModsDocuments(req);
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
						href: `${req.baseUrl}/upload/main-mods/upload-bo`,
						text: 'Change',
						visuallyHiddenText: 'main modifications documents'
					}
				]
			}
		}
	];

	res.render('projects/back-office/manage/examination/v5/upload/main-mods/check-answers', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a local plan',
		uploadedDocuments,
		totalFiles: uploadedDocuments.length,
		checkAnswerRows
	});
});

router.get('/upload/main-mods/check-answers.html', (req, res) => {
	res.redirect(`${req.baseUrl}/upload/main-mods/check-answers`);
});

router.post('/upload/main-mods/check-answers', (req, res) => {
	if (!req.session.data) req.session.data = {};
	const currentBatch = getUploadedMainModsDocumentsFromFileData(req);
	const uploadedCount = currentBatch.length;
	mergeMainModsDocuments(req);

	const safeCount = uploadedCount > 0 ? uploadedCount : 0;
	req.session.notificationMessage = `${safeCount} main modifications document${safeCount === 1 ? '' : 's'} uploaded`;

	delete req.session.data.fileData;
	delete req.session.data.fileSizeMap;

	req.session.save(() => {
		res.redirect(`${req.baseUrl}/upload/main-mods/manage`);
	});
});

router.get('/upload/main-mods/manage', (req, res) => {
	const notificationMessage = req.session.notificationMessage || '';
	delete req.session.notificationMessage;

	const managedDocuments = getMainModsDocuments(req).map((doc) => ({
		originalname: doc.originalname,
		fileHref: `/projects/back-office/manage/documents/download/${encodeURIComponent(doc.filename)}`,
		receivedDate: formatReceivedDate(doc.uploadedAt),
		removeHref: `remove-confirm?filename=${encodeURIComponent(doc.filename)}`
	}));

	res.render('projects/back-office/manage/examination/v5/upload/main-mods/manage', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a local plan',
		notificationMessage,
		managedDocuments
	});

	req.session.save();
});

router.get('/upload/main-mods/remove-confirm', (req, res) => {
	const filename = req.query.filename || '';
	const document = findMainModsDocumentByFilename(req, filename);

	if (!filename || !document) {
		return res.redirect(`${req.baseUrl}/upload/main-mods/manage`);
	}

	res.render('projects/back-office/manage/examination/v5/upload/main-mods/remove-confirm', {
		caseRef: req.session.currentCaseRef || '',
		serviceName: 'Manage a local plan',
		filename,
		documentName: document.originalname
	});
});

router.post('/upload/main-mods/remove-confirm', (req, res) => {
	const filename = req.body.filename || '';
	const action = req.body.action || 'cancel';

	if (action === 'remove') {
		removeMainModsDocumentByFilename(req, filename);
	}

	req.session.save(() => {
		res.redirect(`${req.baseUrl}/upload/main-mods/manage`);
	});
});

router.get('/upload/main-mods/clear-uploads', (req, res) => {
	if (req.session && req.session.data) {
		delete req.session.data.fileData;
		delete req.session.data.fileSizeMap;
		delete req.session.data[MAIN_MODS_DOCS_KEY];
	}
	if (req.session) {
		delete req.session[MAIN_MODS_DOCS_KEY];
	}

	req.session.save(() => {
		res.redirect(`${req.baseUrl}/upload/main-mods/upload-bo`);
	});
});

module.exports = router;
module.exports.MAIN_MODS_DOCS_KEY = MAIN_MODS_DOCS_KEY;
module.exports.getMainModsDocuments = getMainModsDocuments;
