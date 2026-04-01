const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Helper function to format planType for display
function formatPlanType(planType) {
  if (!planType) return '';
  const planTypeMap = {
    'local-plan': 'Local Plan',
    'Local Plan': 'Local Plan'
  };
  return planTypeMap[planType] || planType;
}

// Index overview page GET (display all case data)
router.get('/projects/back-office/manage/index.html', (req, res) => {
  // Combine first and last names for display
  const mainContactName = req.session.mainContact ? 
    [req.session.mainContact.firstName, req.session.mainContact.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || '' : '';
  
  // Initialize contacts array from create-case-v2 or use individual contact fields
  let contactsArray = req.session.contacts || [];
  
  // Filter out empty contacts and build display names
  const contactNames = contactsArray
    .filter(contact => contact.firstName || contact.lastName || contact.email)
    .map((contact, index) => {
      const name = [contact.firstName, contact.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() || '';
      return {
        index: index + 1,
        name: name,
        email: contact.email || '',
        phone: contact.phone || '',
        organisation: contact.organisation || ''
      };
    });

  // Get LPA and region from create-case-v2 data or fallback to manage-specific data
  let lpaName = req.session.lpaName || '';
  let lpaRegion = req.session.lpaRegion || '';
  let lpaRegions = req.session.lpaRegions || {};
  
  // If we have lpas array from create-case-v2, use the first one
  if (req.session.lpas && req.session.lpas.length > 0) {
    lpaName = req.session.lpas[0];
    // Look up region for this LPA
    if (lpaToRegionSimple[lpaName]) {
      lpaRegion = lpaToRegionSimple[lpaName];
    }
    
    // Ensure all LPAs in the array have their regions mapped
    req.session.lpas.forEach(lpa => {
      if (!lpaRegions[lpa] && lpaToRegionSimple[lpa]) {
        lpaRegions[lpa] = lpaToRegionSimple[lpa];
      }
    });
    
    // Update session with populated regions
    req.session.lpaRegions = lpaRegions;
  }

  res.render('projects/back-office/manage/index', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    planType: formatPlanType(req.session.planType) || '',
    lpas: req.session.lpas || [],
    lpaName: lpaName,
    lpaRegion: lpaRegion,
    lpaRegions: lpaRegions,
    caseOfficer: req.session.caseOfficer || '',
    noticeOfIntentionDate: req.session.noticeOfIntentionDate || '-',
    gateway1EstimatedDate: req.session.gateway1EstimatedDate || '-',
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '-',
    gateway3EstimatedDate: req.session.gateway3EstimatedDate || '-',
    submissionDate: req.session.submissionDate || '-',
    mainContactName,
    mainContactEmail: req.session.mainContact?.email || '',
    mainContactPhone: req.session.mainContact?.phone || '',
    mainContactOrg: req.session.mainContact?.organisation || lpaName || '',
    contacts: contactNames,
    gateway2AssessorName: req.session.gateway2AssessorName || '-',
    gateway2PlanStatus: req.session.gateway2PlanStatus || '-',
    gateway2Grade: req.session.gateway2Grade || '-',
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '-',
    gateway2ActualDate: req.session.gateway2ActualDate || '-',
    gateway2ValidDate: req.session.gateway2ValidDate || '-',
    gateway2WorkshopDate: req.session.gateway2WorkshopDate || '-',
    gateway2WorkshopVenue: req.session.gateway2WorkshopVenue || '-',
    gateway2AssessorAppointmentDate: req.session.gateway2AssessorAppointmentDate || '-',
    gateway2ReportIssuedDate: req.session.gateway2ReportIssuedDate || '-',
    gateway2ReportPublishedDate: req.session.gateway2ReportPublishedDate || '-',
    gateway3AssessorName: req.session.gateway3AssessorName || '-',
    gateway3PoContact: req.session.gateway3PoContact || {},
    examinationWebsite: req.session.examinationWebsite || '-',
    examiningInspector1Name: req.session.examiningInspector1Name || '-',
    examiningInspector2Name: req.session.examiningInspector2Name || '-',
    examiningInspector3Name: req.session.examiningInspector3Name || '-',
    qaInspector1Name: req.session.qaInspector1Name || '-',
    qaInspector2Name: req.session.qaInspector2Name || '-',
    qaInspector3Name: req.session.qaInspector3Name || '-'
  });
});

// Plan type edit GET
router.get('/projects/back-office/manage/overview/plan-type', (req, res) => {
  res.render('projects/back-office/manage/overview/plan-type', {
    planType: req.session.planType || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// Plan type edit POST
router.post('/projects/back-office/manage/overview/plan-type', (req, res) => {
  const { 'plan-type': planType, returnUrl } = req.body;
  req.session.planType = planType && planType.trim() !== '' ? planType : '';
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// LPA edit GET (preselect LPA and provide list)
const lpaList = require('../../../data/lpa-list.json');
router.get('/projects/back-office/manage/overview/select-LPA', (req, res) => {
  const index = req.query.index ? parseInt(req.query.index, 10) : 0;
  let selectedLPA = req.session.lpaName || '';
  
  // Get the LPA at the specified index
  if (req.session.lpas && req.session.lpas.length > index) {
    selectedLPA = req.session.lpas[index];
  }
  
  res.render('projects/back-office/manage/overview/select-LPA', {
    selectedLPA: selectedLPA,
    lpaList,
    index: index,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// LPA edit POST (with region lookup)
const lpaToRegion = require('../../../data/lpa-to-region.json');
router.post('/projects/back-office/manage/overview/select-LPA', (req, res) => {
  const { lpa, returnUrl, index } = req.body;
  const lpaIndex = index ? parseInt(index, 10) : 0;
  
  // Update lpas array (create-case-v2 format) 
  if (lpa && lpa.trim() !== '') {
    if (!req.session.lpas) {
      req.session.lpas = [];
    }
    // Update the specific LPA at the given index
    if (lpaIndex < req.session.lpas.length) {
      req.session.lpas[lpaIndex] = lpa;
    } else {
      // If index is beyond array length, add it
      req.session.lpas[lpaIndex] = lpa;
    }
    // Also maintain backward compatibility with lpaName (first LPA)
    if (lpaIndex === 0) {
      req.session.lpaName = lpa;
    }
  }
  
  // Lookup region from lpa-to-region.json
  let region = '';
  if (lpa) {
    const match = lpaToRegion.features.find(f => f.properties.LAD25NM === lpa);
    if (match) {
      region = match.properties.RGN25NM;
    }
  }
  if (region) {
    // For create-case-v2 format
    if (!req.session.lpaRegions) {
      req.session.lpaRegions = {};
    }
    req.session.lpaRegions[lpa] = region;
    // Also maintain backward compatibility with lpaRegion (first LPA)
    if (lpaIndex === 0) {
      req.session.lpaRegion = region;
    }
  }
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Region edit GET (preselect and provide all regions)
const lpaToRegionSimple = require('../../../data/lpa-to-region-simple.json');
const allRegions = Array.from(new Set(Object.values(lpaToRegionSimple))).sort();
router.get('/projects/back-office/manage/overview/LPA-region', (req, res) => {
  const index = req.query.index ? parseInt(req.query.index, 10) : 0;
  
  // Get the LPA at the specified index
  let currentLpa = '';
  let region = req.session.lpaRegion || '';
  
  if (req.session.lpas && req.session.lpas.length > index) {
    currentLpa = req.session.lpas[index];
    // Look up region for this specific LPA
    if (req.session.lpaRegions && req.session.lpaRegions[currentLpa]) {
      region = req.session.lpaRegions[currentLpa];
    } else if (lpaToRegionSimple[currentLpa]) {
      region = lpaToRegionSimple[currentLpa];
    }
  } else if (req.session.lpaName && lpaToRegionSimple[req.session.lpaName]) {
    region = req.session.lpaRegion || lpaToRegionSimple[req.session.lpaName];
  }
  
  res.render('projects/back-office/manage/overview/LPA-region', {
    lpaRegion: region,
    allRegions,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    index: index,
    isEdit: true
  });
});

// Region edit POST
router.post('/projects/back-office/manage/overview/LPA-region', (req, res) => {
  const { 'lpa-region': lpaRegion, returnUrl, index } = req.body;
  const lpaIndex = index ? parseInt(index, 10) : 0;
  
  // Update the region for the LPA at the specified index
  if (!req.session.lpaRegions) {
    req.session.lpaRegions = {};
  }
  
  if (req.session.lpas && req.session.lpas.length > lpaIndex) {
    const lpa = req.session.lpas[lpaIndex];
    req.session.lpaRegions[lpa] = lpaRegion && lpaRegion.trim() !== '' ? lpaRegion : '';
    
    // Also maintain backward compatibility with lpaRegion (first LPA)
    if (lpaIndex === 0) {
      req.session.lpaRegion = lpaRegion && lpaRegion.trim() !== '' ? lpaRegion : '';
    }
  } else {
    // Fallback for old format
    req.session.lpaRegion = lpaRegion && lpaRegion.trim() !== '' ? lpaRegion : '';
  }
  
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Case officer edit GET (preselect and provide all officers)
const caseOfficers = require('../../../data/case-officers.json');
router.get('/projects/back-office/manage/overview/case-officer-name', (req, res) => {
  res.render('projects/back-office/manage/overview/case-officer-name', {
    caseOfficer: req.session.caseOfficer || '',
    caseOfficers,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// Case officer edit POST
router.post('/projects/back-office/manage/overview/case-officer-name', (req, res) => {
  const { 'case-officer-name': caseOfficer, returnUrl } = req.body;
  req.session.caseOfficer = caseOfficer && caseOfficer.trim() !== '' ? caseOfficer : '';
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Main contact edit GET

router.get('/projects/back-office/manage/overview/main-contact', (req, res) => {
  res.render('projects/back-office/manage/overview/main-contact', {
    mainContact: req.session.mainContact || {},
    lpaName: req.session.lpaName || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// Main contact edit POST
router.post('/projects/back-office/manage/overview/main-contact', (req, res) => {
  const {
    'main-contact-first-name': mainContactFirstName,
    'main-contact-last-name': mainContactLastName,
    'main-contact-email': mainContactEmail,
    'main-contact-phone': mainContactPhone,
    contactOrganisation,
    returnUrl
  } = req.body;
  
  req.session.mainContact = {
    firstName: mainContactFirstName && mainContactFirstName.trim() !== '' ? mainContactFirstName : '',
    lastName: mainContactLastName && mainContactLastName.trim() !== '' ? mainContactLastName : '',
    email: mainContactEmail && mainContactEmail.trim() !== '' ? mainContactEmail : '',
    phone: mainContactPhone && mainContactPhone.trim() !== '' ? mainContactPhone : '',
    organisation: contactOrganisation && contactOrganisation.trim() !== '' ? contactOrganisation : ''
  };
  
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Contact 2 edit GET (auto-populate and associate LPA)
router.get('/projects/back-office/manage/overview/contact-2', (req, res) => {
  res.render('projects/back-office/manage/overview/contact-2', {
    contact2FirstName: req.session.contact2FirstName || '',
    contact2LastName: req.session.contact2LastName || '',
    contact2Email: req.session.contact2Email || '',
    contact2Phone: req.session.contact2Phone || '',
    contact2Organisation: req.session.contact2Organisation || req.session.lpaName || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// Contact 2 edit POST
router.post('/projects/back-office/manage/overview/contact-2', (req, res) => {
  const { 'contact-2-first-name': contact2FirstName, 'contact-2-last-name': contact2LastName, 'contact-2-email': contact2Email, 'contact-2-phone': contact2Phone, returnUrl } = req.body;
  req.session.contact2FirstName = contact2FirstName && contact2FirstName.trim() !== '' ? contact2FirstName : '';
  req.session.contact2LastName = contact2LastName && contact2LastName.trim() !== '' ? contact2LastName : '';
  req.session.contact2Email = contact2Email && contact2Email.trim() !== '' ? contact2Email : '';
  req.session.contact2Phone = contact2Phone && contact2Phone.trim() !== '' ? contact2Phone : '';
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});
// Plan title edit GET
router.get('/projects/back-office/manage/overview/plan-title', (req, res) => {
  res.render('projects/back-office/manage/overview/plan-title', {
    planTitle: req.session.planTitle || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// Plan title edit POST
router.post('/projects/back-office/manage/overview/plan-title', (req, res) => {
  const { 'plan-title': planTitle, returnUrl } = req.body;
  req.session.planTitle = planTitle && planTitle.trim() !== '' ? planTitle : '';
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Additional contact GET
router.get('/projects/back-office/manage/overview/additional-contact', (req, res) => {
  const index = parseInt(req.query.index) || 0;
  
  // Initialize contacts array if needed
  if (!req.session.contacts) {
    req.session.contacts = [];
  }
  
  // Pad to at least the requested index
  while (req.session.contacts.length <= index) {
    req.session.contacts.push({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organisation: ''
    });
  }
  
  const contact = req.session.contacts[index] || {};
  
  res.render('projects/back-office/manage/overview/additional-contact', {
    contact: {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email || '',
      phone: contact.phone || ''
    },
    contactIndex: index,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html'
  });
});

// Additional contact POST
router.post('/projects/back-office/manage/overview/additional-contact', (req, res) => {
  const { firstName, lastName, email, phone, contactIndex, returnUrl } = req.body;
  const index = parseInt(contactIndex) || 0;
  
  // Initialize contacts array if needed
  if (!req.session.contacts) {
    req.session.contacts = [];
  }
  
  // Pad to at least the requested index
  while (req.session.contacts.length <= index) {
    req.session.contacts.push({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organisation: ''
    });
  }
  
  req.session.contacts[index] = {
    firstName: firstName || '',
    lastName: lastName || '',
    email: email || '',
    phone: phone || '',
    organisation: req.session.contacts[index]?.organisation || ''
  };
  
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Gateway 2 text fields GET handlers (pre-fill value)
router.get('/projects/back-office/manage/GW2/gateway-2-assessor-name.html', (req, res) => {
  res.render('projects/back-office/manage/GW2/gateway-2-assessor-name', {
    gateway2AssessorName: req.session.gateway2AssessorName || '' ,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/gateway-2.html'
  });
});

router.get('/projects/back-office/manage/GW2/gateway-2-workshop-venue.html', (req, res) => {
  res.render('projects/back-office/manage/GW2/gateway-2-workshop-venue', {
    gateway2WorkshopVenue: req.session.gateway2WorkshopVenue || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/gateway-2.html'
  });
});

router.get('/projects/back-office/manage/GW2/gateway-2-grade', (req, res) => {
  res.render('projects/back-office/manage/GW2/gateway-2-grade', {
    gateway2Grade: req.session.gateway2Grade || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/gateway-2.html'
  });
});

// Fix for GW2 workshop date POST handler to match form field names


// GW2 text fields POST handlers
router.post('/projects/back-office/manage/GW2/gateway-2-assessor-name', (req, res) => {
  const { 'gateway-2-assessor-name': value, returnUrl } = req.body;
  req.session.gateway2AssessorName = value && value.trim() !== '' ? value : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-2.html');
});

router.post('/projects/back-office/manage/GW2/gateway-2-plan-status', (req, res) => {
  const { 'gateway-2-plan-status': value, returnUrl } = req.body;
  req.session.gateway2PlanStatus = value && value.trim() !== '' ? value : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-2.html');
});

router.post('/projects/back-office/manage/GW2/gateway-2-grade', (req, res) => {
  const { 'gateway-2-grade': value, returnUrl } = req.body;
  req.session.gateway2Grade = value && value.trim() !== '' ? value : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-2.html');
});

router.post('/projects/back-office/manage/GW2/gateway-2-workshop-venue', (req, res) => {
  const { 'gateway-2-workshop-venue': value, returnUrl } = req.body;
  req.session.gateway2WorkshopVenue = value && value.trim() !== '' ? value : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-2.html');
});


// --- Gateway 2 Date Edit Handlers ---
const gw2DateFields = [
  { key: 'EstimatedDate', file: 'gateway-2-estimated' },
  { key: 'ActualDate', file: 'gateway-2-actual' },
  { key: 'ValidDate', file: 'gateway-2-valid' },
  { key: 'WorkshopDate', file: 'gateway-2-workshop-date' },
  { key: 'AssessorAppointmentDate', file: 'gateway-2-assessor-appointment' },
  { key: 'ReportIssuedDate', file: 'gateway-2-report-issued' },
  { key: 'ReportPublishedDate', file: 'gateway-2-report-published' }
];

gw2DateFields.forEach(({ key, file }) => {
  // GET handler
  router.get(`/projects/back-office/manage/GW2/${file}.html`, (req, res) => {
    let day = '', month = '', year = '';
    const sessionKey = `gateway2${key}`;
    if (req.session[sessionKey] && req.session[sessionKey] !== '-') {
      // Parse D MMMM YYYY format (or legacy/other formats)
      const parts = req.session[sessionKey].split(' ');
      day = parts[0] || '';
      month = parts[1] || '';
      year = parts[2] || '';
      // Convert month name to number if needed for form fields
      const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
        'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      if (monthMap[month]) month = monthMap[month];
      else if (month.length === 1) month = '0' + month;
      else if (month.length !== 2) month = month.padStart(2, '0');
    }
    const noticeOfIntentionDate = `${day}/${month}/${year}`;
    const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-2.html';
    res.render(`projects/back-office/manage/GW2/${file}.html`, {
      noticeOfIntentionDate,
      returnUrl
    });
  });
  // POST handler
  router.post(`/projects/back-office/manage/GW2/${file}`, (req, res) => {
    const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
    const sessionKey = `gateway2${key}`;
    // Get previous values if present
    let prevDay = '', prevMonth = '', prevYear = '';
    if (req.session[sessionKey] && req.session[sessionKey] !== '-') {
      // Handle D MMMM YYYY format
      const prevParts = req.session[sessionKey].split(' ');
      if (prevParts.length === 3) {
        prevDay = prevParts[0];
        prevMonth = prevParts[1];
        prevYear = prevParts[2];
      }
    }
    // Use new value if provided, otherwise previous value
    const newDay = day && day.trim() !== '' ? parseInt(day, 10) : prevDay;
    const months = [ '', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
    let newMonth = month && month.trim() !== '' ? (months[parseInt(month, 10)] || month) : prevMonth;
    const newYear = year && year.trim() !== '' ? year : prevYear;
    if (newDay && newMonth && newYear) {
      req.session[sessionKey] = `${newDay} ${newMonth} ${newYear}`;
    }
    res.redirect(returnUrl || '/projects/back-office/manage/gateway-2.html');
  });
});


// Gateway 2 page GET
router.get('/projects/back-office/manage/gateway-2.html', (req, res) => {
  res.render('projects/back-office/manage/gateway-2', {
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
    gateway2PlanStatus: req.session.gateway2PlanStatus || '-',
    gateway2Grade: req.session.gateway2Grade || '-'
  });
});


// Notice of Intention date POST (edit view)
router.post('/projects/back-office/manage/change-notice-date', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  // Save to session as D MMMM YYYY (e.g. 17 March 2026)
  if (day && month && year) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10)] || month;
    req.session.noticeOfIntentionDate = `${parseInt(day, 10)} ${monthName} ${year}`;
  }
  res.redirect(returnUrl || '/projects/back-office/manage/timetable.html');
});


// Notice of Intention date GET (edit view)
router.get('/projects/back-office/manage/change-notice-date.html', (req, res) => {
  let noticeOfIntentionDate = '';
  if (req.session.noticeOfIntentionDate && req.session.noticeOfIntentionDate !== '-') {
    // Parse D MMMM YYYY format for form fields
    const parts = req.session.noticeOfIntentionDate.split(' ');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const monthMap = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
      'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    noticeOfIntentionDate = `${day.padStart(2, '0')}/${monthMap[month] || month.padStart(2, '0')}/${year}`;
  } else {
    // Default to today
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    noticeOfIntentionDate = `${day}/${month}/${year}`;
  }
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/timetable.html';
  res.render('projects/back-office/manage/change-notice-date.html', {
    noticeOfIntentionDate,
    returnUrl
  });
});


// Gateway 1 Estimated Date POST
router.post('/projects/back-office/manage/GW1/gateway-1-estimated', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  let estimatedDate = '-';
  if (day && month && year) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10)] || month;
    estimatedDate = `${parseInt(day, 10)} ${monthName} ${year}`;
  }
  req.session.gateway1EstimatedDate = estimatedDate;
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});

// Gateway 1 SLA Sent POST
router.post('/projects/back-office/manage/GW1/gateway-1-sla-sent', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  let slaSentDate = '-';
  if (day && month && year) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10)] || month;
    slaSentDate = `${parseInt(day, 10)} ${monthName} ${year}`;
  }
  req.session.gateway1SlaSentDate = slaSentDate;
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});

// Gateway 1 SLA Received POST
router.post('/projects/back-office/manage/GW1/gateway-1-sla-received', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  let slaReceivedDate = '-';
  if (day && month && year) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10)] || month;
    slaReceivedDate = `${parseInt(day, 10)} ${monthName} ${year}`;
  }
  req.session.gateway1SlaReceivedDate = slaReceivedDate;
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});

// Gateway 1 DSA Check POST
router.post('/projects/back-office/manage/GW1/gateway-1-dsa-check', (req, res) => {
  const { 'dsa-check': dsaCheck, returnUrl } = req.body;
  req.session.gateway1DsaCheck = dsaCheck || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});






// Show delete confirmation page
router.get('/projects/back-office/manage/delete-case-confirmation.html', (req, res) => {
  const caseRef = req.query.caseRef || '';
  
  // Build case object from session data
  const caseToDelete = {
    caseRef: caseRef,
    planTitle: req.session.planTitle || '-',
    planType: req.session.planType || '-',
    lpaName: (req.session.lpas && req.session.lpas.length > 0) ? req.session.lpas[0] : '-',
    caseOfficer: req.session.caseOfficer || '-'
  };
  
  res.render('projects/back-office/manage/delete-case-confirmation', {
    caseRef: caseToDelete.caseRef,
    planTitle: caseToDelete.planTitle,
    planType: formatPlanType(caseToDelete.planType),
    lpaName: caseToDelete.lpaName,
    caseOfficer: caseToDelete.caseOfficer
  });
});

// Handle delete POST and show complete page
router.post('/projects/back-office/manage/delete-case-complete.html', (req, res) => {
  const { caseRef } = req.body;
  
  // Clear all case data from session (soft delete)
  if (caseRef) {
    delete req.session.currentCaseRef;
    delete req.session.planTitle;
    delete req.session.planType;
    delete req.session.lpas;
    delete req.session.lpaName;
    delete req.session.lpaRegion;
    delete req.session.lpaRegions;
    delete req.session.caseOfficer;
    delete req.session.mainContact;
    delete req.session.contacts;
    delete req.session.gateway1EstimatedDate;
    delete req.session.gateway2EstimatedDate;
    delete req.session.gateway3EstimatedDate;
    delete req.session.noticeOfIntentionDate;
    delete req.session.submissionDate;
    // Clear all gateway 2 data
    delete req.session.gateway2AssessorName;
    delete req.session.gateway2PlanStatus;
    delete req.session.gateway2Grade;
    delete req.session.gateway2ActualDate;
    delete req.session.gateway2ValidDate;
    delete req.session.gateway2WorkshopDate;
    delete req.session.gateway2WorkshopVenue;
    delete req.session.gateway2AssessorAppointmentDate;
    delete req.session.gateway2ReportIssuedDate;
    delete req.session.gateway2ReportPublishedDate;
  }
  
  res.render('projects/back-office/manage/delete-case-complete', {
    caseRef: caseRef
  });
});

// Handle Gateway 1 Actual Date POST
router.post('/projects/back-office/manage/GW1/gateway-1-actual', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  // Get previous values if present
  let prevDay = '', prevMonth = '', prevYear = '';
  if (req.session.gateway1ActualDate && req.session.gateway1ActualDate !== '-') {
    const prevParts = req.session.gateway1ActualDate.split(' ');
    if (prevParts.length === 3) {
      prevDay = prevParts[0];
      prevMonth = prevParts[1];
      prevYear = prevParts[2];
    }
  }
  // Use new value if provided, otherwise previous value
  const newDay = day && day.trim() !== '' ? parseInt(day, 10) : prevDay;
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let newMonth = month && month.trim() !== '' ? months[parseInt(month, 10)] || month : prevMonth;
  const newYear = year && year.trim() !== '' ? year : prevYear;
  // Always update with merged values (allow partial edits)
  if (newDay && newMonth && newYear) {
    req.session.gateway1ActualDate = `${newDay} ${newMonth} ${newYear}`;
  } else {
    req.session.gateway1ActualDate = '-';
  }
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});

// Helper to get month name
function getMonthName(month) {
  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  // If already a month name, return as is
  if (months.includes(month)) return month;
  // If numeric, convert to month name
  const m = parseInt(month, 10);
  if (!isNaN(m) && m >= 1 && m <= 12) return months[m];
  return '';
}


// Gateway 1 page GET
router.get('/projects/back-office/manage/gateway-1.html', (req, res) => {
  res.render('projects/back-office/manage/gateway-1', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    noticeOfIntentionDate: formatDateForDisplay(req.session.noticeOfIntentionDate) || '-',
    gateway1ActualDate: formatDateForDisplay(req.session.gateway1ActualDate) || '-',
    gateway1EstimatedDate: formatDateForDisplay(req.session.gateway1EstimatedDate) || '-',
    gateway1SlaSentDate: formatDateForDisplay(req.session.gateway1SlaSentDate) || '-',
    gateway1SlaReceivedDate: formatDateForDisplay(req.session.gateway1SlaReceivedDate) || '-',
    gateway1DsaCheck: req.session.gateway1DsaCheck || '-'
  });
});

// Helper to ensure all dates are in D MMMM YYYY format
function formatDateForDisplay(dateString) {
  if (!dateString || dateString === '-') return '-';
  
  // If already in D MMMM YYYY format, return as-is
  if (/^\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/.test(dateString)) {
    return dateString;
  }
  
  // Parse DD/MM/YYYY format
  const ddmmyyMatch = dateString.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyMatch) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = parseInt(ddmmyyMatch[1], 10);
    const month = parseInt(ddmmyyMatch[2], 10);
    const year = ddmmyyMatch[3];
    return `${day} ${months[month]} ${year}`;
  }
  
  return dateString;
}

// Timetable page GET
router.get('/projects/back-office/manage/timetable.html', (req, res) => {
  res.render('projects/back-office/manage/timetable', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    noticeOfIntentionDate: formatDateForDisplay(req.session.noticeOfIntentionDate) || '-',
    gateway1ActualDate: formatDateForDisplay(req.session.gateway1ActualDate) || '-',
    gateway1EstimatedDate: formatDateForDisplay(req.session.gateway1EstimatedDate) || '-',
    gateway1SlaSentDate: formatDateForDisplay(req.session.gateway1SlaSentDate) || '-',
    gateway1SlaReceivedDate: formatDateForDisplay(req.session.gateway1SlaReceivedDate) || '-',
    gateway1DsaCheck: req.session.gateway1DsaCheck || '-',
    gateway2EstimatedDate: formatDateForDisplay(req.session.gateway2EstimatedDate) || '-',
    gateway2ActualDate: formatDateForDisplay(req.session.gateway2ActualDate) || '-',
    gateway2ValidDate: formatDateForDisplay(req.session.gateway2ValidDate) || '-',
    gateway2WorkshopDate: formatDateForDisplay(req.session.gateway2WorkshopDate) || '-',
    gateway2AssessorAppointmentDate: formatDateForDisplay(req.session.gateway2AssessorAppointmentDate) || '-',
    gateway2ReportIssuedDate: formatDateForDisplay(req.session.gateway2ReportIssuedDate) || '-',
    gateway2ReportPublishedDate: formatDateForDisplay(req.session.gateway2ReportPublishedDate) || '-',
    gateway3EstimatedDate: formatDateForDisplay(req.session.gateway3EstimatedDate) || '-',
    gateway3ActualDate: formatDateForDisplay(req.session.gateway3ActualDate) || '-',
    gateway3AssessorAppointmentDate: formatDateForDisplay(req.session.gateway3AssessorAppointmentDate) || '-',
    gateway3CompletionDate: formatDateForDisplay(req.session.gateway3CompletionDate) || '-',
    examinationEstimatedDate: formatDateForDisplay(req.session.examinationEstimatedDate) || '-',
    examinationActualDate: formatDateForDisplay(req.session.examinationActualDate) || '-',
    examiningInspectorAppointmentDate: formatDateForDisplay(req.session.examiningInspectorAppointmentDate) || '-',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/timetable.html'
  });
});


// Gateway 1 actual date GET (for change link)
router.get('/projects/back-office/manage/GW1/gateway-1-actual.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.gateway1ActualDate && req.session.gateway1ActualDate !== '-') {
    const parts = req.session.gateway1ActualDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
      'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    if (monthMap[month]) {
      month = monthMap[month];
    } else if (!isNaN(month) && month.length === 2) {
      // already a number
    } else {
      month = '';
    }
  }
  const noticeOfIntentionDate = `${day}/${month}/${year}`;
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-1.html';
  // Debug output
  console.log('DEBUG gateway-1-actual GET:', {
    sessionValue: req.session.gateway1ActualDate,
    day, month, year, noticeOfIntentionDate, returnUrl
  });
  res.render('projects/back-office/manage/GW1/gateway-1-actual.html', {
    noticeOfIntentionDate,
    returnUrl
  });
});

// Gateway 1 estimated date GET
router.get('/projects/back-office/manage/GW1/gateway-1-estimated.html', (req, res) => {
  let noticeOfIntentionDate = '';
  if (req.session.gateway1EstimatedDate && req.session.gateway1EstimatedDate !== '-') {
    const parts = req.session.gateway1EstimatedDate.split(' ');
    if (parts.length === 3) {
      const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
        'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      const day = parts[0];
      let month = parts[1];
      const year = parts[2];
      if (monthMap[month]) {
        month = monthMap[month];
      } else if (!isNaN(month) && month.length === 2) {
        // already a number
      } else {
        month = '';
      }
      noticeOfIntentionDate = `${day}/${month}/${year}`;
    }
  }
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-1.html';
  res.render('projects/back-office/manage/GW1/gateway-1-estimated.html', {
    noticeOfIntentionDate,
    returnUrl
  });
});

// Gateway 1 SLA sent GET
router.get('/projects/back-office/manage/GW1/gateway-1-sla-sent.html', (req, res) => {
  let noticeOfIntentionDate = '';
  if (req.session.gateway1SlaSentDate && req.session.gateway1SlaSentDate !== '-') {
    const parts = req.session.gateway1SlaSentDate.split(' ');
    if (parts.length === 3) {
      const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
        'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      const day = parts[0];
      let month = parts[1];
      const year = parts[2];
      if (monthMap[month]) {
        month = monthMap[month];
      } else if (!isNaN(month) && month.length === 2) {
        // already a number
      } else {
        month = '';
      }
      noticeOfIntentionDate = `${day}/${month}/${year}`;
    }
  }
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-1.html';
  res.render('projects/back-office/manage/GW1/gateway-1-sla-sent.html', {
    noticeOfIntentionDate,
    returnUrl
  });
});

// Gateway 1 SLA received GET
router.get('/projects/back-office/manage/GW1/gateway-1-sla-received.html', (req, res) => {
  let noticeOfIntentionDate = '';
  if (req.session.gateway1SlaReceivedDate && req.session.gateway1SlaReceivedDate !== '-') {
    const parts = req.session.gateway1SlaReceivedDate.split(' ');
    if (parts.length === 3) {
      const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
        'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      const day = parts[0];
      let month = parts[1];
      const year = parts[2];
      if (monthMap[month]) {
        month = monthMap[month];
      } else if (!isNaN(month) && month.length === 2) {
        // already a number
      } else {
        month = '';
      }
      noticeOfIntentionDate = `${day}/${month}/${year}`;
    }
  }
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-1.html';
  res.render('projects/back-office/manage/GW1/gateway-1-sla-received.html', {
    noticeOfIntentionDate,
    returnUrl
  });
});

// Gateway 1 DSA check GET
router.get('/projects/back-office/manage/GW1/gateway-1-dsa-check.html', (req, res) => {
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-1.html';
  res.render('projects/back-office/manage/GW1/gateway-1-dsa-check.html', {
    gateway1DsaCheck: req.session.gateway1DsaCheck || '',
    returnUrl
  });
});

router.get('/projects/back-office/manage/index-filter', (req, res) => {
  if (!req.session.cases || req.session.cases.length === 0) {
    req.session.cases = [
      {
        caseRef: 'PLAN/000001',
        planTitle: 'Central City Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Jane Smith',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000002',
        planTitle: 'North District Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'John Doe',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000003',
        planTitle: 'Southside Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Alex Johnson',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000004',
        planTitle: 'West End Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Jane Smith',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000005',
        planTitle: 'East Borough Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Michael Brown',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000006',
        planTitle: 'Riverside Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Sophie Green',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000007',
        planTitle: 'Hilltop Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Chris White',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000008',
        planTitle: 'Market Town Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Rachel Black',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000009',
        planTitle: 'Greenfield Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Tom Harris',
        status: 'Draft'
      },
      {
        caseRef: 'PLAN/000010',
        planTitle: 'Seaside Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Anna Lee',
        status: 'Draft'
      }
    ];
  }
  res.render('projects/back-office/manage/index-filter', {
    cases: req.session.cases
  });
});

// --- Gateway 3 Routes ---
router.get('/projects/back-office/manage/gateway-3.html', (req, res) => {
  res.render('projects/back-office/manage/gateway-3', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    gateway3EstimatedDate: formatDateForDisplay(req.session.gateway3EstimatedDate) || '-',
    gateway3ActualDate: formatDateForDisplay(req.session.gateway3ActualDate) || '-',
    gateway3AssessorAppointmentDate: formatDateForDisplay(req.session.gateway3AssessorAppointmentDate) || '-',
    gateway3CompletionDate: formatDateForDisplay(req.session.gateway3CompletionDate) || '-',
    gateway3AssessorName: req.session.gateway3AssessorName || '-',
    gateway3PoContact: req.session.gateway3PoContact || {}
  });
});

// Gateway 3 GET handlers for edit pages
router.get('/projects/back-office/manage/GW3/gateway-3-assessor-name.html', (req, res) => {
  res.render('projects/back-office/manage/GW3/gateway-3-assessor-name', {
    gateway3AssessorName: req.session.gateway3AssessorName || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/gateway-3.html'
  });
});

router.get('/projects/back-office/manage/GW3/gateway-3-po-details.html', (req, res) => {
  res.render('projects/back-office/manage/GW3/gateway-3-po-details', {
    contact: req.session.gateway3PoContact || {},
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/gateway-3.html'
  });
});

// Gateway 3 POST handlers for text fields
router.post('/projects/back-office/manage/GW3/gateway-3-assessor-name', (req, res) => {
  const { 'gateway-3-assessor-name': value, returnUrl } = req.body;
  req.session.gateway3AssessorName = value && value.trim() !== '' ? value : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-3.html');
});

router.post('/projects/back-office/manage/GW3/gateway-3-po-details', (req, res) => {
  const { firstName, lastName, email, phone, returnUrl } = req.body;
  req.session.gateway3PoContact = {
    firstName: firstName && firstName.trim() !== '' ? firstName : '',
    lastName: lastName && lastName.trim() !== '' ? lastName : '',
    email: email && email.trim() !== '' ? email : '',
    phone: phone && phone.trim() !== '' ? phone : ''
  };
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-3.html');
});

// --- Gateway 3 Date Edit Handlers ---
const gw3DateFields = [
  { key: 'EstimatedDate', file: 'gateway-3-estimated' },
  { key: 'ActualDate', file: 'gateway-3-actual' },
  { key: 'AssessorAppointmentDate', file: 'gateway-3-assessor-appointment' },
  { key: 'CompletionDate', file: 'gateway-3-completion-date' }
];

gw3DateFields.forEach(({ key, file }) => {
  // GET handler
  router.get(`/projects/back-office/manage/GW3/${file}.html`, (req, res) => {
    let day = '', month = '', year = '';
    const sessionKey = `gateway3${key}`;
    if (req.session[sessionKey] && req.session[sessionKey] !== '-') {
      const parts = req.session[sessionKey].includes('/')
        ? req.session[sessionKey].split('/')
        : req.session[sessionKey].split(' ');
      day = parts[0] || '';
      month = parts[1] || '';
      year = parts[2] || '';
      // Convert month name to number if needed
      const monthMap = {
        'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
        'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
      };
      if (monthMap[month]) month = monthMap[month];
      else if (month.length === 1) month = '0' + month;
    }
    const noticeOfIntentionDate = `${day}/${month}/${year}`;
    const returnUrl = req.query.returnUrl || '/projects/back-office/manage/gateway-3.html';
    res.render(`projects/back-office/manage/GW3/${file}.html`, {
      noticeOfIntentionDate,
      returnUrl
    });
  });
  // POST handler
  router.post(`/projects/back-office/manage/GW3/${file}`, (req, res) => {
    const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
    const sessionKey = `gateway3${key}`;
    // Get previous values if present
    let prevDay = '', prevMonth = '', prevYear = '';
    if (req.session[sessionKey] && req.session[sessionKey] !== '-') {
      const prevParts = req.session[sessionKey].includes('/')
        ? req.session[sessionKey].split('/')
        : req.session[sessionKey].split(' ');
      prevDay = prevParts[0] || '';
      prevMonth = prevParts[1] || '';
      prevYear = prevParts[2] || '';
    }
    // Use new value if provided, otherwise previous value
    const newDay = day && day.trim() !== '' ? day.padStart(2, '0') : prevDay;
    const newMonth = month && month.trim() !== '' ? month.padStart(2, '0') : prevMonth;
    const newYear = year && year.trim() !== '' ? year : prevYear;
    if (newDay && newMonth && newYear) {
      req.session[sessionKey] = `${newDay}/${newMonth}/${newYear}`;
      // If updating gateway3EstimatedDate, also update examinationEstimatedDate
      if (key === 'EstimatedDate') {
        req.session.examinationEstimatedDate = `${newDay}/${newMonth}/${newYear}`;
      }
    }
    res.redirect(returnUrl || '/projects/back-office/manage/gateway-3.html');
  });
});

// --- Examination Routes ---
router.get('/projects/back-office/manage/examination.html', (req, res) => {
  res.render('projects/back-office/manage/examination', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    examinationEstimatedDate: formatDateForDisplay(req.session.examinationEstimatedDate) || '-',
    examinationActualDate: formatDateForDisplay(req.session.examinationActualDate) || '-',
    examiningInspector1Name: req.session.examiningInspector1Name || '-',
    examiningInspector2Name: req.session.examiningInspector2Name || '-',
    examiningInspector3Name: req.session.examiningInspector3Name || '-',
    examiningInspectorAppointmentDate: formatDateForDisplay(req.session.examiningInspectorAppointmentDate) || '-',
    examinationWebsite: req.session.examinationWebsite || '-',
    hearingVenue: req.session.hearingVenue || '-',
    hearingStartDate: formatDateForDisplay(req.session.hearingStartDate) || '-',
    hearingCloseDate: formatDateForDisplay(req.session.hearingCloseDate) || '-',
    furtherHearingDates: formatDateForDisplay(req.session.furtherHearingDates) || '-',
    letterSentToMhclgDate: formatDateForDisplay(req.session.letterSentToMhclgDate) || '-',
    letterIssueDate: formatDateForDisplay(req.session.letterIssueDate) || '-',
    qaDate: formatDateForDisplay(req.session.qaDate) || '-',
    qaInspector1Name: req.session.qaInspector1Name || '-',
    qaInspector2Name: req.session.qaInspector2Name || '-',
    qaInspector3Name: req.session.qaInspector3Name || '-',
    qaReportSentDate: formatDateForDisplay(req.session.qaReportSentDate) || '-',
    qaPanelResponseDate: formatDateForDisplay(req.session.qaPanelResponseDate) || '-',
    factCheckReceivedDate: formatDateForDisplay(req.session.factCheckReceivedDate) || '-',
    factCheckDueDate: formatDateForDisplay(req.session.factCheckDueDate) || '-',
    factCheckActualDate: formatDateForDisplay(req.session.factCheckActualDate) || '-',
    factCheckReceivedFromLpaDate: formatDateForDisplay(req.session.factCheckReceivedFromLpaDate) || '-',
    finalReportIssueDate: formatDateForDisplay(req.session.finalReportIssueDate) || '-',
    planPauseDate: formatDateForDisplay(req.session.planPauseDate) || '-',
    planPauseEndDate: formatDateForDisplay(req.session.planPauseEndDate) || '-',
    withdrawnDate: formatDateForDisplay(req.session.withdrawnDate) || '-',
    planSoundness: req.session.planSoundness || '-',
    soundUnsoundDate: formatDateForDisplay(req.session.soundUnsoundDate) || '-',
    adoptionDate: formatDateForDisplay(req.session.adoptionDate) || '-',
    approvedForCilDate: formatDateForDisplay(req.session.approvedForCilDate) || '-'
  });
});

// Examining Inspector GET handlers (for editing/adding inspector details)
for (let i = 1; i <= 3; i++) {
  router.get(`/projects/back-office/manage/examination/examining-inspector-${i}.html`, (req, res) => {
    const sessionKey = `examiningInspector${i}Name`;
    res.render(`projects/back-office/manage/examination/examining-inspector-${i}`, {
      examinationAssessorName: req.session[sessionKey] || '',
      returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html',
      inspectorNumber: i
    });
  });

  // POST handler for each inspector
  router.post(`/projects/back-office/manage/examination/examining-inspector-${i}`, (req, res) => {
    const { 'examination-assessor-name': inspectorName, returnUrl } = req.body;
    const sessionKey = `examiningInspector${i}Name`;
    req.session[sessionKey] = inspectorName && inspectorName.trim() !== '' ? inspectorName : '-';
    res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
  });
}

// QA Inspector GET handlers (for editing/adding QA inspector details)
for (let i = 1; i <= 3; i++) {
  router.get(`/projects/back-office/manage/examination/QA-inspector-${i}.html`, (req, res) => {
    const sessionKey = `qaInspector${i}Name`;
    res.render(`projects/back-office/manage/examination/QA-inspector-${i}`, {
      qaAssessorName: req.session[sessionKey] || '',
      returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html',
      inspectorNumber: i
    });
  });

  // POST handler for each QA inspector
  router.post(`/projects/back-office/manage/examination/QA-inspector-${i}`, (req, res) => {
    const { 'qa-assessor-name': inspectorName, returnUrl } = req.body;
    const sessionKey = `qaInspector${i}Name`;
    req.session[sessionKey] = inspectorName && inspectorName.trim() !== '' ? inspectorName : '-';
    res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
  });
}

// Helper function to parse dates from form inputs
function parseDateFields(day, month, year) {
  if (day && month && year) {
    const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = isNaN(month) ? month : months[parseInt(month, 10)] || month;
    return `${parseInt(day, 10)} ${monthName} ${year}`;
  }
  return '';
}

// Generic date handler factory
function createDateHandler(sessionKey, fieldPrefix) {
  return {
    get: (req, res, file, returnUrlArg) => {
      let day = '', month = '', year = '';
      if (req.session[sessionKey] && req.session[sessionKey] !== '-') {
        const parts = req.session[sessionKey].includes('/')
          ? req.session[sessionKey].split('/')
          : req.session[sessionKey].split(' ');
        day = parts[0] || '';
        month = parts[1] || '';
        year = parts[2] || '';
        const monthMap = {
          'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
          'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
        };
        if (monthMap[month]) month = monthMap[month];
        else if (month.length === 1) month = '0' + month;
      }
      const dateValue = `${day}/${month}/${year}`;
      const returnUrl = returnUrlArg || '/projects/back-office/manage/examination.html';
      return { dateValue, returnUrl };
    },
    post: (day, month, year) => {
      return parseDateFields(day, month, year);
    }
  };
}

// Examination estimated date
router.get('/projects/back-office/manage/examination/examination-estimated.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.examinationEstimatedDate && req.session.examinationEstimatedDate !== '-') {
    const parts = req.session.examinationEstimatedDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/examination-estimated', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/examination-estimated', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  req.session.examinationEstimatedDate = parseDateFields(day, month, year) || req.session.examinationEstimatedDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Examination actual date
router.get('/projects/back-office/manage/examination/examination-actual.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.examinationActualDate && req.session.examinationActualDate !== '-') {
    const parts = req.session.examinationActualDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/examination-actual', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/examination-actual', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  req.session.examinationActualDate = parseDateFields(day, month, year) || req.session.examinationActualDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Examining inspector appointment date
router.get('/projects/back-office/manage/examination/examining-inspector-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.examiningInspectorAppointmentDate && req.session.examiningInspectorAppointmentDate !== '-') {
    const parts = req.session.examiningInspectorAppointmentDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/examining-inspector-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/examining-inspector-date', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  req.session.examiningInspectorAppointmentDate = parseDateFields(day, month, year) || req.session.examiningInspectorAppointmentDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Hearing start date
router.get('/projects/back-office/manage/examination/hearing-start-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.hearingStartDate && req.session.hearingStartDate !== '-') {
    const parts = req.session.hearingStartDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/hearing-start-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/hearing-start-date', (req, res) => {
  const { 'hearing-date-day': day, 'hearing-date-month': month, 'hearing-date-year': year, returnUrl } = req.body;
  req.session.hearingStartDate = parseDateFields(day, month, year) || req.session.hearingStartDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Hearing close date
router.get('/projects/back-office/manage/examination/hearing-close-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.hearingCloseDate && req.session.hearingCloseDate !== '-') {
    const parts = req.session.hearingCloseDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/hearing-close-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/hearing-close-date', (req, res) => {
  const { 'hearing-date-day': day, 'hearing-date-month': month, 'hearing-date-year': year, returnUrl } = req.body;
  req.session.hearingCloseDate = parseDateFields(day, month, year) || req.session.hearingCloseDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Further hearing dates
router.get('/projects/back-office/manage/examination/further-hearing-dates.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.furtherHearingDates && req.session.furtherHearingDates !== '-') {
    const parts = req.session.furtherHearingDates.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/further-hearing-dates', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/further-hearing-dates', (req, res) => {
  const { 'hearing-date-day': day, 'hearing-date-month': month, 'hearing-date-year': year, returnUrl } = req.body;
  req.session.furtherHearingDates = parseDateFields(day, month, year) || req.session.furtherHearingDates || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Letter sent to MHCLG date
router.get('/projects/back-office/manage/examination/letter-sent-to-mhclg-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.letterSentToMhclgDate && req.session.letterSentToMhclgDate !== '-') {
    const parts = req.session.letterSentToMhclgDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/letter-sent-to-mhclg-date', {
    letterSentToMhclgDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/letter-sent-to-mhclg-date', (req, res) => {
  const { 'letter-sent-to-mhclg-date-day': day, 'letter-sent-to-mhclg-date-month': month, 'letter-sent-to-mhclg-date-year': year, returnUrl } = req.body;
  req.session.letterSentToMhclgDate = parseDateFields(day, month, year) || req.session.letterSentToMhclgDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Letter issue date
router.get('/projects/back-office/manage/examination/letter-issue-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.letterIssueDate && req.session.letterIssueDate !== '-') {
    const parts = req.session.letterIssueDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/letter-issue-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/letter-issue-date', (req, res) => {
  const { 'letter-issue-date-day': day, 'letter-issue-date-month': month, 'letter-issue-date-year': year, returnUrl } = req.body;
  req.session.letterIssueDate = parseDateFields(day, month, year) || req.session.letterIssueDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// QA date
router.get('/projects/back-office/manage/examination/qa-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.qaDate && req.session.qaDate !== '-') {
    const parts = req.session.qaDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/qa-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/qa-date', (req, res) => {
  const { 'qa-date-day': day, 'qa-date-month': month, 'qa-date-year': year, returnUrl } = req.body;
  req.session.qaDate = parseDateFields(day, month, year) || req.session.qaDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// QA sent to panel date
router.get('/projects/back-office/manage/examination/QA-sent-to-panel-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.qaReportSentDate && req.session.qaReportSentDate !== '-') {
    const parts = req.session.qaReportSentDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/QA-sent-to-panel-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/QA-sent-to-panel-date', (req, res) => {
  const { 'inspector-report-sent-to-qa-panel-date-day': day, 'inspector-report-sent-to-qa-panel-date-month': month, 'inspector-report-sent-to-qa-panel-date-year': year, returnUrl } = req.body;
  req.session.qaReportSentDate = parseDateFields(day, month, year) || req.session.qaReportSentDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// QA panel response date
router.get('/projects/back-office/manage/examination/QA-panel-response-sent-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.qaPanelResponseDate && req.session.qaPanelResponseDate !== '-') {
    const parts = req.session.qaPanelResponseDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/QA-panel-response-sent-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/QA-panel-response-sent-date', (req, res) => {
  const { 'qa-panel-response-sent-date-day': day, 'qa-panel-response-sent-date-month': month, 'qa-panel-response-sent-date-year': year, returnUrl } = req.body;
  req.session.qaPanelResponseDate = parseDateFields(day, month, year) || req.session.qaPanelResponseDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Fact check received from inspector
router.get('/projects/back-office/manage/examination/fact-check-received-from-inspector.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.factCheckReceivedDate && req.session.factCheckReceivedDate !== '-') {
    const parts = req.session.factCheckReceivedDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/fact-check-received-from-inspector', {
    factCheckReceivedFromInspectorDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/fact-check-received-from-inspector', (req, res) => {
  const { 'fact-check-received-back-from-inspector-date-day': day, 'fact-check-received-back-from-inspector-date-month': month, 'fact-check-received-back-from-inspector-date-year': year, returnUrl } = req.body;
  req.session.factCheckReceivedDate = parseDateFields(day, month, year) || req.session.factCheckReceivedDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Fact check due date
router.get('/projects/back-office/manage/examination/fact-check-due-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.factCheckDueDate && req.session.factCheckDueDate !== '-') {
    const parts = req.session.factCheckDueDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/fact-check-due-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/fact-check-due-date', (req, res) => {
  const { 'fact-check-due-date-day': day, 'fact-check-due-date-month': month, 'fact-check-due-date-year': year, returnUrl } = req.body;
  req.session.factCheckDueDate = parseDateFields(day, month, year) || req.session.factCheckDueDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Fact check actual date
router.get('/projects/back-office/manage/examination/fact-check-actual-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.factCheckActualDate && req.session.factCheckActualDate !== '-') {
    const parts = req.session.factCheckActualDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/fact-check-actual-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/fact-check-actual-date', (req, res) => {
  const { 'fact-check-actual-date-day': day, 'fact-check-actual-date-month': month, 'fact-check-actual-date-year': year, returnUrl } = req.body;
  req.session.factCheckActualDate = parseDateFields(day, month, year) || req.session.factCheckActualDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Fact check received from LPA
router.get('/projects/back-office/manage/examination/fact-check-received-back-from-lpa.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.factCheckReceivedFromLpaDate && req.session.factCheckReceivedFromLpaDate !== '-') {
    const parts = req.session.factCheckReceivedFromLpaDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/fact-check-received-back-from-lpa', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/fact-check-received-back-from-lpa', (req, res) => {
  const { 'fact-check-received-back-from-lpa-date-day': day, 'fact-check-received-back-from-lpa-date-month': month, 'fact-check-received-back-from-lpa-date-year': year, returnUrl } = req.body;
  req.session.factCheckReceivedFromLpaDate = parseDateFields(day, month, year) || req.session.factCheckReceivedFromLpaDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Final report issue date
router.get('/projects/back-office/manage/examination/final-report-issue-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.finalReportIssueDate && req.session.finalReportIssueDate !== '-') {
    const parts = req.session.finalReportIssueDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/final-report-issue-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/final-report-issue-date', (req, res) => {
  const { 'final-report-issue-date-day': day, 'final-report-issue-date-month': month, 'final-report-issue-date-year': year, returnUrl } = req.body;
  req.session.finalReportIssueDate = parseDateFields(day, month, year) || req.session.finalReportIssueDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Examination website
router.get('/projects/back-office/manage/examination/examination-website.html', (req, res) => {
  res.render('projects/back-office/manage/examination/examination-website', {
    examinationWebsite: (req.session.examinationWebsite && req.session.examinationWebsite !== '-') ? req.session.examinationWebsite : '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/examination-website', (req, res) => {
  const { 'examination-website': website, returnUrl } = req.body;
  req.session.examinationWebsite = website && website.trim() !== '' ? website : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Hearing venue
router.get('/projects/back-office/manage/examination/hearing-venue.html', (req, res) => {
  res.render('projects/back-office/manage/examination/hearing-venue', {
    hearingVenue: (req.session.hearingVenue && req.session.hearingVenue !== '-') ? req.session.hearingVenue : '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/hearing-venue', (req, res) => {
  const { 'hearing-venue': venue, returnUrl } = req.body;
  req.session.hearingVenue = venue && venue.trim() !== '' ? venue : '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Plan pause date
router.get('/projects/back-office/manage/examination/plan-pause.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.planPauseDate && req.session.planPauseDate !== '-') {
    const parts = req.session.planPauseDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/plan-pause', {
    planPauseDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/plan-pause', (req, res) => {
  const { 'plan-pause-date-day': day, 'plan-pause-date-month': month, 'plan-pause-date-year': year, returnUrl } = req.body;
  req.session.planPauseDate = parseDateFields(day, month, year) || req.session.planPauseDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Plan pause end date
router.get('/projects/back-office/manage/examination/plan-pause-end.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.planPauseEndDate && req.session.planPauseEndDate !== '-') {
    const parts = req.session.planPauseEndDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/plan-pause-end', {
    planPauseEndDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/plan-pause-end', (req, res) => {
  const { 'plan-pause-end-date-day': day, 'plan-pause-end-date-month': month, 'plan-pause-end-date-year': year, returnUrl } = req.body;
  req.session.planPauseEndDate = parseDateFields(day, month, year) || req.session.planPauseEndDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Withdrawn date
router.get('/projects/back-office/manage/examination/withdrawn-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.withdrawnDate && req.session.withdrawnDate !== '-') {
    const parts = req.session.withdrawnDate.split(' ');
    day = parts[0] || '';
    month = parts[1] || '';
    year = parts[2] || '';
    const monthMap = { 'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12' };
    if (monthMap[month]) month = monthMap[month];
    else if (month.length === 1) month = '0' + month;
  }
  res.render('projects/back-office/manage/examination/withdrawn-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/withdrawn-date', (req, res) => {
  const { 'withdrawn-date-day': day, 'withdrawn-date-month': month, 'withdrawn-date-year': year, returnUrl } = req.body;
  req.session.withdrawnDate = parseDateFields(day, month, year) || req.session.withdrawnDate || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Sound/Unsound
router.get('/projects/back-office/manage/examination/sound-unsound.html', (req, res) => {
  res.render('projects/back-office/manage/examination/sound-unsound', {
    planType: req.session.planSoundness || '',
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/sound-unsound', (req, res) => {
  const { 'plan-soundness': soundness, returnUrl } = req.body;
  if (soundness && soundness.trim() !== '') {
    const capitalized = soundness.trim().charAt(0).toUpperCase() + soundness.trim().slice(1);
    req.session.planSoundness = capitalized;
  } else {
    req.session.planSoundness = '-';
  }
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Sound / Unsound Date
router.get('/projects/back-office/manage/examination/sound-unsound-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.soundUnsoundDate && req.session.soundUnsoundDate !== '-') {
    const parts = req.session.soundUnsoundDate.split(' ');
    day = parts[0];
    year = parts[2];
    // Convert month name to number
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    month = monthNames.indexOf(parts[1]);
  }
  res.render('projects/back-office/manage/examination/sound-unsound-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/sound-unsound-date', (req, res) => {
  const { 'sound-unsound-date-day': day, 'sound-unsound-date-month': month, 'sound-unsound-date-year': year, returnUrl } = req.body;
  req.session.soundUnsoundDate = parseDateFields(day, month, year) || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Adoption Date
router.get('/projects/back-office/manage/examination/adoption-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.adoptionDate && req.session.adoptionDate !== '-') {
    const parts = req.session.adoptionDate.split(' ');
    day = parts[0];
    year = parts[2];
    // Convert month name to number
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    month = monthNames.indexOf(parts[1]);
  }
  res.render('projects/back-office/manage/examination/adoption-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/adoption-date', (req, res) => {
  const { 'adoption-date-day': day, 'adoption-date-month': month, 'adoption-date-year': year, returnUrl } = req.body;
  req.session.adoptionDate = parseDateFields(day, month, year) || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Approved for CIL Date
router.get('/projects/back-office/manage/examination/approved-for-cil-date.html', (req, res) => {
  let day = '', month = '', year = '';
  if (req.session.approvedForCilDate && req.session.approvedForCilDate !== '-') {
    const parts = req.session.approvedForCilDate.split(' ');
    day = parts[0];
    year = parts[2];
    // Convert month name to number
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    month = monthNames.indexOf(parts[1]);
  }
  res.render('projects/back-office/manage/examination/approved-for-cil-date', {
    noticeOfIntentionDate: `${day}/${month}/${year}`,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

router.post('/projects/back-office/manage/examination/approved-for-cil-date', (req, res) => {
  const { 'approved-for-cil-date-day': day, 'approved-for-cil-date-month': month, 'approved-for-cil-date-year': year, returnUrl } = req.body;
  req.session.approvedForCilDate = parseDateFields(day, month, year) || '-';
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Clear manage-specific data (keep create-case-v2 data)
router.get('/projects/back-office/manage/clear-data.html', (req, res) => {
  // Clear all manage-specific fields
  delete req.session.gateway2AssessorName;
  delete req.session.gateway2PlanStatus;
  delete req.session.gateway2Grade;
  delete req.session.gateway2ActualDate;
  delete req.session.gateway2ValidDate;
  delete req.session.gateway2WorkshopDate;
  delete req.session.gateway2WorkshopVenue;
  delete req.session.gateway2AssessorAppointmentDate;
  delete req.session.gateway2ReportIssuedDate;
  delete req.session.gateway2ReportPublishedDate;
  delete req.session.gateway3AssessorName;
  delete req.session.gateway3PoContact;
  delete req.session.examinationWebsite;
  delete req.session.examiningInspector1Name;
  delete req.session.examiningInspector2Name;
  delete req.session.examiningInspector3Name;
  delete req.session.qaInspector1Name;
  delete req.session.qaInspector2Name;
  delete req.session.qaInspector3Name;
  delete req.session.examinationEstimatedDate;
  delete req.session.examinationActualDate;
  delete req.session.examiningInspectorAppointmentDate;
  delete req.session.hearingVenue;
  delete req.session.hearingStartDate;
  delete req.session.hearingCloseDate;
  delete req.session.furtherHearingDates;
  delete req.session.letterSentToMhclgDate;
  delete req.session.letterIssueDate;
  delete req.session.qaDate;
  delete req.session.qaReportSentDate;
  delete req.session.qaPanelResponseDate;
  delete req.session.factCheckReceivedDate;
  delete req.session.factCheckDueDate;
  delete req.session.factCheckActualDate;
  delete req.session.factCheckReceivedFromLpaDate;
  delete req.session.finalReportIssueDate;
  delete req.session.planPauseDate;
  delete req.session.planPauseEndDate;
  delete req.session.withdrawnDate;
  delete req.session.planSoundness;
  delete req.session.soundUnsoundDate;
  delete req.session.adoptionDate;
  delete req.session.approvedForCilDate;
  delete req.session.gateway1ActualDate;
  delete req.session.gateway1SlaSentDate;
  delete req.session.gateway1SlaReceivedDate;
  delete req.session.gateway1DsaCheck;
  
  res.redirect('/projects/back-office/manage/index.html');
});

// Documents page GET
router.get('/projects/back-office/manage/documents.html', (req, res) => {
  const deleteSuccess = req.session.deleteSuccess || null;
  
  // Clear the success message after displaying it
  if (deleteSuccess) {
    delete req.session.deleteSuccess;
  }
  
  res.render('projects/back-office/manage/documents', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    deleteSuccess: deleteSuccess
  });
});

// Delete confirmation page GET
router.get('/projects/back-office/manage/documents/delete-confirmation', (req, res) => {
  const documentName = req.query.docName || '';
  
  res.render('projects/back-office/manage/documents/delete-confirmation', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    documentName: documentName
  });
});

// Delete document POST
router.post('/projects/back-office/manage/documents/delete', (req, res) => {
  const documentName = req.body.documentName;
  
  // In a real implementation, this would delete the file from storage
  // For now, we'll just log it and redirect back to documents with a success message
  console.log(`Document deleted: ${documentName}`);
  
  // Set a success message in session if you have flash messaging set up
  req.session.deleteSuccess = `${documentName} has been successfully deleted.`;
  
  res.redirect('/projects/back-office/manage/documents.html');
});

// Updates page GET
router.get('/projects/back-office/manage/updates.html', (req, res) => {
  res.render('projects/back-office/manage/updates', {
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || ''
  });
});

// Hearing date ranges GET
router.get('/projects/back-office/manage/examination/hearing-date-ranges.html', (req, res) => {
  // Initialize blocks array from session or create one with a single empty block
  let blocks = (req.session.data && req.session.data.hearingDateRanges) || [
    { start: { day: '', month: '', year: '' }, end: { day: '', month: '', year: '' } }
  ];
  
  // Ensure blocks is always an array
  if (!Array.isArray(blocks)) {
    blocks = [{ start: { day: '', month: '', year: '' }, end: { day: '', month: '', year: '' } }];
  }
  
  // Ensure blocks is never empty
  if (blocks.length === 0) {
    blocks = [{ start: { day: '', month: '', year: '' }, end: { day: '', month: '', year: '' } }];
  }
  
  // Pre-fill form with parsed dates if they exist in D MMMM YYYY format
  blocks = blocks.map(block => {
    const parsedBlock = {
      start: { day: '', month: '', year: '' },
      end: { day: '', month: '', year: '' }
    };
    
    if (block.start) {
      parsedBlock.start = {
        day: block.start.day || '',
        month: block.start.month || '',
        year: block.start.year || ''
      };
    }
    
    if (block.end) {
      parsedBlock.end = {
        day: block.end.day || '',
        month: block.end.month || '',
        year: block.end.year || ''
      };
    }
    
    return parsedBlock;
  });
  
  res.render('projects/back-office/manage/examination/hearing-date-ranges', {
    blocks,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/examination.html'
  });
});

// Hearing date ranges POST
router.post('/projects/back-office/manage/examination/hearing-date-ranges.html', (req, res) => {
  console.log('=== hearing-date-ranges POST route hit ===');
  console.log('Full session data:', JSON.stringify(req.session.data, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  const { blocks, addAnother, returnUrl } = req.body;
  
  console.log('POST hearing-date-ranges - blocks received:', JSON.stringify(blocks, null, 2));
  console.log('addAnother:', addAnother);
  
  // Parse the blocks from form submission
  let hearingBlocks = [];
  
  if (blocks && typeof blocks === 'object') {
    // blocks comes as an object from Express form parsing of array-like names
    // Convert it to an array
    const blockIndices = Object.keys(blocks).sort((a, b) => parseInt(a) - parseInt(b));
    console.log('blockIndices:', blockIndices);
    
    blockIndices.forEach(index => {
      const blockData = blocks[index];
      if (!blockData) return;
      
      const startDay = blockData.start?.day?.trim() || '';
      const startMonth = blockData.start?.month?.trim() || '';
      const startYear = blockData.start?.year?.trim() || '';
      const endDay = blockData.end?.day?.trim() || '';
      const endMonth = blockData.end?.month?.trim() || '';
      const endYear = blockData.end?.year?.trim() || '';
      
      console.log(`Block ${index}: startDay=${startDay}, startMonth=${startMonth}, startYear=${startYear}, endDay=${endDay}, endMonth=${endMonth}, endYear=${endYear}`);
      
      // Convert to D MMMM YYYY format if all date fields are provided
      let startFormatted = '-';
      let endFormatted = '-';
      
      if (startDay && startMonth && startYear) {
        const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const startMonthName = isNaN(startMonth) ? startMonth : months[parseInt(startMonth, 10)] || startMonth;
        startFormatted = `${parseInt(startDay, 10)} ${startMonthName} ${startYear}`;
      }
      
      if (endDay && endMonth && endYear) {
        const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const endMonthName = isNaN(endMonth) ? endMonth : months[parseInt(endMonth, 10)] || endMonth;
        endFormatted = `${parseInt(endDay, 10)} ${endMonthName} ${endYear}`;
      }
      
      hearingBlocks.push({
        start: { day: startDay, month: startMonth, year: startYear, formatted: startFormatted },
        end: { day: endDay, month: endMonth, year: endYear, formatted: endFormatted }
      });
    });
  }
  
  console.log('hearingBlocks after parsing:', JSON.stringify(hearingBlocks, null, 2));
  
  // If user clicked "Add another set of dates", re-render with additional block
  if (addAnother === 'true') {
    console.log('User clicked Add Another - re-rendering');
    if (!req.session.data) req.session.data = {};
    req.session.data.hearingDateRanges = hearingBlocks;
    
    // Convert to form display format
    const blocksForForm = hearingBlocks.map(block => ({
      start: { day: block.start.day || '', month: block.start.month || '', year: block.start.year || '' },
      end: { day: block.end.day || '', month: block.end.month || '', year: block.end.year || '' }
    }));
    
    // Add a new empty block
    blocksForForm.push({ 
      start: { day: '', month: '', year: '' }, 
      end: { day: '', month: '', year: '' } 
    });
    
    console.log('blocksForForm:', JSON.stringify(blocksForForm, null, 2));
    
    return res.render('projects/back-office/manage/examination/hearing-date-ranges', {
      blocks: blocksForForm,
      returnUrl: returnUrl || '/projects/back-office/manage/examination.html'
    });
  }
  
  // Otherwise, save and redirect
  console.log('User clicked Save - saving and redirecting');
  if (!req.session.data) req.session.data = {};
  req.session.data.hearingDateRanges = hearingBlocks;
  res.redirect(returnUrl || '/projects/back-office/manage/examination.html');
});

// Helper function to convert month name to number
function getMonthNumber(monthName) {
  const monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05',
    'June': '06', 'July': '07', 'August': '08', 'September': '09', 'October': '10',
    'November': '11', 'December': '12'
  };
  return monthMap[monthName] || monthName;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Handle file upload - store actual file size in session for persistence
router.post('/projects/back-office/manage/ajax-upload', upload.single('documents'), (req, res) => {
  if (!req.file) {
    return res.json({
      error: { message: 'No file uploaded' }
    });
  }

  // Initialize session data structures if needed
  if (!req.session.data) {
    req.session.data = {};
  }
  if (!req.session.data.fileSizeMap) {
    req.session.data.fileSizeMap = {};
  }
  
  // Store the actual file size from multer in session
  const fileSize = req.file.size;
  req.session.data.fileSizeMap[req.file.originalname] = fileSize;
  
  // Persist session before responding
  req.session.save((err) => {
    if (err) {
      return res.json({
        error: { message: 'Failed to save file information' }
      });
    }

    res.json({
      success: {
        messageHtml: req.file.originalname + ' uploaded successfully',
        messageText: req.file.originalname + ' uploaded successfully'
      },
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: fileSize
      }
    });
  });
});

// Handle file deletion
router.post('/projects/back-office/manage/ajax-delete', (req, res) => {
  const fileToDelete = req.body.delete;
  
  if (!fileToDelete) {
    return res.json({
      error: {
        message: 'No file specified for deletion'
      }
    });
  }

  res.json({
    success: {
      message: 'File deleted successfully'
    }
  });
});

// Clear all uploaded documents
router.get('/projects/back-office/manage/documents/clear-uploads', (req, res) => {
  // Clear fileData from session.data (GOV.UK Prototype Kit format)
  if (req.session.data) {
    req.session.data.fileData = '';
  }
  // Also clear the file size map
  req.session.data.fileSizeMap = {};
  
  req.session.save((err) => {
    if (err) console.error('Session save error:', err);
    else console.log('Uploaded documents cleared');
  });
  res.redirect('/projects/back-office/manage/documents/upload-bo');
});

// Upload documents page GET
router.get('/projects/back-office/manage/documents/upload-bo', (req, res) => {
  // Parse fileData from session.data (GOV.UK Prototype Kit format)
  let uploadedDocuments = [];
  if (req.session.data && req.session.data.fileData) {
    try {
      const fileData = typeof req.session.data.fileData === 'string' 
        ? JSON.parse(req.session.data.fileData) 
        : req.session.data.fileData;
      
   
if (Array.isArray(fileData)) {
  uploadedDocuments = fileData.map(file => {
    let size = 0;

    // Correct key for multer/GOV.UK Prototype Kit uploads
    const filename = file.name;

    if (req.session.data.fileSizeMap && req.session.data.fileSizeMap[filename]) {
      size = req.session.data.fileSizeMap[filename];
    }

    return {
            originalname: file.name,
            filename: file.id,
            size: size
          };
        });
      }
    } catch (e) {
      // Silently fail
    }
  }
  
  // Touch session to keep it alive and ensure documents persist
  req.session.touch();
  req.session.save((err) => {
    if (err) {
      // silently fail
    }
  });
  
  res.render('projects/back-office/manage/documents/upload-bo', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments: uploadedDocuments
  });
});

// Upload documents page POST - redirect to check answers
router.post('/projects/back-office/manage/documents/upload-bo', (req, res) => {
  console.log('\n========== POST /upload-bo ==========');
  console.log('Session ID:', req.sessionID);
  console.log('Current fileSizeMap:', req.session.data.fileSizeMap || {});
  
  // Check fileData from session.data
  let fileCount = 0;
  if (req.session.data && req.session.data.fileData) {
    try {
      const fileData = typeof req.session.data.fileData === 'string' 
        ? JSON.parse(req.session.data.fileData) 
        : req.session.data.fileData;
      fileCount = Array.isArray(fileData) ? fileData.length : 0;
    } catch (e) {
      console.error('Error parsing fileData:', e);
    }
  }
  
  console.log('Redirecting to check-answers with', fileCount, 'files');
  
  // IMPORTANT: Save session BEFORE redirecting to ensure data persists
  req.session.save((err) => {
    if (err) {
      console.error('Session save error on POST redirect:', err);
    } else {
      console.log('Session saved before redirect');
    }
    res.redirect('/projects/back-office/manage/documents/check-answers');
  });
});

// Serve uploaded file
router.get('/projects/back-office/manage/documents/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, '../../../uploads', filename);
  
  console.log('Download request for:', filename);
  console.log('Full path:', filepath);
  
  res.download(filepath, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).send('File not found');
    }
  });
});

// Check answers page for documents
router.get('/projects/back-office/manage/documents/check-answers', (req, res) => {
  // Parse fileData from session.data (GOV.UK Prototype Kit format)
  let uploadedDocuments = [];
  if (req.session.data && req.session.data.fileData) {
    try {
      const fileData = typeof req.session.data.fileData === 'string' 
        ? JSON.parse(req.session.data.fileData) 
        : req.session.data.fileData;
      
      if (Array.isArray(fileData)) {
        uploadedDocuments = fileData.map(file => {
          // Look up file size from session.data.fileSizeMap by filename
          let size = 0;
          if (req.session.data.fileSizeMap && req.session.data.fileSizeMap[file.name]) {
            size = req.session.data.fileSizeMap[file.name];
          }
          
          return {
            originalname: file.name,
            filename: file.id,
            size: size
          };
        });
      }
    } catch (e) {
      // Silently fail
    }
  }
  
  // Touch session to keep it alive
  req.session.touch();
  req.session.save((err) => {
    if (err) {
      // silently fail
    }
  });
  
  res.render('projects/back-office/manage/documents/check-answers', {
    caseRef: req.session.currentCaseRef || '',
    serviceName: 'Local Plans Examinations',
    uploadedDocuments: uploadedDocuments,
    totalFiles: uploadedDocuments.length
  });
});

// --- Hearing Dates Pattern Demonstrations ---

// Pattern A: Add Another Day (non-consecutive dates)
router.get('/projects/back-office/manage/examination/hearing-dates-pattern-a.html', (req, res) => {
  res.render('projects/back-office/manage/examination/hearing-dates-pattern-a', {
    serviceName: 'Local Plans Examinations'
  });
});

router.post('/projects/back-office/manage/examination/hearing-dates-pattern-a.html', (req, res) => {
  // Initialize session.data if it doesn't exist
  if (!req.session.data) {
    req.session.data = {};
  }

  // Handle mixed format from form (some flat strings, some objects)
  const rawDates = req.body.hearingDates || [];
  console.log('Pattern A - Raw array from form:', JSON.stringify(rawDates));
  
  // Process the mixed array into proper date objects
  const dates = [];
  let i = 0;
  while (i < rawDates.length) {
    const item = rawDates[i];
    
    // Check if this is an object (nested format) or string (flat format)
    if (typeof item === 'object' && item !== null) {
      // Object format: could be { day: '16', month: '07', year: '2026' } 
      // OR it could be split: { day: '20' }, { month: '06' }, { year: '2026' }
      let day, month, year;
      
      if (item.day && item.month && item.year) {
        // Complete object
        day = item.day;
        month = item.month;
        year = item.year;
        i++;
      } else if (item.day) {
        // Partial object - day only, look ahead for month and year
        day = item.day;
        i++;
        if (i < rawDates.length && typeof rawDates[i] === 'object' && rawDates[i].month) {
          month = rawDates[i].month;
          i++;
        }
        if (i < rawDates.length && typeof rawDates[i] === 'object' && rawDates[i].year) {
          year = rawDates[i].year;
          i++;
        }
      } else if (item.month) {
        // Skip orphaned month/year objects
        i++;
        continue;
      } else if (item.year) {
        // Skip orphaned month/year objects
        i++;
        continue;
      } else {
        i++;
        continue;
      }
      
      if (day && month && year) {
        dates.push({ day, month, year });
      }
    } else if (typeof item === 'string') {
      // Flat format: need to group 3 consecutive strings as day, month, year
      const day = rawDates[i];
      const month = rawDates[i + 1];
      const year = rawDates[i + 2];
      if (day && month && year) {
        dates.push({ day, month, year });
      }
      i += 3;
    } else {
      i++;
    }
  }
  
  console.log('Pattern A - Processed dates:', JSON.stringify(dates));
  
  // Process and sort dates
  const processedDates = dates
    .map(date => {
      const d = parseInt(date.day);
      const m = parseInt(date.month);
      const y = parseInt(date.year);
      return new Date(y, m - 1, d);
    })
    .sort((a, b) => a - b);
  
  // Store in session.data
  req.session.data.hearingDatesPatternA = processedDates.map(date => 
    `${date.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date)} ${date.getFullYear()}`
  );
  
  console.log('Pattern A - Stored in session:', req.session.data.hearingDatesPatternA);
  
  req.session.save(() => {
    console.log('Pattern A - Session saved, redirecting');
    res.redirect('/projects/back-office/manage/examination/hearing-dates-results.html');
  });
});

// Pattern B: Consecutive Days Option (start + end)
router.get('/projects/back-office/manage/examination/hearing-dates-pattern-b.html', (req, res) => {
  res.render('projects/back-office/manage/examination/hearing-dates-pattern-b', {
    serviceName: 'Local Plans Examinations'
  });
});

router.post('/projects/back-office/manage/examination/hearing-dates-pattern-b.html', (req, res) => {
  // Initialize session.data if it doesn't exist
  if (!req.session.data) {
    req.session.data = {};
  }
  
  console.log('Pattern B - Full req.body:', JSON.stringify(req.body));
  
  const durationType = req.body.hearingDurationType;
  console.log('Pattern B - Duration type:', durationType);
  
  if (durationType === 'one-day') {
    // Single day - read from hyphenated field names
    const day = req.body['hearingDateSingle-day'];
    const month = req.body['hearingDateSingle-month'];
    const year = req.body['hearingDateSingle-year'];
    
    console.log('Pattern B - Single date fields:', {day, month, year});
    
    if (day && month && year) {
      const dateObj = new Date(year, month - 1, day);
      req.session.data.hearingDatesPatternB = `${dateObj.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(dateObj)} ${dateObj.getFullYear()}`;
      console.log('Pattern B - Stored:', req.session.data.hearingDatesPatternB);
    }
  } else if (durationType === 'consecutive-days') {
    // Date range - read from hyphenated field names
    const startDay = req.body['hearingDateStart-day'];
    const startMonth = req.body['hearingDateStart-month'];
    const startYear = req.body['hearingDateStart-year'];
    const endDay = req.body['hearingDateEnd-day'];
    const endMonth = req.body['hearingDateEnd-month'];
    const endYear = req.body['hearingDateEnd-year'];
    
    console.log('Pattern B - Date range fields:', {startDay, startMonth, startYear, endDay, endMonth, endYear});
    
    if (startDay && startMonth && startYear && endDay && endMonth && endYear) {
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      
      const startFormatted = `${start.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(start)} ${start.getFullYear()}`;
      const endFormatted = `${end.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(end)} ${end.getFullYear()}`;
      
      req.session.data.hearingDatesPatternB = `${startFormatted} to ${endFormatted}`;
      console.log('Pattern B - Stored:', req.session.data.hearingDatesPatternB);
    }
  }
  
  req.session.save(() => {
    console.log('Pattern B - Session saved, redirecting');
    res.redirect('/projects/back-office/manage/examination/hearing-dates-results.html');
  });
});

// Pattern C: Date Ranges (Multiple Blocks)
router.get('/projects/back-office/manage/examination/hearing-dates-pattern-c.html', (req, res) => {
  let blocks = req.session.data.hearingDatesPatternCBlocks || [{ start: {}, end: {} }];
  
  // If there are saved blocks, add an empty one for the user to fill in
  if (req.session.data.hearingDatesPatternCBlocks && req.session.data.hearingDatesPatternCBlocks.length > 0) {
    blocks = [...blocks, { start: {}, end: {} }];
  }
  
  res.render('projects/back-office/manage/examination/hearing-date-ranges', {
    blocks: blocks,
    serviceName: 'Local Plans Examinations'
  });
});

router.post('/projects/back-office/manage/examination/hearing-dates-pattern-c.html', (req, res) => {
  // Initialize session.data if it doesn't exist
  if (!req.session.data) {
    req.session.data = {};
  }
  
  const rawBlocks = req.body.blocks || [];
  console.log('Pattern C - Raw blocks:', JSON.stringify(rawBlocks));
  
  // If "Add another set of dates" was clicked, save current blocks and redirect
  if (req.body.addAnother) {
    // Initialize array if needed
    if (!req.session.data.hearingDatesPatternCBlocks) {
      req.session.data.hearingDatesPatternCBlocks = [];
    }
    
    // Get previously saved blocks if any
    const previousBlocks = req.session.data.hearingDatesPatternCBlocks || [];
    
    // Add the current blocks to the stored blocks
    const allBlocks = Array.isArray(previousBlocks) ? previousBlocks : [];
    
    // Parse the current form submission's blocks
    const processedRawBlocks = (Array.isArray(rawBlocks) ? rawBlocks : [rawBlocks])
      .filter(block => block && block.start && block.start.day && block.start.month && block.start.year)
      .map(block => ({
        start: {
          day: block.start.day,
          month: block.start.month,
          year: block.start.year
        },
        end: {
          day: block.end && block.end.day ? block.end.day : block.start.day,
          month: block.end && block.end.month ? block.end.month : block.start.month,
          year: block.end && block.end.year ? block.end.year : block.start.year
        }
      }));
    
    // Combine and save
    req.session.data.hearingDatesPatternCBlocks = [...allBlocks, ...processedRawBlocks];
    
    // Save and redirect back to the form for another block
    req.session.save(() => {
      res.redirect('/projects/back-office/manage/examination/hearing-dates-pattern-c.html');
    });
    return;
  }
  
  // Otherwise, process and save all blocks
  const processedBlocks = (Array.isArray(rawBlocks) ? rawBlocks : [rawBlocks])
    .filter(block => block && block.start && block.start.day && block.start.month && block.start.year)
    .map(block => {
      const startDay = parseInt(block.start.day);
      const startMonth = parseInt(block.start.month);
      const startYear = parseInt(block.start.year);
      const endDay = block.end && block.end.day ? parseInt(block.end.day) : startDay;
      const endMonth = block.end && block.end.month ? parseInt(block.end.month) : startMonth;
      const endYear = block.end && block.end.year ? parseInt(block.end.year) : startYear;
      
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      
      const startFormatted = `${start.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(start)} ${start.getFullYear()}`;
      const endFormatted = `${end.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(end)} ${end.getFullYear()}`;
      
      return {
        startDate: startFormatted,
        endDate: endFormatted
      };
    });
  
  req.session.data.hearingDatesPatternC = processedBlocks;
  req.session.data.hearingDatesPatternCBlocks = undefined;
  
  req.session.save(() => {
    res.redirect('/projects/back-office/manage/examination/hearing-dates-results.html');
  });
});

// Hearing Dates Results Page
router.get('/projects/back-office/manage/examination/hearing-dates-results.html', (req, res) => {
  res.render('projects/back-office/manage/examination/hearing-dates-results', {
    data: req.session.data,
    serviceName: 'Local Plans Examinations'
  });
});

// Clear Hearing Dates Data
router.get('/projects/back-office/manage/examination/hearing-dates-clear.html', (req, res) => {
  if (req.session.data) {
    req.session.data.hearingDatesPatternA = undefined;
    req.session.data.hearingDatesPatternB = undefined;
    req.session.data.hearingDatesPatternC = undefined;
    req.session.data.hearingDatesPatternCBlocks = undefined;
  }
  
  req.session.save(() => {
    res.redirect('/projects/back-office/manage/examination/hearing-dates-results.html');
  });
});

module.exports = router;
