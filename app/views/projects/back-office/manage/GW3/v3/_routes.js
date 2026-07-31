const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

function formatDateForDisplay(dateValue) {
  if (!dateValue || dateValue === '-') return '';

  const date = new Date(dateValue);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  return dateValue;
}

router.get('/projects/back-office/manage/GW3/v3/gateway-3-documents', (req, res) => {
  const documentsState = req.query.documentState === 'initial' || req.query.documentState === 'submitted' || req.query.documentState === 'resubmission'
    ? req.query.documentState
    : (req.session.planStatus === 'Awaiting Gateway 3 resubmission' ? 'resubmission' : 'submitted');

  const submission1DocumentsCount = 14;
  const submissionDateSubmitted = documentsState === 'initial'
    ? 'Not provided'
    : formatDateForDisplay(req.session.submissionDate) || 'Not provided';

  res.render('projects/back-office/manage/GW3/v3/gateway-3-documents', {
    caseRef: req.session.currentCaseRef || '',
    documentsState,
    submission1DocumentsCount,
    submissionDateSubmitted
  });
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v3/gateway-3-documents');
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents', (req, res) => {
  const submissionDateSubmitted = formatDateForDisplay(req.session.submissionDate) || 'Not provided';
  const returnUrl = '/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents';

  res.render('projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: 1,
    submissionDateSubmitted,
    returnUrl
  });
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents');
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3-submission-2-documents', (req, res) => {
  const submissionDateSubmitted = formatDateForDisplay(req.session.submissionDate) || 'Not provided';
  const returnUrl = '/projects/back-office/manage/GW3/v3/gateway-3-submission-2-documents';

  res.render('projects/back-office/manage/GW3/v3/gateway-3-submission-2-documents', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: 2,
    submissionDateSubmitted,
    returnUrl
  });
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3-submission-2-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v3/gateway-3-submission-2-documents');
});

router.get('/projects/back-office/manage/GW3/v3/examination-website.html', (req, res) => {
  res.render('projects/back-office/manage/GW3/v3/examination-website', {
    examinationWebsite: (req.session.examinationWebsite && req.session.examinationWebsite !== '-') ? req.session.examinationWebsite : '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW3/v3/gateway-3'
  });
});

router.post('/projects/back-office/manage/GW3/v3/examination-website', (req, res) => {
  const { 'examination-website': website, returnUrl } = req.body;
  req.session.examinationWebsite = website && website.trim() !== '' ? website : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/GW3/v3/gateway-3');
});

module.exports = router;
