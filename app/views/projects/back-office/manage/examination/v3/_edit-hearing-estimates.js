const express = require('express');
const router = express.Router();
const _ = require('lodash')

router.get('/edit-hearing-estimates', function (req, res) {
    res.render('/edit-hearing-estimates/index', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearingEstimates: req.session.editHearingEstimates || req.session.hearingEstimates || {}
    })
  })

  router.post('/edit-hearing-estimates/index', function (req, res) {
    req.session.editHearingEstimates = {
      estimatedPreparationTime: req.body.estimatedPreparationTime,
      estimatedHearingTime: req.body.estimatedHearingTime,
      estimatedReportingTime: req.body.estimatedReportingTime
    }
    req.session.save(() => {
      res.redirect(`/edit-hearing-estimates/check`)
    })
  })

  router.get('/edit-hearing-estimates/check', function (req, res) {
    res.render('/edit-hearing-estimates/check', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearingEstimates: req.session.editHearingEstimates || req.session.hearingEstimates || {}
    })
  })

  router.post('/edit-hearing-estimates/check', function (req, res) {
    req.session.hearingEstimates = req.session.editHearingEstimates
    delete req.session.editHearingEstimates
    req.session.save(() => {
      res.redirect(`/examination`)
    })
  })

module.exports = router;