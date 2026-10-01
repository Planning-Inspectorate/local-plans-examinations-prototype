const express = require('express');
const router = express.Router();

function getAddHearingEstimatesView(req, page) {
  const baseViewPath = (req.baseUrl || '').replace(/^\//, '');
  return `${baseViewPath}/add-hearing-estimates/${page}`;
}

router.get('/add-hearing-estimates', function (req, res) {
    res.render(getAddHearingEstimatesView(req, 'index'), {
      caseRef: req.session.data.currentCaseRef || '',
      planTitle: req.session.data.planTitle || '',
      addHearingEstimates: req.session.data.addHearingEstimates || {}
    })
  })

  router.post('/add-hearing-estimates/index', function (req, res) {
    req.session.data.addHearingEstimates = {
      estimatedPreparationTime: req.session.data.estimatedPreparationTime,
      estimatedHearingTime: req.session.data.estimatedHearingTime,
      estimatedReportingTime: req.session.data.estimatedReportingTime
    }
    req.session.save(() => {
      res.redirect(`${req.baseUrl}/add-hearing-estimates/check`)
    })
  })

  router.get('/add-hearing-estimates/check', function (req, res) {
    res.render(getAddHearingEstimatesView(req, 'check'), {
      caseRef: req.session.data.currentCaseRef || '',
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