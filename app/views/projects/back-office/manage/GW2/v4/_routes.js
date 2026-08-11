const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const WORKSHOP_DOCS_KEY = 'gw2v3WorkshopDocuments';
const ISSUE_REPORT_DOCS_KEY = 'gw2v4IssueReportDocuments';
const ISSUE_REPORT_SUCCESS_MESSAGE = 'Gateway 2 report issued';

function buildFooterLinks() {
  return [
    {
      text: 'Clear GW2 status',
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
  ];
}

function setGw2V4StatusState(req, state) {
  const uploadedAt = new Date().toISOString();
  const defaultEstimatedDate = '15/08/2026';
  const defaultWorkshopVenue = 'Virtual';
  const defaultWorkshopDate = '20 July 2026 to 23 July 2026';
  const demoWorkshopDoc = {
    originalname: 'workshop-doc.pdf',
    filename: 'gw2-v4-workshop-demo',
    size: 102400,
    uploadedAt
  };
  const demoIssueReportDoc = {
    originalname: 'gateway-2-report.pdf',
    filename: 'gw2-v4-issue-report-demo',
    size: 153600,
    uploadedAt
  };
  const demoProceduralDocs = [
    { id: 'gw2-covering-letter', title: 'Gateway 2 covering letter', originalname: 'GW2_covering_letter.docx', filename: 'gw2-v4-procedural-1', size: 81920, uploadedAt },
    { id: 'local-plan-timetable', title: 'Local plan timetable', originalname: 'plan_timetable.csv', filename: 'gw2-v4-procedural-2', size: 61440, uploadedAt },
    { id: 'project-initiation-document', title: 'Project initiation document', originalname: 'PID.docx', filename: 'gw2-v4-procedural-3', size: 92160, uploadedAt },
    { id: 'draft-statement-compliance', title: 'Draft statement of compliance', originalname: 'GW2_compliance_statement.docx', filename: 'gw2-v4-procedural-4', size: 87040, uploadedAt },
    { id: 'draft-statement-soundness', title: 'Draft statement of soundness', originalname: 'GW2_soundness_statement.docx', filename: 'gw2-v4-procedural-5', size: 90112, uploadedAt }
  ];
  const demoConsultationDocs = [
    { id: 'consultation-statement', title: 'Consultation statement', originalname: 'consultation_statement.pdf', filename: 'gw2-v4-consultation-1', size: 122880, uploadedAt },
    { id: 'scoping-consultation-summary', title: 'Consultation summary for scoping consultation', originalname: 'scoping_summary.pdf', filename: 'gw2-v4-consultation-2', size: 112640, uploadedAt },
    { id: 'proposed-plan-summary', title: 'Consultation summary for proposed local plan content and evidence documents', originalname: 'proposed_plan_summary.pdf', filename: 'gw2-v4-consultation-3', size: 153600, uploadedAt },
    { id: 'notice-intention', title: 'Notice of intention to commence local plan preparation', originalname: 'notice_of_intention.pdf', filename: 'gw2-v4-consultation-4', size: 92160, uploadedAt },
    { id: 'scoping-documents', title: 'Scoping consultation documents', originalname: 'scoping_full.pdf', filename: 'gw2-v4-consultation-5', size: 194560, uploadedAt },
    { id: 'scoping-feedback-summary', title: 'Consultation summary of feedback to scoping consultation', originalname: 'scoping_feedback_summary.pdf', filename: 'gw2-v4-consultation-6', size: 102400, uploadedAt },
    { id: 'gateway1-self-assessment', title: 'Gateway 1 – Self assessment of readiness', originalname: 'gateway1_self_assessment.pdf', filename: 'gw2-v4-consultation-7', size: 133120, uploadedAt },
    { id: 'proposed-plan-full', title: 'Consultation on proposed local plan content and evidence documents', originalname: 'proposed_plan_full.pdf', filename: 'gw2-v4-consultation-8', size: 215040, uploadedAt },
    { id: 'consultation-summary-above', title: 'Consultation summary for the above', originalname: 'consultation_summary.pdf', filename: 'gw2-v4-consultation-9', size: 81920, uploadedAt }
  ];
  const demoAdditionalDocs = [
    { id: 'subsequent-work-draft-plan', title: 'Subsequent work towards a draft plan', originalname: 'Additional_documents.pdf', filename: 'gw2-v4-additional-1', size: 143360, uploadedAt }
  ];
  const demoWorkshopHearing = {
    startDate: '20 July 2026',
    time: '10:00',
    endTime: '12:00',
    estimatedDays: '2',
    actualDuration: '',
    endDate: '',
    isVirtual: 'Virtual',
    hasVirtualMeetingLink: 'Yes',
    virtualMeetingLink: 'https://meet.example/gw2-workshop',
    venue: '-',
    address: {},
    hasAddress: 'No'
  };

  delete req.session[WORKSHOP_DOCS_KEY];
  delete req.session[ISSUE_REPORT_DOCS_KEY];
  delete req.session.gw2v4ReportIssued;
  delete req.session.gw2v4StatusOverride;
  delete req.session.gw2v4ProceduralDocuments;
  delete req.session.gw2v4ConsultationDocuments;
  delete req.session.gw2v4AdditionalDocuments;
  delete req.session.gateway2ActualDate;
  delete req.session.gateway2ValidDate;
  delete req.session.gateway2WorkshopVenue;
  delete req.session.gateway2WorkshopDate;
  delete req.session.gateway2AssessorName;
  delete req.session.gateway2AssessorAppointmentDate;
  delete req.session.gateway2ReportIssuedDate;
  delete req.session.gateway2ReportPublishedDate;
  delete req.session.hearings;
  delete req.session.hearingStartDate;
  delete req.session.hearingTime;
  delete req.session.hearingEndTime;
  delete req.session.hearingEstimatedDays;
  delete req.session.hearingActualDuration;
  delete req.session.hearingEndDate;
  delete req.session.hearingIsVirtual;
  delete req.session.hearingHasVirtualMeetingLink;
  delete req.session.hearingVirtualMeetingLink;
  delete req.session.hearingVenue;
  delete req.session.hearingAddress;
  delete req.session.hearingHasAddress;

  if (req.session.data) {
    delete req.session.data[WORKSHOP_DOCS_KEY];
    delete req.session.data[ISSUE_REPORT_DOCS_KEY];
    delete req.session.data.gw2v4StatusOverride;
    delete req.session.data.gw2v4ProceduralDocuments;
    delete req.session.data.gw2v4ConsultationDocuments;
    delete req.session.data.gw2v4AdditionalDocuments;
    delete req.session.data.gateway2ActualDate;
    delete req.session.data.gateway2ValidDate;
    delete req.session.data.gateway2WorkshopVenue;
    delete req.session.data.gateway2WorkshopDate;
    delete req.session.data.gateway2AssessorName;
    delete req.session.data.gateway2AssessorAppointmentDate;
    delete req.session.data.gateway2ReportIssuedDate;
    delete req.session.data.gateway2ReportPublishedDate;
    delete req.session.data.hearings;
    delete req.session.data.hearingStartDate;
    delete req.session.data.hearingTime;
    delete req.session.data.hearingEndTime;
    delete req.session.data.hearingEstimatedDays;
    delete req.session.data.hearingActualDuration;
    delete req.session.data.hearingEndDate;
    delete req.session.data.hearingIsVirtual;
    delete req.session.data.hearingHasVirtualMeetingLink;
    delete req.session.data.hearingVirtualMeetingLink;
    delete req.session.data.hearingVenue;
    delete req.session.data.hearingAddress;
    delete req.session.data.hearingHasAddress;
  }

  if (state === 'none') {
    req.session.gw2v4StatusOverride = 'GW2 submission';
    req.session.gateway2EstimatedDate = req.session.gateway2EstimatedDate || defaultEstimatedDate;

    if (req.session.data) {
      req.session.data.gw2v4StatusOverride = req.session.gw2v4StatusOverride;
      req.session.data.gateway2EstimatedDate = req.session.gateway2EstimatedDate;
    }

    return;
  }

  if (state === 'submission-received') {
    req.session.gw2v4StatusOverride = 'GW2 submitted';
    req.session.gateway2EstimatedDate = req.session.gateway2EstimatedDate || defaultEstimatedDate;
    req.session.gateway2WorkshopVenue = defaultWorkshopVenue;
    req.session.gateway2WorkshopDate = defaultWorkshopDate;
    req.session.gw2v4ProceduralDocuments = demoProceduralDocs;
    req.session.gw2v4ConsultationDocuments = demoConsultationDocs;
    req.session.gw2v4AdditionalDocuments = demoAdditionalDocs;

    if (req.session.data) {
      req.session.data.gw2v4StatusOverride = req.session.gw2v4StatusOverride;
      req.session.data.gateway2EstimatedDate = req.session.gateway2EstimatedDate;
      req.session.data.gateway2WorkshopVenue = req.session.gateway2WorkshopVenue;
      req.session.data.gateway2WorkshopDate = req.session.gateway2WorkshopDate;
      req.session.data.gw2v4ProceduralDocuments = req.session.gw2v4ProceduralDocuments;
      req.session.data.gw2v4ConsultationDocuments = req.session.gw2v4ConsultationDocuments;
      req.session.data.gw2v4AdditionalDocuments = req.session.gw2v4AdditionalDocuments;
    }

    return;
  }

  if (state === 'workshop-confirmed') {
    req.session.gateway2EstimatedDate = req.session.gateway2EstimatedDate || defaultEstimatedDate;
    req.session.gateway2WorkshopVenue = defaultWorkshopVenue;
    req.session.gateway2WorkshopDate = defaultWorkshopDate;
    req.session.gateway2AssessorName = 'Alex Morgan';
    req.session.gateway2AssessorAppointmentDate = '10 July 2026';
    req.session.hearings = [demoWorkshopHearing];
    req.session.hearingStartDate = demoWorkshopHearing.startDate;
    req.session.hearingTime = demoWorkshopHearing.time;
    req.session.hearingEndTime = demoWorkshopHearing.endTime;
    req.session.hearingEstimatedDays = demoWorkshopHearing.estimatedDays;
    req.session.hearingActualDuration = demoWorkshopHearing.actualDuration;
    req.session.hearingEndDate = demoWorkshopHearing.endDate;
    req.session.hearingIsVirtual = demoWorkshopHearing.isVirtual;
    req.session.hearingHasVirtualMeetingLink = demoWorkshopHearing.hasVirtualMeetingLink;
    req.session.hearingVirtualMeetingLink = demoWorkshopHearing.virtualMeetingLink;
    req.session.hearingVenue = demoWorkshopHearing.venue;
    req.session.hearingAddress = demoWorkshopHearing.address;
    req.session.hearingHasAddress = demoWorkshopHearing.hasAddress;
    req.session[WORKSHOP_DOCS_KEY] = [demoWorkshopDoc];
    if (req.session.data) {
      req.session.data.gateway2EstimatedDate = req.session.gateway2EstimatedDate;
      req.session.data.gateway2WorkshopVenue = req.session.gateway2WorkshopVenue;
      req.session.data.gateway2WorkshopDate = req.session.gateway2WorkshopDate;
      req.session.data.gateway2AssessorName = req.session.gateway2AssessorName;
      req.session.data.gateway2AssessorAppointmentDate = req.session.gateway2AssessorAppointmentDate;
      req.session.data.hearings = req.session.hearings;
      req.session.data.hearingStartDate = req.session.hearingStartDate;
      req.session.data.hearingTime = req.session.hearingTime;
      req.session.data.hearingEndTime = req.session.hearingEndTime;
      req.session.data.hearingEstimatedDays = req.session.hearingEstimatedDays;
      req.session.data.hearingActualDuration = req.session.hearingActualDuration;
      req.session.data.hearingEndDate = req.session.hearingEndDate;
      req.session.data.hearingIsVirtual = req.session.hearingIsVirtual;
      req.session.data.hearingHasVirtualMeetingLink = req.session.hearingHasVirtualMeetingLink;
      req.session.data.hearingVirtualMeetingLink = req.session.hearingVirtualMeetingLink;
      req.session.data.hearingVenue = req.session.hearingVenue;
      req.session.data.hearingAddress = req.session.hearingAddress;
      req.session.data.hearingHasAddress = req.session.hearingHasAddress;
      req.session.data[WORKSHOP_DOCS_KEY] = req.session[WORKSHOP_DOCS_KEY];
    }
    return;
  }

  if (state === 'gw3-submission') {
    req.session.gateway2EstimatedDate = req.session.gateway2EstimatedDate || defaultEstimatedDate;
    req.session.gateway2ActualDate = '30/08/2026';
    req.session.gateway2ValidDate = '31/08/2026';
    req.session.gateway2WorkshopVenue = defaultWorkshopVenue;
    req.session.gateway2WorkshopDate = defaultWorkshopDate;
    req.session.gateway2AssessorName = 'Alex Morgan';
    req.session.gateway2AssessorAppointmentDate = '10 July 2026';
    req.session.gateway2ReportIssuedDate = '5 September 2026';
    req.session.gateway2ReportPublishedDate = '7 September 2026';

    req.session.gw2v4ProceduralDocuments = demoProceduralDocs;
    req.session.gw2v4ConsultationDocuments = demoConsultationDocs;
    req.session.gw2v4AdditionalDocuments = demoAdditionalDocs;

    req.session.hearings = [{
      ...demoWorkshopHearing,
      actualDuration: '2 days',
      endDate: '21 July 2026'
    }];
    req.session.hearingStartDate = req.session.hearings[0].startDate;
    req.session.hearingTime = req.session.hearings[0].time;
    req.session.hearingEndTime = req.session.hearings[0].endTime;
    req.session.hearingEstimatedDays = req.session.hearings[0].estimatedDays;
    req.session.hearingActualDuration = req.session.hearings[0].actualDuration;
    req.session.hearingEndDate = req.session.hearings[0].endDate;
    req.session.hearingIsVirtual = req.session.hearings[0].isVirtual;
    req.session.hearingHasVirtualMeetingLink = req.session.hearings[0].hasVirtualMeetingLink;
    req.session.hearingVirtualMeetingLink = req.session.hearings[0].virtualMeetingLink;
    req.session.hearingVenue = req.session.hearings[0].venue;
    req.session.hearingAddress = req.session.hearings[0].address;
    req.session.hearingHasAddress = req.session.hearings[0].hasAddress;

    req.session[WORKSHOP_DOCS_KEY] = [demoWorkshopDoc];
    req.session[ISSUE_REPORT_DOCS_KEY] = [demoIssueReportDoc];
    req.session.gw2v4ReportIssued = true;
    if (req.session.data) {
      req.session.data.gateway2EstimatedDate = req.session.gateway2EstimatedDate;
      req.session.data.gateway2ActualDate = req.session.gateway2ActualDate;
      req.session.data.gateway2ValidDate = req.session.gateway2ValidDate;
      req.session.data.gateway2WorkshopVenue = req.session.gateway2WorkshopVenue;
      req.session.data.gateway2WorkshopDate = req.session.gateway2WorkshopDate;
      req.session.data.gateway2AssessorName = req.session.gateway2AssessorName;
      req.session.data.gateway2AssessorAppointmentDate = req.session.gateway2AssessorAppointmentDate;
      req.session.data.gateway2ReportIssuedDate = req.session.gateway2ReportIssuedDate;
      req.session.data.gateway2ReportPublishedDate = req.session.gateway2ReportPublishedDate;
      req.session.data.gw2v4ProceduralDocuments = req.session.gw2v4ProceduralDocuments;
      req.session.data.gw2v4ConsultationDocuments = req.session.gw2v4ConsultationDocuments;
      req.session.data.gw2v4AdditionalDocuments = req.session.gw2v4AdditionalDocuments;
      req.session.data.hearings = req.session.hearings;
      req.session.data.hearingStartDate = req.session.hearingStartDate;
      req.session.data.hearingTime = req.session.hearingTime;
      req.session.data.hearingEndTime = req.session.hearingEndTime;
      req.session.data.hearingEstimatedDays = req.session.hearingEstimatedDays;
      req.session.data.hearingActualDuration = req.session.hearingActualDuration;
      req.session.data.hearingEndDate = req.session.hearingEndDate;
      req.session.data.hearingIsVirtual = req.session.hearingIsVirtual;
      req.session.data.hearingHasVirtualMeetingLink = req.session.hearingHasVirtualMeetingLink;
      req.session.data.hearingVirtualMeetingLink = req.session.hearingVirtualMeetingLink;
      req.session.data.hearingVenue = req.session.hearingVenue;
      req.session.data.hearingAddress = req.session.hearingAddress;
      req.session.data.hearingHasAddress = req.session.hearingHasAddress;
      req.session.data[WORKSHOP_DOCS_KEY] = req.session[WORKSHOP_DOCS_KEY];
      req.session.data[ISSUE_REPORT_DOCS_KEY] = req.session[ISSUE_REPORT_DOCS_KEY];
    }
  }
}

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
  if (req.session.gw2v4StatusOverride === 'GW2 submission') {
    return {
      text: 'GW2 submission',
      classes: 'govuk-tag--yellow'
    };
  }

  if (req.session.gw2v4StatusOverride === 'GW2 submitted') {
    return {
      text: 'GW2 submitted',
      classes: 'govuk-tag--turquoise'
    };
  }

  if (req.session.gw2v4ReportIssued) {
    return {
      text: 'GW3 submission',
      classes: 'govuk-tag--yellow'
    };
  }

  if (workshopDocuments.length > 0) {
    return {
      text: 'GW2 workshop confirmed',
      classes: 'govuk-tag--blue'
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

function getGateway2DocumentsSummary(req) {
  const proceduralDocuments = Array.isArray(req.session.gw2v4ProceduralDocuments)
    ? req.session.gw2v4ProceduralDocuments
    : [];
  const consultationDocuments = Array.isArray(req.session.gw2v4ConsultationDocuments)
    ? req.session.gw2v4ConsultationDocuments
    : [];
  const additionalDocuments = Array.isArray(req.session.gw2v4AdditionalDocuments)
    ? req.session.gw2v4AdditionalDocuments
    : [];
  const count = proceduralDocuments.length + consultationDocuments.length + additionalDocuments.length;

  return {
    count,
    hasDocuments: count > 0
  };
}

function buildGateway2ViewModel(req, notificationMessage = '') {
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
  const gateway2DocumentsSummary = getGateway2DocumentsSummary(req);
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
    gateway2DocumentsSummary,
    issueReportDocuments: issueReportDocumentsForDisplay,
    issueReportSummary: {
      count: issueReportDocumentsForDisplay.length,
      latestUploadedAtDisplay: issueReportDocumentsForDisplay.length ? issueReportDocumentsForDisplay[issueReportDocumentsForDisplay.length - 1].uploadedAtDisplay : '-',
      hasDocuments: issueReportDocumentsForDisplay.length > 0
    },
    footerLinks: buildFooterLinks(),
    pageState,
    headerStatusText: gateway2Status.text,
    headerStatusClasses: gateway2Status.classes
  };
}

router.get('/set-status', (req, res) => {
  const state = String(req.query.state || 'none');
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW2/v4/gateway-2';

  setGw2V4StatusState(req, state);
  res.redirect(returnUrl);
});

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
  const proceduralDocuments = Array.isArray(req.session.gw2v4ProceduralDocuments)
    ? req.session.gw2v4ProceduralDocuments
    : [];
  const consultationDocuments = Array.isArray(req.session.gw2v4ConsultationDocuments)
    ? req.session.gw2v4ConsultationDocuments
    : [];
  const additionalDocuments = Array.isArray(req.session.gw2v4AdditionalDocuments)
    ? req.session.gw2v4AdditionalDocuments
    : [];

  const withTitles = (docs = []) => docs.map((doc, index) => ({
    ...doc,
    id: doc.id || doc.filename || `doc-${index + 1}`,
    title: doc.title || doc.originalname || `Document ${index + 1}`
  }));

  res.render('projects/back-office/manage/GW2/v4/gateway-2-documents', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    proceduralDocuments: withTitles(proceduralDocuments),
    consultationDocuments: withTitles(consultationDocuments),
    additionalDocuments: withTitles(additionalDocuments),
    footerLinks: buildFooterLinks()
  });
});

router.get('/gateway-2-documents.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-documents');
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
