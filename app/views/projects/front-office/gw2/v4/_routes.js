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
  return data['cover-letter-upload-complete'] &&
         data['timetable-type-complete'] &&
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

function workshopComplete(data) {
  return data['workshop-venue-complete'] &&
         data['workshop-dates-complete']
}

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data

  let completedCount = 0
  if (data['procedural-completed'] == 'true') completedCount++
  if (data['consultation-completed'] == 'true') completedCount++

  res.render('projects/front-office/gw2/v4/application-details', {
    completedCount: completedCount
  })
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS
// -----------------------------------------------

// ---- Cover letter ----
router.post('/procedural-documents/cover-letter-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['cover-letter-upload-complete'] = 'true'
  res.redirect('../application-details')
})

// ---- Timetable ----
router.post('/procedural-documents/timetable-type', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['timetable-type-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/timetable-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['timetable-upload-complete'] = 'true'
  req.session.data['timetable-type-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/pid-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['pid-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/compliance-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['compliance-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/procedural-documents/soundness-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['soundness-upload-complete'] = 'true'
  req.session.data['procedural-completed'] = 'true'
  res.redirect('../application-details')
})

// ---- PID ----
router.post('/procedural-documents/pid-type', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  if (req.session.data['pid-type'] !== 'file upload') {
    req.session.data['pid-link-complete'] = 'true'
  }
  res.redirect('../application-details')
})

// ---- Compliance ----
router.post('/procedural-documents/compliance-type', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  if (req.session.data['compliance-type'] !== 'file upload') {
    req.session.data['compliance-link-complete'] = 'true'
  }
  res.redirect('../application-details')
})

// ---- Soundness ----
router.post('/procedural-documents/soundness-type', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  if (req.session.data['soundness-type'] !== 'file upload') {
    req.session.data['soundness-link-complete'] = 'true'
    req.session.data['procedural-completed'] = 'true'
  }
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

router.post('/consultation-documents/notice-of-intention-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['notice-of-intention-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/scoping-full-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-full-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/scoping-feedback-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-feedback-summary-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/gateway1-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['gateway1-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/consultation-documents/proposed-plan-full-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['proposed-plan-full-upload-complete'] = 'true'
  res.redirect('../application-details')
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

router.post('/supplementary-documents/supplementary-upload', function (req, res) {
  req.session.data['supplementary-upload-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/workshop-info/workshop-venue', function (req, res) {
  req.session.data['workshop-venue-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/workshop-info/workshop-dates', function (req, res) {
  req.session.data['workshop-dates-complete'] = 'true'
  res.redirect('../application-details')
})

// Fallback for any consultation page not explicitly handled above
router.post('/workshop-info/:page', function (req, res) {
  req.session.data['workshop-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

module.exports = router