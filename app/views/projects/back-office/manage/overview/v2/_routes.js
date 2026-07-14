const express = require('express');
const router = express.Router();
const lpaToRegionSimple = require('../../../../../../data/lpa-to-region-simple.json');

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

function getContactNameParts(contact = {}) {
  if (contact.firstName || contact.lastName) {
    return {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      fullName: [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
    };
  }

  const fullName = contact.name || '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
    fullName
  };
}

function buildOverviewContext(req) {
  const currentCase = getCurrentCase(req);
  const mainContact = req.session.mainContact || {};
  const mainContactNameParts = getContactNameParts(mainContact);
  const contacts = Array.isArray(req.session.contacts) ? req.session.contacts : [];
  const lpas = Array.isArray(req.session.lpas) ? req.session.lpas : [];
  const lpaRegions = req.session.lpaRegions && typeof req.session.lpaRegions === 'object'
    ? { ...req.session.lpaRegions }
    : {};

  // Ensure each selected LPA has a region value for display in overview.
  lpas.forEach((lpa, index) => {
    if (!lpaRegions[lpa]) {
      if (lpaToRegionSimple[lpa]) {
        lpaRegions[lpa] = lpaToRegionSimple[lpa];
      } else if (index === 0 && req.session.lpaRegion) {
        lpaRegions[lpa] = req.session.lpaRegion;
      }
    }
  });

  req.session.lpaRegions = lpaRegions;

  const normalizedContacts = contacts.map((contact) => {
    const nameParts = getContactNameParts(contact);
    return {
      ...contact,
      name: contact.name || nameParts.fullName,
      firstName: contact.firstName || nameParts.firstName,
      lastName: contact.lastName || nameParts.lastName
    };
  });

  return {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    planType: req.session.planType || '',
    lpas,
    lpaRegions,
    caseOfficer: req.session.caseOfficer || '',
    contacts: normalizedContacts,
    mainContactName: mainContactNameParts.fullName,
    mainContactEmail: mainContact.email || '',
    mainContactPhone: mainContact.phone || '',
    mainContactOrg: mainContact.organisation || '',
    noticeOfIntentionDate: req.session.noticeOfIntentionDate || '',
    gateway1EstimatedDate: req.session.gateway1EstimatedDate || '',
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '',
    gateway3EstimatedDate: req.session.gateway3EstimatedDate || '',
    submissionDate: req.session.submissionDate || '',
    planBand: req.session.planBand || '',
    currentCase
  };
}

// GET v2 index
router.get('/index', function (req, res) {
  res.render('projects/back-office/manage/overview/v2/index', buildOverviewContext(req));
});

// POST add case note
router.post('/index', function (req, res) {
  const comment = (req.body.comment || '').trim();
  const returnTo = req.body.returnTo || '/projects/back-office/manage/overview/v2/index';
  if (!comment) return res.redirect(returnTo);

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

  req.session.save(() => res.redirect(returnTo));
});

router.get('/index-side', function (req, res) {
  res.render('projects/back-office/manage/overview/v2/index-side', buildOverviewContext(req));
});

router.post('/index-side', function (req, res) {
  const comment = (req.body.comment || '').trim();
  const returnTo = req.body.returnTo || '/projects/back-office/manage/overview/v2/index-side';
  if (!comment) return res.redirect(returnTo);

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

  req.session.save(() => res.redirect(returnTo));
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
