const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

router.use('/', require('./_set-status'));

router.use((req, res, next) => {
  res.locals.caseRef = req.session.data?.currentCaseRef || req.session.currentCaseRef || '';
  next();
});

const DOCUMENTS_SESSION_KEY = 'gw3v4Documents';
const REVIEW_DRAFT_SESSION_KEY = 'gw3v4DocumentReviewDraft';
const GW3_EDIT_DATE_FIELDS = {
  estimated: {
    sessionKey: 'gateway3EstimatedDate',
    title: 'When is the Gateway 3 submission expected?',
    label: 'estimated Gateway 3 date',
    blankDateArticle: 'an'
  },
  actual: {
    sessionKey: 'gateway3ActualDate',
    title: 'When was the Gateway 3 submission received?',
    label: 'submission received date',
    blankDateArticle: 'a'
  }
};

function formatDateForDisplay(dateValue) {
  if (!dateValue || dateValue === '-') return '-';

  const slashDate = DateTime.fromFormat(String(dateValue), 'd/M/yyyy');
  if (slashDate.isValid) return slashDate.toFormat('d MMMM yyyy');

  const shortDate = DateTime.fromFormat(String(dateValue), 'd MMM yyyy');
  if (shortDate.isValid) return shortDate.toFormat('d MMMM yyyy');

  const isoDate = DateTime.fromISO(String(dateValue));
  if (isoDate.isValid) return isoDate.toFormat('d MMMM yyyy');

  return dateValue;
}

function getGateway3DateInputValues(dateValue) {
  const value = String(dateValue || '').trim();
  const parsedDate = [
    DateTime.fromFormat(value, 'd/M/yyyy', { locale: 'en-GB' }),
    DateTime.fromFormat(value, 'd MMMM yyyy', { locale: 'en-GB' }),
    DateTime.fromISO(value)
  ].find((date) => date.isValid);

  return parsedDate
    ? { day: String(parsedDate.day), month: String(parsedDate.month), year: String(parsedDate.year) }
    : { day: '', month: '', year: '' };
}

function getGateway3DateError(day, month, year, label, blankDateArticle = 'the') {
  const values = [day, month, year].map((value) => String(value || '').trim());
  if (values.every((value) => !value)) return `Enter ${blankDateArticle} ${label}`;
  if (values.some((value) => !value)) return `Enter a complete ${label}`;
  if (!/^\d{1,2}$/.test(values[0]) || !/^\d{1,2}$/.test(values[1]) || !/^\d{4}$/.test(values[2])) {
    return `Enter a valid ${label}`;
  }

  const date = DateTime.fromObject({ day: Number(values[0]), month: Number(values[1]), year: Number(values[2]) });
  return date.isValid && date.day === Number(values[0]) && date.month === Number(values[1]) && date.year === Number(values[2])
    ? ''
    : `Enter a valid ${label}`;
}

function normalizeGateway3Website(value) {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) return '';

  const urlValue = /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
  try {
    const url = new URL(urlValue);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.')
      ? url.toString()
      : null;
  } catch (error) {
    return null;
  }
}

function getSubmission1Date(req) {
  const value = String(req.session.submissionDate || '21 June 2026');
  return [
    DateTime.fromFormat(value, 'd/M/yyyy'),
    DateTime.fromFormat(value, 'd MMMM yyyy'),
    DateTime.fromFormat(value, 'd MMM yyyy'),
    DateTime.fromISO(value)
  ].find((date) => date.isValid) || DateTime.fromISO('2026-06-21');
}

function getSubmission1ReportDate(req) {
  return getSubmission1Date(req).plus({ days: 7 }).toFormat('d MMMM yyyy');
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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  const submissionVersion = String(value || '1');
  return ['1', '2', '3'].includes(submissionVersion) ? submissionVersion : '1';
}

function getSubmissionLabel(submissionVersion) {
  return `submission ${submissionVersion}`;
}

function getDecisionOutcomeKey(submissionVersion) {
  return `gw3v4Submission${submissionVersion}DecisionOutcome`;
}

function getDecisionOutcomeDisplay(outcome) {
  const normalizedOutcome = String(outcome || '').trim().toLowerCase();
  if (normalizedOutcome === 'ready' || normalizedOutcome === 'pass') return 'Ready: proceed to examination';
  if (normalizedOutcome === 'not ready') return 'Not ready: resubmission required';
  return outcome || '-';
}

function getDecisionDateKey(submissionVersion) {
  return `gw3v4Submission${submissionVersion}DecisionDate`;
}

function getDecisionReportFilenameKey(submissionVersion) {
  return `gw3v4Submission${submissionVersion}DecisionReportFilename`;
}

function getDecisionReportStoredFilenameKey(submissionVersion) {
  return `gw3v4Submission${submissionVersion}DecisionReportStoredFilename`;
}

function getReportHref(filename) {
  if (!filename || filename.startsWith('gw3-v5-submission-')) return '#';
  return `/projects/back-office/manage/documents/download/${encodeURIComponent(filename)}`;
}

function getDecisionReportUploadedDateKey(submissionVersion) {
  return `gw3v4Submission${submissionVersion}DecisionReportUploadedDate`;
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
    const isGateway3OverviewPath = parsed.pathname === '/projects/back-office/manage/GW3/v5/gateway-3'
      || parsed.pathname === '/projects/back-office/manage/GW3/v5/gateway-3.html';

    if (!isGateway3OverviewPath) {
      return returnUrl;
    }

    parsed.pathname = '/projects/back-office/manage/GW3/v5/gateway-3.html';
    parsed.searchParams.set('gateway3OverviewState', overviewState);
    return `${parsed.pathname}${parsed.search}`;
  } catch (e) {
    return returnUrl;
  }
}

const GW3_V4_OVERVIEW_URL = '/projects/back-office/manage/GW3/v5/gateway-3.html';

function buildGateway3ViewModel(req, notificationMessage = '') {
  const gateway3OverviewState = String(req.query.gateway3OverviewState || req.session.gw3v4OverviewState || req.session.gw3v4StatusState || 'initial');
  const documents = getGateway3Documents(req).map(buildDocumentForView);
  const submissionDocuments = documents.filter((doc) => doc.category === 'submission');
  const supplementaryDocuments = documents.filter((doc) => doc.category === 'supplementary');
  const defaultSubmissionCount = submissionDocuments.length;
  const isInitial = gateway3OverviewState === 'initial';
  const isResubmissionRequired = gateway3OverviewState === 'resubmission-no-docs'
    || gateway3OverviewState === 'resubmission'
    || (gateway3OverviewState === 'pass' && req.session.gw3v5IssuedDecisions?.['1']?.outcome === 'Not ready');
  const isResubmissionNoDocs = gateway3OverviewState === 'resubmission-no-docs';

  const submission1DocumentsCount = isInitial ? 0 : defaultSubmissionCount;
  const submission2DocumentsCount = isResubmissionNoDocs ? 0 : 4;

  const issuedDecisions = req.session.gw3v5IssuedDecisions || {};
  const currentCaseRef = req.session.currentCaseRef || '';
  const submission1IssuedDecision = issuedDecisions['1']?.caseRef === currentCaseRef
    ? { ...issuedDecisions['1'], date: getSubmission1ReportDate(req) }
    : null;
  const submission2IssuedDecision = issuedDecisions['2']?.caseRef === currentCaseRef ? issuedDecisions['2'] : null;
  const isSubmission3Required = String(submission2IssuedDecision?.outcome || '').trim().toLowerCase() === 'not ready';
  const submission3IssuedDecision = issuedDecisions['3']?.caseRef === currentCaseRef ? issuedDecisions['3'] : null;
  const readyDecision = [submission1IssuedDecision, submission2IssuedDecision, submission3IssuedDecision]
    .find((decision) => String(decision?.outcome || '').trim().toLowerCase() === 'ready');

  const examinationWebsite = req.session.examinationWebsite && req.session.examinationWebsite !== '-'
    ? req.session.examinationWebsite
    : 'Not provided';
  const examinationWebsiteHref = getWebsiteHref(examinationWebsite);
  const gateway3CompletionDate = readyDecision
    ? readyDecision.date
    : 'Not provided';

  return {
    caseRef: req.session.currentCaseRef || '',
    notificationMessage,
    notificationMessageLines: String(notificationMessage).split('\n'),
    gateway3EstimatedDate: req.session.gateway3EstimatedDate && req.session.gateway3EstimatedDate !== '-' ? formatDateForDisplay(req.session.gateway3EstimatedDate) : '2 June 2026',
    gateway3ActualDate: req.session.gateway3ActualDate && req.session.gateway3ActualDate !== '-' ? formatDateForDisplay(req.session.gateway3ActualDate) : 'Not provided',
    gateway3AssessorAppointmentDate: req.session.gateway3AssessorAppointmentDate && req.session.gateway3AssessorAppointmentDate !== '-' ? formatDateForDisplay(req.session.gateway3AssessorAppointmentDate) : 'Not provided',
    gateway3CompletionDate: formatDateForDisplay(gateway3CompletionDate),
    gateway3AssessorName: req.session.gateway3AssessorName && req.session.gateway3AssessorName !== '-' ? req.session.gateway3AssessorName : 'Not provided',
    assessorContacts: (req.session.gw3v5AssessorContacts || []).map((contact) => ({
      ...contact,
      dateAppointedDisplay: contact.dateAppointed ? formatTimestampForDisplay(contact.dateAppointed) : 'Not provided'
    })),
    gateway3PoContact: req.session.gateway3PoContact || {},
    examinationWebsite,
    examinationWebsiteHref,
    submissionDocuments,
    supplementaryDocuments,
    submissionDocumentsCount: submission1DocumentsCount,
    gateway3OverviewState,
    isResubmissionRequired,
    isResubmissionNoDocs,
    isSubmission3Required,
    submission1DecisionIssued: !!submission1IssuedDecision,
    submission1Decision: submission1IssuedDecision?.outcome || '-',
    submission1DecisionDisplay: getDecisionOutcomeDisplay(submission1IssuedDecision?.outcome),
    submission1DecisionDate: submission1IssuedDecision?.date || '-',
    submission1Report: submission1IssuedDecision?.reportFilename || '',
    submission1ReportStoredFilename: submission1IssuedDecision?.reportStoredFilename || '',
    submission1ReportHref: getReportHref(submission1IssuedDecision?.reportStoredFilename),
    submission2DecisionIssued: !!submission2IssuedDecision,
    submission2Decision: submission2IssuedDecision?.outcome || '-',
    submission2DecisionDisplay: getDecisionOutcomeDisplay(submission2IssuedDecision?.outcome),
    submission2DecisionDate: submission2IssuedDecision?.date || '-',
    submission2Report: submission2IssuedDecision?.reportFilename || '',
    submission2ReportStoredFilename: submission2IssuedDecision?.reportStoredFilename || '',
    submission2ReportHref: getReportHref(submission2IssuedDecision?.reportStoredFilename),
    submission3DecisionIssued: !!submission3IssuedDecision,
    submission3Decision: submission3IssuedDecision?.outcome || '-',
    submission3DecisionDisplay: getDecisionOutcomeDisplay(submission3IssuedDecision?.outcome),
    submission3DecisionDate: submission3IssuedDecision?.date || '-',
    submission3Report: submission3IssuedDecision?.reportFilename || '',
    submission3ReportStoredFilename: submission3IssuedDecision?.reportStoredFilename || '',
    submission3ReportHref: getReportHref(submission3IssuedDecision?.reportStoredFilename),
    // Compatibility keys used by the current v4 template.
    submission1DocumentsCount,
    submission2DocumentsCount,
    submission3DocumentsCount: isSubmission3Required ? 4 : 0,
    headerStatusText: {
      'initial': 'GW3 pending',
      'submitted': 'GW3 received',
      'resubmission-no-docs': 'GW3 pending',
      'resubmission': 'GW3 received',
      'pass': 'Exam pending'
    }[gateway3OverviewState] || 'GW3 pending',
    headerStatusClasses: {
      'initial': 'govuk-tag--yellow',
      'submitted': 'govuk-tag--turquoise',
      'resubmission-no-docs': 'govuk-tag--yellow',
      'resubmission': 'govuk-tag--turquoise',
      'pass': 'govuk-tag--yellow'
    }[gateway3OverviewState] || 'govuk-tag--turquoise'
  };
}

function renderGateway3Overview(req, res) {
  const notificationMessage = req.session.notificationMessage || req.session.gw3v5AssessorMessage || '';
  delete req.session.notificationMessage;
  delete req.session.gw3v5AssessorMessage;

  res.render('projects/back-office/manage/GW3/v5/gateway-3', buildGateway3ViewModel(req, notificationMessage));
}

router.get('/gateway-3', (req, res) => {
  const search = new URLSearchParams(req.query || {}).toString();
  const suffix = search ? `?${search}` : '';
  res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3.html${suffix}`);
});

router.get('/gateway-3.html', (req, res) => {
  renderGateway3Overview(req, res);
});

router.get('/gateway-3-date/:dateField', (req, res) => {
  const field = GW3_EDIT_DATE_FIELDS[req.params.dateField];
  if (!field) return res.sendStatus(404);

  const storedDate = req.session[field.sessionKey]
    || (req.params.dateField === 'estimated' ? '2 June 2026' : '');
  res.render('projects/back-office/manage/GW3/v5/gateway-3-date', {
    dateField: req.params.dateField,
    dateTitle: field.title,
    dateLabel: field.label,
    dateParts: getGateway3DateInputValues(storedDate),
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3'
  });
});

router.post('/gateway-3-date/:dateField', (req, res) => {
  const field = GW3_EDIT_DATE_FIELDS[req.params.dateField];
  if (!field) return res.sendStatus(404);

  const day = String(req.body['date-day'] || '').trim();
  const month = String(req.body['date-month'] || '').trim();
  const year = String(req.body['date-year'] || '').trim();
  const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3';
  const error = getGateway3DateError(day, month, year, field.label, field.blankDateArticle);
  if (error) {
    return res.status(400).render('projects/back-office/manage/GW3/v5/gateway-3-date', {
      dateField: req.params.dateField,
      dateTitle: field.title,
      dateLabel: field.label,
      dateParts: { day, month, year },
      returnUrl,
      error
    });
  }

  const savedDate = DateTime.fromFormat(`${day}/${month}/${year}`, 'd/M/yyyy', { locale: 'en-GB' }).toFormat('d/M/yyyy');
  req.session[field.sessionKey] = savedDate;
  if (req.params.dateField === 'estimated') req.session.examinationEstimatedDate = savedDate;
  req.session.notificationMessage = `${req.params.dateField === 'estimated' ? 'Gateway 3 estimated date' : 'Gateway 3 actual date'} updated`;
  req.session.save(() => res.redirect(returnUrl));
});

router.get('/gateway-3-po-details', (req, res) => {
  res.render('projects/back-office/manage/GW3/v5/gateway-3-po-details', {
    contact: req.session.gateway3PoContact || {},
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3'
  });
});

router.post('/gateway-3-po-details', (req, res) => {
  const contact = {
    firstName: String(req.body.firstName || '').trim(),
    lastName: String(req.body.lastName || '').trim(),
    email: String(req.body.email || '').trim(),
    phone: String(req.body.phone || '').trim()
  };
  const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3';
  const errors = {};
  if (!contact.firstName) errors.firstName = 'Enter a first name';
  if (!contact.lastName) errors.lastName = 'Enter a last name';
  if (!contact.email) {
    errors.email = 'Enter an email address';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.email = 'Enter an email address in the correct format';
  }
  const errorList = [
    errors.firstName && { text: errors.firstName, href: '#po-firstName' },
    errors.lastName && { text: errors.lastName, href: '#po-lastName' },
    errors.email && { text: errors.email, href: '#po-email' }
  ].filter(Boolean);

  if (errorList.length) {
    return res.status(400).render('projects/back-office/manage/GW3/v5/gateway-3-po-details', {
      contact,
      returnUrl,
      errors,
      errorList
    });
  }

  req.session.gateway3PoContact = contact;
  req.session.notificationMessage = 'Programme officer details updated';
  req.session.save(() => res.redirect(returnUrl));
});

router.get('/examination-website', (req, res) => {
  res.render('projects/back-office/manage/GW3/v5/examination-website', {
    examinationWebsite: req.session.examinationWebsite && req.session.examinationWebsite !== '-'
      ? req.session.examinationWebsite
      : '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3'
  });
});

router.post('/examination-website', (req, res) => {
  const enteredWebsite = String(req.body['examination-website'] || '').trim();
  const examinationWebsite = normalizeGateway3Website(enteredWebsite);
  const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3';
  const error = !enteredWebsite
    ? 'Enter an examination website address'
    : !examinationWebsite
      ? 'Enter a valid website address'
      : '';

  if (error) {
    return res.status(400).render('projects/back-office/manage/GW3/v5/examination-website', {
      examinationWebsite: enteredWebsite,
      returnUrl,
      error
    });
  }

  req.session.examinationWebsite = examinationWebsite;
  req.session.notificationMessage = 'Examination website updated';
  req.session.save(() => res.redirect(returnUrl));
});

const assessorOverview = '/projects/back-office/manage/GW3/v5/gateway-3';
const assessorNotification = '/projects/back-office/manage/GW3/v5/assessor-notification';

router.get('/additional-contact', (req, res) => {
  const contact = req.query.from === 'notification' ? req.session.gw3v5PendingAssessor : {};
  res.render('projects/back-office/manage/GW3/v5/additional-contact', {
    contact: contact || {},
    from: req.query.from || '',
    cancelUrl: req.query.from === 'notification' ? assessorNotification : assessorOverview
  });
});

router.post('/additional-contact', (req, res) => {
  const fullName = (req.body.fullName || '').trim();
  const from = req.body.from;
  if (!fullName) {
    return res.render('projects/back-office/manage/GW3/v5/additional-contact', {
      contact: { fullName }, from,
      cancelUrl: from === 'notification' ? assessorNotification : assessorOverview,
      error: 'Enter the assessor name'
    });
  }

  const contacts = Array.isArray(req.session.gw3v5AssessorContacts) ? req.session.gw3v5AssessorContacts : [];
  if (from === 'notification' && req.session.gw3v5PendingAssessor) {
    req.session.gw3v5PendingAssessor.fullName = fullName;
    contacts[contacts.length - 1].fullName = fullName;
  } else {
    const contact = { fullName, dateAppointed: DateTime.now().toISODate() };
    contacts.push(contact);
    req.session.gw3v5PendingAssessor = contact;
  }
  req.session.gw3v5AssessorContacts = contacts;
  res.redirect(assessorNotification);
});

router.get('/date-appointed', (req, res) => {
  const dateAppointed = req.session.gw3v5PendingAssessor?.dateAppointed || DateTime.now().toISODate();
  const [year, month, day] = dateAppointed.split('-');
  res.render('projects/back-office/manage/GW3/v5/date-appointed', { day, month, year });
});

router.post('/date-appointed', (req, res) => {
  const { day, month, year } = req.body;
  const date = DateTime.fromObject({ day: Number(day), month: Number(month), year: Number(year) });
  if (!day || !month || !year || !date.isValid || date.day !== Number(day) || date.month !== Number(month) || date.year !== Number(year)) {
    return res.render('projects/back-office/manage/GW3/v5/date-appointed', {
      day, month, year, error: 'Enter a valid date appointed'
    });
  }
  const contacts = req.session.gw3v5AssessorContacts;
  if (req.session.gw3v5PendingAssessor && Array.isArray(contacts) && contacts.length) {
    req.session.gw3v5PendingAssessor.dateAppointed = date.toISODate();
    contacts[contacts.length - 1].dateAppointed = date.toISODate();
  }
  res.redirect(assessorNotification);
});

router.get('/assessor-notification', (req, res) => {
  const contact = req.session.gw3v5PendingAssessor;
  if (!contact) return res.redirect(assessorOverview);
  res.render('projects/back-office/manage/GW3/v5/assessor-notification', {
    contact: { ...contact, dateAppointedDisplay: formatTimestampForDisplay(contact.dateAppointed) }
  });
});

router.post('/assessor-notification', (req, res) => {
  const contact = req.session.gw3v5PendingAssessor;
  if (contact) {
    req.session.gw3v5AssessorMessage = `Assessor added`;
    delete req.session.gw3v5PendingAssessor;
  }
  res.redirect(assessorOverview);
});

router.get('/remove-assessor', (req, res) => {
  const index = Number(req.query.edit);
  const contact = req.session.gw3v5AssessorContacts?.[index];
  if (!contact || !Number.isInteger(index) || req.query.edit === undefined) return res.redirect(assessorOverview);
  res.render('projects/back-office/manage/GW3/v5/remove-assessor', { contact, editIndex: index });
});

router.post('/remove-assessor', (req, res) => {
  const index = Number(req.body.editIndex);
  const contacts = req.session.gw3v5AssessorContacts;
  if (Array.isArray(contacts) && Number.isInteger(index) && index >= 0 && index < contacts.length) {
    contacts.splice(index, 1);
    req.session.gw3v5AssessorMessage = 'Assessor removed';
  }
  res.redirect(assessorOverview);
});

router.get('/gateway-3-documents', (req, res) => {
  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;
  const documents = getGateway3Documents(req).map(buildDocumentForView);
  res.render('projects/back-office/manage/GW3/v5/gateway-3-documents', {
    caseRef: req.session.currentCaseRef || '',
    notificationMessage,
    submissionDocuments: documents.filter((doc) => doc.category === 'submission'),
    supplementaryDocuments: documents.filter((doc) => doc.category === 'supplementary')
  });
});

router.get(['/gateway-3-submission-1-documents', '/gateway-3-submission-1-documents-grouped', '/gateway-3-submission-1-documents-required'], (req, res) => {
  const submissionDateSubmitted = getSubmission1Date(req).toFormat('d MMMM yyyy');
  const decisionOutcome = req.session[getDecisionOutcomeKey('1')];
  const hasDecisionOutcome = Boolean(decisionOutcome && !['-', 'Not provided'].includes(decisionOutcome));
  const otherSupportingDocument = getGateway3DocumentById(req, 'other-supporting-documents');
  const otherDocumentVersions = Array.isArray(otherSupportingDocument?.versions)
    ? otherSupportingDocument.versions.slice().reverse()
    : [];
  const otherDocumentsHtml = otherDocumentVersions.length
    ? `<ul class="govuk-list govuk-list--bullet app-other-documents-list">${otherDocumentVersions
      .map((otherDocument) => `<li><a class="govuk-link" href="/projects/back-office/manage/GW3/v5/document/other-supporting-documents">${escapeHtml(otherDocument.fileName)}</a></li>`)
      .join('')}</ul>`
    : 'No other documents';

  const template = req.path.split('/').pop();
  res.render(`projects/back-office/manage/GW3/v5/${template}`, {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: '1',
    submissionDateSubmitted,
    hasDecisionOutcome,
    returnUrl: GW3_V4_OVERVIEW_URL,
    otherDocumentsHtml
  });
});

router.get('/gateway-3-submission-1-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v5/gateway-3-submission-1-documents');
});

router.get('/gateway-3-submission-1-documents-grouped.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v5/gateway-3-submission-1-documents-grouped');
});

router.get('/gateway-3-submission-1-documents-required.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v5/gateway-3-submission-1-documents-required');
});

router.get('/gateway-3-submission-2-documents', (req, res) => {
  if (req.session.gw3v4OverviewState === 'resubmission-no-docs') {
    req.session.gw3v4OverviewState = 'resubmission';
  }

  const submission1Date = getSubmission1Date(req);
  const submissionDateSubmitted = submission1Date.plus({ months: 1 }).toFormat('d MMMM yyyy');
  const otherSupportingDocument = getGateway3DocumentById(req, 'other-supporting-documents');
  const otherDocumentVersions = Array.isArray(otherSupportingDocument?.versions)
    ? otherSupportingDocument.versions.slice().reverse()
    : [];
  const otherDocumentsHtml = otherDocumentVersions.length
    ? `<ul class="govuk-list govuk-list--bullet app-other-documents-list">${otherDocumentVersions
      .map((otherDocument) => `<li><a class="govuk-link" href="/projects/back-office/manage/GW3/v5/document/other-supporting-documents">${escapeHtml(otherDocument.fileName)}</a></li>`)
      .join('')}</ul>`
    : 'No other documents';

  const previousDecision = req.session.gw3v5IssuedDecisions?.['1'];
  const previousSubmissionDecision = previousDecision?.caseRef === (req.session.currentCaseRef || '')
    ? { ...previousDecision, date: getSubmission1ReportDate(req), reportHref: getReportHref(previousDecision.reportStoredFilename) }
    : null;
  const decisionOutcome = req.session[getDecisionOutcomeKey('2')];
  const hasDecisionOutcome = Boolean(decisionOutcome && !['-', 'Not provided'].includes(decisionOutcome));

  res.render('projects/back-office/manage/GW3/v5/gateway-3-submission-2-documents', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: '2',
    submissionDateSubmitted,
    hasDecisionOutcome,
    previousSubmissionDecision,
    previousSubmissionDate: submission1Date.toFormat('d MMMM yyyy'),
    returnUrl: GW3_V4_OVERVIEW_URL,
    otherDocumentsHtml
  });
});

router.get('/gateway-3-submission-2-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v5/gateway-3-submission-2-documents');
});

router.get('/gateway-3-submission-3-documents', (req, res) => {
  const issuedDecisions = req.session.gw3v5IssuedDecisions || {};
  const currentCaseRef = req.session.currentCaseRef || '';
  const previousDecision = issuedDecisions['2'];
  if (previousDecision?.caseRef !== (req.session.currentCaseRef || '')
    || String(previousDecision?.outcome || '').trim().toLowerCase() !== 'not ready') {
    return res.redirect(GW3_V4_OVERVIEW_URL);
  }

  const submission1Date = getSubmission1Date(req);
  const previousSubmission1Decision = issuedDecisions['1']?.caseRef === currentCaseRef
    ? { ...issuedDecisions['1'], date: getSubmission1ReportDate(req), reportHref: getReportHref(issuedDecisions['1'].reportStoredFilename) }
    : null;
  const previousSubmission2Decision = previousDecision?.caseRef === currentCaseRef
    ? { ...previousDecision, reportHref: getReportHref(previousDecision.reportStoredFilename) }
    : null;
  const decisionOutcome = req.session[getDecisionOutcomeKey('3')];
  const hasDecisionOutcome = Boolean(decisionOutcome && !['-', 'Not provided'].includes(decisionOutcome));

  res.render('projects/back-office/manage/GW3/v5/gateway-3-submission-2-documents', {
    caseRef: req.session.currentCaseRef || '',
    submissionNumber: '3',
    hasDecisionOutcome,
    previousSubmission1Decision,
    previousSubmission1Date: submission1Date.toFormat('d MMMM yyyy'),
    previousSubmission2Decision,
    previousSubmission2Date: submission1Date.plus({ months: 1 }).toFormat('d MMMM yyyy'),
    returnUrl: GW3_V4_OVERVIEW_URL
  });
});

router.get('/gateway-3-report/manage', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const issuedDecision = req.session.gw3v5IssuedDecisions?.[submissionVersion];
  if (!issuedDecision || issuedDecision.caseRef !== (req.session.currentCaseRef || '')) {
    return res.redirect(GW3_V4_OVERVIEW_URL);
  }

  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;
  const uploadedReport = getUploadedDocumentsFromSessionData(req)
    .find((document) => document.filename === issuedDecision.reportStoredFilename);
  res.render('projects/back-office/manage/GW3/v5/gateway-3-report-manage', {
    caseRef: req.session.currentCaseRef || '',
    submissionVersion,
    notificationMessage,
    issuedDecision: {
      ...issuedDecision,
      reportFilename: uploadedReport?.originalname || issuedDecision.reportFilename,
      reportHref: getReportHref(issuedDecision.reportStoredFilename),
      date: submissionVersion === '1' ? getSubmission1ReportDate(req) : issuedDecision.date
    }
  });
});

router.get('/gateway-3-report/remove-confirm', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const issuedDecision = req.session.gw3v5IssuedDecisions?.[submissionVersion];
  if (!issuedDecision || issuedDecision.caseRef !== (req.session.currentCaseRef || '')
    || !issuedDecision.reportStoredFilename || issuedDecision.reportStoredFilename !== req.query.filename) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-report/manage?submissionVersion=${submissionVersion}`);
  }
  res.render('projects/back-office/manage/GW3/v5/gateway-3-report-remove-confirm', {
    caseRef: req.session.currentCaseRef || '',
    submissionVersion,
    filename: issuedDecision.reportStoredFilename,
    documentName: issuedDecision.reportFilename
  });
});

router.post('/gateway-3-report/remove-confirm', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.body.submissionVersion);
  const issuedDecision = req.session.gw3v5IssuedDecisions?.[submissionVersion];
  if (req.body.action === 'remove' && issuedDecision?.caseRef === (req.session.currentCaseRef || '')
    && issuedDecision.reportStoredFilename && issuedDecision.reportStoredFilename === req.body.filename) {
    const reportFilename = issuedDecision.reportFilename;
    issuedDecision.reportFilename = '';
    issuedDecision.reportStoredFilename = '';
    if (req.session[getDecisionReportStoredFilenameKey(submissionVersion)] === req.body.filename) {
      delete req.session[getDecisionReportFilenameKey(submissionVersion)];
      delete req.session[getDecisionReportStoredFilenameKey(submissionVersion)];
      delete req.session[getDecisionReportUploadedDateKey(submissionVersion)];
    }
    if (req.session.data) {
      req.session.data.fileData = JSON.stringify(getUploadedDocumentsFromSessionData(req)
        .filter((document) => document.filename !== req.body.filename)
        .map((document) => ({ name: document.originalname, id: document.filename })));
      if (req.session.data.fileSizeMap) delete req.session.data.fileSizeMap[reportFilename];
    }
    req.session.notificationMessage = 'Report removed';
  }
  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-report/manage?submissionVersion=${submissionVersion}`);
  });
});

router.get('/gateway-3-decision.html', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  res.render('projects/back-office/manage/GW3/v5/gateway-3-decision', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    submissionVersion,
    submissionNumber: submissionVersion,
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

  if (!['Ready', 'Not ready'].includes(decisionOutcome)) {
    return res.status(400).render('projects/back-office/manage/GW3/v5/gateway-3-decision', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      submissionVersion,
      submissionNumber: submissionVersion,
      submissionLabel: getSubmissionLabel(submissionVersion),
      hasMultipleSubmissions: submissionVersion === '2',
      returnUrl,
      gateway3DecisionOutcome: decisionOutcome,
      error: 'Select an outcome'
    });
  }

  req.session[getDecisionOutcomeKey(submissionVersion)] = decisionOutcome;

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  });
});

router.get('/gateway-3-decision-upload', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  res.render('projects/back-office/manage/GW3/v5/gateway-3-decision-upload', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    submissionVersion,
    submissionNumber: submissionVersion,
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
    return res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}&showUploadError=1`);
  }

  req.session[getDecisionReportFilenameKey(submissionVersion)] = uploadedDocuments[0].originalname || '-';
  req.session[getDecisionReportStoredFilenameKey(submissionVersion)] = uploadedDocuments[0].filename || '';
  req.session[getDecisionReportUploadedDateKey(submissionVersion)] = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-decision-check-answers.html?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  });
});

router.get('/gateway-3-decision-upload/clear-uploads', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  if (!req.session.data) req.session.data = {};
  req.session.data.fileData = '';
  req.session.data.fileSizeMap = {};

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  });
});

router.get('/gateway-3-decision-check-answers.html', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.query.submissionVersion);
  const returnUrl = req.query.returnUrl || GW3_V4_OVERVIEW_URL;

  res.render('projects/back-office/manage/GW3/v5/gateway-3-decision-check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    submissionVersion,
    submissionNumber: submissionVersion,
    submissionLabel: getSubmissionLabel(submissionVersion),
    hasMultipleSubmissions: submissionVersion === '2',
    returnUrl,
    gateway3DecisionOutcome: getDecisionOutcomeDisplay(req.session[getDecisionOutcomeKey(submissionVersion)] || '-'),
    gateway3DecisionReportFilename: req.session[getDecisionReportFilenameKey(submissionVersion)] || '-',
    gateway3DecisionReportStoredFilename: req.session[getDecisionReportStoredFilenameKey(submissionVersion)] || '',
    gateway3DecisionReportHref: getReportHref(req.session[getDecisionReportStoredFilenameKey(submissionVersion)]),
    uploadedDocuments: getUploadedDocumentsFromSessionData(req)
  });
});

router.post('/gateway-3-decision-check-answers', (req, res) => {
  const submissionVersion = getSubmissionVersion(req.body.submissionVersion);
  const returnUrl = req.body.returnUrl || GW3_V4_OVERVIEW_URL;
  const decisionOutcome = req.session[getDecisionOutcomeKey(submissionVersion)] || '-';
  const normalizedDecisionOutcome = String(decisionOutcome).trim().toLowerCase();
  const reportUploadedDate = req.session[getDecisionReportUploadedDateKey(submissionVersion)] || '-';
  const reportFilename = req.session[getDecisionReportFilenameKey(submissionVersion)];
  const reportStoredFilename = req.session[getDecisionReportStoredFilenameKey(submissionVersion)];
  if (!['ready', 'pass', 'not ready'].includes(normalizedDecisionOutcome)) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-decision.html?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}`);
  }
  if (!reportFilename || reportFilename === '-' || !reportStoredFilename) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/gateway-3-decision-upload?submissionVersion=${submissionVersion}&returnUrl=${encodeURIComponent(returnUrl)}&showUploadError=1`);
  }
  const decisionDate = submissionVersion === '1' ? getSubmission1ReportDate(req) : new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  let nextOverviewState = req.session.gw3v4OverviewState || 'initial';

  req.session[getDecisionOutcomeKey(submissionVersion)] = decisionOutcome;
  req.session[getDecisionDateKey(submissionVersion)] = decisionDate;

  // Keep GW3 overview aligned with issued decision outcome.
  if (submissionVersion === '1' && normalizedDecisionOutcome === 'not ready') {
    nextOverviewState = 'resubmission-no-docs';
    req.session.gw3v4Submission2DecisionOutcome = '-';
    req.session.gw3v4Submission2DecisionDate = '-';
    req.session.gw3v4Submission2DecisionReportFilename = '-';
    req.session.gw3v4Submission2DecisionReportStoredFilename = '';
    req.session.gw3v4Submission2DecisionReportUploadedDate = '-';
    if (req.session.gw3v5IssuedDecisions) delete req.session.gw3v5IssuedDecisions['2'];
    req.session.gw3v4Submission3DecisionOutcome = '-';
    req.session.gw3v4Submission3DecisionDate = '-';
    req.session.gw3v4Submission3DecisionReportFilename = '-';
    req.session.gw3v4Submission3DecisionReportStoredFilename = '';
    req.session.gw3v4Submission3DecisionReportUploadedDate = '-';
    if (req.session.gw3v5IssuedDecisions) delete req.session.gw3v5IssuedDecisions['3'];
    req.session.gateway3CompletionDate = '-';
    if (!req.session.data) req.session.data = {};
    req.session.data.gateway3CompletionDate = '-';
  }

  if (submissionVersion === '1' && (normalizedDecisionOutcome === 'ready' || normalizedDecisionOutcome === 'pass')) {
    nextOverviewState = 'pass';
  }

  if (submissionVersion === '2' && normalizedDecisionOutcome === 'not ready') {
    nextOverviewState = 'resubmission';
  }

  if (submissionVersion === '2' && normalizedDecisionOutcome !== 'not ready') {
    ['Outcome', 'Date', 'ReportFilename', 'ReportStoredFilename', 'ReportUploadedDate'].forEach((field) => {
      delete req.session[`gw3v4Submission3Decision${field}`];
    });
    if (req.session.gw3v5IssuedDecisions) delete req.session.gw3v5IssuedDecisions['3'];
  }

  if (submissionVersion === '3' && normalizedDecisionOutcome === 'not ready') {
    nextOverviewState = 'resubmission';
  }

  if (submissionVersion === '2' && (normalizedDecisionOutcome === 'ready' || normalizedDecisionOutcome === 'pass')) {
    nextOverviewState = 'pass';
  }

  if (submissionVersion === '3' && (normalizedDecisionOutcome === 'ready' || normalizedDecisionOutcome === 'pass')) {
    nextOverviewState = 'pass';
  }

  if (normalizedDecisionOutcome === 'ready' && reportUploadedDate !== '-') {
    req.session.gateway3CompletionDate = reportUploadedDate;
    if (!req.session.data) req.session.data = {};
    req.session.data.gateway3CompletionDate = reportUploadedDate;
  }

  req.session.gw3v4OverviewState = nextOverviewState;
  req.session.gw3v5IssuedDecisions = {
    ...(req.session.gw3v5IssuedDecisions || {}),
    [submissionVersion]: {
      caseRef: req.session.currentCaseRef || '',
      outcome: decisionOutcome,
      date: decisionDate,
      reportFilename,
      reportStoredFilename
    }
  };

  req.session.notificationMessage = normalizedDecisionOutcome === 'not ready'
    ? "Outcome confirmed: resubmission required. We've notified the planning authority."
    : "Outcome confirmed: ready to proceed to examination. We've notified the planning authority.";

  req.session.save(() => {
    res.redirect(withGateway3OverviewState(GW3_V4_OVERVIEW_URL, nextOverviewState));
  });
});

router.get('/document/:documentId', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const viewDocument = buildDocumentForView(document);
  const versions = (Array.isArray(document.versions) ? document.versions : [])
    .map((version) => ({
      ...version,
      uploadedAtDisplay: formatTimestampForDisplay(version.uploadedAt)
    }))
    .reverse();

  res.render('projects/back-office/manage/GW3/v5/document-detail', {
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
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const latestVersion = getLatestDocumentVersion(document);
  const uploadedAt = latestVersion ? new Date(latestVersion.uploadedAt) : new Date();
  const day = isNaN(uploadedAt) ? '' : String(uploadedAt.getDate());
  const month = isNaN(uploadedAt) ? '' : String(uploadedAt.getMonth() + 1);
  const year = isNaN(uploadedAt) ? '' : String(uploadedAt.getFullYear());

  res.render('projects/back-office/manage/GW3/v5/edit-date', {
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
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const day = (req.body['date-received-day'] || '').trim();
  const month = (req.body['date-received-month'] || '').trim();
  const year = (req.body['date-received-year'] || '').trim();

  if (!day || !month || !year) {
    return res.render('projects/back-office/manage/GW3/v5/edit-date', {
      caseRef: req.session.currentCaseRef || '',
      serviceName: 'Local Plans Examinations',
      document: buildDocumentForView(document),
      values: { day, month, year },
      errors: { date: 'Enter a complete date' }
    });
  }

  const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);

  if (isNaN(parsed.getTime())) {
    return res.render('projects/back-office/manage/GW3/v5/edit-date', {
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
    res.redirect('/projects/back-office/manage/GW3/v5/gateway-3-documents');
  });
});

router.get('/document/:documentId/upload-new-version', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const latestVersion = getLatestDocumentVersion(document);
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  res.render('projects/back-office/manage/GW3/v5/upload-new-version', {
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
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const rawFileName = (req.body.fileName || '').trim();
  const latestVersion = getLatestDocumentVersion(document);
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  if (!rawFileName) {
    return res.render('projects/back-office/manage/GW3/v5/upload-new-version', {
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
    res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}`);
  });
});

router.get('/document/:documentId/review/outcome', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);

  res.render('projects/back-office/manage/GW3/v5/review-outcome', {
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
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const reviewOutcome = String(
    req.body.reviewOutcome ||
    req.body['reviewOutcome[]'] ||
    req.session?.data?.reviewOutcome ||
    ''
  ).trim();

  if (!reviewOutcome) {
    return res.render('projects/back-office/manage/GW3/v5/review-outcome', {
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
      res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/reason`);
    });
  }

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/check-answers`);
  });
});

router.get('/document/:documentId/review/reason', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (reviewDraft.documentId !== document.id || (reviewDraft.reviewOutcome !== 'invalid' && reviewDraft.reviewOutcome !== 'incomplete')) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/outcome`);
  }

  res.render('projects/back-office/manage/GW3/v5/review-reason', {
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
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (reviewDraft.documentId !== document.id || (reviewDraft.reviewOutcome !== 'invalid' && reviewDraft.reviewOutcome !== 'incomplete')) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/outcome`);
  }

  const reviewReason = (req.body.reviewReason || '').trim();

  if (!reviewReason) {
    return res.render('projects/back-office/manage/GW3/v5/review-reason', {
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
    res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/check-answers`);
  });
});

router.get('/document/:documentId/review/check-answers', (req, res) => {
  const document = getGateway3DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (!reviewDraft.reviewOutcome || reviewDraft.documentId !== document.id) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/outcome`);
  }

  if ((reviewDraft.reviewOutcome === 'invalid' || reviewDraft.reviewOutcome === 'incomplete') && !reviewDraft.reviewReason) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/reason`);
  }

  const latestVersion = getLatestDocumentVersion(document);

  res.render('projects/back-office/manage/GW3/v5/review-check-answers', {
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
    return res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  }

  const reviewDraft = getReviewDraft(req);
  if (!reviewDraft.reviewOutcome || reviewDraft.documentId !== document.id) {
    return res.redirect(`/projects/back-office/manage/GW3/v5/document/${document.id}/review/outcome`);
  }

  document.status = 'Validated';
  document.review = {
    outcome: reviewDraft.reviewOutcome,
    reason: reviewDraft.reviewReason || '',
    reviewedAt: new Date().toISOString()
  };

  clearReviewDraft(req);
  req.session.notificationMessage = `${document.title} validated and notification sent to planning authority`;

  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW3/v5/gateway-3');
  });
});

module.exports = router;
