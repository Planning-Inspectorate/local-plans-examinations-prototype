const express = require('express');
const router = express.Router();

router.get('/projects/back-office/manage/examination/v1/cancel-hearing', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/cancel-hearing/index', {
      caseRef: req.session.data.currentCaseRef || '',
      planTitle: req.session.data.planTitle || ''
    })
  })

  router.post('/projects/back-office/manage/examination/v1/cancel-hearing', function (req, res) {
    delete req.session.hearingStartDate
    delete req.session.hearingTime
    delete req.session.hearingEstimatedDays
    delete req.session.hearingHasAddress
    delete req.session.hearingAddress
    delete req.session.hearingVenue
    delete req.session.hearingCloseDate
    delete req.session.hearingEstimates
    req.session.notificationMessage = 'Hearing cancelled'
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/examination`)
    })
  })

module.exports = router;