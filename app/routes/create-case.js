
const express = require('express');
const router = express.Router();

// Create a local plan case
// Start page
// Show the form
router.get('/projects/back-office/create-case/index', (req, res) => {
  res.render('projects/back-office/create-case/index');
});

// Case officer
router.post('/projects/back-office/create-case/0-case-officer-name', (req, res) => {
  if (!req.body.caseOfficer) {
    return res.render('projects/back-office/create-case/0-case-officer-name', {
      error: 'Please select a case officer',
      caseOfficer: req.session.caseOfficer,
      lpa: req.session.lpa
    });
  }
  req.session.caseOfficer = req.body.caseOfficer;
  req.session.lpa = req.body.lpa;
  res.redirect('/projects/back-office/create-case/1-plan-title');
});

// Plan title page
router.get('/projects/back-office/create-case/1-plan-title', (req, res) => {
  res.render('projects/back-office/create-case/1-plan-title', {
    planTitle: req.session.planTitle
  });
});

router.post('/projects/back-office/create-case/1-plan-title', (req, res) => {
  if (!req.body['plan-title']) {
    return res.render('projects/back-office/create-case/1-plan-title', {
      error: 'Please enter a plan title',
      planTitle: req.session.planTitle
    });
  }
  req.session.planTitle = req.body['plan-title'];
  res.redirect('/projects/back-office/create-case/2-plan-type');
});
// Plan type page
router.get('/projects/back-office/create-case/2-plan-type', (req, res) => {
  res.render('projects/back-office/create-case/2-plan-type', {
    planType: req.session.planType
  });
});

router.post('/projects/back-office/create-case/2-plan-type', (req, res) => {
  if (!req.body['plan-type']) {
    return res.render('projects/back-office/create-case/2-plan-type', {
      error: 'Please select a plan type',
      planType: req.session.planType
    });
  }
  req.session.planType = req.body['plan-type'];
  res.redirect('/projects/back-office/create-case/3-select-LPA');
});
// Select LPA page
router.get('/projects/back-office/create-case/3-select-LPA', (req, res) => {
  res.render('projects/back-office/create-case/3-select-LPA', {
    selectedLPA: req.session.selectedLPA
  });
});

router.post('/projects/back-office/create-case/3-select-LPA', (req, res) => {
  req.session.selectedLPA = req.body.lpa;
  res.redirect('/projects/back-office/create-case/3a-LPA-region');
});

// LPA region page
router.get('/projects/back-office/create-case/3a-LPA-region', (req, res) => {
  res.render('projects/back-office/create-case/3a-LPA-region', {
    selectedRegion: req.session.selectedRegion
  });
});

router.post('/projects/back-office/create-case/3a-LPA-region', (req, res) => {
  req.session.selectedRegion = req.body.region;
  res.redirect('/projects/back-office/create-case/4-lead-contact-name');
});

// Lead contact name page
router.get('/projects/back-office/create-case/4-lead-contact-name', (req, res) => {
  res.render('projects/back-office/create-case/4-lead-contact-name', {
    leadContactFirstName: req.session.data.leadContactFirstName,
    leadContactLastName: req.session.data.leadContactLastName
  });
});

router.post('/projects/back-office/create-case/4-lead-contact-name', (req, res) => {
  // Only use these fields for lead contact, not tempContact
  console.log('POST /4-lead-contact-name', req.body);
  req.session.data.leadContactFirstName = req.body['interested-first-name'];
  req.session.data.leadContactLastName = req.body['interested-last-name'];
  res.redirect('/projects/back-office/create-case/5-lead-email-address');
});

// Lead contact email address page
router.get('/projects/back-office/create-case/5-lead-email-address', (req, res) => {
  console.log('GET /5-lead-email-address', req.session.data.leadContactEmail);
  res.render('projects/back-office/create-case/5-lead-email-address', {
    leadContactEmail: req.session.data.leadContactEmail
  });
});

router.post('/projects/back-office/create-case/5-lead-email-address', (req, res) => {
  // Only use this field for lead contact, not tempContact
  req.session.data.leadContactEmail = req.body['lead-email-address'];
  res.redirect('/projects/back-office/create-case/6-lead-phone-number');
});

// Lead contact phone number page
router.get('/projects/back-office/create-case/6-lead-phone-number', (req, res) => {
  res.render('projects/back-office/create-case/6-lead-phone-number', {
    leadContactPhone: req.session.data.leadContactPhone
  });
});

router.post('/projects/back-office/create-case/6-lead-phone-number', (req, res) => {
  // Only use this field for lead contact, not tempContact
  req.session.data.leadContactPhone = req.body.phoneNumber;
  res.redirect('/projects/back-office/create-case/7-add-secondary');
});

// Add secondary LPA page
router.get('/projects/back-office/create-case/7-add-secondary', (req, res) => {
  res.render('projects/back-office/create-case/7-add-secondary', {
    hasSecondaryLPA: req.session.hasSecondaryLPA
  });
});

router.post('/projects/back-office/create-case/7-add-secondary', (req, res) => {
  req.session.hasSecondaryLPA = req.body.hasSecondaryLPA;
  if (req.body.hasSecondaryLPA === 'yes') {
    res.redirect('/projects/back-office/create-case/8-secondary-LPA');
  } else {
    res.redirect('/projects/back-office/create-case/add-another-contact');
  }
});

// Secondary LPA page
router.get('/projects/back-office/create-case/8-secondary-LPA', (req, res) => {
  res.render('projects/back-office/create-case/8-secondary-LPA', {
    secondaryLPA: req.session.secondaryLPA
  });
});

router.post('/projects/back-office/create-case/8-secondary-LPA', (req, res) => {
  req.session.secondaryLPA = req.body.lpa;
  res.redirect('/projects/back-office/create-case/8a-secondary-LPA-region');
});

// Secondary LPA region page
router.get('/projects/back-office/create-case/8a-secondary-LPA-region', (req, res) => {
  res.render('projects/back-office/create-case/8a-secondary-LPA-region', {
    secondaryLPARegion: req.session.secondaryLPARegion
  });
});

router.post('/projects/back-office/create-case/8a-secondary-LPA-region', (req, res) => {
  req.session.secondaryLPARegion = req.body.lpa;
  res.redirect('/projects/back-office/create-case/9-secondary-LPA-contact-name');
});

// Secondary LPA contact name page
router.get('/projects/back-office/create-case/9-secondary-LPA-contact-name', (req, res) => {
  const tempContact = req.session.tempContact || {};
  res.render('projects/back-office/create-case/9-secondary-LPA-contact-name', {
    secondaryContactFirstName: tempContact.firstName || '',
    secondaryContactLastName: tempContact.lastName || ''
  });
});

router.post('/projects/back-office/create-case/9-secondary-LPA-contact-name', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.firstName = req.body['contact-first-name'];
  req.session.tempContact.lastName = req.body['contact-last-name'];
  res.redirect('/projects/back-office/create-case/10-secondary-LPA-email-address');
});

// Secondary LPA contact email page
router.get('/projects/back-office/create-case/10-secondary-LPA-email-address', (req, res) => {
  const tempContact = req.session.tempContact || {};
  res.render('projects/back-office/create-case/10-secondary-LPA-email-address', {
    secondaryContactEmail: tempContact.email || ''
  });
});

router.post('/projects/back-office/create-case/10-secondary-LPA-email-address', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.email = req.body['contact-email-address'];
  res.redirect('/projects/back-office/create-case/11-secondary-LPA-phone-number');
});

// Secondary LPA contact phone number page
router.get('/projects/back-office/create-case/11-secondary-LPA-phone-number', (req, res) => {
  const tempContact = req.session.tempContact || {};
  res.render('projects/back-office/create-case/11-secondary-LPA-phone-number', {
    secondaryContactPhone: tempContact.phone || ''
  });
});

router.post('/projects/back-office/create-case/11-secondary-LPA-phone-number', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.phone = req.body['phone-number'];
  // Save tempContact to secondaryLPAContacts array
  if (!req.session.secondaryLPAContacts) req.session.secondaryLPAContacts = [];
  if (req.session.tempContact.firstName) {
    req.session.secondaryLPAContacts.push({
      firstName: req.session.tempContact.firstName,
      lastName: req.session.tempContact.lastName,
      email: req.session.tempContact.email,
      phone: req.session.tempContact.phone
    });
    req.session.tempContact = {};
  }
  res.redirect('/projects/back-office/create-case/add-another-contact');
});


// Add another contact page
router.get('/projects/back-office/create-case/add-another-contact', (req, res) => {
  res.render('projects/back-office/create-case/add-another-contact', {
    addAnotherContact: req.session.addAnotherContact
  });
});

router.post('/projects/back-office/create-case/add-another-contact', (req, res) => {
  req.session.addAnotherContact = req.body.addAnotherContact;
  // If yes, loop back to contact-name for another contact
  if (req.body.addAnotherContact === 'yes') {
    res.redirect('/projects/back-office/create-case/contact-name');
  } else {
    res.redirect('/projects/back-office/create-case/enter-key-dates');
  }
});

// Contact name page
router.get('/projects/back-office/create-case/contact-name', (req, res) => {
  res.render('projects/back-office/create-case/contact-name', {
    contactFirstName: req.session.tempContact.firstName || '',
    contactLastName: req.session.tempContact.lastName || ''
  });
});

router.post('/projects/back-office/create-case/contact-name', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.firstName = req.body['contact-first-name'];
  req.session.tempContact.lastName = req.body['contact-last-name'];
  res.redirect('/projects/back-office/create-case/email-address');
});

// Contact email address page
router.get('/projects/back-office/create-case/email-address', (req, res) => {
  res.render('projects/back-office/create-case/email-address', {
    contactEmail: req.session.tempContact.email || ''
  });
});

router.post('/projects/back-office/create-case/email-address', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.email = req.body['contact-email-address'];
  res.redirect('/projects/back-office/create-case/phone-number');
});

// Contact phone number page
router.get('/projects/back-office/create-case/phone-number', (req, res) => {
  res.render('projects/back-office/create-case/phone-number', {
    contactPhone: req.session.tempContact.phone || ''
  });
}); 
router.post('/projects/back-office/create-case/phone-number', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.phone = req.body['phone-number'];
  // Save tempContact to contacts array (for additional contacts)
  if (!req.session.contacts) req.session.contacts = [];
  if (req.session.tempContact.firstName) {
    req.session.contacts.push({
      firstName: req.session.tempContact.firstName,
      lastName: req.session.tempContact.lastName,
      email: req.session.tempContact.email,
      phone: req.session.tempContact.phone
    });
    req.session.tempContact = {};
  }
  res.redirect('/projects/back-office/create-case/add-another-contact');
});


// Enter key dates page

router.get('/projects/back-office/create-case/enter-key-dates', (req, res) => {
  res.render('projects/back-office/create-case/enter-key-dates', {
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate
  });
});

router.post('/projects/back-office/create-case/enter-key-dates', (req, res) => {
  req.session.noticeOfIntentionDate = `${req.body['notice-of-intention-date-day'] || ''}/${req.body['notice-of-intention-date-month'] || ''}/${req.body['notice-of-intention-date-year'] || ''}`;
  req.session.gateway1Date = `${req.body['gateway-1-date-day'] || ''}/${req.body['gateway-1-date-month'] || ''}/${req.body['gateway-1-date-year'] || ''}`;
  req.session.gateway2Date = `${req.body['gateway-2-date-day'] || ''}/${req.body['gateway-2-date-month'] || ''}/${req.body['gateway-2-date-year'] || ''}`;
  req.session.gateway3Date = `${req.body['gateway-3-date-day'] || ''}/${req.body['gateway-3-date-month'] || ''}/${req.body['gateway-3-date-year'] || ''}`;
  req.session.submissionDate = `${req.body['submission-date-day'] || ''}/${req.body['submission-date-month'] || ''}/${req.body['submission-date-year'] || ''}`;
  res.redirect('/projects/back-office/create-case/check-answers');
});

// Check answers page
router.get('/projects/back-office/create-case/check-answers', (req, res) => {
  // Ensure contacts and secondaryLPAContacts are always arrays
  if (!req.session.contacts) req.session.contacts = [];
  if (!req.session.secondaryLPAContacts) req.session.secondaryLPAContacts = [];
  console.log("Check-answers debug:", {
    data: req.session.data,
    contacts: req.session.contacts,
    secondaryLPAContacts: req.session.secondaryLPAContacts,
    planTitle: req.session.planTitle,
    planType: req.session.planType,
    selectedLPA: req.session.selectedLPA,
    selectedRegion: req.session.selectedRegion,
    secondaryLPA: req.session.secondaryLPA,
    secondaryLPARegion: req.session.secondaryLPARegion,
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate
  });
  res.render('/projects/back-office/create-case/check-answers', {
    data: req.session.data,
    contacts: req.session.contacts,
    secondaryLPAContacts: req.session.secondaryLPAContacts,
    planTitle: req.session.planTitle,
    planType: req.session.planType,
    selectedLPA: req.session.selectedLPA,
    selectedRegion: req.session.selectedRegion,
    secondaryLPA: req.session.secondaryLPA,
    secondaryLPARegion: req.session.secondaryLPARegion,
    caseOfficer: req.session.caseOfficer,
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate
  });
}); 


module.exports = router;