const express = require('express');
const router = express.Router();
const {
  PLAN_STATUS_CLASS_MAP,
  getPlanStatusClasses
} = require('./projects/back-office/plan-status-classes');

// Helper function to convert date format from "D MonthName YYYY" or "DD/MM/YYYY" to "DD/MM/YYYY"
function convertToSlashFormat(dateStr) {
  if (!dateStr || dateStr === '-') return '';
  
  // If already in DD/MM/YYYY format, return as is
  if (dateStr.includes('/')) return dateStr;
  
  // Convert from "D MonthName YYYY" format to "DD/MM/YYYY"
  const months = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };
  
  const parts = dateStr.trim().split(' ');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = months[parts[1]];
    const year = parts[2];
    if (month && year) return `${day}/${month}/${year}`;
  }
  
  return '';
}

// Format dates for check-answers as "D Month YYYY".
// Only show a value when at least month and year are present.
function formatDateForCheckAnswers(dateStr) {
  if (!dateStr || dateStr === '-') return '';

  const monthNames = {
    '1': 'January', '01': 'January',
    '2': 'February', '02': 'February',
    '3': 'March', '03': 'March',
    '4': 'April', '04': 'April',
    '5': 'May', '05': 'May',
    '6': 'June', '06': 'June',
    '7': 'July', '07': 'July',
    '8': 'August', '08': 'August',
    '9': 'September', '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December'
  };

  // Handle slash format: D/M/YYYY or partials.
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    const day = (parts[0] || '').trim();
    const monthRaw = (parts[1] || '').trim();
    const year = (parts[2] || '').trim();

    // Requirement: only show if month and year exist.
    if (!monthRaw || !year) return '';

    const month = monthNames[monthRaw];
    if (!month) return '';

    if (!day) return `${month} ${year}`;
    const dayNum = parseInt(day, 10);
    return Number.isNaN(dayNum) ? '' : `${dayNum} ${month} ${year}`;
  }

  // Handle already formatted values like "17 May 2026".
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length === 3) {
    const dayNum = parseInt(parts[0], 10);
    const month = parts[1];
    const year = parts[2];
    return Number.isNaN(dayNum) ? '' : `${dayNum} ${month} ${year}`;
  }

  return '';
}

// ...existing code...

const REGION_OPTIONS = [
  "East of England",
  "East Midlands",
  "London",
  "North East",
  "North West",
  "South East",
  "South West",
  "West Midlands",
  "Yorkshire and the Humber"
];

// Edit LPA region page
router.get('/projects/back-office/create-case/v5/LPA-region', (req, res) => {
  const isEdit = req.query.edit === 'true';
  const index = req.query.index ? parseInt(req.query.index, 10) : 0;
  const lpas = req.session.lpas || [];
  const lpa = lpas[index];
  const lpaRegions = req.session.lpaRegions || {};
  res.render('projects/back-office/create-case/v5/LPA-region', {
    region: lpaRegions[lpa] || '',
    regionOptions: REGION_OPTIONS,
    isEdit,
    lpa,
    index
  });
});

router.post('/projects/back-office/create-case/v5/LPA-region', (req, res) => {
  if (req.body.action === 'cancel') {
    return res.redirect('/projects/back-office/create-case/v5/check-answers');
  }
  const isEdit = req.body.isEdit === 'true';
  const index = req.body.index ? parseInt(req.body.index, 10) : 0;
  const lpas = req.session.lpas || [];
  const lpa = lpas[index];
  if (!req.session.lpaRegions) req.session.lpaRegions = {};
  req.session.lpaRegions[lpa] = req.body.region;
  if (isEdit) {
    return res.redirect('/projects/back-office/create-case/v5/check-answers');
  }
  res.redirect('/projects/back-office/create-case/v5/add-additional-lpa');
});

// Start page
router.get('/projects/back-office/create-case/v5/index', (req, res) => {
  // Reinitialize if cases don't exist or are in old format (missing lpas field)
  const needsReinit = !req.session.cases || req.session.cases.length === 0 || (req.session.cases.length > 0 && !req.session.cases[0].lpas);
  if (needsReinit) {
    req.session.cases = [
      {
        caseRef: 'PLAN/000001',
        planTitle: 'Central City Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Jane Smith',
        lpas: ['Birmingham City Council'],
        lpaRegions: {'Birmingham City Council': 'West Midlands'},
        mainContact: {name: 'David Wilson', email: 'd.wilson@birmingham.gov.uk', phone: '0121 303 1234', organisation: 'Birmingham City Council'},
        contacts: [{name: 'Emma Thompson', email: 'e.thompson@birmingham.gov.uk', phone: '0121 303 5678', organisation: 'Birmingham City Council'}],
        noticeOfIntentionDate: '1 March 2026',
        gateway1Date: '15 April 2026',
        gateway2Date: '20 June 2026',
        gateway3Date: '10 September 2026',
        submissionDate: '15 September 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-01-15').toISOString()
      },
      {
        caseRef: 'PLAN/000002',
        planTitle: 'North District Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'John Doe',
        lpas: ['Leeds City Council'],
        lpaRegions: {'Leeds City Council': 'Yorkshire and the Humber'},
        mainContact: {name: 'Sarah Brown', email: 's.brown@leeds.gov.uk', phone: '0113 222 4000', organisation: 'Leeds City Council'},
        contacts: [{name: 'Michael Clarke', email: 'm.clarke@leeds.gov.uk', phone: '0113 222 4001', organisation: 'Leeds City Council'}, {name: 'Lisa Wong', email: 'l.wong@leeds.gov.uk', phone: '0113 222 4002', organisation: 'Leeds City Council'}],
        noticeOfIntentionDate: '5 February 2026',
        gateway1Date: '20 March 2026',
        gateway2Date: '25 May 2026',
        gateway3Date: '15 August 2026',
        submissionDate: '20 August 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-01-20').toISOString()
      },
      {
        caseRef: 'PLAN/000003',
        planTitle: 'Southside Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Alex Johnson',
        lpas: ['Brighton and Hove City Council'],
        lpaRegions: {'Brighton and Hove City Council': 'South East'},
        mainContact: {name: 'Jennifer Lee', email: 'j.lee@brighton-hove.gov.uk', phone: '01273 292 000', organisation: 'Brighton and Hove City Council'},
        contacts: [{name: 'Robert Davis', email: 'r.davis@brighton-hove.gov.uk', phone: '01273 292 001', organisation: 'Brighton and Hove City Council'}],
        noticeOfIntentionDate: '10 January 2026',
        gateway1Date: '25 February 2026',
        gateway2Date: '30 April 2026',
        gateway3Date: '20 July 2026',
        submissionDate: '25 July 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-01-25').toISOString()
      },
      {
        caseRef: 'PLAN/000004',
        planTitle: 'West End Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Jane Smith',
        lpas: ['Manchester City Council'],
        lpaRegions: {'Manchester City Council': 'North West'},
        mainContact: {name: 'Patricia Martin', email: 'p.martin@manchester.gov.uk', phone: '0161 234 5000', organisation: 'Manchester City Council'},
        contacts: [{name: 'Kevin Foster', email: 'k.foster@manchester.gov.uk', phone: '0161 234 5001', organisation: 'Manchester City Council'}, {name: 'Amy Stewart', email: 'a.stewart@manchester.gov.uk', phone: '0161 234 5002', organisation: 'Manchester City Council'}, {name: 'James Murray', email: 'j.murray@manchester.gov.uk', phone: '0161 234 5003', organisation: 'Manchester City Council'}],
        noticeOfIntentionDate: '15 December 2026',
        gateway1Date: '28 January 2026',
        gateway2Date: '5 April 2026',
        gateway3Date: '25 June 2026',
        submissionDate: '30 June 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-02-01').toISOString()
      },
      {
        caseRef: 'PLAN/000005',
        planTitle: 'East Borough Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Michael Brown',
        lpas: ['Norwich City Council'],
        lpaRegions: {'Norwich City Council': 'East of England'},
        mainContact: {name: 'Catherine Bennett', email: 'c.bennett@norwich.gov.uk', phone: '01603 212 000', organisation: 'Norwich City Council'},
        contacts: [{name: 'George Wright', email: 'g.wright@norwich.gov.uk', phone: '01603 212 001', organisation: 'Norwich City Council'}],
        noticeOfIntentionDate: '20 February 2026',
        gateway1Date: '10 April 2026',
        gateway2Date: '15 June 2026',
        gateway3Date: '5 September 2026',
        submissionDate: '10 September 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-02-10').toISOString()
      },
      {
        caseRef: 'PLAN/000006',
        planTitle: 'Riverside Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Sophie Green',
        lpas: ['Nottingham City Council'],
        lpaRegions: {'Nottingham City Council': 'East Midlands'},
        mainContact: {name: 'Victoria Harris', email: 'v.harris@nottingham.gov.uk', phone: '0115 876 5000', organisation: 'Nottingham City Council'},
        contacts: [{name: 'Edward Roberts', email: 'e.roberts@nottingham.gov.uk', phone: '0115 876 5001', organisation: 'Nottingham City Council'}, {name: 'Susan Taylor', email: 's.taylor@nottingham.gov.uk', phone: '0115 876 5002', organisation: 'Nottingham City Council'}],
        noticeOfIntentionDate: '25 January 2026',
        gateway1Date: '12 March 2026',
        gateway2Date: '18 May 2026',
        gateway3Date: '8 August 2026',
        submissionDate: '13 August 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-02-15').toISOString()
      },
      {
        caseRef: 'PLAN/000007',
        planTitle: 'Hilltop Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Chris White',
        lpas: ['Coventry City Council'],
        lpaRegions: {'Coventry City Council': 'West Midlands'},
        mainContact: {name: 'Margaret Wilson', email: 'm.wilson@coventry.gov.uk', phone: '024 7683 3333', organisation: 'Coventry City Council'},
        contacts: [{name: 'Peter Johnson', email: 'p.johnson@coventry.gov.uk', phone: '024 7683 3334', organisation: 'Coventry City Council'}],
        noticeOfIntentionDate: '8 March 2026',
        gateway1Date: '22 April 2026',
        gateway2Date: '28 June 2026',
        gateway3Date: '18 September 2026',
        submissionDate: '23 September 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-02-20').toISOString()
      },
      {
        caseRef: 'PLAN/000008',
        planTitle: 'Market Town Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Rachel Black',
        lpas: ['Bristol City Council'],
        lpaRegions: {'Bristol City Council': 'South West'},
        mainContact: {name: 'Elizabeth Moore', email: 'e.moore@bristol.gov.uk', phone: '0117 922 2000', organisation: 'Bristol City Council'},
        contacts: [{name: 'Richard Turner', email: 'r.turner@bristol.gov.uk', phone: '0117 922 2001', organisation: 'Bristol City Council'}, {name: 'Margaret Phillips', email: 'm.phillips@bristol.gov.uk', phone: '0117 922 2002', organisation: 'Bristol City Council'}],
        noticeOfIntentionDate: '12 February 2026',
        gateway1Date: '28 March 2026',
        gateway2Date: '2 June 2026',
        gateway3Date: '22 August 2026',
        submissionDate: '27 August 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-02-25').toISOString()
      },
      {
        caseRef: 'PLAN/000009',
        planTitle: 'Greenfield Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Tom Harris',
        lpas: ['York City Council'],
        lpaRegions: {'York City Council': 'Yorkshire and the Humber'},
        mainContact: {name: 'Julia Anderson', email: 'j.anderson@york.gov.uk', phone: '01904 613 000', organisation: 'York City Council'},
        contacts: [{name: 'William Jackson', email: 'w.jackson@york.gov.uk', phone: '01904 613 001', organisation: 'York City Council'}],
        noticeOfIntentionDate: '18 March 2026',
        gateway1Date: '5 May 2026',
        gateway2Date: '10 July 2026',
        gateway3Date: '30 September 2026',
        submissionDate: '5 October 2026',
        status: 'Awaiting Gateway 2',
        createdDate: new Date('2024-03-01').toISOString()
      },
      {
        caseRef: 'PLAN/000010',
        planTitle: 'Seaside Local Plan',
        planType: 'Local Plan',
        caseOfficer: 'Anna Lee',
        lpas: ['Southampton City Council'],
        lpaRegions: {'Southampton City Council': 'South East'},
        mainContact: {name: 'Dorothy Garcia', email: 'd.garcia@southampton.gov.uk', phone: '023 8083 3000', organisation: 'Southampton City Council'},
        contacts: [{name: 'Frank Miller', email: 'f.miller@southampton.gov.uk', phone: '023 8083 3001', organisation: 'Southampton City Council'}, {name: 'Helen Davis', email: 'h.davis@southampton.gov.uk', phone: '023 8083 3002', organisation: 'Southampton City Council'}, {name: 'Thomas Brown', email: 't.brown@southampton.gov.uk', phone: '023 8083 3003', organisation: 'Southampton City Council'}],
        noticeOfIntentionDate: '22 January 2026',
        gateway1Date: '8 March 2026',
        gateway2Date: '12 May 2026',
        gateway3Date: '2 August 2026',
        submissionDate: '7 August 2026',
        statusStrategy: 'fixed',
        status: 'Gateway 2 Validation',
        createdDate: new Date('2024-03-05').toISOString()
      }
    ];
  }

  const journey = req.query.journey === 'side' ? 'side' : 'default';
  res.render('projects/back-office/create-case/v5/index', {
    cases: req.session.cases.slice().reverse(),
    showEmpty: req.query.showEmpty === 'true',
    planStatusClassMap: PLAN_STATUS_CLASS_MAP,
    journey
  });
});

// Load case - populates session with case data and redirects to manage
router.get('/projects/back-office/create-case/v5/load-case', (req, res) => {
  const { caseRef } = req.query;
  const destination = req.query.destination === 'overview-side' ? 'overview-side' : 'overview';
  
  // Find the case in the cases array
  if (!req.session.cases) {
    return res.redirect('/projects/back-office/create-case/v5/index');
  }
  
  const caseToLoad = req.session.cases.find(c => c.caseRef === caseRef);
  
  if (!caseToLoad) {
    return res.redirect('/projects/back-office/create-case/v5/index');
  }
  
  // Clear all manage-specific fields first
  // This ensures data from previous cases doesn't contaminate the new case
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
  
  // Populate the session with the case data
  req.session.currentCaseRef = caseRef;
  req.session.planTitle = caseToLoad.planTitle || '';
  req.session.planType = caseToLoad.planType || '';
  req.session.caseOfficer = caseToLoad.caseOfficer || '';
  req.session.lpas = caseToLoad.lpas || [];
  req.session.lpaRegions = caseToLoad.lpaRegions || {};
  req.session.mainContact = caseToLoad.mainContact || null;
  req.session.contacts = caseToLoad.contacts || [];
  req.session.noticeOfIntentionDate = caseToLoad.noticeOfIntentionDate || '';
  // Map gateway dates - create-case/v2 stores as gateway1Date, manage pages expect gateway1EstimatedDate
  req.session.gateway1EstimatedDate = caseToLoad.gateway1Date || '';
  req.session.gateway2EstimatedDate = caseToLoad.gateway2Date || '';
  req.session.gateway3EstimatedDate = caseToLoad.gateway3Date || '';
  req.session.submissionDate = caseToLoad.submissionDate || '';
  req.session.planStatus = caseToLoad.status || 'Submitted';
  caseToLoad.status = req.session.planStatus;
  if (!req.session.data) req.session.data = {};
  req.session.data.planStatus = req.session.planStatus;
  req.session.data.planStatusClasses = getPlanStatusClasses(req.session.planStatus);
  req.session.data.planStatusClassMap = PLAN_STATUS_CLASS_MAP;
  // Populate examination estimated date from gateway3 - stored in D MMMM YYYY format (GOV.UK standard)
  const gateway3Date = caseToLoad.gateway3Date || '';
  req.session.examinationEstimatedDate = (gateway3Date && gateway3Date !== '') ? gateway3Date : '';

  if (destination === 'overview-side') {
    const selectedOverviewVersion = req.session?.workflowNavVersionOverrides?.overview;
    const sideOverviewVersion = selectedOverviewVersion === 'v1' || selectedOverviewVersion === 'v2'
      ? selectedOverviewVersion
      : 'v2';
    return res.redirect(`/projects/back-office/manage/overview/${sideOverviewVersion}/index-side`);
  }

  // Redirect to selected overview version from nav tester (defaults to v2).
  const selectedOverviewVersion = req.session?.workflowNavVersionOverrides?.overview || 'v2';
  res.redirect(`/projects/back-office/manage/overview/${selectedOverviewVersion}/index`);
});

// Case officer
router.get('/projects/back-office/create-case/v5/0-case-officer-name', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case/v5/0-case-officer-name', {
    caseOfficer: req.session.caseOfficer,
    lpa: req.session.lpa,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case/v5/0-case-officer-name', (req, res) => {
  if (!req.body.caseOfficer) {
    return res.render('projects/back-office/create-case/v5/0-case-officer-name', {
      error: 'Please select a case officer',
      caseOfficer: req.session.caseOfficer,
      lpa: req.session.lpa
    });
  }
  const isEdit = req.body.isEdit === 'true';
  req.session.caseOfficer = req.body.caseOfficer;
  req.session.lpa = req.body.lpa;
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case/v5/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case/v5/1-plan-title');
  }
});

// Plan title page
router.get('/projects/back-office/create-case/v5/1-plan-title', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case/v5/1-plan-title', {
    planTitle: req.session.planTitle,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case/v5/1-plan-title', (req, res) => {
  if (!req.body['plan-title']) {
    return res.render('projects/back-office/create-case/v5/1-plan-title', {
      error: 'Please enter a plan title',
      planTitle: req.session.planTitle
    });
  }
  const isEdit = req.body.isEdit === 'true';
  req.session.planTitle = req.body['plan-title'];
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case/v5/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case/v5/2-plan-type');
  }
});

// Plan type page
router.get('/projects/back-office/create-case/v5/2-plan-type', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case/v5/2-plan-type', {
    planType: req.session.planType,
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case/v5/2-plan-type', (req, res) => {
  if (!req.body['plan-type']) {
    return res.render('projects/back-office/create-case/v5/2-plan-type', {
      error: 'Please select a plan type',
      planType: req.session.planType
    });
  }
  const isEdit = req.body.isEdit === 'true';
  req.session.planType = req.body['plan-type'];
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case/v5/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case/v5/3-select-LPA');
  }
});

// Select LPA page
router.get('/projects/back-office/create-case/v5/3-select-LPA', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const lpaListPath = path.join(__dirname, '../data/lpa-list.json');
  let lpaList = [];
  try {
    lpaList = JSON.parse(fs.readFileSync(lpaListPath, 'utf8'));
  } catch (e) {
    lpaList = [];
  }
  const isEdit = req.query.edit === 'true';
  const index = req.query.index ? parseInt(req.query.index, 10) : 0;
  let selectedLPA = undefined;
  if (req.session.lpas && req.session.lpas.length > index) {
    selectedLPA = req.session.lpas[index];
  }
  res.render('projects/back-office/create-case/v5/3-select-LPA', {
    lpaList,
    selectedLPA,
    isEdit,
    index
  });
});

router.post('/projects/back-office/create-case/v5/3-select-LPA', (req, res) => {
  const index = req.body.index ? parseInt(req.body.index, 10) : 0;
  if (!req.session.lpas) req.session.lpas = [];
  req.session.lpas[index] = req.body.lpa;

  // Load the LPA to region mapping
  const path = require('path');
  const fs = require('fs');
  const mappingPath = path.join(__dirname, '../data/lpa-to-region-simple.json');
  let lpaToRegion = {};
  try {
    lpaToRegion = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  } catch (e) {
    lpaToRegion = {};
  }
  if (!req.session.lpaRegions) req.session.lpaRegions = {};
  req.session.lpaRegions[req.body.lpa] = lpaToRegion[req.body.lpa] || '';

  // If editing, return to check-answers, else continue as normal
  if (req.body.isEdit === 'true') {
    return res.redirect('/projects/back-office/create-case/v5/check-answers');
  }
  res.redirect('/projects/back-office/create-case/v5/add-additional-lpa');
});

// Add additional LPA page
router.get('/projects/back-office/create-case/v5/add-additional-lpa', (req, res) => {
  res.render('projects/back-office/create-case/v5/add-additional-lpa', {
    hasAdditionalLPA: req.session.hasAdditionalLPA
  });
});

router.post('/projects/back-office/create-case/v5/add-additional-lpa', (req, res) => {
  req.session.hasAdditionalLPA = req.body.hasAdditionalLPA;
  if (req.body.hasAdditionalLPA === 'yes') {
    res.redirect('/projects/back-office/create-case/v5/additional-LPA');
  } else {
    res.redirect('/projects/back-office/create-case/v5/main-contact');
  }
});

// Additional LPA page
router.get('/projects/back-office/create-case/v5/additional-LPA', (req, res) => {
  const path = require('path');
  const fs = require('fs');
  const lpaListPath = path.join(__dirname, '../data/lpa-list.json');
  let lpaList = [];
  try {
    lpaList = JSON.parse(fs.readFileSync(lpaListPath, 'utf8'));
  } catch (e) {
    lpaList = [];
  }
  res.render('projects/back-office/create-case/v5/additional-LPA', { lpaList });
});

router.post('/projects/back-office/create-case/v5/additional-LPA', (req, res) => {
  if (!req.session.lpas) req.session.lpas = [];
  req.session.lpas.push(req.body.lpa); // Add new LPA to array
  res.redirect('/projects/back-office/create-case/v5/add-additional-lpa');
});

// Main contact page (single GET route, uses mainContact)
router.get('/projects/back-office/create-case/v5/main-contact', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case/v5/main-contact', {
    lpas: req.session.lpas || [],
    mainContact: req.session.mainContact,
    isEdit: isEdit,
    from: req.query.from || ''
  });
});

router.post('/projects/back-office/create-case/v5/main-contact', (req, res) => {
  const isEdit = req.body.isEdit === 'true';
  const fromPage = req.body.from || req.query.from || 'check-answers';
  
  req.session.mainContact = {
    firstName: req.body.mainContactFirstName,
    lastName: req.body.mainContactLastName,
    email: req.body.mainContactEmail,
    phone: req.body.mainContactPhone,
    organisation: req.session.mainContact?.organisation || ''
  };

  const returnTo = isEdit
    ? (fromPage === 'check-contact-details'
      ? '/projects/back-office/create-case/v5/check-contact-details'
      : '/projects/back-office/create-case/v5/check-answers')
    : '/projects/back-office/create-case/v5/check-contact-details';

  req.session.pendingContactAssociation = {
    type: 'main',
    returnTo
  };

  res.redirect('/projects/back-office/create-case/v5/contact-organisation');
});

// Contact organisation association page
router.get('/projects/back-office/create-case/v5/contact-organisation', (req, res) => {
  const pending = req.session.pendingContactAssociation;
  if (!pending) {
    return res.redirect('/projects/back-office/create-case/v5/check-contact-details');
  }

  const lpas = req.session.lpas || [];
  let selectedOrganisation = '';
  let contactLabel = 'contact';

  if (pending.type === 'main' && req.session.mainContact) {
    selectedOrganisation = req.session.mainContact.organisation || '';
    contactLabel = `main contact (${req.session.mainContact.firstName || ''} ${req.session.mainContact.lastName || ''})`.trim();
  } else if (
    pending.type === 'additional' &&
    Number.isInteger(pending.index) &&
    Array.isArray(req.session.contacts) &&
    req.session.contacts[pending.index]
  ) {
    const contact = req.session.contacts[pending.index];
    selectedOrganisation = contact.organisation || '';
    contactLabel = `additional contact (${contact.firstName || ''} ${contact.lastName || ''})`.trim();
  }

  res.render('projects/back-office/create-case/v5/contact-organisation', {
    lpas,
    selectedOrganisation,
    contactLabel,
    error: null
  });
});

router.post('/projects/back-office/create-case/v5/contact-organisation', (req, res) => {
  const pending = req.session.pendingContactAssociation;
  if (!pending) {
    return res.redirect('/projects/back-office/create-case/v5/check-contact-details');
  }

  const lpas = req.session.lpas || [];
  let selectedOrganisation = (req.body.contactOrganisation || '').trim();

  if (!selectedOrganisation && lpas.length === 1) {
    selectedOrganisation = lpas[0];
  }

  if (!selectedOrganisation) {
    let contactLabel = 'contact';
    if (pending.type === 'main' && req.session.mainContact) {
      contactLabel = `main contact (${req.session.mainContact.firstName || ''} ${req.session.mainContact.lastName || ''})`.trim();
    } else if (
      pending.type === 'additional' &&
      Number.isInteger(pending.index) &&
      Array.isArray(req.session.contacts) &&
      req.session.contacts[pending.index]
    ) {
      const contact = req.session.contacts[pending.index];
      contactLabel = `additional contact (${contact.firstName || ''} ${contact.lastName || ''})`.trim();
    }

    return res.render('projects/back-office/create-case/v5/contact-organisation', {
      lpas,
      selectedOrganisation,
      contactLabel,
      error: 'Select which Local Planning Authority this contact is associated with'
    });
  }

  if (pending.type === 'main' && req.session.mainContact) {
    req.session.mainContact.organisation = selectedOrganisation;
  } else if (
    pending.type === 'additional' &&
    Number.isInteger(pending.index) &&
    Array.isArray(req.session.contacts) &&
    req.session.contacts[pending.index]
  ) {
    req.session.contacts[pending.index].organisation = selectedOrganisation;
  }

  const returnTo = pending.returnTo || '/projects/back-office/create-case/v5/check-contact-details';
  delete req.session.pendingContactAssociation;
  res.redirect(returnTo);
});

// Remove main contact
router.post('/projects/back-office/create-case/v5/remove-main-contact', (req, res) => {
  req.session.mainContact = null;
  res.redirect('/projects/back-office/create-case/v5/main-contact');
});

// Remove additional contact
router.post('/projects/back-office/create-case/v5/remove-contact', (req, res) => {
  const idx = parseInt(req.body.index, 10);
  if (Array.isArray(req.session.contacts)) {
    req.session.contacts.splice(idx, 1);
  }
  res.redirect('/projects/back-office/create-case/v5/check-contact-details');
});
// Check contact details page
router.get('/projects/back-office/create-case/v5/check-contact-details', (req, res) => {
  res.render('projects/back-office/create-case/v5/check-contact-details', {
    mainContact: req.session.mainContact,
    contacts: req.session.contacts || [],
    addAnotherContact: req.session.addAnotherContact
  });
});

router.post('/projects/back-office/create-case/v5/check-contact-details', (req, res) => {
  const addAnotherContact = req.body.addAnotherContact;

  if (!addAnotherContact) {
    return res.render('projects/back-office/create-case/v5/check-contact-details', {
      mainContact: req.session.mainContact,
      contacts: req.session.contacts || [],
      addAnotherContact: '',
      error: 'Select yes if you need to add another contact'
    });
  }

  req.session.addAnotherContact = addAnotherContact;

  if (addAnotherContact === 'yes') {
    return res.redirect('/projects/back-office/create-case/v5/additional-contact');
  }

  return res.redirect('/projects/back-office/create-case/v5/enter-key-dates');
});

// Add another contact page
router.get('/projects/back-office/create-case/v5/add-another-contact', (req, res) => {
  res.redirect('/projects/back-office/create-case/v5/check-contact-details');
});

router.post('/projects/back-office/create-case/v5/add-another-contact', (req, res) => {
  res.redirect('/projects/back-office/create-case/v5/check-contact-details');
});

// Additional contact add/edit
router.get('/projects/back-office/create-case/v5/additional-contact', (req, res) => {
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
  res.render('projects/back-office/create-case/v5/additional-contact', {
    lpas: req.session.lpas || [],
    contact,
    editIndex,
    fromCheckAnswers,
    from: req.query.from || ''
  });
});

router.post('/projects/back-office/create-case/v5/additional-contact', (req, res) => {
  if (!req.session.contacts) req.session.contacts = [];
  const fromCheckAnswers = req.body.fromCheckAnswers === 'true';
  const fromCheckContactDetails = req.body.from === 'check-contact-details';
  const returnTo = fromCheckContactDetails
    ? '/projects/back-office/create-case/v5/check-contact-details'
    : fromCheckAnswers
      ? '/projects/back-office/create-case/v5/check-answers'
      : '/projects/back-office/create-case/v5/check-contact-details';
  
  if (req.body.editIndex !== undefined && req.body.editIndex !== '') {
    const editIndex = Number(req.body.editIndex);
    const existingOrganisation = req.session.contacts[editIndex]?.organisation || '';

    req.session.contacts[editIndex] = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      organisation: existingOrganisation
    };

    req.session.pendingContactAssociation = {
      type: 'additional',
      index: editIndex,
      returnTo
    };

    return res.redirect('/projects/back-office/create-case/v5/contact-organisation');
  } else {
    const newIndex = req.session.contacts.push({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      organisation: ''
    }) - 1;

    req.session.pendingContactAssociation = {
      type: 'additional',
      index: newIndex,
      returnTo
    };

    return res.redirect('/projects/back-office/create-case/v5/contact-organisation');
  }
});

router.get('/projects/back-office/create-case/v5/remove-contact-details-page', (req, res) => {
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

  res.render('projects/back-office/create-case/v5/remove-contact-details', {
    contact,
    editIndex,
    isMain
  });
});

router.post('/projects/back-office/create-case/v5/remove-contact-details-page', (req, res) => {
  const editIndex = req.body.editIndex;
  const isMain = req.body.isMain === 'true';

  if (isMain) {
    req.session.mainContact = undefined;
    // Redirect to main contact page to force user to add a new one
    return res.redirect('/projects/back-office/create-case/v5/main-contact');
  } else if (
    typeof editIndex !== 'undefined' &&
    req.session.contacts &&
    Array.isArray(req.session.contacts) &&
    !isNaN(Number(editIndex))
  ) {
    req.session.contacts.splice(Number(editIndex), 1);
  }

  res.redirect('/projects/back-office/create-case/v5/check-contact-details');
});

// Enter key dates page
router.get('/projects/back-office/create-case/v5/enter-key-dates', (req, res) => {
  const isEdit = req.query.edit === 'true';
  res.render('projects/back-office/create-case/v5/enter-key-dates', {
    mainContact: req.session.mainContact,
    contacts: req.session.contacts || [],
    noticeOfIntentionDate: convertToSlashFormat(req.session.noticeOfIntentionDate),
    gateway1Date: convertToSlashFormat(req.session.gateway1Date),
    gateway2Date: convertToSlashFormat(req.session.gateway2Date),
    gateway3Date: convertToSlashFormat(req.session.gateway3Date),
    submissionDate: convertToSlashFormat(req.session.submissionDate),
    isEdit: isEdit
  });
});

router.post('/projects/back-office/create-case/v5/enter-key-dates', (req, res) => {
  const isEdit = req.body.isEdit === 'true';
  const readDateParts = (prefix) => {
    const day = (req.body[`${prefix}-day`] || '').trim();
    const month = (req.body[`${prefix}-month`] || '').trim();
    const year = (req.body[`${prefix}-year`] || '').trim();
    const hasAnyValue = Boolean(day || month || year);

    return {
      day,
      month,
      year,
      hasAnyValue,
      value: hasAnyValue ? `${day}/${month}/${year}` : ''
    };
  };

  const notice = readDateParts('notice-of-intention-date');
  const gateway1 = readDateParts('gateway-1-date');
  const gateway2 = readDateParts('gateway-2-date');
  const gateway3 = readDateParts('gateway-3-date');
  const submission = readDateParts('submission-date');

  const errors = {};
  const errorList = [];

  const addDateErrorIfInvalid = (fieldKey, fieldLabel, fieldId, dateParts) => {
    if (!dateParts.hasAnyValue) return;

    if (!dateParts.month || !dateParts.year) {
      const message = `Enter a month and year for ${fieldLabel}`;
      errors[fieldKey] = message;
      errorList.push({ text: message, href: `#${fieldId}` });
    }
  };

  addDateErrorIfInvalid('noticeOfIntentionDate', 'Notice of Intention to Commence Local Plan Preparation', 'notice-of-intention-date-month', notice);
  addDateErrorIfInvalid('gateway1Date', 'Gateway 1 estimated date', 'gateway-1-date-month', gateway1);
  addDateErrorIfInvalid('gateway2Date', 'Gateway 2 estimated date', 'gateway-2-date-month', gateway2);
  addDateErrorIfInvalid('gateway3Date', 'Gateway 3 estimated date', 'gateway-3-date-month', gateway3);
  addDateErrorIfInvalid('submissionDate', 'Submission for examination estimated date', 'submission-date-month', submission);

  if (errorList.length > 0) {
    return res.render('projects/back-office/create-case/v5/enter-key-dates', {
      mainContact: req.session.mainContact,
      contacts: req.session.contacts || [],
      noticeOfIntentionDate: notice.value,
      gateway1Date: gateway1.value,
      gateway2Date: gateway2.value,
      gateway3Date: gateway3.value,
      submissionDate: submission.value,
      isEdit,
      errors,
      errorList
    });
  }

  req.session.noticeOfIntentionDate = notice.value;
  req.session.gateway1Date = gateway1.value;
  req.session.gateway2Date = gateway2.value;
  req.session.gateway3Date = gateway3.value;
  req.session.submissionDate = submission.value;
  
  if (isEdit) {
    res.redirect('/projects/back-office/create-case/v5/check-answers');
  } else {
    res.redirect('/projects/back-office/create-case/v5/check-answers');
  }
});

// Check answers page
router.get('/projects/back-office/create-case/v5/check-answers', (req, res) => {
  if (!req.session.contacts) req.session.contacts = [];
  if (!req.session.secondaryLPAContacts) req.session.secondaryLPAContacts = [];
  res.render('/projects/back-office/create-case/v5/check-answers', {
    mainContact: req.session.mainContact,
    contacts: req.session.contacts,
    secondaryLPAContacts: req.session.secondaryLPAContacts,
    planTitle: req.session.planTitle,
    planType: req.session.planType,
    lpas: req.session.lpas,
    lpaRegions: req.session.lpaRegions || {},
    caseOfficer: req.session.caseOfficer,
    noticeOfIntentionDate: formatDateForCheckAnswers(req.session.noticeOfIntentionDate),
    gateway1Date: formatDateForCheckAnswers(req.session.gateway1Date),
    gateway2Date: formatDateForCheckAnswers(req.session.gateway2Date),
    gateway3Date: formatDateForCheckAnswers(req.session.gateway3Date),
    submissionDate: formatDateForCheckAnswers(req.session.submissionDate)
  });
});

router.post('/projects/back-office/create-case/v5/check-answers', (req, res) => {
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
    lpaRegions: req.session.lpaRegions || {},
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
  
  res.redirect('/projects/back-office/create-case/v5/confirmation');
});

// Confirmation page
router.get('/projects/back-office/create-case/v5/confirmation', (req, res) => {
  res.render('projects/back-office/create-case/v5/confirmation', {
    caseRef: req.session.latestCaseRef || 'PLAN/000001'
  });
});

router.get('/projects/back-office/create-case/v5/clear-data', (req, res) => {
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
  req.session.planStatus = undefined;
  req.session.secondaryLPAContacts = [];
  req.session.cases = []; // Clear all cases
  req.session.latestCaseRef = undefined;

  // Also clear back-office manage journey state (including GW2 v4)
  req.session.gw2v3WorkshopDocuments = undefined;
  req.session.gw2v4IssueReportDocuments = undefined;
  req.session.gw2v4ReportIssued = undefined;
  req.session.gw2v4UploadReturnTo = undefined;
  req.session.hearings = undefined;
  req.session.notificationMessage = undefined;
  req.session.workflowNavVersionOverrides = undefined;

  req.session.data = {}; // Also clear the default data object
  req.session.save(() => {
    res.redirect('/projects/back-office/create-case/v5/index');
  });
});

module.exports = router;