const express = require('express');
const router = express.Router();

function getCurrentCase(req, preferredRef) {
  const caseRef = preferredRef || req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  const matchedCase = caseRef ? cases.find(item => item.caseRef === caseRef) : null;

  if (matchedCase) {
    if (!Array.isArray(matchedCase.caseNotes)) matchedCase.caseNotes = [];
    return { reference: matchedCase.caseRef, caseNotes: matchedCase.caseNotes };
  }

  if (!Array.isArray(req.session.caseNotes)) req.session.caseNotes = [];
  return { reference: caseRef || 'PLAN/000001', caseNotes: req.session.caseNotes };
}

function buildCaseNote(now, text, userName) {
  const tableDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const tableTime = now
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()
    .replace(' ', '');

  return {
    text,
    meta: `${tableDate} at ${tableTime} by ${userName}`,
    tableDate,
    tableTime,
    tableUser: userName
  };
}

function addCaseNoteToSession(req, newNote) {
  const caseRef = req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  const matchedCase = caseRef ? cases.find(item => item.caseRef === caseRef) : null;

  if (matchedCase) {
    if (!Array.isArray(matchedCase.caseNotes)) matchedCase.caseNotes = [];
    matchedCase.caseNotes.unshift(newNote);
    return;
  }

  if (!Array.isArray(req.session.caseNotes)) req.session.caseNotes = [];
  req.session.caseNotes.unshift(newNote);
}

function getSafeReturnPath(req, fallbackPath) {
  const value = (req.body.returnTo || '').trim();
  if (
    value === '/projects/back-office/manage/overview/v2/index' ||
    value === '/projects/back-office/manage/overview/v2/index-side'
  ) {
    return value;
  }
  return fallbackPath;
}

// GET v2 index
router.get('/index', function (req, res) {
  const currentCase = getCurrentCase(req);
  res.render('projects/back-office/manage/overview/v2/index', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    planType: req.session.planType || '',
    lpas: req.session.lpas || [],
    lpaRegions: req.session.lpaRegions || {},
    caseOfficer: req.session.caseOfficer || '',
    contacts: req.session.contacts || [],
    mainContactName: req.session.mainContact ? [req.session.mainContact.firstName, req.session.mainContact.lastName].filter(Boolean).join(' ') : '',
    mainContactEmail: req.session.mainContact?.email || '',
    mainContactPhone: req.session.mainContact?.phone || '',
    mainContactOrg: req.session.mainContact?.organisation || '',
    planBand: req.session.planBand || '',
    noticeOfIntentionDate: req.session.noticeOfIntentionDate || '-',
    gateway1EstimatedDate: req.session.gateway1EstimatedDate || '-',
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '-',
    gateway3EstimatedDate: req.session.gateway3EstimatedDate || '-',
    submissionDate: req.session.submissionDate || '-',
    currentCase
  });
});

// POST add case note
router.post('/index', function (req, res) {
  const comment = (req.body.comment || '').trim();
  const returnPath = getSafeReturnPath(req, '/projects/back-office/manage/overview/v2/index');
  if (!comment) return res.redirect(returnPath);

  const userName = req.session.caseOfficer || 'Case officer';
  const newNote = buildCaseNote(new Date(), comment, userName);
  addCaseNoteToSession(req, newNote);

  req.session.save(() => res.redirect(returnPath));
});

// GET v2 index-side (side navigation version)
router.get('/index-side', function (req, res) {
  const currentCase = getCurrentCase(req);
  res.render('projects/back-office/manage/overview/v2/index-side', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    planType: req.session.planType || '',
    lpas: req.session.lpas || [],
    lpaRegions: req.session.lpaRegions || {},
    caseOfficer: req.session.caseOfficer || '',
    contacts: req.session.contacts || [],
    mainContactName: req.session.mainContact ? [req.session.mainContact.firstName, req.session.mainContact.lastName].filter(Boolean).join(' ') : '',
    mainContactEmail: req.session.mainContact?.email || '',
    mainContactPhone: req.session.mainContact?.phone || '',
    mainContactOrg: req.session.mainContact?.organisation || '',
    planBand: req.session.planBand || '',
    noticeOfIntentionDate: req.session.noticeOfIntentionDate || '-',
    gateway1EstimatedDate: req.session.gateway1EstimatedDate || '-',
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '-',
    gateway3EstimatedDate: req.session.gateway3EstimatedDate || '-',
    submissionDate: req.session.submissionDate || '-',
    currentCase
  });
});

// POST add case note (side navigation version)
router.post('/index-side', function (req, res) {
  const comment = (req.body.comment || '').trim();
  const returnPath = getSafeReturnPath(req, '/projects/back-office/manage/overview/v2/index-side');
  if (!comment) return res.redirect(returnPath);

  const userName = req.session.caseOfficer || 'Case officer';
  const newNote = buildCaseNote(new Date(), comment, userName);
  addCaseNoteToSession(req, newNote);

  req.session.save(() => res.redirect(returnPath));
});

// GET all case notes
router.get('/all-case-notes', function (req, res) {
  const currentCase = getCurrentCase(req, req.query.ref);
  res.render('projects/back-office/manage/overview/v2/case-notes', { currentCase });
});

// Backward-compatible route used by v2 overview links
router.get('/case-notes', function (req, res) {
  const currentCase = getCurrentCase(req, req.query.ref);
  res.render('projects/back-office/manage/overview/v2/case-notes', { currentCase });
});

module.exports = router;
