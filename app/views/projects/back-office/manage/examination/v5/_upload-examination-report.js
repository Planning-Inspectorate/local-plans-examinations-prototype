const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const EXAMINATION_REPORT_DOCUMENTS_KEY = 'examinationReportDocuments';

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
  if (Array.isArray(req.session[EXAMINATION_REPORT_DOCUMENTS_KEY])) {
    return req.session[EXAMINATION_REPORT_DOCUMENTS_KEY];
  }
  if (Array.isArray(req.session.data?.[EXAMINATION_REPORT_DOCUMENTS_KEY])) {
    req.session[EXAMINATION_REPORT_DOCUMENTS_KEY] = req.session.data[EXAMINATION_REPORT_DOCUMENTS_KEY];
    return req.session[EXAMINATION_REPORT_DOCUMENTS_KEY];
  }
  return [];
}

router.get('/upload/examination-report/upload-bo', (req, res) => {
  res.render('projects/back-office/manage/examination/v5/upload/examination-report/upload-bo', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    uploadedDocuments: getDocuments(req)
  });
});

router.post('/upload/examination-report/upload-bo', (req, res) => {
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/upload/examination-report/check-answers`);
  });
});

router.get('/upload/examination-report/clear-uploads', (req, res) => {
  delete req.session[EXAMINATION_REPORT_DOCUMENTS_KEY];
  if (req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
  }
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/upload/examination-report/upload-bo`);
  });
});

router.get('/upload/examination-report/check-answers', (req, res) => {
  const uploadedDocuments = getFileData(req).length ? getFileData(req) : getDocuments(req);
  res.render('projects/back-office/manage/examination/v5/upload/examination-report/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    uploadedDocuments,
    returnUrl: req.query.returnUrl || `${req.baseUrl}/examination`
  });
});

router.post('/upload/examination-report/check-answers', (req, res) => {
  if (!req.session.data) req.session.data = {};
  const currentBatch = getFileData(req);
  const documents = currentBatch.length ? currentBatch : getDocuments(req);
  req.session[EXAMINATION_REPORT_DOCUMENTS_KEY] = documents;
  req.session.data[EXAMINATION_REPORT_DOCUMENTS_KEY] = documents;
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;
  req.session.qaDate = DateTime.now().toFormat('d/M/yyyy');
  req.session.examinationV3StatusState = 'qa';
  req.session.notificationMessage = 'Examination report saved and notification sent';
  req.session.save(() => {
    res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`);
  });
});

module.exports = router;
module.exports.EXAMINATION_REPORT_DOCUMENTS_KEY = EXAMINATION_REPORT_DOCUMENTS_KEY;
module.exports.getDocuments = getDocuments;
