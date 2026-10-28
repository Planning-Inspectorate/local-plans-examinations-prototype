const express = require('express');
const router = express.Router();

function getAddHearingEstimatesView(req, page) {
  const baseViewPath = (req.baseUrl || '').replace(/^\//, '');
  return `${baseViewPath}/add-hearing-estimates/${page}`;
}

function getHearingEstimatesCaseRef(req) {
  return req.session?.data?.currentCaseRef || req.session?.currentCaseRef || '';
}

router.get('/add-hearing-estimates', function (req, res) {
    res.render(getAddHearingEstimatesView(req, 'index'), {
      caseRef: getHearingEstimatesCaseRef(req),
      planTitle: req.session.data.planTitle || '',
      addHearingEstimates: req.session.data.addHearingEstimates || {}
    })
  })

  router.post('/add-hearing-estimates/index', function (req, res) {
    const addHearingEstimates = {
      estimatedPreparationTime: String(req.session.data.estimatedPreparationTime || '').trim(),
      estimatedHearingTime: String(req.session.data.estimatedHearingTime || '').trim(),
      estimatedReportingTime: String(req.session.data.estimatedReportingTime || '').trim()
    };
    const errors = {};
    Object.entries(addHearingEstimates).forEach(([field, value]) => {
      if (!value) errors[field] = 'Enter a number of hours';
      else if (!Number.isFinite(Number(value)) || Number(value) <= 0) errors[field] = 'Enter a number greater than 0';
    });
    req.session.data.addHearingEstimates = addHearingEstimates;
    if (Object.keys(errors).length) {
      const errorTargets = {
        estimatedPreparationTime: 'estimated-prep-time',
        estimatedHearingTime: 'estimated-hearing-time',
        estimatedReportingTime: 'estimated-reporting-time'
      };
      return res.status(400).render(getAddHearingEstimatesView(req, 'index'), {
        caseRef: getHearingEstimatesCaseRef(req),
        planTitle: req.session.data.planTitle || '',
        addHearingEstimates,
        errors,
        errorList: Object.entries(errors).map(([field, text]) => ({ text, href: `#${errorTargets[field]}` }))
      });
    }
    req.session.save(() => {
      res.redirect(`${req.baseUrl}/add-hearing-estimates/check`)
    })
  })

  router.get('/add-hearing-estimates/check', function (req, res) {
    res.render(getAddHearingEstimatesView(req, 'check'), {
      caseRef: getHearingEstimatesCaseRef(req),
      planTitle: req.session.data.planTitle || '',
      addHearingEstimates: req.session.data.addHearingEstimates || {}
    })
  })

  router.post('/add-hearing-estimates/check', function (req, res) {
    req.session.hearingEstimates = req.session.data.addHearingEstimates
    delete req.session.data.addHearingEstimates
    req.session.save(() => {
      res.redirect(`${req.baseUrl}/examination`)
    })
  })

module.exports = router;