const express = require('express');
const router = express.Router();
const _ = require('lodash')

router.get('/projects/back-office/manage/examination/v1/edit-hearing-estimates', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/edit-hearing-estimates/index', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearingEstimates: req.session.editHearingEstimates || req.session.hearingEstimates || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/edit-hearing-estimates/index', function (req, res) {
    req.session.editHearingEstimates = {
      estimatedPreparationTime: req.body.estimatedPreparationTime,
      estimatedHearingTime: req.body.estimatedHearingTime,
      estimatedReportingTime: req.body.estimatedReportingTime
    }
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/edit-hearing-estimates/check`)
    })
  })

  router.get('/projects/back-office/manage/examination/v1/edit-hearing-estimates/check', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/edit-hearing-estimates/check', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearingEstimates: req.session.editHearingEstimates || req.session.hearingEstimates || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/edit-hearing-estimates/check', function (req, res) {
    req.session.hearingEstimates = req.session.editHearingEstimates
    delete req.session.editHearingEstimates
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/examination`)
    })
  })

module.exports = router;