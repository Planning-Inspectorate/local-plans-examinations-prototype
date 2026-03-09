const express = require('express');
const router = express.Router();





// Show delete confirmation page
router.get('/projects/back-office/manage/delete-case-confirmation.html', (req, res) => {
  res.render('projects/back-office/manage/delete-case-confirmation');
});

// Handle delete POST and show complete page
router.post('/projects/back-office/manage/delete-case-complete.html', (req, res) => {
  // Here you would implement soft delete logic, e.g. mark as deleted in DB or session
  res.render('projects/back-office/manage/delete-case-complete');
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

module.exports = router;
