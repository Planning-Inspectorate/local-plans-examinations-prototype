const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

function submissionComplete(data) {
  return data['proposed-local-plan-upload-complete'] &&
         data['policies-map-upload-complete'] &&
         data['compliance-statement-upload-complete'] &&
         data['soundness-statement-upload-complete'] &&
         data['consultation-engagement-summary-upload-complete'] &&
         data['scoping-consultation-summary-upload-complete'] &&
         data['plan-content-evidence-consultation-summary-upload-complete'] &&
         data['proposed-plan-consultation-summary-upload-complete'] &&
         data['gw1-self-assessment-upload-complete'] &&
         data['plan-content-evidence-consultation-docs-upload-complete'] &&
         data['plan-content-evidence-consultation-summary-2-upload-complete'] &&
         data['representations-upload-complete'] &&
         data['practical-arrangements-statement-upload-complete'] &&
         data['environmental-report-upload-complete'] &&
         data['supplementary-plans-statement-upload-complete'] &&
         data['supporting-documents-upload-complete']
}

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data

  let completedCount = 0
  if (data['gw3-documents-completed'] == 'true') completedCount++

  res.render('projects/front-office/gw3/v1/application-details', {
    completedCount: completedCount
  })
})

// -----------------------------------------------
// SUBMISSION DOCUMENTS
// -----------------------------------------------

router.post('/submission-documents/proposed-local-plan-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['proposed-local-plan-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('policies-map-upload')
  }
})

router.post('/submission-documents/policies-map-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['policies-map-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('compliance-statement-upload')
  }
})

router.post('/submission-documents/compliance-statement-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['compliance-statement-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('soundness-statement-upload')
  }
})

router.post('/submission-documents/soundness-statement-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['soundness-statement-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('consultation-engagement-summary-upload')
  }
})

router.post('/submission-documents/consultation-engagement-summary-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['consultation-engagement-summary-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('scoping-consultation-summary-upload')
  }
})

router.post('/submission-documents/scoping-consultation-summary-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['scoping-consultation-summary-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('plan-content-evidence-consultation-summary-upload')
  }
})

router.post('/submission-documents/plan-content-evidence-consultation-summary-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['plan-content-evidence-consultation-summary-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('proposed-plan-consultation-summary-upload')
  }
})

router.post('/submission-documents/proposed-plan-consultation-summary-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['proposed-plan-consultation-summary-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('gw1-self-assessment-upload')
  }
})

router.post('/submission-documents/gw1-self-assessment-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['gw1-self-assessment-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('plan-content-evidence-consultation-docs-upload')
  }
})

router.post('/submission-documents/plan-content-evidence-consultation-docs-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['plan-content-evidence-consultation-docs-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('plan-content-evidence-consultation-summary-2-upload')
  }
})

router.post('/submission-documents/plan-content-evidence-consultation-summary-2-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['plan-content-evidence-consultation-summary-2-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('representations-upload')
  }
})

router.post('/submission-documents/representations-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['representations-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('practical-arrangements-statement-upload')
  }
})

router.post('/submission-documents/practical-arrangements-statement-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['practical-arrangements-statement-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('environmental-report-upload')
  }
})

router.post('/submission-documents/environmental-report-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['environmental-report-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('supplementary-plans-statement-upload')
  }
})

router.post('/submission-documents/supplementary-plans-statement-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['supplementary-plans-statement-upload-complete'] = 'true'
  if (req.query.cya) {
    res.redirect('../application-details')
  } else {
    res.redirect('supporting-documents-upload')
  }
})

router.post('/submission-documents/supporting-documents-upload', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data['supporting-documents-upload-complete'] = 'true'
  req.session.data['gw3-documents-completed'] = 'true'
  res.redirect('../application-details')
})

// Fallback for any submission page not explicitly handled above
router.post('/submission-documents/:page', function (req, res) {
  req.session.data['gw3-documents-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

module.exports = router