

//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Debug middleware - log session data on every request
router.use((req, res, next) => {
  console.log('\n--- Session Data ---');
  console.log('URL:', req.url);
  console.log('Session data:', req.session.data);
  console.log('------------------\n');
  next();
});

// uploads handling
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

// Create a local plan case
// Start page
// Show the form
router.get('/flows/back-office/create/lpa/index', (req, res) => {
  res.render('flows/back-office/create/lpa/index');
});

// Case officer
router.post('/flows/back-office/create/lpa/0-case-officer-name', (req, res) => {
  if (!req.body.caseOfficer) {
    return res.render('flows/back-office/create/lpa/0-case-officer-name', {
      error: 'Please select a case officer',
      caseOfficer: req.session.caseOfficer,
      lpa: req.session.lpa
    });
  }
  req.session.caseOfficer = req.body.caseOfficer;
  req.session.lpa = req.body.lpa;
  res.redirect('/flows/back-office/create/lpa/1-plan-title');
});

// Plan title page
router.get('/flows/back-office/create/lpa/1-plan-title', (req, res) => {
  res.render('flows/back-office/create/lpa/1-plan-title', {
    planTitle: req.session.planTitle
  });
});

router.post('/flows/back-office/create/lpa/1-plan-title', (req, res) => {
  if (!req.body['plan-title']) {
    return res.render('flows/back-office/create/lpa/1-plan-title', {
      error: 'Please enter a plan title',
      planTitle: req.session.planTitle
    });
  }
  req.session.planTitle = req.body['plan-title'];
  res.redirect('/flows/back-office/create/lpa/2-plan-type');
});
// Plan type page
router.get('/flows/back-office/create/lpa/2-plan-type', (req, res) => {
  res.render('flows/back-office/create/lpa/2-plan-type', {
    planType: req.session.planType
  });
});

router.post('/flows/back-office/create/lpa/2-plan-type', (req, res) => {
  if (!req.body['plan-type']) {
    return res.render('flows/back-office/create/lpa/2-plan-type', {
      error: 'Please select a plan type',
      planType: req.session.planType
    });
  }
  req.session.planType = req.body['plan-type'];
  res.redirect('/flows/back-office/create/lpa/3-select-LPA');
});
// Select LPA page
router.get('/flows/back-office/create/lpa/3-select-LPA', (req, res) => {
  res.render('flows/back-office/create/lpa/3-select-LPA', {
    selectedLPA: req.session.selectedLPA
  });
});

router.post('/flows/back-office/create/lpa/3-select-LPA', (req, res) => {
  req.session.selectedLPA = req.body.lpa;
  res.redirect('/flows/back-office/create/lpa/3a-LPA-region');
});

// LPA region page
router.get('/flows/back-office/create/lpa/3a-LPA-region', (req, res) => {
  res.render('flows/back-office/create/lpa/3a-LPA-region', {
    selectedRegion: req.session.selectedRegion
  });
});

router.post('/flows/back-office/create/lpa/3a-LPA-region', (req, res) => {
  req.session.selectedRegion = req.body.region;
  res.redirect('/flows/back-office/create/lpa/4-lead-contact-name');
});

// Lead contact name page
router.get('/flows/back-office/create/lpa/4-lead-contact-name', (req, res) => {
  res.render('flows/back-office/create/lpa/4-lead-contact-name', {
    leadContactFirstName: req.session.data.leadContactFirstName,
    leadContactLastName: req.session.data.leadContactLastName
  });
});

router.post('/flows/back-office/create/lpa/4-lead-contact-name', (req, res) => {
  // Only use these fields for lead contact, not tempContact
  console.log('POST /4-lead-contact-name', req.body);
  req.session.data.leadContactFirstName = req.body['interested-first-name'];
  req.session.data.leadContactLastName = req.body['interested-last-name'];
  res.redirect('/flows/back-office/create/lpa/5-lead-email-address');
});

// Lead contact email address page
router.get('/flows/back-office/create/lpa/5-lead-email-address', (req, res) => {
  console.log('GET /5-lead-email-address', req.session.data.leadContactEmail);
  res.render('flows/back-office/create/lpa/5-lead-email-address', {
    leadContactEmail: req.session.data.leadContactEmail
  });
});

router.post('/flows/back-office/create/lpa/5-lead-email-address', (req, res) => {
  // Only use this field for lead contact, not tempContact
  req.session.data.leadContactEmail = req.body['lead-email-address'];
  res.redirect('/flows/back-office/create/lpa/6-lead-phone-number');
});

// Lead contact phone number page
router.get('/flows/back-office/create/lpa/6-lead-phone-number', (req, res) => {
  res.render('flows/back-office/create/lpa/6-lead-phone-number', {
    leadContactPhone: req.session.data.leadContactPhone
  });
});

router.post('/flows/back-office/create/lpa/6-lead-phone-number', (req, res) => {
  // Only use this field for lead contact, not tempContact
  req.session.data.leadContactPhone = req.body.phoneNumber;
  res.redirect('/flows/back-office/create/lpa/7-add-secondary');
});

// Add secondary LPA page
router.get('/flows/back-office/create/lpa/7-add-secondary', (req, res) => {
  res.render('flows/back-office/create/lpa/7-add-secondary', {
    hasSecondaryLPA: req.session.hasSecondaryLPA
  });
});

router.post('/flows/back-office/create/lpa/7-add-secondary', (req, res) => {
  req.session.hasSecondaryLPA = req.body.hasSecondaryLPA;
  if (req.body.hasSecondaryLPA === 'yes') {
    res.redirect('/flows/back-office/create/lpa/8-secondary-LPA');
  } else {
    res.redirect('/flows/back-office/create/lpa/add-another-contact');
  }
});

// Secondary LPA page
router.get('/flows/back-office/create/lpa/8-secondary-LPA', (req, res) => {
  res.render('flows/back-office/create/lpa/8-secondary-LPA', {
    secondaryLPA: req.session.secondaryLPA
  });
});

router.post('/flows/back-office/create/lpa/8-secondary-LPA', (req, res) => {
  req.session.secondaryLPA = req.body.lpa;
  res.redirect('/flows/back-office/create/lpa/8a-secondary-LPA-region');
});

// Secondary LPA region page
router.get('/flows/back-office/create/lpa/8a-secondary-LPA-region', (req, res) => {
  res.render('flows/back-office/create/lpa/8a-secondary-LPA-region', {
    secondaryLPARegion: req.session.secondaryLPARegion
  });
});

router.post('/flows/back-office/create/lpa/8a-secondary-LPA-region', (req, res) => {
  req.session.secondaryLPARegion = req.body.lpa;
  res.redirect('/flows/back-office/create/lpa/9-secondary-LPA-contact-name');
});

// Secondary LPA contact name page
router.get('/flows/back-office/create/lpa/9-secondary-LPA-contact-name', (req, res) => {
  const tempContact = req.session.tempContact || {};
  res.render('flows/back-office/create/lpa/9-secondary-LPA-contact-name', {
    secondaryContactFirstName: tempContact.firstName || '',
    secondaryContactLastName: tempContact.lastName || ''
  });
});

router.post('/flows/back-office/create/lpa/9-secondary-LPA-contact-name', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.firstName = req.body['contact-first-name'];
  req.session.tempContact.lastName = req.body['contact-last-name'];
  res.redirect('/flows/back-office/create/lpa/10-secondary-LPA-email-address');
});

// Secondary LPA contact email page
router.get('/flows/back-office/create/lpa/10-secondary-LPA-email-address', (req, res) => {
  const tempContact = req.session.tempContact || {};
  res.render('flows/back-office/create/lpa/10-secondary-LPA-email-address copy', {
    secondaryContactEmail: tempContact.email || ''
  });
});

router.post('/flows/back-office/create/lpa/10-secondary-LPA-email-address', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.email = req.body['contact-email-address'];
  res.redirect('/flows/back-office/create/lpa/11-secondary-LPA-phone-number');
});

// Secondary LPA contact phone number page
router.get('/flows/back-office/create/lpa/11-secondary-LPA-phone-number', (req, res) => {
  const tempContact = req.session.tempContact || {};
  res.render('flows/back-office/create/lpa/11-secondary-LPA-phone-number', {
    secondaryContactPhone: tempContact.phone || ''
  });
});

router.post('/flows/back-office/create/lpa/11-secondary-LPA-phone-number', (req, res) => {
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
  res.redirect('/flows/back-office/create/lpa/add-another-contact');
});


// Add another contact page
router.get('/flows/back-office/create/lpa/add-another-contact', (req, res) => {
  res.render('flows/back-office/create/lpa/add-another-contact', {
    addAnotherContact: req.session.addAnotherContact
  });
});

router.post('/flows/back-office/create/lpa/add-another-contact', (req, res) => {
  req.session.addAnotherContact = req.body.addAnotherContact;
  // If yes, loop back to contact-name for another contact
  if (req.body.addAnotherContact === 'yes') {
    res.redirect('/flows/back-office/create/lpa/contact-name');
  } else {
    res.redirect('/flows/back-office/create/lpa/enter-key-dates');
  }
});

// Contact name page
router.get('/flows/back-office/create/lpa/contact-name', (req, res) => {
  res.render('flows/back-office/create/lpa/contact-name', {
    contactFirstName: req.session.tempContact.firstName || '',
    contactLastName: req.session.tempContact.lastName || ''
  });
});

router.post('/flows/back-office/create/lpa/contact-name', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.firstName = req.body['contact-first-name'];
  req.session.tempContact.lastName = req.body['contact-last-name'];
  res.redirect('/flows/back-office/create/lpa/email-address');
});

// Contact email address page
router.get('/flows/back-office/create/lpa/email-address', (req, res) => {
  res.render('flows/back-office/create/lpa/email-address', {
    contactEmail: req.session.tempContact.email || ''
  });
});

router.post('/flows/back-office/create/lpa/email-address', (req, res) => {
  if (!req.session.tempContact) req.session.tempContact = {};
  req.session.tempContact.email = req.body['contact-email-address'];
  res.redirect('/flows/back-office/create/lpa/phone-number');
});

// Contact phone number page
router.get('/flows/back-office/create/lpa/phone-number', (req, res) => {
  res.render('flows/back-office/create/lpa/phone-number', {
    contactPhone: req.session.tempContact.phone || ''
  });
}); 
router.post('/flows/back-office/create/lpa/phone-number', (req, res) => {
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
  res.redirect('/flows/back-office/create/lpa/add-another-contact');
});


// Enter key dates page

router.get('/flows/back-office/create/lpa/enter-key-dates', (req, res) => {
  res.render('flows/back-office/create/lpa/enter-key-dates', {
    noticeOfIntentionDate: req.session.noticeOfIntentionDate,
    gateway1Date: req.session.gateway1Date,
    gateway2Date: req.session.gateway2Date,
    gateway3Date: req.session.gateway3Date,
    submissionDate: req.session.submissionDate
  });
});

router.post('/flows/back-office/create/lpa/enter-key-dates', (req, res) => {
  req.session.noticeOfIntentionDate = `${req.body['notice-of-intention-date-day'] || ''}/${req.body['notice-of-intention-date-month'] || ''}/${req.body['notice-of-intention-date-year'] || ''}`;
  req.session.gateway1Date = `${req.body['gateway-1-date-day'] || ''}/${req.body['gateway-1-date-month'] || ''}/${req.body['gateway-1-date-year'] || ''}`;
  req.session.gateway2Date = `${req.body['gateway-2-date-day'] || ''}/${req.body['gateway-2-date-month'] || ''}/${req.body['gateway-2-date-year'] || ''}`;
  req.session.gateway3Date = `${req.body['gateway-3-date-day'] || ''}/${req.body['gateway-3-date-month'] || ''}/${req.body['gateway-3-date-year'] || ''}`;
  req.session.submissionDate = `${req.body['submission-date-day'] || ''}/${req.body['submission-date-month'] || ''}/${req.body['submission-date-year'] || ''}`;
  res.redirect('/flows/back-office/create/lpa/check-answers');
});

// Check answers page
router.get('/flows/back-office/create/lpa/check-answers', (req, res) => {
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
  res.render('flows/back-office/create/lpa/check-answers', {
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



// Register a local plan on the portal
// Email address page

router.get('/portal/email-address', function (req, res) {
  res.render('portal/email-address');
});

// Add GET route for /portal/request-new-code
router.get('/portal/request-new-code', function (req, res) {
  res.render('portal/request-new-code');
});

router.post('/portal/enter-code-success', function (req, res) {
  res.redirect('/portal/tasklist');
});






// Comment on a local plan representation journey

  // Start page
router.get('/local-plan-representations/start', function (req, res) {
  res.render('local-plan-representations/start');
});

 // Who are you representing?

router.post('/local-plan-representations/who-are-you-representing', function (req, res) {
  const choice = req.body['examination-submitting-for'];

 
  req.session.data['examination-submitting-for'] = choice;

  if (choice === 'myself') {
    res.redirect('/local-plan-representations/name');
  } else if (choice === 'another') {
    res.redirect('/local-plan-representations/agent-person');
  } else if (choice === 'organisation') {
    res.redirect('/local-plan-representations/agent');
  }
});


// Myself



 // What is your name?
router.post('/local-plan-representations/name', function (req, res) {
 
  req.session.data['interested-first-name'] = req.body['interested-first-name'];
  req.session.data['interested-last-name'] = req.body['interested-last-name'];

 
  res.redirect('/local-plan-representations/email-address');
});


 // What is your email address?

router.post('/local-plan-representations/email', function (req, res) {
  req.session.data['email-address'] = req.body['email-address'];
  res.redirect('/local-plan-representations/address');
});


// What is your address?
router.post('/local-plan-representations/address', function (req, res) {
  req.session.data['address-line-1'] = req.body['address-line-1'];
  req.session.data['address-line-2'] = req.body['address-line-2'];
  req.session.data['town'] = req.body['town'];
  req.session.data['county'] = req.body['county'];
  req.session.data['postcode'] = req.body['postcode'];
  res.redirect('/local-plan-representations/part-of-plan');
});


// Another person

// Are you acting as an agent on behalf of a client?
router.post('/local-plan-representations/agent-person', function (req, res) {
  req.session.data['agent-person'] = req.body['agent-person'];
  
  if (req.body['agent-person'] === 'Yes') {
    res.redirect('/local-plan-representations/organisation-name-another-person');
  } else {
    res.redirect('/local-plan-representations/email-rep-not-agent-person'); 
  }
});

// What is the name of the organisation you work for? **** this section seems to be problematic ****
router.post('/local-plan-representations/organisation-name-another-person', function (req, res) {
  req.session.data['organisation-name-another-person'] = req.body['organisation-name-another-person'];
  res.redirect('/local-plan-representations/email-rep-person');
});

// What is your email address?
router.post('/local-plan-representations/email-rep-person', function (req, res) {
  req.session.data['email-rep-person'] = req.body['email-rep-person'];
  res.redirect('/local-plan-representations/person-representing');
});

// What is your email address? (non-agent)
router.post('/local-plan-representations/email-rep-not-agent-person', function (req, res) {
  req.session.data['email-rep-not-agent-person'] = req.body['email-rep-not-agent-person'];
  res.redirect('/local-plan-representations/person-representing');
}); 

// What is the name of the person you are representing?   
router.post('/local-plan-representations/person-representing', function (req, res) {
  req.session.data['person-first-name'] = req.body['person-first-name'];
  req.session.data['person-last-name'] = req.body['person-last-name'];
  res.redirect('/local-plan-representations/part-of-plan');
});



// Organisation or charity

// Are you acting as an agent on behalf of a client?
router.post('/local-plan-representations/agent', function (req, res) {
  req.session.data['agent'] = req.body['agent'];
  
  if (req.body['agent-person'] === 'Yes') {
    res.redirect('/local-plan-representations/name-of-organisation');
  } else {
    res.redirect('/local-plan-representations/email-rep-not-agent-organisation'); 
  }
});

// What is the name of the organisation you work for?
router.post('/local-plan-representations/name-of-organisation', function (req, res) {
  req.session.data['name-of-organisation'] = req.body['name-of-organisation'];
  res.redirect('/local-plan-representations/email-rep-organisation');
});

// What is your email address?
router.post('/local-plan-representations/email-rep-organisation', function (req, res) {
  req.session.data['email-rep-organisation'] = req.body['email-rep-organisation'];
  res.redirect('/local-plan-representations/organisation-representing');
});

// What is your email address? (non-agent)
router.post('/local-plan-representations/email-rep-not-agent-organisation', function (req, res) {
  req.session.data['email-rep-not-agent-organisation'] = req.body['email-rep-not-agent-organisation'];
  res.redirect('/local-plan-representations/organisation-representing');
}); 

// What is the full name of the organisation or charity that you are representing?
router.post('/local-plan-representations/organisation-representing', function (req, res) {
  req.session.data['organisation-representing'] = req.body['organisation-representing'];
  res.redirect('/local-plan-representations/part-of-plan');
}); 


// Representation comments journey

// Which part of the plan are you commenting on?
router.post('/local-plan-representations/plan-part', function (req, res) {
  req.session.data['paragraph'] = req.body['paragraph'];
  req.session.data['policy'] = req.body['policy'];
  req.session.data['policy-map'] = req.body['policy-map'];
  res.redirect('/local-plan-representations/soundness'); 
});


// Is the plan sound?
router.post('/local-plan-representations/soundness', function (req, res) {
  req.session.data['soundness'] = req.body['soundness'];
  res.redirect('/local-plan-representations/legally-compliant'); 
});

// Is the plan legally compliant?
router.post('/local-plan-representations/legally-compliant', function (req, res) {
  req.session.data['legally-compliant'] = req.body['legally-compliant'];
  res.redirect('/local-plan-representations/duty-to-cooperate'); 
});

// Does the plan meet the duty to cooperate?
router.post('/local-plan-representations/duty-to-cooperate', function (req, res) {
  req.session.data['duty-to-cooperate'] = req.body['duty-to-cooperate'];
  res.redirect('/local-plan-representations/add-your-comment'); 
});

// What is your comment on this part of the plan?
router.post('/local-plan-representations/comment', function (req, res) {
  req.session.data['comment'] = req.body['comment'];
  res.redirect('/local-plan-representations/upload-files-to-support-comment'); 
});

// Do you want to upload documents to support your comment?
router.post('/local-plan-representations/documents-check', function (req, res) {
  req.session.data['wants-to-upload-documents'] = req.body['wants-to-upload-documents'];

  if (req.body['wants-to-upload-documents'] === 'Yes') {
    res.redirect('/document-category/upload-documents');
  } else {
    res.redirect('/local-plan-representations/modifications'); 
  }
});

// Document upload handler
router.post('/document-category/upload-documents', function(req, res, next) {
  console.log('\n=== Upload Request Received ===');
  console.log('Headers:', req.headers);
  console.log('Body before multer:', req.body);
  console.log('Files before multer:', req.files);
  console.log('===========================\n');

  upload.array('upload-documents')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).send(`Upload error: ${err.message}`);
    }

    console.log('\n=== After Multer Processing ===');
    console.log('Files processed:', req.files);
    console.log('============================\n');

    try {
      if (!req.files || req.files.length === 0) {
        console.warn('No files in request after multer processing');
        req.session.data['upload-documents'] = [];
      } else {
        const fileInfo = req.files.map(file => ({
          name: file.originalname,
          size: Math.round(file.size / 1024) + 'KB'
        }));
        
        console.log('Saving to session:', fileInfo);
        req.session.data['upload-documents'] = fileInfo;
        
        // Force session save
        req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          else console.log('Session saved successfully');
        });
      }

      res.redirect('/local-plan-representations/modifications');
    } catch (error) {
      console.error('Error in upload handler:', error);
      res.status(500).send(`Upload processing error: ${error.message}`);
    }
  });
});



// What changes would make this part of the plan legally compliant and sound?

router.post('/local-plan-representations/comments-mod', function (req, res) {
  req.session.data['comments-mod'] = req.body['comments-mod'];
  res.redirect('/local-plan-representations/upload-files-to-support-modifications'); 
});


// Do you want to upload documents to support your suggested changes?
router.post('/local-plan-representations/documents-mod', function (req, res) {
  req.session.data['wants-to-upload-documents-mod'] = req.body['wants-to-upload-documents-mod'];

  if (req.body['wants-to-upload-documents-mod'] === 'Yes') {
    res.redirect('/local-plan-representations/mod-document-category/upload-documents');
  } else {
    res.redirect('/local-plan-representations/hearings'); 
  }
});

// Document upload for modifications
router.post('/local-plan-representations/mod-document-category/upload-documents', function(req, res, next) {
  console.log('\n=== Modifications Upload Request Received ===');
  console.log('Headers:', req.headers);
  console.log('Body before multer:', req.body);
  console.log('Files before multer:', req.files);
  console.log('===========================\n');

  upload.array('upload-documents-mod')(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).send(`Upload error: ${err.message}`);
    }

    console.log('\n=== After Multer Processing ===');
    console.log('Files processed:', req.files);
    console.log('============================\n');

    try {
      if (!req.files || req.files.length === 0) {
        console.warn('No files in request after multer processing');
        req.session.data['upload-documents-mod'] = [];
      } else {
        const fileInfo = req.files.map(file => ({
          name: file.originalname,
          size: Math.round(file.size / 1024) + 'KB'
        }));
        
        console.log('Saving to session:', fileInfo);
        req.session.data['upload-documents-mod'] = fileInfo;
        
        // Force session save
        req.session.save((err) => {
          if (err) console.error('Session save error:', err);
          else console.log('Session saved successfully');
        });
      }

      res.redirect('/local-plan-representations/hearings');
    } catch (error) {
      console.error('Error in upload handler:', error);
      res.status(500).send(`Upload processing error: ${error.message}`);
    }
  });
});

// Do you want to take part in the hearing sessions for this suggested change?
router.post('/local-plan-representations/hearing', function (req, res) {
  req.session.data['hearing'] = req.body['hearing'];

  if (req.body['hearing'] === 'Yes') {
    res.redirect('/local-plan-representations/hearing-participation-comment');
  } else {
    res.redirect('/local-plan-representations/add-another-comment'); 
  }
});

// Why do you want to take part in the hearing sessions for this suggested change?

router.post('/local-plan-representations/comment-hearing', function (req, res) {
  req.session.data['comment-hearing'] = req.body['comment-hearing'];
  res.redirect('/local-plan-representations/add-another-comment'); 
});

// Do you want to comment on another part of the plan?
router.post('/local-plan-representations/add-another-comment', function (req, res) {
  req.session.data['add-another-comment'] = req.body['add-another-comment'];

  if (req.body['add-another-comment'] === 'Yes') {
    // Increment the comment count or initialize it
    const currentCount = req.session.data['number-of-comments'] || 1;
    req.session.data['number-of-comments'] = currentCount + 1;
    
    // Clone the personal details to the new comment's data
    const newIndex = currentCount;
    
    // Copy just the section-specific data to new indexed versions
    const fieldsToReset = [
      'paragraph', 'policy', 'policy-map', 'soundness', 'legally-compliant', 
      'duty-to-cooperate', 'comment', 'comments-mod', 'hearing', 'comment-hearing'
    ];
    
    fieldsToReset.forEach(field => {
      // Save the current comment's data with an index
      if (req.session.data[field]) {
        req.session.data[`${field}-${newIndex - 1}`] = req.session.data[field];
        // Clear the base field for the next comment
        req.session.data[field] = '';
      }
    });

    // Handle file uploads for the previous comment
    if (req.session.data['upload-documents']) {
      req.session.data[`upload-documents-${newIndex - 1}`] = req.session.data['upload-documents'];
      req.session.data['upload-documents'] = [];
    }
    if (req.session.data['upload-documents-mod']) {
      req.session.data[`upload-documents-mod-${newIndex - 1}`] = req.session.data['upload-documents-mod'];
      req.session.data['upload-documents-mod'] = [];
    }

    res.redirect('/local-plan-representations/part-of-plan');
  } else {
    // If this is the last comment, save its data with an index
    const currentCount = req.session.data['number-of-comments'] || 1;
    const lastIndex = currentCount - 1;
    
    const fieldsToSave = [
      'paragraph', 'policy', 'policy-map', 'soundness', 'legally-compliant', 
      'duty-to-cooperate', 'comment', 'comments-mod', 'hearing', 'comment-hearing'
    ];
    
    fieldsToSave.forEach(field => {
      if (req.session.data[field]) {
        req.session.data[`${field}-${lastIndex}`] = req.session.data[field];
      }
    });

    // Handle file uploads for the last comment
    if (req.session.data['upload-documents']) {
      req.session.data[`upload-documents-${lastIndex}`] = req.session.data['upload-documents'];
    }
    if (req.session.data['upload-documents-mod']) {
      req.session.data[`upload-documents-mod-${lastIndex}`] = req.session.data['upload-documents-mod'];
    }

    res.redirect('/local-plan-representations/multiple-answers');
  }
});


// Check your answers
router.post('/local-plan-representations/answers', function (req, res) {
  res.redirect('/local-plan-representations/declaration');
});

// Declaration
router.post('/local-plan-representations/declaration', function (req, res) {
  res.redirect('/local-plan-representations/representation-submitted');
});

