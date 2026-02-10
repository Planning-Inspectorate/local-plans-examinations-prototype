const express = require('express');
const router = express.Router();

// Start page
router.get('/projects/back-office/create-case-v2/index', (req, res) => {
  res.render('projects/back-office/create-case-v2/index', {
    cases: req.session.cases || []
  });
});

// Case officer
router.get('/projects/back-office/create-case-v2/0-case-officer-name', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case-v2/0-case-officer-name', {
    caseOfficer: req.session.caseOfficer,
    lpa: req.session.lpa,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case-v2/0-case-officer-name', (req, res) => {
  if (!req.body.caseOfficer) {
    return res.render('projects/back-office/create-case-v2/0-case-officer-name', {
      error: 'Please select a case officer',
      caseOfficer: req.session.caseOfficer,
      lpa: req.session.lpa
    });
  }
  const isEdit = req.body.isEdit === 'true';
  req.session.caseOfficer = req.body.caseOfficer;
  req.session.lpa = req.body.lpa;
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case-v2/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case-v2/1-plan-title');
  }
});

// Plan title page
router.get('/projects/back-office/create-case-v2/1-plan-title', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case-v2/1-plan-title', {
    planTitle: req.session.planTitle,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case-v2/1-plan-title', (req, res) => {
  if (!req.body['plan-title']) {
    return res.render('projects/back-office/create-case-v2/1-plan-title', {
      error: 'Please enter a plan title',
      planTitle: req.session.planTitle
    });
  }
  const isEdit = req.body.isEdit === 'true';
  req.session.planTitle = req.body['plan-title'];
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case-v2/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case-v2/2-plan-type');
  }
});

// Plan type page
router.get('/projects/back-office/create-case-v2/2-plan-type', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case-v2/2-plan-type', {
    planType: req.session.planType,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case-v2/2-plan-type', (req, res) => {
  if (!req.body['plan-type']) {
    return res.render('projects/back-office/create-case-v2/2-plan-type', {
      error: 'Please select a plan type',
      planType: req.session.planType
    });
  }
  const isEdit = req.body.isEdit === 'true';
  req.session.planType = req.body['plan-type'];
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case-v2/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case-v2/3-select-LPA');
  }
});

// Select LPA page
router.get('/projects/back-office/create-case-v2/3-select-LPA', (req, res) => {
  res.render('/projects/back-office/create-case-v2/3-select-LPA', {
    selectedLPA: req.session.lpas ? req.session.lpas[0] : undefined
  });
});

router.post('/projects/back-office/create-case-v2/3-select-LPA', (req, res) => {
  req.session.lpas = [req.body.lpa]; // Start array with first LPA
  res.redirect('/projects/back-office/create-case-v2/add-additional-lpa');
});

// Add additional LPA page
router.get('/projects/back-office/create-case-v2/add-additional-lpa', (req, res) => {
  res.render('projects/back-office/create-case-v2/add-additional-lpa', {
    hasAdditionalLPA: req.session.hasAdditionalLPA
  });
});

router.post('/projects/back-office/create-case-v2/add-additional-lpa', (req, res) => {
  req.session.hasAdditionalLPA = req.body.hasAdditionalLPA;
  if (req.body.hasAdditionalLPA === 'yes') {
    res.redirect('/projects/back-office/create-case-v2/additional-LPA');
  } else {
    res.redirect('/projects/back-office/create-case-v2/main-contact');
  }
});

// Additional LPA page
router.get('/projects/back-office/create-case-v2/additional-LPA', (req, res) => {
  res.render('projects/back-office/create-case-v2/additional-LPA');
});

router.post('/projects/back-office/create-case-v2/additional-LPA', (req, res) => {
  if (!req.session.lpas) req.session.lpas = [];
  req.session.lpas.push(req.body.lpa); // Add new LPA to array
  res.redirect('/projects/back-office/create-case-v2/add-additional-lpa');
});

// Main contact page (single GET route, uses mainContact)
router.get('/projects/back-office/create-case-v2/main-contact', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case-v2/main-contact', {
    lpas: req.session.lpas || [],
    mainContact: req.session.mainContact,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case-v2/main-contact', (req, res) => {
  const isEdit = req.body.isEdit === 'true';
  
  req.session.mainContact = {
    firstName: req.body.mainContactFirstName,
    lastName: req.body.mainContactLastName,
    email: req.body.mainContactEmail,
    phone: req.body.mainContactPhone,
    organisation: req.body.contactOrganisation
  };
  
  if (isEdit) {
    const fromPage = req.query.from || 'check-answers';
    if (fromPage === 'check-contact-details') {
      res.redirect('/projects/back-office/create-case-v2/check-contact-details');
    } else {
      res.redirect('/projects/back-office/create-case-v2/check-answers');
    }
  } else {
    res.redirect('/projects/back-office/create-case-v2/add-another-contact');
  }
});

// Remove main contact
router.post('/projects/back-office/create-case-v2/remove-main-contact', (req, res) => {
  req.session.mainContact = null;
  res.redirect('/projects/back-office/create-case-v2/main-contact');
});

// Remove additional contact
router.post('/projects/back-office/create-case-v2/remove-contact', (req, res) => {
  const idx = parseInt(req.body.index, 10);
  if (Array.isArray(req.session.contacts)) {
    req.session.contacts.splice(idx, 1);
  }
  res.redirect('/projects/back-office/create-case-v2/check-contact-details');
});
// Check contact details page
router.get('/projects/back-office/create-case-v2/check-contact-details', (req, res) => {
  res.render('projects/back-office/create-case-v2/check-contact-details', {
    mainContact: req.session.mainContact,
    contacts: req.session.contacts || []
  });
});

// Add another contact page
router.get('/projects/back-office/create-case-v2/add-another-contact', (req, res) => {
  res.render('projects/back-office/create-case-v2/add-another-contact', {
    addAnotherContact: req.session.addAnotherContact,
    contacts: req.session.contacts || []
  });
});

router.post('/projects/back-office/create-case-v2/add-another-contact', (req, res) => {
  req.session.addAnotherContact = req.body.addAnotherContact;
  if (req.body.addAnotherContact === 'yes') {
    res.redirect('/projects/back-office/create-case-v2/additional-contact');
  } else {
    res.redirect('/projects/back-office/create-case-v2/check-contact-details');
  }
});

// Additional contact add/edit
router.get('/projects/back-office/create-case-v2/additional-contact', (req, res) => {
  let contact = {};
  let editIndex = req.query.edit;
  let fromCheckAnswers = req.query.from === 'check-answers';
  
  if (
    typeof editIndex !== 'undefined' &&
    req.session.contacts &&
    Array.isArray(req.session.contacts) &&
    !isNaN(Number(editIndex)) &&
    req.session.contacts[Number(editIndex)]
  ) {
    editIndex = Number(editIndex);
    contact = req.session.contacts[editIndex];
  } else {
    if (req.session.lpas && req.session.lpas.length > 0) {
      contact.organisation = req.session.lpas[0];
    }
    editIndex = '';
  }
  res.render('projects/back-office/create-case-v2/additional-contact', {
    lpas: req.session.lpas || [],
    contact,
    editIndex,
    fromCheckAnswers
  });
});

router.post('/projects/back-office/create-case-v2/additional-contact', (req, res) => {
  if (!req.session.contacts) req.session.contacts = [];
  const fromCheckAnswers = req.body.fromCheckAnswers === 'true';
  const fromCheckContactDetails = req.query.from === 'check-contact-details' || req.body.from === 'check-contact-details';
  
  if (req.body.editIndex !== undefined && req.body.editIndex !== '') {
    // Editing an existing contact
    req.session.contacts[req.body.editIndex] = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      organisation: req.body.contactOrganisation
    };
    
    if (fromCheckContactDetails) {
      return res.redirect('/projects/back-office/create-case-v2/check-contact-details');
    } else {
      return res.redirect('/projects/back-office/create-case-v2/check-answers');
    }
  } else {
    // Adding a new contact
    req.session.contacts.push({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      organisation: req.body.contactOrganisation
    });
    
    if (fromCheckAnswers || fromCheckContactDetails) {
      if (fromCheckContactDetails) {
        return res.redirect('/projects/back-office/create-case-v2/check-contact-details');
      } else {
        return res.redirect('/projects/back-office/create-case-v2/check-answers');
      }
    } else {
      return res.redirect('/projects/back-office/create-case-v2/add-another-contact');
    }
  }
});

router.get('/projects/back-office/create-case-v2/remove-contact-details-page', (req, res) => {
  const editIndex = req.query.edit;
  const type = req.query.type;
  let contact = null;
  let isMain = false;

  if (type === 'main') {
    contact = req.session.mainContact;
    isMain = true;
  } else if (
    typeof editIndex !== 'undefined' &&
    req.session.contacts &&
    Array.isArray(req.session.contacts) &&
    !isNaN(Number(editIndex)) &&
    req.session.contacts[Number(editIndex)]
  ) {
    contact = req.session.contacts[Number(editIndex)];
  }

  res.render('projects/back-office/create-case-v2/remove-contact-details', {
    contact,
    editIndex,
    isMain
  });
});

router.post('/projects/back-office/create-case-v2/remove-contact-details-page', (req, res) => {
  const editIndex = req.body.editIndex;
  const isMain = req.body.isMain === 'true';

  if (isMain) {
    req.session.mainContact = undefined;
    // Redirect to main contact page to force user to add a new one
    return res.redirect('/projects/back-office/create-case-v2/main-contact');
  } else if (
    typeof editIndex !== 'undefined' &&
    req.session.contacts &&
    Array.isArray(req.session.contacts) &&
    !isNaN(Number(editIndex))
  ) {
    req.session.contacts.splice(Number(editIndex), 1);
  }

  res.redirect('/projects/back-office/create-case-v2/check-contact-details');
});

// Enter key dates page
router.get('/projects/back-office/create-case-v2/enter-key-dates', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case-v2/enter-key-dates', {
    mainContact: req.session.mainContact,
    contacts: req.session.contacts || [],
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case-v2/enter-key-dates', (req, res) => {
  const isEdit = req.body.isEdit === 'true';
  req.session.noticeOfIntentionDate = `${req.body['notice-of-intention-date-day'] || ''}/${req.body['notice-of-intention-date-month'] || ''}/${req.body['notice-of-intention-date-year'] || ''}`;
  req.session.gateway1Date = `${req.body['gateway-1-date-day'] || ''}/${req.body['gateway-1-date-month'] || ''}/${req.body['gateway-1-date-year'] || ''}`;
  req.session.gateway2Date = `${req.body['gateway-2-date-day'] || ''}/${req.body['gateway-2-date-month'] || ''}/${req.body['gateway-2-date-year'] || ''}`;
  req.session.gateway3Date = `${req.body['gateway-3-date-day'] || ''}/${req.body['gateway-3-date-month'] || ''}/${req.body['gateway-3-date-year'] || ''}`;
  req.session.submissionDate = `${req.body['submission-date-day'] || ''}/${req.body['submission-date-month'] || ''}/${req.body['submission-date-year'] || ''}`;
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case-v2/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case-v2/check-answers');
  }
});

// Check answers page
router.get('/projects/back-office/create-case-v2/check-answers', (req, res) => {
  if (!req.session.contacts) req.session.contacts = [];
  if (!req.session.secondaryLPAContacts) req.session.secondaryLPAContacts = [];
  res.render('/projects/back-office/create-case-v2/check-answers', {
    mainContact: req.session.mainContact,
    contacts: req.session.contacts,
    secondaryLPAContacts: req.session.secondaryLPAContacts,
    planTitle: req.session.planTitle,
    planType: req.session.planType,
    lpas: req.session.lpas,
    caseOfficer: req.session.caseOfficer,
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate
  });
});

router.post('/projects/back-office/create-case-v2/check-answers', (req, res) => {
  // Initialize cases array if it doesn't exist
  if (!req.session.cases) req.session.cases = [];
  
  // Generate case reference number
  const caseRef = `PLAN/${String(req.session.cases.length + 1).padStart(6, '0')}`;
  
  // Create the case object
  const newCase = {
    caseRef: caseRef,
    planTitle: req.session.planTitle,
    planType: req.session.planType,
    caseOfficer: req.session.caseOfficer,
    lpas: req.session.lpas,
    mainContact: req.session.mainContact,
    contacts: req.session.contacts,
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate,
    status: 'Submitted',
    createdDate: new Date().toISOString()
  };
  
  // Add case to the array
  req.session.cases.push(newCase);
  
  // Store the latest case reference for the confirmation page
  req.session.latestCaseRef = caseRef;
  
  res.redirect('/projects/back-office/create-case-v2/confirmation');
});

// Confirmation page
router.get('/projects/back-office/create-case-v2/confirmation', (req, res) => {
  res.render('projects/back-office/create-case-v2/confirmation', {
    caseRef: req.session.latestCaseRef || 'PLAN/000001'
  });
});

router.get('/projects/back-office/create-case-v2/clear-data', (req, res) => {
  req.session.contacts = [];
  req.session.mainContact = undefined;
  req.session.lpas = [];
  req.session.caseOfficer = undefined;
  req.session.planTitle = undefined;
  req.session.planType = undefined;
  req.session.noticeOfIntentionDate = undefined;
  req.session.gateway1Date = undefined;
  req.session.gateway2Date = undefined;
  req.session.gateway3Date = undefined;
  req.session.submissionDate = undefined;
  req.session.secondaryLPAContacts = [];
  req.session.cases = []; // Clear all cases
  req.session.latestCaseRef = undefined;
  req.session.data = {}; // Also clear the default data object
  req.session.save(() => {
    res.redirect('/projects/back-office/create-case-v2/index');
  });
});

module.exports = router;