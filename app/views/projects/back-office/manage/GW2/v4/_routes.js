const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');
const { applyStatusEvent } = require('../../../../../../routes/projects/back-office/status-flow');

const WORKSHOP_DOCS_KEY = 'gw2v3WorkshopDocuments';
const ISSUE_REPORT_DOCS_KEY = 'gw2v4IssueReportDocuments';
const DOCUMENTS_SESSION_KEY = 'gw2v4Documents';
const REVIEW_DRAFT_SESSION_KEY = 'gw2v4DocumentReviewDraft';
const ISSUE_REPORT_SUCCESS_MESSAGE = 'Gateway 2 report issued';

const RETURN_TO_FALLBACK = 'gateway-2';
const RETURN_TO_MAP = {
  'gateway-2': '/projects/back-office/manage/GW2/v4/gateway-2',
  'check-answers-v1': '/projects/back-office/manage/GW2/v4/upload/v1/check-answers',
  'upload-bo-v1': '/projects/back-office/manage/GW2/v4/upload/v1/upload-bo',
  'check-answers-v2': '/projects/back-office/manage/GW2/v4/upload/v2/check-answers',
  'upload-bo-v2': '/projects/back-office/manage/GW2/v4/upload/v2/upload-bo'
};

function getReturnPath(returnTo) {
  return RETURN_TO_MAP[returnTo] || RETURN_TO_MAP[RETURN_TO_FALLBACK];
}

function getReturnTo(req, fallback = RETURN_TO_FALLBACK) {
  const requestedReturnTo =
    (req.query && req.query.returnTo) ||
    (req.body && req.body.returnTo) ||
    req.session.gw2v4UploadReturnTo ||
    fallback;

  return Object.prototype.hasOwnProperty.call(RETURN_TO_MAP, requestedReturnTo)
    ? requestedReturnTo
    : RETURN_TO_FALLBACK;
}

function withReturnTo(path, returnTo) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function formatDateForDisplay(dateString) {
  if (!dateString || dateString === '-') return '-';

  const slashParsed = DateTime.fromFormat(dateString, 'd/M/yyyy');
  if (slashParsed.isValid) {
    return slashParsed.toFormat('d MMMM yyyy');
  }

  return dateString;
}

function formatTimestampForDisplay(timestamp) {
  if (!timestamp || timestamp === '-') return '-';

  const parsed = DateTime.fromISO(timestamp);
  if (!parsed.isValid) return '-';

  return parsed.toFormat('d MMMM yyyy');
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultGateway2Documents() {
  const seedDate = '2026-05-17T10:00:00.000Z';

  return [
    {
      id: 'gw2-covering-letter',
      category: 'procedural',
      title: 'Gateway 2 covering letter',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'GW2_covering_letter.docx', uploadedAt: seedDate }]
    },
    {
      id: 'local-plan-timetable',
      category: 'procedural',
      title: 'Local plan timetable',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'plan_timetable.csv', uploadedAt: seedDate }]
    },
    {
      id: 'project-initiation-document',
      category: 'procedural',
      title: 'Project initiation document',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'PID.docx', uploadedAt: seedDate }]
    },
    {
      id: 'draft-statement-compliance',
      category: 'procedural',
      title: 'Draft statement of compliance',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'GW2_compliance_statement.docx', uploadedAt: seedDate }]
    },
    {
      id: 'draft-statement-soundness',
      category: 'procedural',
      title: 'Draft statement of soundness',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'GW2_soundness_statement.docx', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-statement',
      category: 'consultation',
      title: 'Consultation statement',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'consultation_statement.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-summary-scoping',
      category: 'consultation',
      title: 'Consultation summary for scoping consultation',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'scoping_summary.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-summary-proposed-plan',
      category: 'consultation',
      title: 'Consultation summary for proposed local plan content and evidence documents',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'proposed_plan_summary.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'notice-of-intention',
      category: 'consultation',
      title: 'Notice of intention to commence local plan preparation',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'notice_of_intention.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'scoping-consultation-documents',
      category: 'consultation',
      title: 'Scoping consultation documents',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'scoping_full.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'scoping-feedback-summary',
      category: 'consultation',
      title: 'Consultation summary of feedback to scoping consultation',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'scoping_feedback_summary.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'gateway1-self-assessment',
      category: 'consultation',
      title: 'Gateway 1 - Self assessment of readiness',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'gateway1_self_assessment.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-proposed-plan-evidence',
      category: 'consultation',
      title: 'Consultation on proposed local plan content and evidence documents',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'proposed_plan_full.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-summary-above',
      category: 'consultation',
      title: 'Consultation summary for the above',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'consultation_summary.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'subsequent-work-draft-plan',
      category: 'additional',
      title: 'Subsequent work towards a draft plan',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'subsequent_work_draft_plan.pdf', uploadedAt: seedDate }]
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

function getGateway2Documents(req) {
  if (Array.isArray(req.session[DOCUMENTS_SESSION_KEY])) {
    return req.session[DOCUMENTS_SESSION_KEY];
  }

  const seededDocuments = getDefaultGateway2Documents();
  req.session[DOCUMENTS_SESSION_KEY] = cloneDeep(seededDocuments);
  return req.session[DOCUMENTS_SESSION_KEY];
}

function getGateway2DocumentById(req, documentId) {
  const documents = getGateway2Documents(req);
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

function getUploadedDocuments(req) {
  if (Array.isArray(req.session[WORKSHOP_DOCS_KEY])) {
    return req.session[WORKSHOP_DOCS_KEY];
  }

  if (req.session.data && Array.isArray(req.session.data[WORKSHOP_DOCS_KEY])) {
    req.session[WORKSHOP_DOCS_KEY] = req.session.data[WORKSHOP_DOCS_KEY];
    return req.session[WORKSHOP_DOCS_KEY];
  }

  return [];
}

function getIssueReportDocuments(req) {
  if (Array.isArray(req.session[ISSUE_REPORT_DOCS_KEY])) {
    return req.session[ISSUE_REPORT_DOCS_KEY];
  }

  if (req.session.data && Array.isArray(req.session.data[ISSUE_REPORT_DOCS_KEY])) {
    req.session[ISSUE_REPORT_DOCS_KEY] = req.session.data[ISSUE_REPORT_DOCS_KEY];
    return req.session[ISSUE_REPORT_DOCS_KEY];
  }

  return [];
}

function getUploadedDocumentsFromFileData(req) {
  let uploadedDocuments = [];

  if (req.session.data && req.session.data.fileData) {
    try {
      const fileData = typeof req.session.data.fileData === 'string'
        ? JSON.parse(req.session.data.fileData)
        : req.session.data.fileData;

      if (Array.isArray(fileData)) {
        uploadedDocuments = fileData.map((file) => {
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
      }
    } catch (e) {
      uploadedDocuments = [];
    }
  }

  return uploadedDocuments;
}

function mergeWorkshopDocuments(req) {
  const existingDocuments = Array.isArray(req.session[WORKSHOP_DOCS_KEY])
    ? req.session[WORKSHOP_DOCS_KEY]
    : [];
  const currentBatch = getUploadedDocumentsFromFileData(req);
  const nowIso = new Date().toISOString();

  const merged = [...existingDocuments];
  currentBatch.forEach((doc) => {
    const existingIndex = merged.findIndex(
      (item) => item.filename === doc.filename || (item.originalname === doc.originalname && item.size === doc.size)
    );

    if (existingIndex === -1) {
      merged.push({
        ...doc,
        uploadedAt: nowIso
      });
    } else if (!merged[existingIndex].uploadedAt) {
      merged[existingIndex].uploadedAt = nowIso;
    }
  });

  req.session[WORKSHOP_DOCS_KEY] = merged;
  if (req.session.data) {
    req.session.data[WORKSHOP_DOCS_KEY] = merged;
  }

  return merged;
}

function mergeIssueReportDocuments(req) {
  const existingDocuments = Array.isArray(req.session[ISSUE_REPORT_DOCS_KEY])
    ? req.session[ISSUE_REPORT_DOCS_KEY]
    : [];
  const currentBatch = getUploadedDocumentsFromFileData(req);
  const nowIso = new Date().toISOString();

  const merged = [...existingDocuments];
  currentBatch.forEach((doc) => {
    const existingIndex = merged.findIndex(
      (item) => item.filename === doc.filename || (item.originalname === doc.originalname && item.size === doc.size)
    );

    if (existingIndex === -1) {
      merged.push({
        ...doc,
        uploadedAt: nowIso
      });
    } else if (!merged[existingIndex].uploadedAt) {
      merged[existingIndex].uploadedAt = nowIso;
    }
  });

  req.session[ISSUE_REPORT_DOCS_KEY] = merged;
  if (req.session.data) {
    req.session.data[ISSUE_REPORT_DOCS_KEY] = merged;
  }

  return merged;
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

function removeIssueReportDocumentByFilename(req, filename) {
  if (!filename) return;

  const existingDocuments = Array.isArray(req.session[ISSUE_REPORT_DOCS_KEY])
    ? req.session[ISSUE_REPORT_DOCS_KEY]
    : [];
  const updatedDocuments = existingDocuments.filter((doc) => doc.filename !== filename);
  req.session[ISSUE_REPORT_DOCS_KEY] = updatedDocuments;
  if (updatedDocuments.length === 0) {
    req.session.gw2v4ReportIssued = false;
  }

  if (req.session.data) {
    req.session.data[ISSUE_REPORT_DOCS_KEY] = updatedDocuments;

    const fileData = parseFileData(req);
    const updatedFileData = fileData.filter((file) => file.id !== filename);
    req.session.data.fileData = updatedFileData;
  }
}

function removeWorkshopDocumentByFilename(req, filename) {
  if (!filename) return;

  const existingDocuments = Array.isArray(req.session[WORKSHOP_DOCS_KEY])
    ? req.session[WORKSHOP_DOCS_KEY]
    : [];
  const updatedDocuments = existingDocuments.filter((doc) => doc.filename !== filename);
  req.session[WORKSHOP_DOCS_KEY] = updatedDocuments;

  if (req.session.data) {
    req.session.data[WORKSHOP_DOCS_KEY] = updatedDocuments;

    const fileData = parseFileData(req);
    const updatedFileData = fileData.filter((file) => file.id !== filename);
    req.session.data.fileData = updatedFileData;
  }
}

function findIssueReportDocumentByFilename(req, filename) {
  if (!filename) return null;

  const storedDocuments = Array.isArray(req.session[ISSUE_REPORT_DOCS_KEY])
    ? req.session[ISSUE_REPORT_DOCS_KEY]
    : [];
  const storedMatch = storedDocuments.find((doc) => doc.filename === filename);
  if (storedMatch) return storedMatch;

  const currentBatch = getUploadedDocumentsFromFileData(req);
  return currentBatch.find((doc) => doc.filename === filename) || null;
}

function findWorkshopDocumentByFilename(req, filename) {
  if (!filename) return null;

  const storedDocuments = Array.isArray(req.session[WORKSHOP_DOCS_KEY])
    ? req.session[WORKSHOP_DOCS_KEY]
    : [];
  const storedMatch = storedDocuments.find((doc) => doc.filename === filename);
  if (storedMatch) return storedMatch;

  const currentBatch = getUploadedDocumentsFromFileData(req);
  return currentBatch.find((doc) => doc.filename === filename) || null;
}

function hasProceduralAndConsultationDocuments(req) {
  const proceduralDocs = Array.isArray(req.session.gw2v4ProceduralDocuments)
    ? req.session.gw2v4ProceduralDocuments
    : null;
  const consultationDocs = Array.isArray(req.session.gw2v4ConsultationDocuments)
    ? req.session.gw2v4ConsultationDocuments
    : null;

  if (proceduralDocs && consultationDocs) {
    return proceduralDocs.length > 0 && consultationDocs.length > 0;
  }

  // v4 template currently includes both sections with seeded document rows.
  return true;
}

function getGateway2Status(req, workshopDocuments) {
  if (req.session.gw2v4ReportIssued) {
    return {
      text: 'Ready for Gateway 3',
      classes: 'govuk-tag--blue'
    };
  }

  if (workshopDocuments.length > 0) {
    return {
      text: 'Gateway 2 awaiting workshop',
      classes: 'govuk-tag--yellow'
    };
  }

  if (hasProceduralAndConsultationDocuments(req)) {
    return {
      text: 'Gateway 2 validation',
      classes: 'govuk-tag--turquoise'
    };
  }

  return {
    text: null,
    classes: null
  };
}

function buildGateway2ViewModel(req, notificationMessage = '') {
  const documents = getGateway2Documents(req).map(buildDocumentForView);
  const proceduralDocuments = documents.filter((doc) => doc.category === 'procedural');
  const consultationDocuments = documents.filter((doc) => doc.category === 'consultation');
  const additionalDocuments = documents.filter((doc) => doc.category === 'additional');
  const gateway2DocumentsCount = proceduralDocuments.length + consultationDocuments.length + additionalDocuments.length;
  const workshopDocuments = getUploadedDocuments(req);
  const workshopDocumentsForDisplay = workshopDocuments.map((doc) => ({
    ...doc,
    uploadedAtDisplay: formatTimestampForDisplay(doc.uploadedAt)
  }));
  const issueReportDocuments = getIssueReportDocuments(req);
  const issueReportDocumentsForDisplay = issueReportDocuments.map((doc) => ({
    ...doc,
    uploadedAtDisplay: formatTimestampForDisplay(doc.uploadedAt)
  }));
  const gateway2Status = getGateway2Status(req, workshopDocuments);
  const hearings = Array.isArray(req.session.hearings) ? req.session.hearings : [];

  const pageState = {
    hasWorkshopDocuments: workshopDocuments.length > 0,
    hasIssueReportDocuments: issueReportDocuments.length > 0,
    hasHearings: hearings.length > 0,
    reportIssued: !!req.session.gw2v4ReportIssued,
    statusText: gateway2Status.text,
    statusClasses: gateway2Status.classes
  };

  return {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    planTitle: req.session.data?.planTitle || req.session.planTitle || '',
    notificationMessage,
    gateway2EstimatedDate: formatDateForDisplay(req.session.gateway2EstimatedDate),
    gateway2ActualDate: formatDateForDisplay(req.session.gateway2ActualDate),
    gateway2ValidDate: formatDateForDisplay(req.session.gateway2ValidDate),
    gateway2WorkshopVenue: req.session.gateway2WorkshopVenue || '',
    gateway2WorkshopDate: formatDateForDisplay(req.session.gateway2WorkshopDate),
    gateway2AssessorName: req.session.gateway2AssessorName || '-',
    gateway2AssessorAppointmentDate: formatDateForDisplay(req.session.gateway2AssessorAppointmentDate),
    gateway2ReportIssuedDate: formatDateForDisplay(req.session.gateway2ReportIssuedDate),
    gateway2ReportPublishedDate: formatDateForDisplay(req.session.gateway2ReportPublishedDate),
    hearings,
    uploadedDocuments: workshopDocumentsForDisplay,
    workshopDocumentsSummary: {
      count: workshopDocumentsForDisplay.length,
      latestUploadedAtDisplay: workshopDocumentsForDisplay.length ? workshopDocumentsForDisplay[workshopDocumentsForDisplay.length - 1].uploadedAtDisplay : '-',
      hasDocuments: workshopDocumentsForDisplay.length > 0
    },
    issueReportDocuments: issueReportDocumentsForDisplay,
    issueReportSummary: {
      count: issueReportDocumentsForDisplay.length,
      latestUploadedAtDisplay: issueReportDocumentsForDisplay.length ? issueReportDocumentsForDisplay[issueReportDocumentsForDisplay.length - 1].uploadedAtDisplay : '-',
      hasDocuments: issueReportDocumentsForDisplay.length > 0
    },
    gateway2DocumentsSummary: {
      count: gateway2DocumentsCount,
      hasDocuments: gateway2DocumentsCount > 0
    },
    proceduralDocuments,
    consultationDocuments,
    additionalDocuments,
    pageState,
    headerStatusText: gateway2Status.text,
    headerStatusClasses: gateway2Status.classes
  };
}

router.use((req, res, next) => {
  res.locals.basePath = req.baseUrl || '';
  
  // Preserve workshop/report docs before prototype kit potentially overwrites them
  if (!req.session._preservedDocs) {
    req.session._preservedDocs = {};
  }
  if (req.session[WORKSHOP_DOCS_KEY]) {
    req.session._preservedDocs[WORKSHOP_DOCS_KEY] = JSON.parse(JSON.stringify(req.session[WORKSHOP_DOCS_KEY]));
  }
  if (req.session[ISSUE_REPORT_DOCS_KEY]) {
    req.session._preservedDocs[ISSUE_REPORT_DOCS_KEY] = JSON.parse(JSON.stringify(req.session[ISSUE_REPORT_DOCS_KEY]));
  }
  
  // Wrap res.json to restore docs after responses
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    if (req.session._preservedDocs[WORKSHOP_DOCS_KEY] && !req.session[WORKSHOP_DOCS_KEY]) {
      req.session[WORKSHOP_DOCS_KEY] = req.session._preservedDocs[WORKSHOP_DOCS_KEY];
    }
    if (req.session._preservedDocs[ISSUE_REPORT_DOCS_KEY] && !req.session[ISSUE_REPORT_DOCS_KEY]) {
      req.session[ISSUE_REPORT_DOCS_KEY] = req.session._preservedDocs[ISSUE_REPORT_DOCS_KEY];
    }
    return originalJson(data);
  };
  
  next();
});

router.get('/gateway-2', (req, res) => {
  console.log('\n=== GET /gateway-2 ===');
  console.log('Query params:', req.query);
  console.log('Session state:');
  console.log('  req.session[WORKSHOP_DOCS_KEY]:', req.session[WORKSHOP_DOCS_KEY]);
  console.log('  req.session.gateway2WorkshopDate:', req.session.gateway2WorkshopDate);
  console.log('  req.session.gw2v4ReportIssued:', req.session.gw2v4ReportIssued);
  
  let notificationMessage = req.session.notificationMessage || '';
  if (req.query.issueReportSubmitted === '1') {
    notificationMessage = ISSUE_REPORT_SUCCESS_MESSAGE;
  }
  delete req.session.notificationMessage;

  res.render('projects/back-office/manage/GW2/v4/gateway-2', buildGateway2ViewModel(req, notificationMessage));
  req.session.save();
});

router.get('/gateway-2.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
});

router.get('/gateway-2-documents', (req, res) => {
  res.render('projects/back-office/manage/GW2/v4/gateway-2-documents', buildGateway2ViewModel(req));
});

router.get('/gateway-2-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
});

router.get('/document/:documentId', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const viewDocument = buildDocumentForView(document);
  const versions = (Array.isArray(document.versions) ? document.versions : []).map((version) => ({
    ...version,
    uploadedAtDisplay: formatTimestampForDisplay(version.uploadedAt)
  })).reverse();

  res.render('projects/back-office/manage/GW2/v4/document-detail', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: viewDocument,
    versions
  });
});

router.get('/document/:documentId/upload-new-version', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const latestVersion = getLatestDocumentVersion(document);
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  res.render('projects/back-office/manage/GW2/v4/upload-new-version', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    document: buildDocumentForView(document),
    nextVersionNumber,
    values: {
      fileName: req.body && req.body.fileName ? req.body.fileName : ''
    },
    errors: null
  });
});

router.post('/document/:documentId/upload-new-version', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const rawFileName = (req.body.fileName || '').trim();
  const latestVersion = getLatestDocumentVersion(document);
  const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

  if (!rawFileName) {
    return res.render('projects/back-office/manage/GW2/v4/upload-new-version', {
      caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
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
    res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}`);
  });
});

router.get('/document/:documentId/review/outcome', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const reviewDraft = getReviewDraft(req);

  res.render('projects/back-office/manage/GW2/v4/review-outcome', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
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
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const reviewOutcome = (req.body.reviewOutcome || '').trim();

  if (!reviewOutcome) {
    return res.render('projects/back-office/manage/GW2/v4/review-outcome', {
      caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
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
      res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/reason`);
    });
  }

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/check-answers`);
  });
});

router.get('/document/:documentId/review/reason', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const reviewDraft = getReviewDraft(req);
  if (reviewDraft.documentId !== document.id || (reviewDraft.reviewOutcome !== 'invalid' && reviewDraft.reviewOutcome !== 'incomplete')) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/outcome`);
  }

  res.render('projects/back-office/manage/GW2/v4/review-reason', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
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
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const reviewDraft = getReviewDraft(req);
  if (reviewDraft.documentId !== document.id || (reviewDraft.reviewOutcome !== 'invalid' && reviewDraft.reviewOutcome !== 'incomplete')) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/outcome`);
  }

  const reviewReason = (req.body.reviewReason || '').trim();

  if (!reviewReason) {
    return res.render('projects/back-office/manage/GW2/v4/review-reason', {
      caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
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
    res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/check-answers`);
  });
});

router.get('/document/:documentId/review/check-answers', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const reviewDraft = getReviewDraft(req);
  if (!reviewDraft.reviewOutcome || reviewDraft.documentId !== document.id) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/outcome`);
  }

  if ((reviewDraft.reviewOutcome === 'invalid' || reviewDraft.reviewOutcome === 'incomplete') && !reviewDraft.reviewReason) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/reason`);
  }

  const outcomeLabelMap = {
    valid: 'Valid',
    invalid: 'Invalid',
    incomplete: 'Incomplete'
  };
  const latestVersion = getLatestDocumentVersion(document);

  res.render('projects/back-office/manage/GW2/v4/review-check-answers', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
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
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  }

  const reviewDraft = getReviewDraft(req);
  if (!reviewDraft.reviewOutcome || reviewDraft.documentId !== document.id) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/document/${document.id}/review/outcome`);
  }

  const statusMap = {
    valid: 'Validated',
    invalid: 'Invalid',
    incomplete: 'Incomplete'
  };
  const notificationOutcomeMap = {
    valid: 'valid',
    invalid: 'invalid',
    incomplete: 'incomplete'
  };

  document.status = statusMap[reviewDraft.reviewOutcome] || 'Validated';
  document.review = {
    outcome: reviewDraft.reviewOutcome,
    reason: reviewDraft.reviewReason || '',
    reviewedAt: new Date().toISOString()
  };

  clearReviewDraft(req);
  req.session.notificationMessage = `${document.title} marked as ${notificationOutcomeMap[document.review.outcome] || 'valid'} and notification sent to LPA`;

  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
  });
});

router.get('/upload/v1/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;

  res.render('projects/back-office/manage/GW2/v4/upload/v1/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments: getUploadedDocuments(req),
    returnTo,
    returnPath: getReturnPath(returnTo)
  });
});

router.get('/upload/v1/upload-bo.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/upload/v1/upload-bo');
});

router.post('/upload/v1/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v4/upload/v1/check-answers', returnTo));
  });
});

router.get('/upload/v1/check-answers', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  const transientDocuments = getUploadedDocumentsFromFileData(req);
  const uploadedDocuments = transientDocuments.length > 0
    ? transientDocuments
    : getUploadedDocuments(req);

  res.render('projects/back-office/manage/GW2/v4/upload/v1/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments,
    totalFiles: uploadedDocuments.length,
    returnTo
  });
});

router.get('/upload/v1/check-answers.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/upload/v1/check-answers');
});

router.get('/upload/v1/remove-confirm', (req, res) => {
  const filename = req.query.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  const document = findWorkshopDocumentByFilename(req, filename);

  if (!filename || !document) {
    return res.redirect(getReturnPath(returnTo));
  }

  res.render('projects/back-office/manage/GW2/v4/upload/v1/remove-confirm', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    filename,
    returnTo,
    documentName: document.originalname
  });
});

router.post('/upload/v1/remove-confirm', (req, res) => {
  const filename = req.body.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  const action = req.body.action || 'cancel';

  if (action === 'remove') {
    removeWorkshopDocumentByFilename(req, filename);
  }

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.get('/upload/v1/clear-uploads', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  if (req.session && req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
    delete req.session.data[WORKSHOP_DOCS_KEY];
  }
  if (req.session) {
    delete req.session[WORKSHOP_DOCS_KEY];
  }

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v4/upload/v1/upload-bo', returnTo));
  });
});

router.post('/upload/v1/check-answers', (req, res) => {
  console.log('\n=== POST /upload/v1/check-answers ===');
  console.log('req.session.data.fileData:', req.session.data?.fileData);
  console.log('req.session[WORKSHOP_DOCS_KEY] before merge:', req.session[WORKSHOP_DOCS_KEY]);

  const returnTo = getReturnTo(req);

  req.session.gw2v4UploadReturnTo = returnTo;
  if (!req.session.data) req.session.data = {};
  const currentBatch = getUploadedDocumentsFromFileData(req);
  const uploadedCount = currentBatch.length;
  console.log('currentBatch from fileData:', currentBatch);
  mergeWorkshopDocuments(req);
  console.log('req.session[WORKSHOP_DOCS_KEY] after merge:', req.session[WORKSHOP_DOCS_KEY]);

  const safeCount = uploadedCount > 0 ? uploadedCount : 0;
  req.session.notificationMessage = `${safeCount} workshop document${safeCount === 1 ? '' : 's'} uploaded`;
  if (safeCount > 0) {
    applyStatusEvent(req, 'GW2_SUBMISSION_RECEIVED', { source: 'GW2 workshop docs check answers POST' });
  }

  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.get('/upload/v2/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;

  res.render('projects/back-office/manage/GW2/v4/upload/v2/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments: getIssueReportDocuments(req),
    returnTo,
    returnPath: getReturnPath(returnTo)
  });
});

router.get('/upload/v2/upload-bo.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/upload/v2/upload-bo');
});

router.post('/upload/v2/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v4/upload/v2/check-answers', returnTo));
  });
});

router.get('/upload/v2/check-answers', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  const transientDocuments = getUploadedDocumentsFromFileData(req);
  const storedDocuments = getIssueReportDocuments(req);
  const uploadedDocumentsRaw = transientDocuments.length > 0
    ? transientDocuments.map((doc) => ({
      ...doc,
      uploadedAt: doc.uploadedAt || new Date().toISOString()
    }))
    : storedDocuments;

  const uploadedDocuments = uploadedDocumentsRaw.map((doc) => ({
    ...doc,
    uploadedAtDisplay: formatTimestampForDisplay(doc.uploadedAt)
  }));

  res.render('projects/back-office/manage/GW2/v4/upload/v2/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments,
    totalFiles: uploadedDocuments.length,
    returnTo
  });
});

router.get('/upload/v2/check-answers.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/upload/v2/check-answers');
});

router.get('/upload/v2/remove-confirm', (req, res) => {
  const filename = req.query.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  const document = findIssueReportDocumentByFilename(req, filename);

  if (!filename || !document) {
    return res.redirect(getReturnPath(returnTo));
  }

  res.render('projects/back-office/manage/GW2/v4/upload/v2/remove-confirm', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    filename,
    returnTo,
    documentName: document.originalname
  });
});

router.post('/upload/v2/remove-confirm', (req, res) => {
  const filename = req.body.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  const action = req.body.action || 'cancel';

  if (action === 'remove') {
    removeIssueReportDocumentByFilename(req, filename);
  }

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.get('/upload/v2/clear-uploads', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;

  if (req.session && req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
    delete req.session.data[ISSUE_REPORT_DOCS_KEY];
  }
  if (req.session) {
    delete req.session[ISSUE_REPORT_DOCS_KEY];
    req.session.gw2v4ReportIssued = false;
  }

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v4/upload/v2/upload-bo', returnTo));
  });
});

router.post('/upload/v2/check-answers', (req, res) => {
  console.log('\n=== POST /upload/v2/check-answers (Issue Report) ===');
  console.log('BEFORE merge:');
  console.log('  req.session[WORKSHOP_DOCS_KEY]:', req.session[WORKSHOP_DOCS_KEY]);
  console.log('  req.session.gateway2WorkshopDate:', req.session.gateway2WorkshopDate);
  console.log('  req.session.gw2v4ReportIssued:', req.session.gw2v4ReportIssued);
  
  // Preserve workshop docs in case prototype kit clears them
  const preservedWorkshopDocs = req.session[WORKSHOP_DOCS_KEY];
  
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  if (!req.session.data) req.session.data = {};
  
  // Restore workshop docs if they got wiped
  if (preservedWorkshopDocs && !req.session[WORKSHOP_DOCS_KEY]) {
    req.session[WORKSHOP_DOCS_KEY] = preservedWorkshopDocs;
  }
  
  mergeIssueReportDocuments(req);
  req.session.gw2v4ReportIssued = true;
  applyStatusEvent(req, 'GW2_REPORT_ISSUED', { source: 'GW2 issue report check answers POST' });
  
  // Ensure workshop docs are preserved in both locations
  if (preservedWorkshopDocs) {
    req.session[WORKSHOP_DOCS_KEY] = preservedWorkshopDocs;
    if (req.session.data) {
      req.session.data[WORKSHOP_DOCS_KEY] = preservedWorkshopDocs;
    }
  }
  
  console.log('AFTER merge:');
  console.log('  req.session[WORKSHOP_DOCS_KEY]:', req.session[WORKSHOP_DOCS_KEY]);
  console.log('  req.session.gateway2WorkshopDate:', req.session.gateway2WorkshopDate);
  console.log('  req.session.gw2v4ReportIssued:', req.session.gw2v4ReportIssued);
  
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;

  req.session.save(() => {
    res.redirect(`${getReturnPath(returnTo)}?issueReportSubmitted=1`);
  });
});

router.use('/', require('./_add-workshop'));
router.use('/', require('./_cancel-workshop'));

module.exports = router;
