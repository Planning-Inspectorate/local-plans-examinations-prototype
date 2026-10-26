const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

router.get('/set-status', (req, res) => {
  const requestedState = req.query.state || 'initial';
  const state = requestedState === 'ready' ? 'pass' : requestedState;
  const returnUrl = req.query.returnUrl || '/projects/back-office/manage/GW3/v5/gateway-3';

  req.session.gw3v5IssuedDecisions = {};
  if (!req.session.data) req.session.data = {};
  delete req.session.data.fileData;
  delete req.session.data.fileSizeMap;
  delete req.session.notificationMessage;
  delete req.session.gateway3CompletionDate;
  delete req.session.data.gateway3CompletionDate;
  ['1', '2', '3'].forEach((version) => {
    ['Outcome', 'Date', 'ReportFilename', 'ReportStoredFilename', 'ReportUploadedDate'].forEach((field) => {
      delete req.session[`gw3v4Submission${version}Decision${field}`];
    });
  });
  const submissionValue = String(req.session.submissionDate || '21 June 2026');
  const submissionDate = [
    DateTime.fromFormat(submissionValue, 'd/M/yyyy'),
    DateTime.fromFormat(submissionValue, 'd MMMM yyyy'),
    DateTime.fromFormat(submissionValue, 'd MMM yyyy'),
    DateTime.fromISO(submissionValue)
  ].find((date) => date.isValid) || DateTime.fromISO('2026-06-21');
  req.session.submissionDate = submissionDate.toFormat('d MMMM yyyy');

  const seedDecision = (version, outcome, date) => {
    const filename = `gw3-v5-submission-${version}-report`;
    const issuedDate = date.toFormat('d MMMM yyyy');
    req.session.gw3v5IssuedDecisions[version] = {
      caseRef: req.session.currentCaseRef || '',
      outcome,
      date: issuedDate,
      reportFilename: `gateway-3-submission-${version}-report.pdf`,
      reportStoredFilename: filename,
      reportIsDummy: true
    };
    req.session[`gw3v4Submission${version}DecisionOutcome`] = outcome;
    req.session[`gw3v4Submission${version}DecisionDate`] = issuedDate;
    req.session[`gw3v4Submission${version}DecisionReportFilename`] = `gateway-3-submission-${version}-report.pdf`;
    req.session[`gw3v4Submission${version}DecisionReportStoredFilename`] = filename;
    req.session[`gw3v4Submission${version}DecisionReportUploadedDate`] = issuedDate;
  };

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
    delete req.session.gw3v4Submission3DecisionOutcome;
    delete req.session.gw3v4Submission3DecisionDate;
    delete req.session.gateway3CompletionDate;
    delete req.session.gw3v5AssessorContacts;
  }

  req.session.gw3v4StatusState = state;
  req.session.gw3v4OverviewState = state;

  const commonFields = () => {
    if (!req.session.gateway3EstimatedDate) {
      req.session.gateway3EstimatedDate = '2 Jun 2026';
    }
    if (!req.session.gateway3ActualDate) {
      req.session.gateway3ActualDate = submissionDate.toFormat('d MMMM yyyy');
    }
    if (!req.session.gateway3AssessorName) {
      req.session.gateway3AssessorName = 'James Wilson';
    }
    if (!req.session.gateway3AssessorAppointmentDate) {
      req.session.gateway3AssessorAppointmentDate = submissionDate.minus({ days: 7 }).toFormat('d MMMM yyyy');
    }
    if (!req.session.gw3v5AssessorContacts?.length) {
      req.session.gw3v5AssessorContacts = [{
        fullName: req.session.gateway3AssessorName,
        dateAppointed: submissionDate.minus({ days: 7 }).toISODate()
      }];
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
    seedDecision('1', 'Not ready', submissionDate.plus({ days: 7 }));
  }

  if (state === 'resubmission') {
    commonFields();
    seedDecision('1', 'Not ready', submissionDate.plus({ days: 7 }));
  }

  if (state === 'pass') {
    commonFields();
    if (requestedState === 'ready') {
      seedDecision('1', 'Ready', submissionDate.plus({ days: 7 }));
      req.session.gateway3CompletionDate = req.session.gw3v5IssuedDecisions['1'].date;
    } else {
      seedDecision('1', 'Not ready', submissionDate.plus({ days: 7 }));
      seedDecision('2', 'Ready', submissionDate.plus({ months: 1, days: 7 }));
      req.session.gateway3CompletionDate = req.session.gw3v5IssuedDecisions['2'].date;
    }
    req.session.data.gateway3CompletionDate = req.session.gateway3CompletionDate;
  }

  req.session.save(() => {
    res.redirect(`${returnUrl}?gateway3OverviewState=${state}`);
  });
});

module.exports = router;
