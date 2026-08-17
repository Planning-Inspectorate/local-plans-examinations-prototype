const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.get('/set-status', (req, res) => {
  const state = req.query.state || 'none';
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW2/v4/gateway-2';

  // Clear fields not relevant to the selected state
  if (state === 'none') {
    // Clear all state-specific fields
    delete req.session.gateway2ActualDate;
    delete req.session.gw2v4IssueReportDocuments;
    delete req.session.gateway2AssessorName;
    delete req.session.gateway2AssessorAppointmentDate;
    delete req.session.gw2v3WorkshopDocuments;
    delete req.session.hearings;
  } else if (state === 'submission-received') {
    // Clear assessor and workshop-related fields
    delete req.session.gateway2AssessorName;
    delete req.session.gateway2AssessorAppointmentDate;
    delete req.session.gw2v3WorkshopDocuments;
    delete req.session.hearings;
  } else if (state === 'workshop-confirmed') {
    // Clear submission documents and date
    delete req.session.gateway2ActualDate;
    delete req.session.gw2v4IssueReportDocuments;
  }
  // For gw3-submission, do not clear any fields - keep everything populated

  // Populate gateway2EstimatedDate if not already set
  if (!req.session.gateway2EstimatedDate) {
    req.session.gateway2EstimatedDate = '15/4/2026';
  }

  // Set state-based flags
  req.session.gw2v4StatusState = state;

  // Populate workshop-confirmed state fields
  if (state === 'workshop-confirmed') {
    if (!req.session.gateway2AssessorName) {
      req.session.gateway2AssessorName = 'Sarah Johnson';
    }
    if (!req.session.gateway2AssessorAppointmentDate) {
      req.session.gateway2AssessorAppointmentDate = '10/4/2026';
    }
    if (!req.session.gw2v3WorkshopDocuments || req.session.gw2v3WorkshopDocuments.length === 0) {
      req.session.gw2v3WorkshopDocuments = [
        {
          originalname: 'Workshop_Agenda.pdf',
          filename: 'workshop-agenda-1',
          size: 215000,
          uploadedAt: new Date().toISOString()
        }
      ];
    }
    if (!req.session.hearings || req.session.hearings.length === 0) {
      req.session.hearings = [
        {
          startDate: '18/5/2026',
          time: '10:00',
          estimatedDays: '3',
          isVirtual: 'In-person',
          venue: 'Town Hall Conference Room',
          hasAddress: 'Yes',
          address: {
            line1: '42 High Street',
            line2: 'The Town Hall',
            town: 'Manchester',
            postcode: 'M1 1AB'
          }
        }
      ];
    }
  }

  // Populate submission documents for submission-received state
  if (state === 'submission-received') {
    if (!req.session.gateway2ActualDate) {
      req.session.gateway2ActualDate = '20/5/2026';
    }
    if (!req.session.gw2v4IssueReportDocuments || req.session.gw2v4IssueReportDocuments.length === 0) {
      req.session.gw2v4IssueReportDocuments = [
        {
          originalname: 'GW2_Submission_Report.pdf',
          filename: 'submission-report-1',
          size: 325000,
          uploadedAt: new Date().toISOString()
        }
      ];
    }
  }

  // Populate GW3 submission with all GW2 data
  if (state === 'gw3-submission') {
    req.session.gw2v4ReportIssued = true;

    // Populate report issued date if not already set
    if (!req.session.gateway2ReportIssuedDate) {
      req.session.gateway2ReportIssuedDate = '25/5/2026';
    }

    // Populate assessor details if not already set
    if (!req.session.gateway2AssessorName) {
      req.session.gateway2AssessorName = 'Sarah Johnson';
    }
    if (!req.session.gateway2AssessorAppointmentDate) {
      req.session.gateway2AssessorAppointmentDate = '10/4/2026';
    }

    // Populate submission date if not already set
    if (!req.session.gateway2ActualDate) {
      req.session.gateway2ActualDate = '20/5/2026';
    }

    // Populate workshop documents if not already set
    if (!req.session.gw2v3WorkshopDocuments || req.session.gw2v3WorkshopDocuments.length === 0) {
      req.session.gw2v3WorkshopDocuments = [
        {
          originalname: 'Workshop_Agenda.pdf',
          filename: 'workshop-agenda-1',
          size: 215000,
          uploadedAt: new Date().toISOString()
        }
      ];
    }

    // Populate submission documents if not already set
    if (!req.session.gw2v4IssueReportDocuments || req.session.gw2v4IssueReportDocuments.length === 0) {
      req.session.gw2v4IssueReportDocuments = [
        {
          originalname: 'GW2_Submission_Report.pdf',
          filename: 'submission-report-1',
          size: 325000,
          uploadedAt: new Date().toISOString()
        }
      ];
    }

    // Populate GW3 report documents if not already set
    if (!req.session.gw2v4ReportDocuments || req.session.gw2v4ReportDocuments.length === 0) {
      req.session.gw2v4ReportDocuments = [
        {
          originalname: 'GW3_Report.pdf',
          filename: 'gw3-report-1',
          size: 425000,
          uploadedAt: new Date().toISOString()
        }
      ];
    }

    // Populate workshop hearing details if not already set
    if (!req.session.hearings || req.session.hearings.length === 0) {
      req.session.hearings = [
        {
          startDate: '18/5/2026',
          time: '10:00',
          estimatedDays: '3',
          isVirtual: 'In-person',
          venue: 'Town Hall Conference Room',
          hasAddress: 'Yes',
          address: {
            line1: '42 High Street',
            line2: 'The Town Hall',
            town: 'Manchester',
            postcode: 'M1 1AB'
          }
        }
      ];
    }
  } else {
    req.session.gw2v4ReportIssued = false;
  }

  req.session.save(() => {
    res.redirect(returnUrl);
  });
});

module.exports = router;
