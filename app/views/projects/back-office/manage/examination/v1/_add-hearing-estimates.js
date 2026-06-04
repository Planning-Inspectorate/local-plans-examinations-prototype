const express = require('express');
const router = express.Router();

router.get('/add-hearing-estimates', function (req, res) {
    res.render('/add-hearing-estimates/index', {
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
      res.redirect(`/add-hearing-estimates/check`)
    })
  })

  router.get('/add-hearing-estimates/check', function (req, res) {
    res.render('/add-hearing-estimates/check', {
      caseRef: req.session.data.currentCaseRef || '',
      planTitle: req.session.data.planTitle || '',
      addHearingEstimates: req.session.data.addHearingEstimates || {}
    })
  })

  router.post('/add-hearing-estimates/check', function (req, res) {
    req.session.hearingEstimates = req.session.data.addHearingEstimates
    delete req.session.data.addHearingEstimates
    req.session.save(() => {
      res.redirect(`/add-hearing/examination`)
    })
  })

module.exports = router;