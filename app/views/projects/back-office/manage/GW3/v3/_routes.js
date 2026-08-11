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

function getGateway3OverviewState(req) {
  const stateFromQuery = (req.query.gateway3OverviewState || '').trim();
  const validStates = ['initial', 'submitted', 'resubmission-no-docs', 'resubmission', 'pass'];

  if (validStates.includes(stateFromQuery)) {
    return stateFromQuery;
  }

  if (req.session.planStatus === 'Awaiting Gateway 3 resubmission') {
    return 'resubmission';
  }

  return 'submitted';
}

function getGateway3ExaminationWebsite(req, gateway3OverviewState) {
  if (gateway3OverviewState === 'initial') {
    return '-';
  }

  const submittedExaminationWebsite = req.session.data?.['examination-library-link'] || 'eastborough.gov.uk/examination-library';

  if (req.session.examinationWebsite && req.session.examinationWebsite !== '-') {
    return req.session.examinationWebsite;
  }

  req.session.examinationWebsite = submittedExaminationWebsite;
  return submittedExaminationWebsite;
}

function getWebsiteHref(value) {
  if (!value || value === '-') return '';

  const trimmed = String(value).trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

router.get('/projects/back-office/manage/GW3/v3/gateway-3', (req, res) => {
  const gateway3OverviewState = getGateway3OverviewState(req);
  const isPassState = gateway3OverviewState === 'pass';
  const isResubmissionRequired = ['resubmission-no-docs', 'resubmission', 'pass'].includes(gateway3OverviewState);
  const isResubmissionNoDocs = gateway3OverviewState === 'resubmission-no-docs';
  const examinationWebsite = getGateway3ExaminationWebsite(req, gateway3OverviewState);
  const examinationWebsiteHref = getWebsiteHref(examinationWebsite);
  const gateway3CompletionDate = isPassState
    ? (formatDateForDisplay(req.session.gateway3CompletionDate) || '-')
    : '-';

  res.render('projects/back-office/manage/GW3/v3/gateway-3', {
    caseRef: req.session.currentCaseRef || '',
    gateway3OverviewState,
    isResubmissionRequired,
    isResubmissionNoDocs,
    submission1DocumentsCount: 14,
    submission2DocumentsCount: 14,
    gateway3EstimatedDate: formatDateForDisplay(req.session.gateway3EstimatedDate) || '-',
    gateway3ActualDate: formatDateForDisplay(req.session.gateway3ActualDate) || '-',
    gateway3AssessorAppointmentDate: formatDateForDisplay(req.session.gateway3AssessorAppointmentDate) || '-',
    gateway3CompletionDate,
    gateway3AssessorName: req.session.gateway3AssessorName || '-',
    gateway3PoContact: req.session.gateway3PoContact || {},
    examinationWebsite,
    examinationWebsiteHref,
    submission1Decision: req.session.submission1Decision || '-',
    submission1DecisionDate: formatDateForDisplay(req.session.submission1DecisionDate) || '-',
    submission2Decision: req.session.submission2Decision || '-',
    submission2DecisionDate: formatDateForDisplay(req.session.submission2DecisionDate) || '-'
  });
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v3/gateway-3');
});

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

router.get('/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents-actual-inputs', (req, res) => {
  const submissionDateSubmitted = formatDateForDisplay(req.session.submissionDate) || 'Not provided';
  const returnUrl = '/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents-actual-inputs';

  res.render('projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents-actual-inputs', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: 1,
    submissionDateSubmitted,
    returnUrl
  });
});

router.get('/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents-actual-inputs.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v3/gateway-3-submission-1-documents-actual-inputs');
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
  const gateway3OverviewState = getGateway3OverviewState(req);

  res.render('projects/back-office/manage/GW3/v3/examination-website', {
    examinationWebsite: getGateway3ExaminationWebsite(req, gateway3OverviewState) !== '-'
      ? getGateway3ExaminationWebsite(req, gateway3OverviewState)
      : '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW3/v3/gateway-3'
  });
});

router.post('/projects/back-office/manage/GW3/v3/examination-website', (req, res) => {
  const { 'examination-website': website, returnUrl } = req.body;
  req.session.examinationWebsite = website && website.trim() !== '' ? website : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/GW3/v3/gateway-3');
});

module.exports = router;
