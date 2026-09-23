const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

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
  res.render('projects/back-office/manage/examination/v5/upload/final-report/check-answers', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    uploadedDocuments: getFileData(req).length ? getFileData(req) : getDocuments(req),
    planSoundness: req.session.planSoundness || 'Not provided',
    soundUnsoundDate: req.session.soundUnsoundDate || 'Not provided',
    returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
  });
});

router.post('/upload/final-report/check-answers', (req, res) => {
  if (!req.session.data) req.session.data = {};
  const currentBatch = getFileData(req);
  const documents = currentBatch.length ? currentBatch : getDocuments(req);
  req.session[FINAL_REPORT_DOCUMENTS_KEY] = documents;
  req.session.data[FINAL_REPORT_DOCUMENTS_KEY] = documents;
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;
  req.session.finalReportIssueDate = new Date().toLocaleDateString('en-GB');
  req.session.notificationMessage = 'Final report saved and notification sent';
  if (req.session.planSoundness === 'Sound') {
    req.session.examinationV3StatusState = 'report-issued';
  }
  req.session.save(() => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
});

router.get('/upload/final-report/clear-uploads', (req, res) => {
  delete req.session[FINAL_REPORT_DOCUMENTS_KEY];
  if (req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
  }
  req.session.save(() => res.redirect(`${req.baseUrl}/upload/final-report/upload-bo`));
});

module.exports = router;
module.exports.FINAL_REPORT_DOCUMENTS_KEY = FINAL_REPORT_DOCUMENTS_KEY;
module.exports.getDocuments = getDocuments;
