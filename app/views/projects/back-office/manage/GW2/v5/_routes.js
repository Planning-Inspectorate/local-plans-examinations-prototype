const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const WORKSHOP_DOCS_KEY = 'gw2v3WorkshopDocuments';
const ISSUE_REPORT_DOCS_KEY = 'gw2v5IssueReportDocuments';
const ISSUE_REPORT_SUCCESS_MESSAGE = 'Gateway 2 report issued';

const RETURN_TO_FALLBACK = 'gateway-2';
const RETURN_TO_MAP = {
  'gateway-2': '/projects/back-office/manage/GW2/v5/gateway-2',
  'gateway-2-side': '/projects/back-office/manage/GW2/v5/gateway-2-side',
  'check-answers': '/projects/back-office/manage/GW2/v3/upload/v1/check-answers',
  'upload-bo': '/projects/back-office/manage/GW2/v3/upload/v1/upload-bo',
  'check-answers-v2': '/projects/back-office/manage/GW2/v5/upload/v2/check-answers',
  'upload-bo-v2': '/projects/back-office/manage/GW2/v5/upload/v2/upload-bo'
};

function getReturnPath(returnTo) {
  return RETURN_TO_MAP[returnTo] || RETURN_TO_MAP[RETURN_TO_FALLBACK];
}

function getReturnTo(req, fallback = RETURN_TO_FALLBACK) {
  const requestedReturnTo =
    (req.query && req.query.returnTo) ||
    (req.body && req.body.returnTo) ||
    req.session.gw2UploadReturnTo ||
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

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('/').map(Number);
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    if (month >= 1 && month <= 12) {
      return `${day} ${months[month - 1]} ${year}`;
    }
  }

  return dateString;
}

function formatTimestampForDisplay(timestamp) {
  if (!timestamp || timestamp === '-') return '-';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '-';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getUploadedDocuments(req) {
  if (Array.isArray(req.session[WORKSHOP_DOCS_KEY])) {
    return req.session[WORKSHOP_DOCS_KEY];
  }

  // Backward compatibility for earlier implementation
  if (req.session.data && Array.isArray(req.session.data[WORKSHOP_DOCS_KEY])) {
    req.session[WORKSHOP_DOCS_KEY] = req.session.data[WORKSHOP_DOCS_KEY];
    return req.session[WORKSHOP_DOCS_KEY];
  }

  // Do not fall back to shared transient fileData here.
  // Workshop documents must only come from the workshop-specific store.
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

function mergeWorkshopDocuments(req) {
  const existingDocuments = Array.isArray(req.session[WORKSHOP_DOCS_KEY])
    ? req.session[WORKSHOP_DOCS_KEY]
    : [];
  const currentBatch = getUploadedDocumentsFromFileData(req);

  const merged = [...existingDocuments];
  currentBatch.forEach((doc) => {
    const alreadyPresent = merged.some(
      (item) => item.filename === doc.filename || (item.originalname === doc.originalname && item.size === doc.size)
    );
    if (!alreadyPresent) merged.push(doc);
  });

  req.session[WORKSHOP_DOCS_KEY] = merged;

  // Keep mirrored copy for compatibility with any templates/routes that look in session.data
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

  const merged = [...existingDocuments];
  const nowIso = new Date().toISOString();
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

function removeDocumentByFilename(req, filename) {
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

function removeIssueReportDocumentByFilename(req, filename) {
  if (!filename) return;

  const existingDocuments = Array.isArray(req.session[ISSUE_REPORT_DOCS_KEY])
    ? req.session[ISSUE_REPORT_DOCS_KEY]
    : [];
  const updatedDocuments = existingDocuments.filter((doc) => doc.filename !== filename);
  req.session[ISSUE_REPORT_DOCS_KEY] = updatedDocuments;

  if (req.session.data) {
    req.session.data[ISSUE_REPORT_DOCS_KEY] = updatedDocuments;

    const fileData = parseFileData(req);
    const updatedFileData = fileData.filter((file) => file.id !== filename);
    req.session.data.fileData = updatedFileData;
  }
}

function findDocumentByFilename(req, filename) {
  if (!filename) return null;

  const storedDocuments = Array.isArray(req.session[WORKSHOP_DOCS_KEY])
    ? req.session[WORKSHOP_DOCS_KEY]
    : [];
  const storedMatch = storedDocuments.find((doc) => doc.filename === filename);
  if (storedMatch) return storedMatch;

  const currentBatch = getUploadedDocumentsFromFileData(req);
  return currentBatch.find((doc) => doc.filename === filename) || null;
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

function buildGateway2ViewModel(req, notificationMessage = '') {
  const uploadedDocuments = getUploadedDocuments(req);
  const issueReportDocuments = getIssueReportDocuments(req);

  return {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    gateway2EstimatedDate: formatDateForDisplay(req.session.gateway2EstimatedDate) || '-',
    gateway2ActualDate: formatDateForDisplay(req.session.gateway2ActualDate) || '-',
    gateway2ValidDate: formatDateForDisplay(req.session.gateway2ValidDate) || '-',
    gateway2WorkshopDate: formatDateForDisplay(req.session.gateway2WorkshopDate) || '-',
    gateway2WorkshopVenue: req.session.gateway2WorkshopVenue || '-',
    gateway2AssessorAppointmentDate: formatDateForDisplay(req.session.gateway2AssessorAppointmentDate) || '-',
    gateway2ReportIssuedDate: formatDateForDisplay(req.session.gateway2ReportIssuedDate) || '-',
    gateway2ReportPublishedDate: formatDateForDisplay(req.session.gateway2ReportPublishedDate) || '-',
    gateway2AssessorName: req.session.gateway2AssessorName || '-',
    uploadedDocuments,
    issueReportDocuments,
    totalWorkshopDocuments: uploadedDocuments.length,
    notificationMessage
  };
}

router.get('/gateway-2', (req, res) => {
  const showUploadConfirmation = req.query.uploaded === '1';
  const showIssueReportConfirmation = req.query.issueReportSubmitted === '1';
  const uploadedCount = parseInt(req.query.uploadedCount || '0', 10);
  const uploadedDocuments = getUploadedDocuments(req);
  let notificationMessage = '';

  if (showIssueReportConfirmation) {
    notificationMessage = ISSUE_REPORT_SUCCESS_MESSAGE;
  } else if (showUploadConfirmation) {
    notificationMessage = `${uploadedCount > 0 ? uploadedCount : uploadedDocuments.length} workshop document${(uploadedCount > 0 ? uploadedCount : uploadedDocuments.length) === 1 ? '' : 's'} uploaded`;
  }

  res.render('projects/back-office/manage/GW2/v5/gateway-2', buildGateway2ViewModel(req, notificationMessage));
});

router.get('/gateway-2.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v5/gateway-2');
});

router.get('/gateway-2-side', (req, res) => {
  const showUploadConfirmation = req.query.uploaded === '1';
  const showIssueReportConfirmation = req.query.issueReportSubmitted === '1';
  const uploadedCount = parseInt(req.query.uploadedCount || '0', 10);
  const uploadedDocuments = getUploadedDocuments(req);
  let notificationMessage = '';

  if (showIssueReportConfirmation) {
    notificationMessage = ISSUE_REPORT_SUCCESS_MESSAGE;
  } else if (showUploadConfirmation) {
    notificationMessage = `${uploadedCount > 0 ? uploadedCount : uploadedDocuments.length} workshop document${(uploadedCount > 0 ? uploadedCount : uploadedDocuments.length) === 1 ? '' : 's'} uploaded`;
  }

  res.render('projects/back-office/manage/GW2/v5/gateway-2-side', buildGateway2ViewModel(req, notificationMessage));
});

router.get('/gateway-2-side.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v5/gateway-2-side');
});

router.get('/gateway-2-alt', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-alt');
});

router.get('/gateway-2-alt.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2-alt');
});

router.get('/upload/v1/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;

  res.render('projects/back-office/manage/GW2/v3/upload/v1/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments: getUploadedDocuments(req),
    returnTo,
    returnPath: getReturnPath(returnTo)
  });
});

router.get('/upload/v1/upload-bo.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v3/upload/v1/upload-bo');
});

router.post('/upload/v1/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v3/upload/v1/check-answers', returnTo));
  });
});

router.get('/upload/v1/check-answers', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  const uploadedDocuments = getUploadedDocumentsFromFileData(req);

  res.render('projects/back-office/manage/GW2/v3/upload/v1/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments,
    totalFiles: uploadedDocuments.length,
    returnTo
  });
});

router.get('/upload/v1/check-answers.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v3/upload/v1/check-answers');
});

router.get('/upload/v1/remove-confirm', (req, res) => {
  const filename = req.query.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  const document = findDocumentByFilename(req, filename);

  if (!filename || !document) {
    return res.redirect(getReturnPath(returnTo));
  }

  res.render('projects/back-office/manage/GW2/v3/upload/v1/remove-confirm', {
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
  req.session.gw2UploadReturnTo = returnTo;
  const action = req.body.action || 'cancel';

  if (action === 'remove') {
    removeDocumentByFilename(req, filename);
  }

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.get('/upload/v1/remove', (req, res) => {
  const filename = req.query.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;

  removeDocumentByFilename(req, filename);

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.post('/upload/v1/check-answers', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  if (!req.session.data) req.session.data = {};
  const currentBatch = getUploadedDocumentsFromFileData(req);
  const uploadedCount = currentBatch.length;
  mergeWorkshopDocuments(req);
  req.session.save(() => {
    res.redirect(`${getReturnPath(returnTo)}?uploaded=1&uploadedCount=${uploadedCount}`);
  });
});

router.get('/upload/v1/clear-uploads', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  if (req.session && req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
    delete req.session.data[WORKSHOP_DOCS_KEY];
  }
  if (req.session) {
    delete req.session[WORKSHOP_DOCS_KEY];
  }

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v3/upload/v1/upload-bo', returnTo));
  });
});

router.get('/upload/v2/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;

  res.render('projects/back-office/manage/GW2/v5/upload/v2/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments: getIssueReportDocuments(req),
    returnTo,
    returnPath: getReturnPath(returnTo)
  });
});

router.get('/upload/v2/upload-bo.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v5/upload/v2/upload-bo');
});

router.post('/upload/v2/upload-bo', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v5/upload/v2/check-answers', returnTo));
  });
});

router.get('/upload/v2/check-answers', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
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

  res.render('projects/back-office/manage/GW2/v5/upload/v2/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments,
    totalFiles: uploadedDocuments.length,
    gateway2ReportIssuedDate: formatDateForDisplay(req.session.gateway2ReportIssuedDate) || '-',
    returnTo
  });
});

router.get('/upload/v2/check-answers.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v5/upload/v2/check-answers');
});

router.get('/upload/v2/remove-confirm', (req, res) => {
  const filename = req.query.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  const document = findIssueReportDocumentByFilename(req, filename);

  if (!filename || !document) {
    return res.redirect(getReturnPath(returnTo));
  }

  res.render('projects/back-office/manage/GW2/v5/upload/v2/remove-confirm', {
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
  req.session.gw2UploadReturnTo = returnTo;
  const action = req.body.action || 'cancel';

  if (action === 'remove') {
    removeIssueReportDocumentByFilename(req, filename);
  }

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.get('/upload/v2/remove', (req, res) => {
  const filename = req.query.filename || '';
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;

  removeIssueReportDocumentByFilename(req, filename);

  req.session.save(() => {
    res.redirect(getReturnPath(returnTo));
  });
});

router.post('/upload/v2/check-answers', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  if (!req.session.data) req.session.data = {};
  mergeIssueReportDocuments(req);
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;

  req.session.save(() => {
    res.redirect(`${getReturnPath(returnTo)}?issueReportSubmitted=1`);
  });
});

router.get('/upload/v2/clear-uploads', (req, res) => {
  const returnTo = getReturnTo(req);
  req.session.gw2UploadReturnTo = returnTo;
  if (req.session && req.session.data) {
    delete req.session.data.fileData;
    delete req.session.data.fileSizeMap;
    delete req.session.data[ISSUE_REPORT_DOCS_KEY];
  }
  if (req.session) {
    delete req.session[ISSUE_REPORT_DOCS_KEY];
  }

  req.session.save(() => {
    res.redirect(withReturnTo('/projects/back-office/manage/GW2/v5/upload/v2/upload-bo', returnTo));
  });
});

module.exports = router;
