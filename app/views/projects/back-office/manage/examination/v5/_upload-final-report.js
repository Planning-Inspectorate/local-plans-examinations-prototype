const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const FINAL_REPORT_DOCUMENTS_KEY = 'finalReportDocuments';

function getFileData(req) {
  const fileData = req.session.data && req.session.data.fileData;
  if (!fileData) return [];
  try {
    const parsed = typeof fileData === 'string' ? JSON.parse(fileData) : fileData;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getDocuments(req) {
  if (Array.isArray(req.session[FINAL_REPORT_DOCUMENTS_KEY])) return req.session[FINAL_REPORT_DOCUMENTS_KEY];
  if (Array.isArray(req.session.data?.[FINAL_REPORT_DOCUMENTS_KEY])) {
    req.session[FINAL_REPORT_DOCUMENTS_KEY] = req.session.data[FINAL_REPORT_DOCUMENTS_KEY];
    return req.session[FINAL_REPORT_DOCUMENTS_KEY];
  }
  return [];
}

function saveDocuments(req, documents) {
  req.session[FINAL_REPORT_DOCUMENTS_KEY] = documents;
  req.session.data[FINAL_REPORT_DOCUMENTS_KEY] = documents;
}

router.get('/upload/final-report/upload-bo', (req, res) => {
  res.render('projects/back-office/manage/examination/v5/upload/final-report/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    uploadedDocuments: getDocuments(req)
  });
});

router.post('/upload/final-report/upload-bo', (req, res) => {
  req.session.save(() => res.redirect(`${req.baseUrl}/upload/final-report/check-answers`));
});

router.get('/upload/final-report/check-answers', (req, res) => {
  const soundUnsoundDate = req.session.soundUnsoundDate || '';
  const parsedDate = DateTime.fromFormat(soundUnsoundDate, 'd/M/yyyy');
  res.render('projects/back-office/manage/examination/v5/upload/final-report/check-answers', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    uploadedDocuments: getFileData(req).length ? getFileData(req) : getDocuments(req),
    planSoundness: req.session.planSoundness || 'Not provided',
    soundUnsoundDate: parsedDate.isValid ? parsedDate.toFormat('d MMMM yyyy') : (soundUnsoundDate || 'Not provided'),
    returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
  });
});

router.post('/upload/final-report/check-answers', (req, res) => {
  if (!req.session.data) req.session.data = {};
  const currentBatch = getFileData(req);
  const documents = [...getDocuments(req)];
  currentBatch.forEach((file) => {
    if (!documents.some((document) => (document.filename || document.id) === file.id)) {
      documents.push({ ...file, filename: file.id, originalname: file.name, uploadedAt: new Date().toISOString() });
    }
  });
  saveDocuments(req, documents);
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;
  req.session.finalReportIssueDate = new Date().toLocaleDateString('en-GB');
  req.session.notificationMessage = 'Final report saved and notification sent';
  if (req.session.planSoundness === 'Sound') {
    req.session.examinationV3StatusState = 'report-issued';
  }
  req.session.save(() => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
});

router.get('/upload/final-report/manage', (req, res) => {
  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;
  const managedDocuments = getDocuments(req).map((document) => ({
    originalname: document.originalname || document.name,
    fileHref: `/projects/back-office/manage/documents/download/${encodeURIComponent(document.filename || document.id)}`,
    receivedDate: document.uploadedAt ? DateTime.fromISO(document.uploadedAt).toFormat('d MMMM yyyy') : '',
    removeHref: `remove-confirm?filename=${encodeURIComponent(document.filename || document.id)}`
  }));
  res.render('projects/back-office/manage/examination/v5/upload/final-report/manage', {
    caseRef: req.session.currentCaseRef || '', notificationMessage, managedDocuments
  });
  req.session.save();
});

router.get('/upload/final-report/remove-confirm', (req, res) => {
  const filename = req.query.filename || '';
  const document = getDocuments(req).find((item) => (item.filename || item.id) === filename);
  if (!document) return res.redirect(`${req.baseUrl}/upload/final-report/manage`);
  res.render('projects/back-office/manage/examination/v5/upload/final-report/remove-confirm', {
    caseRef: req.session.currentCaseRef || '', filename, documentName: document.originalname || document.name
  });
});

router.post('/upload/final-report/remove-confirm', (req, res) => {
  if (req.body.action === 'remove') {
    const documents = getDocuments(req);
    if (documents.some((document) => (document.filename || document.id) === req.body.filename)) {
      if (!req.session.data) req.session.data = {};
      saveDocuments(req, documents.filter((document) => (document.filename || document.id) !== req.body.filename));
      req.session.notificationMessage = 'Document removed';
    }
  }
  req.session.save(() => res.redirect(`${req.baseUrl}/upload/final-report/manage`));
});

router.get('/upload/final-report/clear-uploads', (req, res) => {
  delete req.session[FINAL_REPORT_DOCUMENTS_KEY];
  if (req.session.data) {
    delete req.session.data[FINAL_REPORT_DOCUMENTS_KEY];
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
  }
  req.session.save(() => res.redirect(`${req.baseUrl}/upload/final-report/upload-bo`));
});

module.exports = router;
module.exports.FINAL_REPORT_DOCUMENTS_KEY = FINAL_REPORT_DOCUMENTS_KEY;
module.exports.getDocuments = getDocuments;
