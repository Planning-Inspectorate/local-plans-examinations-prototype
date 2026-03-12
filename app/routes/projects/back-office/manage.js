const express = require('express');
const router = express.Router();

// Index overview page GET (display all case data)
router.get('/projects/back-office/manage/index.html', (req, res) => {
  // Combine first and last names for display
  const mainContactName = req.session.mainContact ? 
    [req.session.mainContact.firstName, req.session.mainContact.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() || '' : '';
  
  const contact2Name = [req.session.contact2FirstName, req.session.contact2LastName]
    .filter(Boolean)
    .join(' ')
    .trim() || '';

  res.render('projects/back-office/manage/index', {
    planTitle: req.session.planTitle || '',
    planType: req.session.planType || '',
    lpaName: req.session.lpaName || '',
    lpaRegion: req.session.lpaRegion || '',
    caseOfficer: req.session.caseOfficer || '',
    mainContactName,
    mainContactEmail: req.session.mainContact?.email || '',
    mainContactPhone: req.session.mainContact?.phone || '',
    mainContactOrg: req.session.mainContact?.organisation || req.session.lpaName || '',
    contact2Name,
    contact2Email: req.session.contact2Email || '',
    contact2Phone: req.session.contact2Phone || '',
    contact2Org: req.session.contact2Organisation || req.session.lpaName || '',
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
    examiningInspectors: req.session.examiningInspectors || '-'
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
  res.render('projects/back-office/manage/overview/select-LPA', {
    selectedLPA: req.session.lpaName || '',
    lpaList,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// LPA edit POST (with region lookup)
const lpaToRegion = require('../../../data/lpa-to-region.json');
router.post('/projects/back-office/manage/overview/select-LPA', (req, res) => {
  const { lpa, returnUrl } = req.body;
  req.session.lpaName = lpa && lpa.trim() !== '' ? lpa : '';
  // Lookup region from lpa-to-region.json
  let region = '';
  if (lpa) {
    const match = lpaToRegion.features.find(f => f.properties.LAD25NM === lpa);
    if (match) {
      region = match.properties.RGN25NM;
    }
  }
  if (region) {
    req.session.lpaRegion = region;
  }
  res.redirect(returnUrl || '/projects/back-office/manage/index.html');
});

// Region edit GET (preselect and provide all regions)
const lpaToRegionSimple = require('../../../data/lpa-to-region-simple.json');
const allRegions = Array.from(new Set(Object.values(lpaToRegionSimple))).sort();
router.get('/projects/back-office/manage/overview/LPA-region', (req, res) => {
  // Default to looked-up region if available, else session value
  let region = req.session.lpaRegion || '';
  if (req.session.lpaName && lpaToRegionSimple[req.session.lpaName]) {
    region = req.session.lpaRegion || lpaToRegionSimple[req.session.lpaName];
  }
  res.render('projects/back-office/manage/overview/LPA-region', {
    lpaRegion: region,
    allRegions,
    returnUrl: req.query.returnUrl || '/projects/back-office/manage/index.html',
    isEdit: true
  });
});

// Region edit POST
router.post('/projects/back-office/manage/overview/LPA-region', (req, res) => {
  const { 'lpa-region': lpaRegion, returnUrl } = req.body;
  req.session.lpaRegion = lpaRegion && lpaRegion.trim() !== '' ? lpaRegion : '';
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
      const prevParts = req.session[sessionKey].split(' ');
      if (prevParts.length === 3) {
        prevDay = prevParts[0];
        prevMonth = prevParts[1];
        prevYear = prevParts[2];
      }
    }
    // Use new value if provided, otherwise previous value
    const newDay = day && day.trim() !== '' ? day.padStart(2, '0') : prevDay;
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
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '-',
    gateway2ActualDate: req.session.gateway2ActualDate || '-',
    gateway2ValidDate: req.session.gateway2ValidDate || '-',
    gateway2WorkshopDate: req.session.gateway2WorkshopDate || '-',
    gateway2WorkshopVenue: req.session.gateway2WorkshopVenue || '-',
    gateway2AssessorAppointmentDate: req.session.gateway2AssessorAppointmentDate || '-',
    gateway2ReportIssuedDate: req.session.gateway2ReportIssuedDate || '-',
    gateway2ReportPublishedDate: req.session.gateway2ReportPublishedDate || '-',
    gateway2AssessorName: req.session.gateway2AssessorName || '-',
    gateway2PlanStatus: req.session.gateway2PlanStatus || '-',
    gateway2Grade: req.session.gateway2Grade || '-'
  });
});


// Notice of Intention date POST (edit view)
router.post('/projects/back-office/manage/change-notice-date', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  // Save to session
  if (day && month && year) {
    // Save as D MMMM YYYY (e.g. 12 March 2026)
    const months = [ '', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
    let m = parseInt(month, 10);
    let monthName = months[m] || month;
    req.session.noticeOfIntentionDate = `${parseInt(day, 10)} ${monthName} ${year}`;
  }
  res.redirect(returnUrl || '/projects/back-office/manage/timetable.html');
});


// Notice of Intention date GET (edit view)
router.get('/projects/back-office/manage/change-notice-date.html', (req, res) => {
  let noticeOfIntentionDate = '';
  if (req.session.noticeOfIntentionDate && req.session.noticeOfIntentionDate !== '-') {
    // Accepts either DD/MM/YYYY or DD MM YYYY or D MMMM YYYY
    let parts = req.session.noticeOfIntentionDate.includes('/')
      ? req.session.noticeOfIntentionDate.split('/')
      : req.session.noticeOfIntentionDate.split(' ');
    let day = parts[0] || '';
    let month = parts[1] || '';
    let year = parts[2] || '';
    // Convert month name to number if needed
    const monthMap = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
      'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    if (monthMap[month]) {
      month = monthMap[month];
    } else if (month.length === 1) {
      month = '0' + month;
    }
    noticeOfIntentionDate = `${day}/${month}/${year}`;
  } else if (req.query.date) {
    // Use date from query string if provided (format: DD/MM/YYYY)
    noticeOfIntentionDate = req.query.date;
  } else {
    // Default to today
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    noticeOfIntentionDate = `${day}/${month}/${year}`;
  }
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/timetable.html';
  // Debug output
  console.log('DEBUG change-notice-date GET:', {
    sessionValue: req.session.noticeOfIntentionDate,
    noticeOfIntentionDate,
    returnUrl
  });
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
    estimatedDate = `${day.padStart(2, '0')} ${getMonthName(month)} ${year}`;
  }
  req.session.gateway1EstimatedDate = estimatedDate;
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});

// Gateway 1 SLA Sent POST
router.post('/projects/back-office/manage/GW1/gateway-1-sla-sent', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  let slaSentDate = '-';
  if (day && month && year) {
    slaSentDate = `${day.padStart(2, '0')} ${getMonthName(month)} ${year}`;
  }
  req.session.gateway1SlaSentDate = slaSentDate;
  res.redirect(returnUrl || '/projects/back-office/manage/gateway-1.html');
});

// Gateway 1 SLA Received POST
router.post('/projects/back-office/manage/GW1/gateway-1-sla-received', (req, res) => {
  const { 'notice-of-intention-date-day': day, 'notice-of-intention-date-month': month, 'notice-of-intention-date-year': year, returnUrl } = req.body;
  let slaReceivedDate = '-';
  if (day && month && year) {
    slaReceivedDate = `${day.padStart(2, '0')} ${getMonthName(month)} ${year}`;
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
  res.render('projects/back-office/manage/delete-case-confirmation');
});

// Handle delete POST and show complete page
router.post('/projects/back-office/manage/delete-case-complete.html', (req, res) => {
  // Here you would implement soft delete logic, e.g. mark as deleted in DB or session
  res.render('projects/back-office/manage/delete-case-complete');
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
  const newDay = day && day.trim() !== '' ? day.padStart(2, '0') : prevDay;
  const newMonth = month && month.trim() !== '' ? getMonthName(month) : prevMonth;
  const newYear = year && year.trim() !== '' ? year : prevYear;
  // Always update with merged values (allow partial edits)
  if (newDay || newMonth || newYear) {
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
    gateway1ActualDate: req.session.gateway1ActualDate || '-',
    gateway1EstimatedDate: req.session.gateway1EstimatedDate || '-',
    gateway1SlaSentDate: req.session.gateway1SlaSentDate || '-',
    gateway1SlaReceivedDate: req.session.gateway1SlaReceivedDate || '-',
    gateway1DsaCheck: req.session.gateway1DsaCheck || '-'
  });
});

// Timetable page GET
router.get('/projects/back-office/manage/timetable.html', (req, res) => {
  // Format noticeOfIntentionDate as 'DD MMMM YYYY' if possible
  let noticeOfIntentionDate = req.session.noticeOfIntentionDate || '-';
  if (noticeOfIntentionDate && noticeOfIntentionDate !== '-') {
    // Accepts 'D MMMM YYYY', 'DD/MM/YYYY', or 'DD MM YYYY'
    let parts = noticeOfIntentionDate.includes('/')
      ? noticeOfIntentionDate.split('/')
      : noticeOfIntentionDate.split(' ');
    let day = parts[0] || '';
    let month = parts[1] || '';
    let year = parts[2] || '';
    // Convert month number to name if needed
    const months = [ '', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
    if (/^\d+$/.test(month)) {
      let m = parseInt(month, 10);
      if (m >= 1 && m <= 12) month = months[m];
    }
    if (day && month && year) {
      noticeOfIntentionDate = `${parseInt(day, 10)} ${month} ${year}`;
    }
  }
  res.render('projects/back-office/manage/timetable', {
    noticeOfIntentionDate,
    gateway1ActualDate: req.session.gateway1ActualDate || '-',
    gateway1EstimatedDate: req.session.gateway1EstimatedDate || '-',
    gateway1SlaSentDate: req.session.gateway1SlaSentDate || '-',
    gateway1SlaReceivedDate: req.session.gateway1SlaReceivedDate || '-',
    gateway1DsaCheck: req.session.gateway1DsaCheck || '-',
    gateway2EstimatedDate: req.session.gateway2EstimatedDate || '-',
    gateway2ActualDate: req.session.gateway2ActualDate || '-',
    gateway2ValidDate: req.session.gateway2ValidDate || '-',
    gateway2WorkshopDate: req.session.gateway2WorkshopDate || '-',
    gateway2AssessorAppointmentDate: req.session.gateway2AssessorAppointmentDate || '-',
    gateway2ReportIssuedDate: req.session.gateway2ReportIssuedDate || '-',
    gateway2ReportPublishedDate: req.session.gateway2ReportPublishedDate || '-',
    gateway3EstimatedDate: req.session.gateway3EstimatedDate || '-',
    gateway3ActualDate: req.session.gateway3ActualDate || '-',
    gateway3AssessorAppointmentDate: req.session.gateway3AssessorAppointmentDate || '-',
    gateway3CompletionDate: req.session.gateway3CompletionDate || '-',
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
    gateway3EstimatedDate: req.session.gateway3EstimatedDate || '-',
    gateway3ActualDate: req.session.gateway3ActualDate || '-',
    gateway3AssessorAppointmentDate: req.session.gateway3AssessorAppointmentDate || '-',
    gateway3CompletionDate: req.session.gateway3CompletionDate || '-',
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
      const prevParts = req.session[sessionKey].split(' ');
      if (prevParts.length === 3) {
        prevDay = prevParts[0];
        prevMonth = prevParts[1];
        prevYear = prevParts[2];
      }
    }
    // Use new value if provided, otherwise previous value
    const newDay = day && day.trim() !== '' ? day.padStart(2, '0') : prevDay;
    const months = [ '', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
    let newMonth = month && month.trim() !== '' ? (months[parseInt(month, 10)] || month) : prevMonth;
    const newYear = year && year.trim() !== '' ? year : prevYear;
    if (newDay && newMonth && newYear) {
      req.session[sessionKey] = `${newDay} ${newMonth} ${newYear}`;
    }
    res.redirect(returnUrl || '/projects/back-office/manage/gateway-3.html');
  });
});

module.exports = router;
