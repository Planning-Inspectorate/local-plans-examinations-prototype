const express = require('express');
const router = express.Router();
const { DateTime } = require('luxon');

function parseDateFields(day, month, year) {
  if (!day || !month || !year) return '';
  return `${parseInt(day, 10)}/${parseInt(month, 10)}/${parseInt(year, 10)}`;
}

function getReturnUrl(req) {
  return req.query.returnUrl || `${req.baseUrl}/examination`;
}

function getCaseRef(req) {
  return req.session.data?.currentCaseRef || req.session.currentCaseRef || '';
}

function addSixMonths(dateString) {
  const date = DateTime.fromFormat(dateString, 'd/M/yyyy');
  return date.isValid ? date.plus({ months: 6 }).toFormat('d/M/yyyy') : '';
}

router.get(['/plan-pause', '/plan-pause.html'], (req, res) => {
  res.render('projects/back-office/manage/examination/v4/plan-pause', {
    caseRef: getCaseRef(req),
    planPauseDate: req.session.planPauseDate || '',
    returnUrl: getReturnUrl(req)
  });
});

router.post('/plan-pause', (req, res) => {
  const planPauseDate = parseDateFields(
    req.body['plan-pause-date-day'],
    req.body['plan-pause-date-month'],
    req.body['plan-pause-date-year']
  );
  if (req.session.examinationV3StatusState !== 'paused') {
    req.session.examinationV3StatusBeforePause = req.session.examinationV3StatusState || 'exam-in-progress';
  }
  req.session.planPauseDate = planPauseDate || req.session.planPauseDate || '';
  if (planPauseDate) req.session.planPauseEndDate = addSixMonths(planPauseDate);
  req.session.examinationV3StatusState = 'paused';
  if (req.session.data) req.session.data.examinationV3StatusState = 'paused';
    const returnUrl = req.body.returnUrl || `${req.baseUrl}/examination`;
    req.session.save(() => res.redirect(`${req.baseUrl}/plan-pause-reason?returnUrl=${encodeURIComponent(returnUrl)}`));
});

router.get(['/plan-pause-end', '/plan-pause-end.html'], (req, res) => {
  res.render('projects/back-office/manage/examination/v4/plan-pause-end', {
    caseRef: getCaseRef(req),
    planPauseEndDate: req.session.planPauseEndDate || '',
    returnUrl: getReturnUrl(req)
  });
});

router.post('/plan-pause-end', (req, res) => {
  req.session.planPauseEndDate = parseDateFields(
    req.body['plan-pause-end-date-day'],
    req.body['plan-pause-end-date-month'],
    req.body['plan-pause-end-date-year']
  ) || req.session.planPauseEndDate || '';
  req.session.save(() => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
});

router.get(['/plan-pause-actual-end', '/plan-pause-actual-end.html'], (req, res) => {
  res.render('projects/back-office/manage/examination/v4/plan-pause-actual-end', {
    caseRef: getCaseRef(req),
    planPauseActualEndDate: req.session.planPauseActualEndDate || '',
    returnUrl: getReturnUrl(req)
  });
});

router.post('/plan-pause-actual-end', (req, res) => {
  const planPauseActualEndDate = parseDateFields(
    req.body['plan-pause-actual-end-date-day'],
    req.body['plan-pause-actual-end-date-month'],
    req.body['plan-pause-actual-end-date-year']
  );
  req.session.planPauseActualEndDate = planPauseActualEndDate || req.session.planPauseActualEndDate || '';
  if (planPauseActualEndDate) {
    req.session.examinationV3StatusState = req.session.examinationV3StatusBeforePause || 'exam-in-progress';
    if (req.session.data) req.session.data.examinationV3StatusState = req.session.examinationV3StatusState;
    delete req.session.examinationV3StatusBeforePause;
  }
  req.session.save(() => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
});

router.get(['/plan-pause-reason', '/plan-pause-reason.html'], (req, res) => {
  res.render('projects/back-office/manage/examination/v4/plan-pause-reason', {
    caseRef: getCaseRef(req),
    planPauseReason: req.session.planPauseReason || '',
    returnUrl: getReturnUrl(req)
  });
});

router.post('/plan-pause-reason', (req, res) => {
  req.session.planPauseReason = (req.body['plan-pause-reason'] || '').trim();
  req.session.examinationV3StatusState = 'paused';
  if (req.session.data) req.session.data.examinationV3StatusState = 'paused';
  req.session.notificationMessage = 'Pause details saved';
  req.session.save(() => res.redirect(req.body.returnUrl || `${req.baseUrl}/examination`));
});

module.exports = router;
