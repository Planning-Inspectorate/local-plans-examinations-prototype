const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const WORKSHOP_DOCS_KEY = 'gw2v3WorkshopDocuments';
const ISSUE_REPORT_DOCS_KEY = 'gw2v4IssueReportDocuments';
const GW2_DOCUMENTS_KEY = 'gw2v4Documents';
const GW2_V3_SELECTED_TYPE_KEY = 'gw2v4UploadV3DocumentType';
const GW2_V3_UPLOADED_DOCS_KEY = 'gw2v4UploadV3Documents';
const GW2_V3_RECEIVED_DATE_KEY = 'gw2v4UploadV3ReceivedDate';
const GW2_V3_REPLACE_DOCUMENT_ID_KEY = 'gw2v4UploadV3ReplaceDocumentId';
const ISSUE_REPORT_SUCCESS_MESSAGE = 'Gateway 2 report issued';

const RETURN_TO_FALLBACK = 'gateway-2';
const RETURN_TO_MAP = {
  'gateway-2': '/projects/back-office/manage/GW2/v4/gateway-2',
  'gateway-2-alt': '/projects/back-office/manage/GW2/v4/gateway-2-alt',
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
  if (!dateString || dateString === 'Not provided') return 'Not provided';

  const slashParsed = DateTime.fromFormat(dateString, 'd/M/yyyy');
  if (slashParsed.isValid) {
    return slashParsed.toFormat('d MMMM yyyy');
  }

  return dateString;
}

function formatTimestampForDisplay(timestamp) {
  if (!timestamp || timestamp === 'Not provided') return 'Not provided';

  const parsed = DateTime.fromISO(timestamp);
  if (!parsed.isValid) return 'Not provided';

  return parsed.toFormat('d MMMM yyyy');
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultGateway2Documents() {
  const seedDate = '2026-05-20T10:00:00.000Z';

  return [
    {
      id: 'gateway-2-covering-letter',
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
      id: 'draft-statement-of-compliance',
      category: 'procedural',
      title: 'Draft statement of compliance',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'GW2_compliance_statement.docx', uploadedAt: seedDate }]
    },
    {
      id: 'draft-statement-of-soundness',
      category: 'procedural',
      title: 'Draft statement of soundness',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'GW2_soundness_statement.docx', uploadedAt: seedDate }]
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
      versions: [{ versionNumber: 1, fileName: 'scoping_summary.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'gateway-1-self-assessment',
      category: 'consultation',
      title: 'Gateway 1 - Self assessment of readiness',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'self_assessment.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-full-pack',
      category: 'consultation',
      title: 'Consultation on proposed local plan content and evidence documents',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'proposed_plan_full.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'consultation-summary-pack',
      category: 'consultation',
      title: 'Summary of consultation on proposed local plan content and evidence documents',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'proposed_plan_summary.pdf', uploadedAt: seedDate }]
    },
    {
      id: 'subsequent-work-draft-plan',
      category: 'additional',
      title: 'Subsequent work towards a draft plan',
      status: 'Received',
      versions: [{ versionNumber: 1, fileName: 'scoping_feedback_summary.pdf', uploadedAt: seedDate }]
    }
  ];
}

function getGateway2Documents(req) {
  if (Array.isArray(req.session[GW2_DOCUMENTS_KEY])) {
    return req.session[GW2_DOCUMENTS_KEY];
  }

  const seededDocuments = getDefaultGateway2Documents();
  req.session[GW2_DOCUMENTS_KEY] = cloneDeep(seededDocuments);
  return req.session[GW2_DOCUMENTS_KEY];
}

function getGateway2DocumentById(req, documentId) {
  const documents = getGateway2Documents(req);
  return documents.find((doc) => doc.id === documentId) || null;
}

function getLatestGateway2DocumentVersion(document) {
  if (!document || !Array.isArray(document.versions) || document.versions.length === 0) {
    return null;
  }

  return document.versions[document.versions.length - 1];
}

function getGateway2DocumentStatusTagClass(status) {
  if (status === 'Validated') return 'govuk-tag govuk-tag--green';
  if (status === 'Invalid') return 'govuk-tag govuk-tag--red';
  if (status === 'Incomplete') return 'govuk-tag govuk-tag--blue';
  if (status === 'Ready to validate') return 'govuk-tag govuk-tag--yellow';
  return 'govuk-tag govuk-tag--grey';
}

function buildGateway2DocumentForView(document) {
  const latestVersion = getLatestGateway2DocumentVersion(document);
  const isV3UploadedDocument = document.id && document.id.startsWith('v3-upload-');
  const latestFileHref = latestVersion && latestVersion.storedFilename
    ? `/projects/back-office/manage/documents/download/${encodeURIComponent(latestVersion.storedFilename)}`
    : '';

  return {
    ...document,
    currentVersionNumber: latestVersion ? latestVersion.versionNumber : '-',
    latestFileName: latestVersion ? latestVersion.fileName : '-',
    latestUploadedAtDisplay: latestVersion ? formatTimestampForDisplay(latestVersion.uploadedAt) : 'Not provided',
    receivedDateDisplay: document.receivedDate ? formatDateForDisplay(document.receivedDate) : '',
    categoryLabel: getV3DocumentTypeLabel(document.category),
    isV3UploadedDocument,
    latestFileHref,
    fileChangeUrl: isV3UploadedDocument ? `/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(document.id)}/file` : '',
    categoryChangeUrl: isV3UploadedDocument ? `/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(document.id)}/category` : '',
    receivedDateChangeUrl: isV3UploadedDocument ? `/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(document.id)}/date-received` : '',
    statusTagClass: getGateway2DocumentStatusTagClass(document.status || 'Received')
  };
}

function normalizeV3DocumentType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'procedural') return 'procedural';
  if (normalized === 'consultation') return 'consultation';
  if (normalized === 'additional') return 'additional';
  return '';
}

function getV3DocumentTypeLabel(value) {
  const normalized = normalizeV3DocumentType(value);
  if (normalized === 'procedural') return 'Procedural';
  if (normalized === 'consultation') return 'Consultation';
  if (normalized === 'additional') return 'Additional';
  return 'Not provided';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildV3UploadedDocumentRows(documents) {
  return documents.map((doc) => {
    const downloadHref = `/projects/back-office/manage/documents/download/${encodeURIComponent(doc.filename)}`;
    const viewHref = `/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(getV3UploadedDocumentId(doc))}`;
    const originalName = escapeHtml(doc.originalname);

    return {
      key: { text: 'Uploaded document' },
      value: { html: `<a class="govuk-hint" href="${downloadHref}">${originalName}</a>` },
      actions: {
        items: [
          {
            href: viewHref,
            text: 'View'
          }
        ]
      }
    };
  });
}

function getV3UploadedDocumentId(doc) {
  return `v3-upload-${doc.filename}`;
}

function upsertV3UploadedDocumentInGateway2Documents(req, doc, category) {
  const documents = getGateway2Documents(req);
  const documentId = getV3UploadedDocumentId(doc);
  const uploadedAt = doc.uploadedAt || new Date().toISOString();
  const existingDocument = documents.find((document) => document.id === documentId);
  const uploadedDocument = {
    id: documentId,
    category,
    title: 'Uploaded document',
    status: 'Received',
    receivedDate: doc.receivedDate || '',
    versions: [
      {
        versionNumber: 1,
        fileName: doc.originalname,
        uploadedAt,
        storedFilename: doc.filename
      }
    ]
  };

  if (existingDocument) {
    Object.assign(existingDocument, uploadedDocument);
  } else {
    documents.push(uploadedDocument);
  }

  req.session[GW2_DOCUMENTS_KEY] = documents;
}

function removeGateway2DocumentById(req, documentId) {
  const documents = getGateway2Documents(req);
  req.session[GW2_DOCUMENTS_KEY] = documents.filter((document) => document.id !== documentId);
}

function syncV3UploadedDocumentsToGateway2Documents(req) {
  const docsByCategory = getV3UploadedDocumentsByCategory(req);

  ['procedural', 'consultation', 'additional'].forEach((category) => {
    docsByCategory[category].forEach((doc) => {
      upsertV3UploadedDocumentInGateway2Documents(req, doc, category);
    });
  });
}

function updateV3UploadedDocumentCategory(req, documentId, newCategory) {
  const normalizedCategory = normalizeV3DocumentType(newCategory);
  if (!documentId || !normalizedCategory) return false;

  const docsByCategory = getV3UploadedDocumentsByCategory(req);
  let matchingDocument = null;

  ['procedural', 'consultation', 'additional'].forEach((category) => {
    docsByCategory[category] = docsByCategory[category].filter((doc) => {
      if (getV3UploadedDocumentId(doc) === documentId) {
        matchingDocument = doc;
        return false;
      }

      return true;
    });
  });

  if (!matchingDocument) return false;

  docsByCategory[normalizedCategory].push(matchingDocument);
  req.session[GW2_V3_UPLOADED_DOCS_KEY] = docsByCategory;
  upsertV3UploadedDocumentInGateway2Documents(req, matchingDocument, normalizedCategory);
  return true;
}

function updateV3UploadedDocumentReceivedDate(req, documentId, receivedDate) {
  if (!documentId) return false;

  const documents = getGateway2Documents(req);
  const existingDocument = documents.find((document) => document.id === documentId);
  if (existingDocument) {
    existingDocument.receivedDate = receivedDate || '';
    req.session[GW2_DOCUMENTS_KEY] = documents;
  }

  const docsByCategory = getV3UploadedDocumentsByCategory(req);
  let matchingDocument = null;
  let matchingCategory = '';

  ['procedural', 'consultation', 'additional'].forEach((category) => {
    docsByCategory[category].forEach((doc) => {
      if (getV3UploadedDocumentId(doc) === documentId) {
        matchingDocument = doc;
        matchingCategory = category;
      }
    });
  });

  if (!matchingDocument || !matchingCategory) return !!existingDocument;

  matchingDocument.receivedDate = receivedDate || '';
  req.session[GW2_V3_UPLOADED_DOCS_KEY] = docsByCategory;
  upsertV3UploadedDocumentInGateway2Documents(req, matchingDocument, matchingCategory);
  return true;
}

function replaceV3UploadedDocumentFile(req, documentId, category) {
  const normalizedCategory = normalizeV3DocumentType(category);
  if (!documentId || !normalizedCategory) return null;

  const replacementBatch = getUploadedDocumentsFromFileData(req);
  if (replacementBatch.length === 0) return null;

  const docsByCategory = getV3UploadedDocumentsByCategory(req);
  let existingDocument = null;

  ['procedural', 'consultation', 'additional'].forEach((storedCategory) => {
    docsByCategory[storedCategory] = docsByCategory[storedCategory].filter((doc) => {
      if (getV3UploadedDocumentId(doc) === documentId) {
        existingDocument = doc;
        return false;
      }

      return true;
    });
  });

  const replacementDocument = {
    ...replacementBatch[0],
    uploadedAt: new Date().toISOString(),
    receivedDate: existingDocument && existingDocument.receivedDate
      ? existingDocument.receivedDate
      : getV3ReceivedDate(req)
  };

  docsByCategory[normalizedCategory].push(replacementDocument);
  req.session[GW2_V3_UPLOADED_DOCS_KEY] = docsByCategory;
  removeGateway2DocumentById(req, documentId);
  upsertV3UploadedDocumentInGateway2Documents(req, replacementDocument, normalizedCategory);

  return getV3UploadedDocumentId(replacementDocument);
}

function getV3DefaultReceivedDate() {
  return DateTime.now().toFormat('d/M/yyyy');
}

function getV3ReceivedDate(req) {
  return req.session[GW2_V3_RECEIVED_DATE_KEY] || getV3DefaultReceivedDate();
}

function getV3DateInputValues(dateString) {
  const parsed = DateTime.fromFormat(dateString || '', 'd/M/yyyy');

  if (!parsed.isValid) {
    return { day: '', month: '', year: '' };
  }

  return {
    day: parsed.toFormat('d'),
    month: parsed.toFormat('M'),
    year: parsed.toFormat('yyyy')
  };
}

function getV3DateFromValues(day, month, year) {
  if (!day || !month || !year) return '';

  const parsed = DateTime.fromObject({
    day: Number(day),
    month: Number(month),
    year: Number(year)
  });

  return parsed.isValid ? parsed.toFormat('d/M/yyyy') : '';
}

function getV3UploadedDocumentsByCategory(req) {
  const initial = {
    procedural: [],
    consultation: [],
    additional: []
  };

  if (!req.session[GW2_V3_UPLOADED_DOCS_KEY] || typeof req.session[GW2_V3_UPLOADED_DOCS_KEY] !== 'object') {
    req.session[GW2_V3_UPLOADED_DOCS_KEY] = initial;
    return req.session[GW2_V3_UPLOADED_DOCS_KEY];
  }

  const stored = req.session[GW2_V3_UPLOADED_DOCS_KEY];
  if (!Array.isArray(stored.procedural)) stored.procedural = [];
  if (!Array.isArray(stored.consultation)) stored.consultation = [];
  if (!Array.isArray(stored.additional)) stored.additional = [];
  return stored;
}

function mergeV3UploadedDocuments(req, documentType) {
  const normalizedType = normalizeV3DocumentType(documentType);
  if (!normalizedType) return [];

  const docsByCategory = getV3UploadedDocumentsByCategory(req);
  const existingDocuments = docsByCategory[normalizedType];
  const currentBatch = getUploadedDocumentsFromFileData(req);
  const nowIso = new Date().toISOString();
  const receivedDate = getV3ReceivedDate(req);

  const merged = [...existingDocuments];
  currentBatch.forEach((doc) => {
    const existingIndex = merged.findIndex(
      (item) => item.filename === doc.filename || (item.originalname === doc.originalname && item.size === doc.size)
    );

    if (existingIndex === -1) {
      merged.push({
        ...doc,
        uploadedAt: nowIso,
        receivedDate
      });
    } else if (!merged[existingIndex].uploadedAt) {
      merged[existingIndex].uploadedAt = nowIso;
    } else if (!merged[existingIndex].receivedDate) {
      merged[existingIndex].receivedDate = receivedDate;
    }
  });

  docsByCategory[normalizedType] = merged;
  req.session[GW2_V3_UPLOADED_DOCS_KEY] = docsByCategory;
  merged.forEach((doc) => {
    upsertV3UploadedDocumentInGateway2Documents(req, doc, normalizedType);
  });

  return currentBatch;
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

function getGW3ReportDocuments(req) {
  if (Array.isArray(req.session.gw2v4ReportDocuments)) {
    return req.session.gw2v4ReportDocuments;
  }

  if (req.session.data && Array.isArray(req.session.data.gw2v4ReportDocuments)) {
    req.session.gw2v4ReportDocuments = req.session.data.gw2v4ReportDocuments;
    return req.session.gw2v4ReportDocuments;
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
  const state = req.session.gw2v4StatusState || 'none';

  if (state === 'gw3-submission' || req.session.gw2v4ReportIssued) {
    return {
      text: 'GW3 submission',
      classes: 'govuk-tag--blue'
    };
  }

  if (state === 'workshop-confirmed') {
    return {
      text: 'GW2 workshop confirmed',
      classes: 'govuk-tag--yellow'
    };
  }

  if (state === 'submission-received') {
    return {
      text: 'GW2 submitted',
      classes: 'govuk-tag--yellow'
    };
  }

  if (state === 'none') {
    return {
      text: 'GW2 submission',
      classes: 'govuk-tag--turquoise'
    };
  }

  if (workshopDocuments.length > 0) {
    return {
      text: 'GW2 submitted',
      classes: 'govuk-tag--yellow'
    };
  }

  if (hasProceduralAndConsultationDocuments(req)) {
    return {
      text: 'GW2 submitted',
      classes: 'govuk-tag--turquoise'
    };
  }

  return {
    text: null,
    classes: null
  };
}

function buildGateway2ViewModel(req, notificationMessage = '') {
  const workshopDocuments = getUploadedDocuments(req);
  const workshopDocumentsForDisplay = workshopDocuments.map((doc) => ({
    ...doc,
    uploadedAtDisplay: formatTimestampForDisplay(doc.uploadedAt)
  }));
  const issueReportDocuments = getIssueReportDocuments(req);
  const gateway2Documents = getGateway2Documents(req);
  const gw3ReportDocuments = getGW3ReportDocuments(req);
  const gateway2Status = getGateway2Status(req, workshopDocuments);
  const hearings = Array.isArray(req.session.hearings) ? req.session.hearings : [];
  const currentState = req.session.gw2v4StatusState || 'none';
  const showGateway2Documents = ['submission-received', 'workshop-confirmed', 'gw3-submission'].includes(currentState);

  const pageState = {
    hasWorkshopDocuments: workshopDocuments.length > 0,
    hasIssueReportDocuments: issueReportDocuments.length > 0,
    hasHearings: hearings.length > 0,
    reportIssued: !!req.session.gw2v4ReportIssued,
    statusText: gateway2Status.text,
    statusClasses: gateway2Status.classes
  };
footerLinks: [
  {
    text: 'GW2 submission',
    href: '/projects/back-office/manage/GW2/v4/set-status?state=none&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
  },
  {
    text: 'GW2 submitted',
    href: '/projects/back-office/manage/GW2/v4/set-status?state=submission-received&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
  },
  {
    text: 'GW2 workshop confirmed',
    href: '/projects/back-office/manage/GW2/v4/set-status?state=workshop-confirmed&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
  },
  {
    text: 'GW3 submission',
    href: '/projects/back-office/manage/GW2/v4/set-status?state=gw3-submission&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
  }
]
  return {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    planTitle: req.session.data?.planTitle || req.session.planTitle || '',
    notificationMessage,
    gateway2EstimatedDate: formatDateForDisplay(req.session.gateway2EstimatedDate),
    gateway2ActualDate: formatDateForDisplay(req.session.gateway2ActualDate),
    gateway2ValidDate: formatDateForDisplay(req.session.gateway2ValidDate),
    gateway2AssessorName: req.session.gateway2AssessorName || 'Not provided',
    gateway2AssessorAppointmentDate: formatDateForDisplay(req.session.gateway2AssessorAppointmentDate),
    gateway2ReportIssuedDate: formatDateForDisplay(req.session.gateway2ReportIssuedDate),
    gateway2ReportPublishedDate: formatDateForDisplay(req.session.gateway2ReportPublishedDate),
    hearings,
    uploadedDocuments: workshopDocumentsForDisplay,
    issueReportDocuments,
    pageState,
    headerStatusText: gateway2Status.text,
    headerStatusClasses: gateway2Status.classes,
    workshopDocumentsSummary: {
      count: workshopDocuments.length,
      hasDocuments: workshopDocuments.length > 0,
      latestUploadedAtDisplay: workshopDocuments.length > 0 ? formatTimestampForDisplay(workshopDocuments[workshopDocuments.length - 1].uploadedAt) : null
    },
    gateway2DocumentsSummary: {
      count: showGateway2Documents ? gateway2Documents.length : 0,
      hasDocuments: showGateway2Documents && gateway2Documents.length > 0
    },
    issueReportSummary: {
      count: issueReportDocuments.length,
      hasDocuments: issueReportDocuments.length > 0,
      latestUploadedAtDisplay: issueReportDocuments.length > 0 ? formatTimestampForDisplay(issueReportDocuments[issueReportDocuments.length - 1].uploadedAt) : null
    },
    footerLinks: [
      {
        text: 'GW2 submission',
        href: '/projects/back-office/manage/GW2/v4/set-status?state=none&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
      },
      {
        text: 'GW2 submitted',
        href: '/projects/back-office/manage/GW2/v4/set-status?state=submission-received&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
      },
      {
        text: 'GW2 workshop confirmed',
        href: '/projects/back-office/manage/GW2/v4/set-status?state=workshop-confirmed&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
      },
      {
        text: 'GW3 submission',
        href: '/projects/back-office/manage/GW2/v4/set-status?state=gw3-submission&returnUrl=/projects/back-office/manage/GW2/v4/gateway-2'
      }
    ],
    gw3ReportSummary: {
      count: gw3ReportDocuments.length,
      hasDocuments: gw3ReportDocuments.length > 0
    },
    currentState
  };
}

router.use((req, res, next) => {
  res.locals.basePath = req.baseUrl || '';
  next();
});

router.get('/gateway-2', (req, res) => {
  let notificationMessage = req.session.notificationMessage || '';
  if (req.query.issueReportSubmitted === '1') {
    notificationMessage = ISSUE_REPORT_SUCCESS_MESSAGE;
  }
  delete req.session.notificationMessage;

  res.render('projects/back-office/manage/GW2/v4/gateway-2', buildGateway2ViewModel(req, notificationMessage));
  req.session.save();
});

router.get('/gateway-2-documents', (req, res) => {
  syncV3UploadedDocumentsToGateway2Documents(req);
  const documents = getGateway2Documents(req).map(buildGateway2DocumentForView);
  const uploadedByCategory = getV3UploadedDocumentsByCategory(req);

  res.render('projects/back-office/manage/GW2/v4/gateway-2-documents', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    proceduralDocuments: documents.filter((doc) => doc.category === 'procedural'),
    consultationDocuments: documents.filter((doc) => doc.category === 'consultation'),
    additionalDocuments: documents.filter((doc) => doc.category === 'additional'),
    proceduralUploadedDocuments: uploadedByCategory.procedural,
    consultationUploadedDocuments: uploadedByCategory.consultation,
    additionalUploadedDocuments: uploadedByCategory.additional,
    proceduralUploadedDocumentRows: buildV3UploadedDocumentRows(uploadedByCategory.procedural),
    consultationUploadedDocumentRows: buildV3UploadedDocumentRows(uploadedByCategory.consultation),
    additionalUploadedDocumentRows: buildV3UploadedDocumentRows(uploadedByCategory.additional)
  });
});

router.get('/gateway-2-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
});

router.get('/document/:documentId', (req, res) => {
  syncV3UploadedDocumentsToGateway2Documents(req);
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document) {
    req.session.notificationMessage = 'Document not found';
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
  }

  if (document.id && document.id.startsWith('v3-upload-')) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(document.id)}`);
  }

  const viewDocument = buildGateway2DocumentForView(document);
  const versions = (Array.isArray(document.versions) ? document.versions : [])
    .map((version) => ({
      ...version,
      uploadedAtDisplay: formatTimestampForDisplay(version.uploadedAt),
      fileHref: version.storedFilename ? `/projects/back-office/manage/documents/download/${encodeURIComponent(version.storedFilename)}` : ''
    }))
    .reverse();

  res.render('projects/back-office/manage/GW2/v4/document-detail', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    document: viewDocument,
    versions
  });
});

router.get('/gateway-2.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
});

router.get('/upload/v3/document-type', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.session[GW2_V3_SELECTED_TYPE_KEY]);
  const returnUrl = req.query.returnUrl || '';

  res.render('projects/back-office/manage/GW2/v4/upload/v3/document-type', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    selectedType,
    returnUrl,
    errorMessage: req.query.error === '1' ? 'Select a document type' : ''
  });
});

router.post('/upload/v3/document-type', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.body.documentType);
  const returnUrl = req.body.returnUrl || '';
  if (!selectedType) {
    const errorUrl = returnUrl
      ? `/projects/back-office/manage/GW2/v4/upload/v3/document-type?error=1&returnUrl=${encodeURIComponent(returnUrl)}`
      : '/projects/back-office/manage/GW2/v4/upload/v3/document-type?error=1';
    return res.redirect(errorUrl);
  }

  req.session[GW2_V3_SELECTED_TYPE_KEY] = selectedType;

  req.session.save(() => {
    res.redirect(returnUrl || '/projects/back-office/manage/GW2/v4/upload/v3/upload-bo');
  });
});

router.get('/upload/v3/upload-bo', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.session[GW2_V3_SELECTED_TYPE_KEY]);
  if (!selectedType) {
    return res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/document-type');
  }

  res.render('projects/back-office/manage/GW2/v4/upload/v3/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    selectedType,
    selectedTypeLabel: getV3DocumentTypeLabel(selectedType),
    uploadedDocuments: getUploadedDocumentsFromFileData(req)
  });
});

router.post('/upload/v3/upload-bo', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.session[GW2_V3_SELECTED_TYPE_KEY]);
  if (!selectedType) {
    return res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/document-type');
  }

  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/check-answers');
  });
});

router.get('/upload/v3/check-answers', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.session[GW2_V3_SELECTED_TYPE_KEY]);
  if (!selectedType) {
    return res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/document-type');
  }

  const checkPageUrl = '/projects/back-office/manage/GW2/v4/upload/v3/check-answers';
  const receivedDate = getV3ReceivedDate(req);
  const uploadedDocuments = getUploadedDocumentsFromFileData(req).map((doc) => ({
    ...doc,
    uploadedAtDisplay: formatTimestampForDisplay(new Date().toISOString())
  }));

  res.render('projects/back-office/manage/GW2/v4/upload/v3/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    selectedType,
    selectedTypeLabel: getV3DocumentTypeLabel(selectedType),
    uploadedDocuments,
    documentTypeChangeUrl: `/projects/back-office/manage/GW2/v4/upload/v3/document-type?returnUrl=${encodeURIComponent(checkPageUrl)}`,
    uploadChangeUrl: '/projects/back-office/manage/GW2/v4/upload/v3/upload-bo',
    receivedDatePreview: formatDateForDisplay(receivedDate),
    receivedDateChangeUrl: `/projects/back-office/manage/GW2/v4/upload/v3/date-received?returnUrl=${encodeURIComponent(checkPageUrl)}`
  });
});

router.get('/upload/v3/date-received', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.session[GW2_V3_SELECTED_TYPE_KEY]);
  if (!selectedType) {
    return res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/document-type');
  }

  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW2/v4/upload/v3/check-answers';

  res.render('projects/back-office/manage/GW2/v4/upload/v3/date-received', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    returnUrl,
    receivedDateValues: getV3DateInputValues(getV3ReceivedDate(req))
  });
});

router.post('/upload/v3/date-received', (req, res) => {
  const returnUrl = req.body.returnUrl || '/projects/back-office/manage/GW2/v4/upload/v3/check-answers';
  const day = (req.body['received-day'] || '').trim();
  const month = (req.body['received-month'] || '').trim();
  const year = (req.body['received-year'] || '').trim();
  const receivedDate = getV3DateFromValues(day, month, year);

  if (receivedDate) {
    req.session[GW2_V3_RECEIVED_DATE_KEY] = receivedDate;
  } else {
    delete req.session[GW2_V3_RECEIVED_DATE_KEY];
  }

  req.session.save(() => {
    res.redirect(returnUrl);
  });
});

router.post('/upload/v3/check-answers', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.session[GW2_V3_SELECTED_TYPE_KEY]);
  if (!selectedType) {
    return res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/document-type');
  }

  const replacementDocumentId = req.session[GW2_V3_REPLACE_DOCUMENT_ID_KEY] || '';
  if (replacementDocumentId) {
    const newDocumentId = replaceV3UploadedDocumentFile(req, replacementDocumentId, selectedType);
    delete req.session[GW2_V3_REPLACE_DOCUMENT_ID_KEY];

    if (req.session.data) {
      delete req.session.data.fileData;
      delete req.session.data.fileSizeMap;
    }

    return req.session.save(() => {
      res.redirect(newDocumentId
        ? `/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(newDocumentId)}`
        : `/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(replacementDocumentId)}`);
    });
  }

  mergeV3UploadedDocuments(req, selectedType);

  if (req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
  }

  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
  });
});

router.get('/upload/v3/document/:documentId/file', (req, res) => {
  syncV3UploadedDocumentsToGateway2Documents(req);
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document || !document.id.startsWith('v3-upload-')) {
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
  }

  req.session[GW2_V3_REPLACE_DOCUMENT_ID_KEY] = document.id;
  req.session[GW2_V3_SELECTED_TYPE_KEY] = normalizeV3DocumentType(document.category);
  req.session[GW2_V3_RECEIVED_DATE_KEY] = document.receivedDate || getV3DefaultReceivedDate();

  if (req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
  }

  req.session.save(() => {
    res.redirect('/projects/back-office/manage/GW2/v4/upload/v3/upload-bo');
  });
});

router.get('/upload/v3/document/:documentId', (req, res) => {
  syncV3UploadedDocumentsToGateway2Documents(req);
  const document = getGateway2DocumentById(req, req.params.documentId);

  if (!document || !document.id.startsWith('v3-upload-')) {
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
  }

  const viewDocument = buildGateway2DocumentForView(document);

  res.render('projects/back-office/manage/GW2/v4/upload/v3/document-detail', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    document: viewDocument
  });
});

router.get('/upload/v3/document/:documentId/category', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);
  if (!document || !document.id.startsWith('v3-upload-')) {
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
  }

  res.render('projects/back-office/manage/GW2/v4/upload/v3/document-category', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    document,
    selectedType: normalizeV3DocumentType(document.category),
    errorMessage: req.query.error === '1' ? 'Select a document category' : ''
  });
});

router.post('/upload/v3/document/:documentId/category', (req, res) => {
  const selectedType = normalizeV3DocumentType(req.body.documentType);
  if (!selectedType) {
    return res.redirect(`/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(req.params.documentId)}/category?error=1`);
  }

  updateV3UploadedDocumentCategory(req, req.params.documentId, selectedType);

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(req.params.documentId)}`);
  });
});

router.get('/upload/v3/document/:documentId/date-received', (req, res) => {
  const document = getGateway2DocumentById(req, req.params.documentId);
  if (!document || !document.id.startsWith('v3-upload-')) {
    return res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
  }

  res.render('projects/back-office/manage/GW2/v4/upload/v3/document-date-received', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
    document,
    receivedDateValues: getV3DateInputValues(document.receivedDate || getV3DefaultReceivedDate())
  });
});

router.post('/upload/v3/document/:documentId/date-received', (req, res) => {
  const day = (req.body['received-day'] || '').trim();
  const month = (req.body['received-month'] || '').trim();
  const year = (req.body['received-year'] || '').trim();
  const receivedDate = getV3DateFromValues(day, month, year);

  updateV3UploadedDocumentReceivedDate(req, req.params.documentId, receivedDate);

  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/GW2/v4/upload/v3/document/${encodeURIComponent(req.params.documentId)}`);
  });
});

router.get('/upload/v1/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;

  res.render('projects/back-office/manage/GW2/v4/upload/v1/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Manage a local plan',
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
    serviceName: 'Manage a local plan',
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
    serviceName: 'Manage a local plan',
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
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  if (!req.session.data) req.session.data = {};
  const currentBatch = getUploadedDocumentsFromFileData(req);
  const uploadedCount = currentBatch.length;
  mergeWorkshopDocuments(req);

  const safeCount = uploadedCount > 0 ? uploadedCount : 0;
  req.session.notificationMessage = `${safeCount} workshop document${safeCount === 1 ? '' : 's'} uploaded`;

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
    serviceName: 'Manage a local plan',
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
    serviceName: 'Manage a local plan',
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
    serviceName: 'Manage a local plan',
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
  const returnTo = getReturnTo(req);
  req.session.gw2v4UploadReturnTo = returnTo;
  if (!req.session.data) req.session.data = {};
  mergeIssueReportDocuments(req);
  req.session.gw2v4ReportIssued = true;
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;

  req.session.save(() => {
    res.redirect(`${getReturnPath(returnTo)}?issueReportSubmitted=1`);
  });
});

router.use('/', require('./_add-workshop'));
router.use('/', require('./_cancel-workshop'));
router.use('/', require('./_set-status'));
module.exports = router;
