const express = require('express');
const router = express.Router();
const _ = require('lodash')
const { DateTime } = require("luxon")

router.get('/projects/back-office/manage/examination/v1/edit-hearing', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/edit-hearing/index', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearing: req.session.editHearing || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/edit-hearing/index', function (req, res) {
    req.session.editHearing = {
      date: {
        day: req.body['hearing-date-day'],
        month: req.body['hearing-date-month'],
        year: req.body['hearing-date-year']
      },
      time: {
        hour: req.body['hearing-time-hour'],
        minute: req.body['hearing-time-minute']
      }
    }
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/edit-hearing/has-address`)
    })
  })

  router.get('/projects/back-office/manage/examination/v1/edit-hearing/has-address', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/edit-hearing/has-address', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearing: req.session.editHearing || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/edit-hearing/has-address', function (req, res) {
    req.session.editHearing.hasAddress = req.body.hasAddress
    req.session.save(() => {
      if(req.session.editHearing.hasAddress == 'Yes') {
        res.redirect(`/projects/back-office/manage/examination/v1/edit-hearing/address`)
      } else {
        res.redirect(`/projects/back-office/manage/examination/v1/edit-hearing/check`)
      }
    })
  })

  router.get('/projects/back-office/manage/examination/v1/edit-hearing/address', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/edit-hearing/address', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearing: req.session.editHearing || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/edit-hearing/address', function (req, res) {
    req.session.editHearing.venue = req.body['hearing-venue']
    req.session.editHearing.address = {
      line1: req.body['hearing-address-line1'],
      line2: req.body['hearing-address-line2'],
      town: req.body['hearing-address-town'],
      postcode: req.body['hearing-address-postcode']
    }
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/edit-hearing/check`)
    })
  })

  router.get('/projects/back-office/manage/examination/v1/edit-hearing/check', function (req, res) {
    res.render('projects/back-office/manage/examination/v1/edit-hearing/check', {
      caseRef: req.session.currentCaseRef || '',
      planTitle: req.session.planTitle || '',
      editHearing: req.session.editHearing || {}
    })
  })

  router.post('/projects/back-office/manage/examination/v1/edit-hearing/check', function (req, res) {
    const { date, time, venue } = req.session.editHearing

    const hearingDate = DateTime.fromObject({
      day: parseInt(date.day),
      month: parseInt(date.month),
      year: parseInt(date.year),
      hours: parseInt(time.hour),
      minutes: parseInt(time.minute),
    })

    req.session.hearingStartDate = hearingDate.toFormat('d MMMM yyyy')
    req.session.hearingVenue = venue || '-'
    req.session.hearingEstimates = req.session.editHearingEstimates || req.session.hearingEstimates || {}
    
    delete req.session.editHearing
    req.session.save(() => {
      res.redirect(`/projects/back-office/manage/examination/v1/examination`)
    })
  })

module.exports = router;