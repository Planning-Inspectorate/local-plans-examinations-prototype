const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.use('/', require('./_set-status'));

const DOCUMENTS_SESSION_KEY = 'gw3v4Documents';
const REVIEW_DRAFT_SESSION_KEY = 'gw3v4DocumentReviewDraft';

function formatDateForDisplay(dateValue) {
  if (!dateValue || dateValue === '-') return '-';

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

function formatTimestampForDisplay(timestamp) {
  if (!timestamp) return '-';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultGateway3Documents() {
  const seedDate = '2026-05-17T10:00:00.000Z';

  return [
    {
      id: 'proposed-local-plan',
      category: 'submission',
      title: 'Proposed local plan',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'Proposed_local_plan.docx', uploadedAt: seedDate }]
    },
    {
      id: 'map-of-proposed-policies',
      category: 'submission',
      title: 'Map of proposed local plan policies',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'map_of_proposed_local_plan_policies.doc', uploadedAt: seedDate }]
    },
    {
      id: 'statement-of-compliance',
      category: 'submission',
      title: 'Statement of compliance',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'statement_of_compliance.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'statement-of-soundness',
      category: 'submission',
      title: 'Statement of soundness',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'statement_of_soundness.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'summary-consultation-engagement',
      category: 'submission',
      title: 'Summary of consultation and engagement activities',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'summary_of_consultation_and_engagement_activities.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'summary-scoping-consultation',
      category: 'submission',
      title: 'Summary of scoping consultation',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'summary_of_scoping_consultation.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'summary-consultation-content-evidence',
      category: 'submission',
      title: 'Summary of consultation on proposed local plan content and evidence',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'summary_of_consultation_on_proposed_local_plan_content_and_evidence.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'summary-consultation-proposed-plan',
      category: 'submission',
      title: 'Summary of consultation on the proposed local plan',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'summary_of_consultation_on_the_proposed_local_plan.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'gateway1-self-assessment',
      category: 'submission',
      title: 'Gateway 1 - Self assessment of readiness',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'gateway1_self_assessment.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-summary-content-evidence-docs',
      category: 'submission',
      title: 'Consultation summary on proposed local plan content and evidence documents',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'proposed_plan_full.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'copies-of-representations',
      category: 'submission',
      title: 'Copies of representations',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'copies_of_representations.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'statement-practical-arrangements',
      category: 'submission',
      title: 'Statement of practical arrangements demonstrating readiness for the examination',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'statement_of_practical_arrangements_demonstrating_readiness_for_the_examination.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'supplementary-plans-statement',
      category: 'submission',
      title: 'Supplementary plans statement',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'supplementary_plans_statement.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'environmental-report',
      category: 'submission',
      title: 'Environmental report',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'environmental_report.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'other-supporting-documents',
      category: 'supplementary',
      title: 'Any other documents supporting gateway assessment',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'other_supporting_documents.pdf', uploadedAt: seedDate }]
    }
  ];
}

function getDocumentStatusTagClass(status) {
  if (status === 'Validated') return 'govuk-tag govuk-tag--green';
  if (status === 'Invalid') return 'govuk-tag govuk-tag--red';
  if (status === 'Incomplete') return 'govuk-tag govuk-tag--blue';
  if (status === 'Ready to validate') return 'govuk-tag govuk-tag--yellow';
  return 'govuk-tag govuk-tag--grey';
}

function getGateway3Documents(req) {
  if (Array.isArray(req.session[DOCUMENTS_SESSION_KEY])) {
    return req.session[DOCUMENTS_SESSION_KEY];
  }

  const seededDocuments = getDefaultGateway3Documents();
  req.session[DOCUMENTS_SESSION_KEY] = cloneDeep(seededDocuments);
  return req.session[DOCUMENTS_SESSION_KEY];
}

function getGateway3DocumentById(req, documentId) {
  const documents = getGateway3Documents(req);
  return documents.find((doc) => doc.id === documentId) || null;
}

function getLatestDocumentVersion(document) {
  if (!document || !Array.isArray(document.versions) || document.versions.length === 0) {
    return null;
  }

  return document.versions[document.versions.length - 1];
}

function buildDocumentForView(document) {
  const latestVersion = getLatestDocumentVersion(document);

  return {
    ...document,
    currentVersionNumber: latestVersion ? latestVersion.versionNumber : '-',
    latestFileName: latestVersion ? latestVersion.fileName : '-',
    latestUploadedAtDisplay: latestVersion ? formatTimestampForDisplay(latestVersion.uploadedAt) : '-',
    statusTagClass: getDocumentStatusTagClass(document.status || 'Received')
  };
}

function getReviewDraft(req) {
  if (!req.session[REVIEW_DRAFT_SESSION_KEY] || typeof req.session[REVIEW_DRAFT_SESSION_KEY] !== 'object') {
    return {};
  }

  return req.session[REVIEW_DRAFT_SESSION_KEY];
}

function clearReviewDraft(req) {
  delete req.session[REVIEW_DRAFT_SESSION_KEY];
}

function getSubmissionVersion(value) {
  return String(value || '1') === '2' ? '2' : '1';
}

function getSubmissionLabel(submissionVersion) {
  return submissionVersion === '2' ? 'submission 2' : 'submission 1';
}

function getDecisionOutcomeKey(submissionVersion) {
  return submissionVersion === '2'
    ? 'gw3v4Submission2DecisionOutcome'
    : 'gw3v4Submission1DecisionOutcome';
}

function getDecisionDateKey(submissionVersion) {
  return submissionVersion === '2'
    ? 'gw3v4Submission2DecisionDate'
    : 'gw3v4Submission1DecisionDate';
}

function getDecisionReportFilenameKey(submissionVersion) {
  return submissionVersion === '2'
    ? 'gw3v4Submission2DecisionReportFilename'
    : 'gw3v4Submission1DecisionReportFilename';
}

function getDecisionReportStoredFilenameKey(submissionVersion) {
  return submissionVersion === '2'
    ? 'gw3v4Submission2DecisionReportStoredFilename'
    : 'gw3v4Submission1DecisionReportStoredFilename';
}

function getDecisionReportUploadedDateKey(submissionVersion) {
  return submissionVersion === '2'
    ? 'gw3v4Submission2DecisionReportUploadedDate'
    : 'gw3v4Submission1DecisionReportUploadedDate';
}

function getUploadedDocumentsFromSessionData(req) {
  const fileDataRaw = req.session?.data?.fileData;
  if (!fileDataRaw) return [];

  try {
    const fileData = typeof fileDataRaw === 'string' ? JSON.parse(fileDataRaw) : fileDataRaw;
    if (!Array.isArray(fileData)) return [];

    return fileData.map((file) => {
      const originalname = file?.name || '';
      const size = req.session?.data?.fileSizeMap?.[originalname] || 0;

      return {
        originalname,
        filename: file?.id || '',
        size
      };
    });
  } catch (e) {
    return [];
  }
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

function withGateway3OverviewState(returnUrl, overviewState) {
  if (!returnUrl || !overviewState) return returnUrl;

  try {
    const parsed = new URL(returnUrl, 'http://localhost');
    const isGateway3OverviewPath = parsed.pathname === '/projects/back-office/manage/GW3/v4/gateway-3'
      || parsed.pathname === '/projects/back-office/manage/GW3/v4/gateway-3.html';

    if (!isGateway3OverviewPath) {
      return returnUrl;
    }

    parsed.pathname = '/projects/back-office/manage/GW3/v4/gateway-3.html';
    parsed.searchParams.set('gateway3OverviewState', overviewState);
    return `${parsed.pathname}${parsed.search}`;
  } catch (e) {
    return returnUrl;
  }
}

const GW3_V4_OVERVIEW_URL = '/projects/back-office/manage/GW3/v4/gateway-3.html';

function buildGateway3ViewModel(req, notificationMessage = '') {
  const gateway3OverviewState = String(req.query.gateway3OverviewState || req.session.gw3v4StatusState || 'initial');
  const documents = getGateway3Documents(req).map(buildDocumentForView);
  const submissionDocuments = documents.filter((doc) => doc.category === 'submission');
  const supplementaryDocuments = documents.filter((doc) => doc.category === 'supplementary');
  const defaultSubmissionCount = submissionDocuments.length;
  const isInitial = gateway3OverviewState === 'initial';
  const isResubmissionRequired = gateway3OverviewState === 'resubmission-no-docs'
    || gateway3OverviewState === 'resubmission'
    || gateway3OverviewState === 'pass';
  const isResubmissionNoDocs = gateway3OverviewState === 'resubmission-no-docs';
  const isPassState = gateway3OverviewState === 'pass';

  const submission1DocumentsCount = isInitial ? 0 : defaultSubmissionCount;
  const submission2DocumentsCount = isResubmissionNoDocs ? 0 : defaultSubmissionCount;

  const shouldUseStoredDecisions = gateway3OverviewState === 'resubmission-no-docs'
    || gateway3OverviewState === 'resubmission'
    || gateway3OverviewState === 'pass';

  let submission1Decision = shouldUseStoredDecisions ? (req.session.gw3v4Submission1DecisionOutcome || '-') : '-';
  let submission1DecisionDate = shouldUseStoredDecisions ? (req.session.gw3v4Submission1DecisionDate || '-') : '-';
  let submission2Decision = shouldUseStoredDecisions ? (req.session.gw3v4Submission2DecisionOutcome || '-') : '-';
  let submission2DecisionDate = shouldUseStoredDecisions ? (req.session.gw3v4Submission2DecisionDate || '-') : '-';

  if (submission1Decision === '-' && (gateway3OverviewState === 'resubmission-no-docs' || gateway3OverviewState === 'resubmission')) {
    submission1Decision = 'Resubmission required';
    submission1DecisionDate = '10 June 2026';
  }

  if (submission1Decision === '-' && gateway3OverviewState === 'pass') {
    submission1Decision = 'Resubmission required';
    submission1DecisionDate = '10 June 2026';
  }

  if (submission2Decision === '-' && gateway3OverviewState === 'pass') {
    submission2Decision = 'Pass';
    submission2DecisionDate = '20 June 2026';
  }

  const examinationWebsite = req.session.examinationWebsite && req.session.examinationWebsite !== '-'
    ? req.session.examinationWebsite
    : 'Not provided';
  const examinationWebsiteHref = getWebsiteHref(examinationWebsite);
  const gateway3CompletionDate = isPassState && req.session.gateway3CompletionDate && req.session.gateway3CompletionDate !== '-'
    ? req.session.gateway3CompletionDate
    : 'Not provided';

  return {
    caseRef: req.session.currentCaseRef || '',
    notificationMessage,
    gateway3EstimatedDate: req.session.gateway3EstimatedDate && req.session.gateway3EstimatedDate !== '-' ? req.session.gateway3EstimatedDate : '2 Jun 2026',
    gateway3ActualDate: req.session.gateway3ActualDate && req.session.gateway3ActualDate !== '-' ? req.session.gateway3ActualDate : 'Not provided',
    gateway3AssessorAppointmentDate: req.session.gateway3AssessorAppointmentDate && req.session.gateway3AssessorAppointmentDate !== '-' ? req.session.gateway3AssessorAppointmentDate : 'Not provided',
    gateway3CompletionDate,
    gateway3AssessorName: req.session.gateway3AssessorName && req.session.gateway3AssessorName !== '-' ? req.session.gateway3AssessorName : 'Not provided',
    gateway3PoContact: req.session.gateway3PoContact || {},
    examinationWebsite,
    examinationWebsiteHref,
    submissionDocuments,
    supplementaryDocuments,
    submissionDocumentsCount: submission1DocumentsCount,
    gateway3OverviewState,
    isResubmissionRequired,
    isResubmissionNoDocs,
    submission1Decision,
    submission1DecisionDate,
    submission2Decision,
    submission2DecisionDate,
    // Compatibility keys used by the current v4 template.
    submission1DocumentsCount,
    submission2DocumentsCount,
    headerStatusText: {
      'initial': 'GW3 submission',
      'submitted': 'GW3 submitted',
      'resubmission-no-docs': 'GW3 resubmission',
      'resubmission': 'GW3 resubmitted',
      'pass': 'Examination'
    }[gateway3OverviewState] || 'GW3 submission',
    headerStatusClasses: {
      'initial': 'govuk-tag--turquoise',
      'submitted': 'govuk-tag--yellow',
      'resubmission-no-docs': 'govuk-tag--yellow',
      'resubmission': 'govuk-tag--yellow',
      'pass': 'govuk-tag--green'
    }[gateway3OverviewState] || 'govuk-tag--turquoise'
  };
}

function renderGateway3Overview(req, res) {
  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;

  res.render('projects/back-office/manage/GW3/v4/gateway-3', buildGateway3ViewModel(req, notificationMessage));
}

router.get('/gateway-3', (req, res) => {
  const search = new URLSearchParams(req.query || {}).toString();
  const suffix = search ? `?${search}` : '';
  res.redirect(`/projects/back-office/manage/GW3/v4/gateway-3.html${suffix}`);
});

router.get('/gateway-3.html', (req, res) => {
  renderGateway3Overview(req, res);
});

router.get('/gateway-3-documents', (req, res) => {
  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;
  const documents = getGateway3Documents(req).map(buildDocumentForView);
  res.render('projects/back-office/manage/GW3/v4/gateway-3-documents', {
    caseRef: req.session.currentCaseRef || '',
    notificationMessage,
    submissionDocuments: documents.filter((doc) => doc.category === 'submission'),
    supplementaryDocuments: documents.filter((doc) => doc.category === 'supplementary')
  });
});

router.get('/gateway-3-submission-1-documents', (req, res) => {
  const submissionDateSubmitted = formatDateForDisplay(req.session.submissionDate) || formatDateForDisplay(new Date().toISOString());

  res.render('projects/back-office/manage/GW3/v4/gateway-3-submission-1-documents', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: '1',
    submissionDateSubmitted,
    returnUrl: GW3_V4_OVERVIEW_URL
  });
});

router.get('/gateway-3-submission-1-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v4/gateway-3-submission-1-documents');
});

router.get('/gateway-3-submission-2-documents', (req, res) => {
  if (req.session.gw3v4OverviewState === 'resubmission-no-docs') {
    req.session.gw3v4OverviewState = 'resubmission';
  }

  const submissionDateSubmitted = formatDateForDisplay(new Date().toISOString());

  res.render('projects/back-office/manage/GW3/v4/gateway-3-submission-2-documents', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: '2',
    submissionDateSubmitted,
    returnUrl: GW3_V4_OVERVIEW_URL
  });
});

router.get('/gateway-3-submission-2-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v4/gateway-3-submission-2-documents');
});

router.get('/gateway-3-decision.html', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  res.render('projects/back-office/manage/GW3/v4/gateway-3-decision', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    submissionVersion,
    submissionLabel: getSubmissionLabel(submissionVersion),
    hasMultipleSubmissions: submissionVersion === '2',
    returnUrl,
    gateway3DecisionOutcome: req.session[getDecisionOutcomeKey(submissionVersion)] || '-'
  });
});

router.post('/gateway-3-decision', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.body.submissionVersion);
  const returnUrl = req.body.returnUrl || GW3_V4_OVERVIEW_URL;
  const decisionOutcome = String(req.body['gateway-3-decision-outcome'] || '').trim();

  req.session[getDecisionOutcomeKey(submissionVersion)] = decisionOutcome || 'Not provided';

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v4/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  });
});

router.get('/gateway-3-decision-upload', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  res.render('projects/back-office/manage/GW3/v4/gateway-3-decision-upload', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    submissionVersion,
    submissionLabel: getSubmissionLabel(submissionVersion),
    hasMultipleSubmissions: submissionVersion === '2',
    returnUrl,
    showUploadError: req.query.showUploadError === '1',
    uploadedDocuments: getUploadedDocumentsFromSessionData(req)
  });
});

router.post('/gateway-3-decision-upload', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.body.submissionVersion);
  const returnUrl = req.body.returnUrl || GW3_V4_OVERVIEW_URL;
  const uploadedDocuments = getUploadedDocumentsFromSessionData(req);

  if (!uploadedDocuments.length) {
    return res.redirect(`/projects/back-office/manage/GW3/v4/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}&showUploadError=1`);
  }

  req.session[getDecisionReportFilenameKey(submissionVersion)] = uploadedDocuments[0].originalname || '-';
  req.session[getDecisionReportStoredFilenameKey(submissionVersion)] = uploadedDocuments[0].filename || '';
  req.session[getDecisionReportUploadedDateKey(submissionVersion)] = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v4/gateway-3-decision-check-answers.html?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  });
});

router.get('/gateway-3-decision-upload/clear-uploads', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  if (!req.session.data) req.session.data = {};
  req.session.data.fileData = '';
  req.session.data.fileSizeMap = {};

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v4/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  });
});

router.get('/gateway-3-decision-check-answers.html', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  res.render('projects/back-office/manage/GW3/v4/gateway-3-decision-check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    submissionVersion,
    submissionLabel: getSubmissionLabel(submissionVersion),
    hasMultipleSubmissions: submissionVersion === '2',
    returnUrl,
    gateway3DecisionOutcome: req.session[getDecisionOutcomeKey(submissionVersion)] || '-',
    gateway3DecisionReportFilename: req.session[getDecisionReportFilenameKey(submissionVersion)] || '-',
    gateway3DecisionReportStoredFilename: req.session[getDecisionReportStoredFilenameKey(submissionVersion)] || '',
    uploadedDocuments: getUploadedDocumentsFromSessionData(req)
  });
});

router.post('/gateway-3-decision-check-answers', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.body.submissionVersion);
  const returnUrl = req.body.returnUrl || GW3_V4_OVERVIEW_URL;
  const decisionOutcome = req.session[getDecisionOutcomeKey(submissionVersion)] || '-';
  const normalizedDecisionOutcome = String(decisionOutcome).trim().toLowerCase();
  const reportUploadedDate = req.session[getDecisionReportUploadedDateKey(submissionVersion)] || '-';
  const decisionDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  let nextOverviewState = req.session.gw3v4OverviewState || 'initial';

  if (submissionVersion === '2') {
    req.session.gw3v4Submission2DecisionOutcome = decisionOutcome;
    req.session.gw3v4Submission2DecisionDate = decisionDate;
  } else {
    req.session.gw3v4Submission1DecisionOutcome = decisionOutcome;
    req.session.gw3v4Submission1DecisionDate = decisionDate;
  }

  // Keep GW3 overview aligned with issued decision outcome.
  if (submissionVersion === '1' && normalizedDecisionOutcome === 'resubmission required') {
    nextOverviewState = 'resubmission-no-docs';
    req.session.gw3v4Submission2DecisionOutcome = '-';
    req.session.gw3v4Submission2DecisionDate = '-';
    req.session.gw3v4Submission2DecisionReportFilename = '-';
    req.session.gw3v4Submission2DecisionReportStoredFilename = '';
    req.session.gw3v4Submission2DecisionReportUploadedDate = '-';
    req.session.gateway3CompletionDate = '-';
    if (!req.session.data) req.session.data = {};
    req.session.data.gateway3CompletionDate = '-';
  }

  if (submissionVersion === '1' && (normalizedDecisionOutcome === 'proceed to examination' || normalizedDecisionOutcome === 'pass')) {
    nextOverviewState = 'pass';
  }

  if (submissionVersion === '2' && normalizedDecisionOutcome === 'resubmission required') {
    nextOverviewState = 'resubmission';
  }

  if (submissionVersion === '2' && (normalizedDecisionOutcome === 'proceed to examination' || normalizedDecisionOutcome === 'pass')) {
    nextOverviewState = 'pass';
  }

  if (normalizedDecisionOutcome === 'proceed to examination' && reportUploadedDate !== '-') {
    req.session.gateway3CompletionDate = reportUploadedDate;
    if (!req.session.data) req.session.data = {};
    req.session.data.gateway3CompletionDate = reportUploadedDate;
  }

  req.session.gw3v4OverviewState = nextOverviewState;

  req.session.notificationMessage = 'Gateway 3 decision issued and notification sent to LPA';

  req.session.save(() => {
    res.redirect(withGateway3OverviewState(GW3_V4_OVERVIEW_URL, nextOverviewState));
  });
});

router.get('/document/:documentId', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const viewDocument = buildDocumentForView(document);
  const versions = (Array.isArray(document.versions) ? document.versions : [])
    .map((version) => ({
      ...version,
      uploadedAtDisplay: formatTimestampForDisplay(version.uploadedAt)
    }))
    .reverse();

  res.render('projects/back-office/manage/GW3/v4/document-detail', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: viewDocument,
    versions
  });
});

router.get('/document/:documentId/edit-date', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const latestVersion = getLatestDocumentVersion(document);
  const uploadedAt = latestVersion ? new Date(latestVersion.uploadedAt) : new Date();
  const day = isNaN(uploadedAt) ? '' : String(uploadedAt.getDate());
  const month = isNaN(uploadedAt) ? '' : String(uploadedAt.getMonth() + 1);
  const year = isNaN(uploadedAt) ? '' : String(uploadedAt.getFullYear());

  res.render('projects/back-office/manage/GW3/v4/edit-date', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: buildDocumentForView(document),
    values: { day, month, year },
    errors: null
  });
});

router.post('/document/:documentId/edit-date', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const day = (req.body['date-received-day'] || '').trim();
  const month = (req.body['date-received-month'] || '').trim();
  const year = (req.body['date-received-year'] || '').trim();

  if (!day || !month || !year) {
    return res.render('projects/back-office/manage/GW3/v4/edit-date', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      document: buildDocumentForView(document),
      values: { day, month, year },
      errors: { date: 'Enter a complete date' }
    });
  }

  const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);

  if (isNaN(parsed.getTime())) {
    return res.render('projects/back-office/manage/GW3/v4/edit-date', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      document: buildDocumentForView(document),
      values: { day, month, year },
      errors: { date: 'Enter a valid date' }
    });
  }

  const latestVersion = getLatestDocumentVersion(document);
  if (latestVersion) {
    latestVersion.uploadedAt = parsed.toISOString();
  }

  req.session.notificationMessage = 'Date received has been updated';
  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW3/v4/gateway-3-documents');
  });
});

router.get('/document/:documentId/upload-new-version', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const latestVersion = getLatestDocumentVersion(document);
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  res.render('projects/back-office/manage/GW3/v4/upload-new-version', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: buildDocumentForView(document),
    nextVersionNumber,
    values: {
      fileName: ''
    },
    errors: null
  });
});

router.post('/document/:documentId/upload-new-version', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const rawFileName = (req.body.fileName || '').trim();
  const latestVersion = getLatestDocumentVersion(document);
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  if (!rawFileName) {
    return res.render('projects/back-office/manage/GW3/v4/upload-new-version', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      document: buildDocumentForView(document),
      nextVersionNumber,
      values: {
        fileName: rawFileName
      },
      errors: {
        fileName: 'Enter a file name for the new version'
      }
    });
  }

  if (!Array.isArray(document.versions)) {
    document.versions = [];
  }

  document.versions.push({
    versionNumber: nextVersionNumber,
    fileName: rawFileName,
    uploadedAt: new Date().toISOString()
  });
  document.status = 'Ready to validate';
  document.review = null;
  clearReviewDraft(req);
  req.session.notificationMessage = `New version uploaded for ${document.title}`;

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}`);
  });
});

router.get('/document/:documentId/review/outcome', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);

  res.render('projects/back-office/manage/GW3/v4/review-outcome', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: buildDocumentForView(document),
    values: {
      reviewOutcome:
        reviewDraft.documentId === document.id && reviewDraft.reviewOutcome
          ? reviewDraft.reviewOutcome
          : ''
    },
    errors: null
  });
});

router.post('/document/:documentId/review/outcome', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const reviewOutcome = String(
    req.body.reviewOutcome ||
    req.body['reviewOutcome[]'] ||
    req.session?.data?.reviewOutcome ||
    ''
  ).trim();

  if (!reviewOutcome) {
    return res.render('projects/back-office/manage/GW3/v4/review-outcome', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      document: buildDocumentForView(document),
      values: {
        reviewOutcome
      },
      errors: {
        reviewOutcome: 'Select the outcome of your review'
      }
    });
  }

  req.session[REVIEW_DRAFT_SESSION_KEY] = {
    documentId: document.id,
    reviewOutcome,
    reviewReason: ''
  };

  if (reviewOutcome === 'invalid' || reviewOutcome === 'incomplete') {
    return req.session.save(() => {
      res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/reason`);
    });
  }

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/check-answers`);
  });
});

router.get('/document/:documentId/review/reason', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (reviewDraft.documentId !== document.id || (reviewDraft.reviewOutcome !== 'invalid' && reviewDraft.reviewOutcome !== 'incomplete')) {
    return res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/outcome`);
  }

  res.render('projects/back-office/manage/GW3/v4/review-reason', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: buildDocumentForView(document),
    reviewOutcome: reviewDraft.reviewOutcome,
    values: {
      reviewReason: reviewDraft.reviewReason || ''
    },
    errors: null
  });
});

router.post('/document/:documentId/review/reason', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (reviewDraft.documentId !== document.id || (reviewDraft.reviewOutcome !== 'invalid' && reviewDraft.reviewOutcome !== 'incomplete')) {
    return res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/outcome`);
  }

  const reviewReason = (req.body.reviewReason || '').trim();

  if (!reviewReason) {
    return res.render('projects/back-office/manage/GW3/v4/review-reason', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      document: buildDocumentForView(document),
      reviewOutcome: reviewDraft.reviewOutcome,
      values: {
        reviewReason
      },
      errors: {
        reviewReason: 'Enter why you reached this decision'
      }
    });
  }

  req.session[REVIEW_DRAFT_SESSION_KEY] = {
    ...reviewDraft,
    reviewReason
  };

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/check-answers`);
  });
});

router.get('/document/:documentId/review/check-answers', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (!reviewDraft.reviewOutcome || reviewDraft.documentId !== document.id) {
    return res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/outcome`);
  }

  if ((reviewDraft.reviewOutcome === 'invalid' || reviewDraft.reviewOutcome === 'incomplete') && !reviewDraft.reviewReason) {
    return res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/reason`);
  }

  const latestVersion = getLatestDocumentVersion(document);

  res.render('projects/back-office/manage/GW3/v4/review-check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: buildDocumentForView(document),
    latestVersion,
    review: {
      outcome: reviewDraft.reviewOutcome,
      outcomeLabel: outcomeLabelMap[reviewDraft.reviewOutcome] || reviewDraft.reviewOutcome,
      reason: reviewDraft.reviewReason || ''
    }
  });
});

router.post('/document/:documentId/review/check-answers', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (!reviewDraft.reviewOutcome || reviewDraft.documentId !== document.id) {
    return res.redirect(`/projects/back-office/manage/GW3/v4/document/${document.id}/review/outcome`);
  }

  document.status = 'Validated';
  document.review = {
    outcome: reviewDraft.reviewOutcome,
    reason: reviewDraft.reviewReason || '',
    reviewedAt: new Date().toISOString()
  };

  clearReviewDraft(req);
  req.session.notificationMessage = `${document.title} validated and notification sent to LPA`;

  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
  });
});

module.exports = router;
