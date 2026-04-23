const express = require('express');
const router = express.Router();

router.get('/projects/back-office/manage/examination/v1/add-hearing-estimates', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/add-hearing-estimates/index', {
      caseRef: req.session.data.currentCaseRef || '',
      planTitle: req.session.data.planTitle || '',
      addHearingEstimates: req.session.data.addHearingEstimates || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/add-hearing-estimates/index', function (req, res) {
    req.session.data.addHearingEstimates = {
      estimatedPreparationTime: req.session.data.estimatedPreparationTime,
      estimatedHearingTime: req.session.data.estimatedHearingTime,
      estimatedReportingTime: req.session.data.estimatedReportingTime
    }
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/add-hearing-estimates/check`)
    })
  })

  router.get('/projects/back-office/manage/examination/v1/add-hearing-estimates/check', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/add-hearing-estimates/check', {
      caseRef: req.session.data.currentCaseRef || '',
      planTitle: req.session.data.planTitle || '',
      addHearingEstimates: req.session.data.addHearingEstimates || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/add-hearing-estimates/check', function (req, res) {
    req.session.hearingEstimates = req.session.data.addHearingEstimates
    delete req.session.data.addHearingEstimates
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/examination`)
    })
  })

module.exports = router;