const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('*', function(req, res, next){
  // Add return to task list
  res.locals['return'] = true

  next()
})

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

function proceduralComplete(data) {
  return data['proposed-local-plan-upload-complete'] &&
         data['policies-map-upload-complete'] &&
         data['compliance-statement-upload-complete'] &&
         data['soundness-statement-upload-complete']
}

function consultationComplete(data) {
  return data['consultation-engagement-summary-upload-complete'] &&
         data['scoping-consultation-summary-upload-complete'] &&
         data['plan-content-evidence-consultation-summary-upload-complete'] &&
         data['proposed-plan-consultation-summary-upload-complete'] &&
         data['gw1-self-assessment-upload-complete'] &&
         data['plan-content-evidence-consultation-docs-upload-complete'] &&
         data['plan-content-evidence-consultation-summary-2-upload-complete'] &&
         data['representations-upload-complete'] &&
         data['practical-arrangements-statement-upload-complete'] &&
         data['environmental-report-upload-complete'] &&
         data['supplementary-plans-statement-upload-complete']
}

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data

  let completedCount = 0
  if (data['procedural-completed'] == 'true') completedCount++
  if (data['consultation-completed'] == 'true') completedCount++
  if (data['supplementary-completed'] == 'true') completedCount++

  res.render('projects/front-office/gw3/v1/application-details', {
    completedCount: completedCount
  })
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS
// -----------------------------------------------

router.post('/procedural-documents/proposed-local-plan-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['proposed-local-plan-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/policies-map-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['policies-map-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/compliance-statement-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['compliance-statement-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/soundness-statement-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['soundness-statement-upload-complete'] = 'true'
  req.session.data['procedural-completed'] = 'true'
  res.redirect('../application-details')
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

router.post('/consultation-documents/consultation-engagement-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['consultation-engagement-summary-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/scoping-consultation-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-consultation-summary-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/plan-content-evidence-consultation-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['plan-content-evidence-consultation-summary-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/proposed-plan-consultation-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['proposed-plan-consultation-summary-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/gw1-self-assessment-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['gw1-self-assessment-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/plan-content-evidence-consultation-docs-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['plan-content-evidence-consultation-docs-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/plan-content-evidence-consultation-summary-2-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['plan-content-evidence-consultation-summary-2-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/representations-check', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['representations-check-complete'] = 'true'

  if (req.session.data['representationsDocs'] == 'yes') {
    res.redirect('representations-upload')
  } else {
    res.redirect('../application-details')
  }
})

router.post('/consultation-documents/representations-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['representations-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/practical-arrangements-statement-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['practical-arrangements-statement-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/environmental-report-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['environmental-report-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/supplementary-plans-statement-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['supplementary-plans-statement-upload-complete'] = 'true'
  req.session.data['consultation-completed'] = 'true'
  res.redirect('../application-details')
})

// Fallback for any consultation page not explicitly handled above
router.post('/consultation-documents/:page', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

router.post('/supplementary-documents/supplementary-check', function (req, res) {
  req.session.data['supplementary-started'] = 'true'
  req.session.data['supplementary-check-complete'] = 'true'

  if (req.session.data['additionalDocs'] == 'yes') {
    res.redirect('supplementary-upload')
  } else {
    req.session.data['supplementary-completed'] = 'true'
    res.redirect('../application-details')
  }
})

router.post('/supplementary-documents/supplementary-upload', function (req, res) {
  req.session.data['supplementary-upload-complete'] = 'true'
  req.session.data['supplementary-completed'] = 'true'
  res.redirect('../application-details')
})

module.exports = router
