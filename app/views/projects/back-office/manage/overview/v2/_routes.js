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
    currentCase
  });
});

// POST add case note
router.post('/index', function (req, res) {
  const comment = (req.body.comment || '').trim();
  if (!comment) return res.redirect('/projects/back-office/manage/overview/v2/index');

  const userName = req.session.caseOfficer || 'Case officer';
  const newNote = buildCaseNote(new Date(), comment, userName);

  const caseRef = req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  const matchedCase = caseRef ? cases.find(item => item.caseRef === caseRef) : null;

  if (matchedCase) {
    if (!Array.isArray(matchedCase.caseNotes)) matchedCase.caseNotes = [];
    matchedCase.caseNotes.unshift(newNote);
  } else {
    if (!Array.isArray(req.session.caseNotes)) req.session.caseNotes = [];
    req.session.caseNotes.unshift(newNote);
  }

  req.session.save(() => res.redirect('/projects/back-office/manage/overview/v2/index'));
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
