const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();

router.get('/set-status', (req, res) => {
  const state = req.query.state || 'initial';
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW3/v4/gateway-3';

  // Clear fields not relevant to the selected state
  if (state === 'initial') {
    delete req.session.gateway3ActualDate;
    delete req.session.gateway3AssessorName;
    delete req.session.gateway3AssessorAppointmentDate;
    delete req.session.gateway3PoContact;
    delete req.session.examinationWebsite;
    delete req.session.gw3v4Submission1DecisionOutcome;
    delete req.session.gw3v4Submission1DecisionDate;
    delete req.session.gw3v4Submission2DecisionOutcome;
    delete req.session.gw3v4Submission2DecisionDate;
    delete req.session.gateway3CompletionDate;
  }

  req.session.gw3v4StatusState = state;

  const commonFields = () => {
    if (!req.session.gateway3EstimatedDate) {
      req.session.gateway3EstimatedDate = '2 Jun 2026';
    }
    if (!req.session.gateway3ActualDate) {
      req.session.gateway3ActualDate = '15 Sep 2026';
    }
    if (!req.session.gateway3AssessorName) {
      req.session.gateway3AssessorName = 'James Wilson';
    }
    if (!req.session.gateway3AssessorAppointmentDate) {
      req.session.gateway3AssessorAppointmentDate = '1 Sep 2026';
    }
    if (!req.session.gateway3PoContact) {
      req.session.gateway3PoContact = {
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@example.com',
        phone: '020 7946 0958'
      };
    }
    if (!req.session.examinationWebsite || req.session.examinationWebsite === '-') {
      req.session.examinationWebsite = 'eastborough.gov.uk/examination-library';
    }
  };

  if (state === 'submitted') {
    commonFields();
  }

  if (state === 'resubmission-no-docs') {
    commonFields();
    req.session.gw3v4Submission1DecisionOutcome = 'Resubmission required';
    req.session.gw3v4Submission1DecisionDate = '10 Jun 2026';
  }

  if (state === 'resubmission') {
    commonFields();
    req.session.gw3v4Submission1DecisionOutcome = 'Resubmission required';
    req.session.gw3v4Submission1DecisionDate = '10 Jun 2026';
  }

  if (state === 'pass') {
    commonFields();
    req.session.gw3v4Submission1DecisionOutcome = 'Resubmission required';
    req.session.gw3v4Submission1DecisionDate = '10 Jun 2026';
    req.session.gw3v4Submission2DecisionOutcome = 'Pass';
    req.session.gw3v4Submission2DecisionDate = '20 Jun 2026';
    if (!req.session.gateway3CompletionDate) {
      req.session.gateway3CompletionDate = '20 Oct 2026';
    }
  }

  req.session.save(() => {
    res.redirect(`${returnUrl}?gateway3OverviewState=${state}`);
  });
});

module.exports = router;
