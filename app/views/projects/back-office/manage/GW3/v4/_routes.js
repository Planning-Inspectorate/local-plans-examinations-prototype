const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

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

function buildGateway3ViewModel(req, notificationMessage = '') {
  const documents = getGateway3Documents(req).map(buildDocumentForView);
  const submissionDocuments = documents.filter((doc) => doc.category === 'submission');
  const supplementaryDocuments = documents.filter((doc) => doc.category === 'supplementary');
  const submissionDocumentsCount = submissionDocuments.length;

  return {
    caseRef: req.session.currentCaseRef || '',
    notificationMessage,
    gateway3EstimatedDate: req.session.gateway3EstimatedDate && req.session.gateway3EstimatedDate !== '-' ? req.session.gateway3EstimatedDate : '2 Jun 2026',
    gateway3ActualDate: req.session.gateway3ActualDate && req.session.gateway3ActualDate !== '-' ? req.session.gateway3ActualDate : 'Not provided',
    gateway3AssessorAppointmentDate: req.session.gateway3AssessorAppointmentDate && req.session.gateway3AssessorAppointmentDate !== '-' ? req.session.gateway3AssessorAppointmentDate : 'Not provided',
    gateway3CompletionDate: req.session.gateway3CompletionDate && req.session.gateway3CompletionDate !== '-' ? req.session.gateway3CompletionDate : 'Not provided',
    gateway3AssessorName: req.session.gateway3AssessorName && req.session.gateway3AssessorName !== '-' ? req.session.gateway3AssessorName : 'Not provided',
    gateway3PoContact: req.session.gateway3PoContact || {},
    submissionDocuments,
    supplementaryDocuments,
    submissionDocumentsCount,
    // Compatibility keys used by the current v4 template.
    submission1DocumentsCount: submissionDocumentsCount,
    submission2DocumentsCount: submissionDocumentsCount
  };
}

router.get('/gateway-3', (req, res) => {
  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;

  res.render('projects/back-office/manage/GW3/v4/gateway-3', buildGateway3ViewModel(req, notificationMessage));
});

router.get('/gateway-3.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW3/v4/gateway-3');
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

  const reviewOutcome = (req.body.reviewOutcome || '').trim();

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

  const outcomeLabelMap = {
    valid: 'Valid',
    invalid: 'Invalid',
    incomplete: 'Incomplete'
  };

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
