const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

function proceduralComplete(data) {
  return data['cover-letter-upload-complete'] &&
         data['timetable-upload-complete'] &&
         data['pid-upload-complete'] &&
         data['compliance-upload-complete'] &&
         data['soundness-upload-complete']
}

function consultationComplete(data) {
  return data['notice-of-intention-upload-complete'] &&
         data['scoping-full-upload-complete'] &&
         data['scoping-feedback-summary-upload-complete'] &&
         data['gateway1-upload-complete'] &&
         data['proposed-plan-full-upload-complete'] &&
         data['consultation-summary-upload-complete']
}

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data

  let completedCount = 0
  if (data['procedural-completed'] == 'true') completedCount++
  if (data['consultation-completed'] == 'true') completedCount++

  res.render('projects/front-office/gw2/v2/application-details', {
    completedCount: completedCount
  })
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS
// -----------------------------------------------

router.post('/procedural-documents/cover-letter-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['cover-letter-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('timetable-upload')
  }
})

router.post('/procedural-documents/timetable-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['timetable-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('pid-upload')
  }
})

router.post('/procedural-documents/pid-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['pid-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('compliance-upload')
  }
})

router.post('/procedural-documents/compliance-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['compliance-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('soundness-upload')
  }
})

router.post('/procedural-documents/soundness-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['soundness-upload-complete'] = 'true'
  req.session.data['procedural-completed'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('../consultation-documents/notice-of-intention-upload')
  }
})

// Fallback for any procedural page not explicitly handled above
router.post('/procedural-documents/:page', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

// -----------------------------------------------
// CONSULTATION DOCUMENTS
// -----------------------------------------------

router.post('/consultation-documents/notice-of-intention-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['notice-of-intention-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('scoping-full-upload')
  }
})

router.post('/consultation-documents/scoping-full-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-full-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('scoping-feedback-summary-upload')
  }
})

router.post('/consultation-documents/scoping-feedback-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-feedback-summary-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('gateway1-upload')
  }
})

router.post('/consultation-documents/gateway1-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['gateway1-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('proposed-plan-full-upload')
  }
})

router.post('/consultation-documents/proposed-plan-full-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['proposed-plan-full-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('consultation-summary-upload')
  }
})

router.post('/consultation-documents/consultation-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['consultation-summary-upload-complete'] = 'true'
  req.session.data['consultation-completed'] = 'true'
  res.redirect('../application-details')
})

// Fallback for any consultation page not explicitly handled above
router.post('/consultation-documents/:page', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

module.exports = router