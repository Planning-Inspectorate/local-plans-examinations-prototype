const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.get('/set-status', (req, res) => {
  const state = req.query.state || 'initial';
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW3/v3/gateway-3';

  // Clear fields not relevant to the selected state
  if (state === 'initial') {
    // Clear all state-specific fields
    delete req.session.gateway3EstimatedDate;
    delete req.session.gateway3ActualDate;
    delete req.session.gateway3AssessorName;
    delete req.session.gateway3AssessorAppointmentDate;
    delete req.session.gateway3PoContact;
    delete req.session.examinationWebsite;
    delete req.session.submission1Decision;
    delete req.session.submission1DecisionDate;
    delete req.session.submission2Decision;
    delete req.session.submission2DecisionDate;
    delete req.session.gateway3CompletionDate;
  }

  // Set state
  req.session.gateway3OverviewState = state;

  // Populate submitted state fields
  if (state === 'submitted') {
    if (!req.session.gateway3EstimatedDate) {
      req.session.gateway3EstimatedDate = '10/9/2026';
    }
    if (!req.session.gateway3AssessorName) {
      req.session.gateway3AssessorName = 'James Wilson';
    }
    if (!req.session.gateway3AssessorAppointmentDate) {
      req.session.gateway3AssessorAppointmentDate = '1/9/2026';
    }
    if (!req.session.gateway3PoContact) {
      req.session.gateway3PoContact = {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@example.com',
        phone: '020 7946 0958'
      };
    }
    if (!req.session.examinationWebsite) {
      req.session.examinationWebsite = 'eastborough.gov.uk/examination-library';
    }
    if (!req.session.submission1Decision) {
      req.session.submission1Decision = 'Proceed to examination';
    }
  }

  // Populate resubmission-no-docs state fields
  if (state === 'resubmission-no-docs') {
    if (!req.session.gateway3EstimatedDate) {
      req.session.gateway3EstimatedDate = '10/9/2026';
    }
    if (!req.session.gateway3AssessorName) {
      req.session.gateway3AssessorName = 'James Wilson';
    }
    if (!req.session.gateway3AssessorAppointmentDate) {
      req.session.gateway3AssessorAppointmentDate = '1/9/2026';
    }
    if (!req.session.gateway3PoContact) {
      req.session.gateway3PoContact = {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@example.com',
        phone: '020 7946 0958'
      };
    }
    if (!req.session.examinationWebsite) {
      req.session.examinationWebsite = 'eastborough.gov.uk/examination-library';
    }
    if (!req.session.submission1Decision) {
      req.session.submission1Decision = 'Proceed to examination';
    }
  }

  // Populate resubmission state fields
  if (state === 'resubmission') {
    if (!req.session.gateway3EstimatedDate) {
      req.session.gateway3EstimatedDate = '10/9/2026';
    }
    if (!req.session.gateway3AssessorName) {
      req.session.gateway3AssessorName = 'James Wilson';
    }
    if (!req.session.gateway3AssessorAppointmentDate) {
      req.session.gateway3AssessorAppointmentDate = '1/9/2026';
    }
    if (!req.session.gateway3PoContact) {
      req.session.gateway3PoContact = {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@example.com',
        phone: '020 7946 0958'
      };
    }
    if (!req.session.examinationWebsite) {
      req.session.examinationWebsite = 'eastborough.gov.uk/examination-library';
    }
    if (!req.session.submission1Decision) {
      req.session.submission1Decision = 'Proceed to examination';
    }
    if (!req.session.submission2Decision) {
      req.session.submission2Decision = 'Pass';
    }
  }

  // Populate pass state fields
  if (state === 'pass') {
    if (!req.session.gateway3EstimatedDate) {
      req.session.gateway3EstimatedDate = '10/9/2026';
    }
    if (!req.session.gateway3ActualDate) {
      req.session.gateway3ActualDate = '15/10/2026';
    }
    if (!req.session.gateway3AssessorName) {
      req.session.gateway3AssessorName = 'James Wilson';
    }
    if (!req.session.gateway3AssessorAppointmentDate) {
      req.session.gateway3AssessorAppointmentDate = '1/9/2026';
    }
    if (!req.session.gateway3PoContact) {
      req.session.gateway3PoContact = {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@example.com',
        phone: '020 7946 0958'
      };
    }
    if (!req.session.examinationWebsite) {
      req.session.examinationWebsite = 'eastborough.gov.uk/examination-library';
    }
    // Always set the correct decisions for pass state regardless of previous values
    req.session.submission1Decision = 'Resubmission required';
    req.session.submission2Decision = 'Pass';
    if (!req.session.gateway3CompletionDate) {
      req.session.gateway3CompletionDate = '20/10/2026';
    }
  }

  req.session.save(() => {
    res.redirect(returnUrl);
  });
});

module.exports = router;
