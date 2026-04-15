const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res, next) {
  let completedCount = 0
  if (req.session.data['procedural-completed'] == 'true') { completedCount++ }
  if (req.session.data['consultation-completed'] == 'true') { completedCount++ }
  res.locals.completedCount = completedCount
  next()
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS
// -----------------------------------------------

// Specific routes first
router.post('/procedural-documents/cover-letter-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['cover-letter-upload-complete'] = 'true'
  res.redirect('timetable-upload')
})

router.post('/procedural-documents/timetable-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['timetable-upload-complete'] = 'true'
  res.redirect('pid-upload')
})

router.post('/procedural-documents/pid-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['pid-upload-complete'] = 'true'
  res.redirect('compliance-upload')
})

router.post('/procedural-documents/compliance-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['compliance-upload-complete'] = 'true'
  res.redirect('soundness-upload')
})

router.post('/procedural-documents/soundness-upload', function (req, res) {
  req.session.data['procedural-started'] = 'true'
  req.session.data['soundness-upload-complete'] = 'true'
  req.session.data['procedural-completed'] = 'true'
  res.redirect('complete')
})

// Generic wildcard — after specific routes
router.post('/procedural-documents/:page', function (req, res, next) {
  req.session.data['procedural-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  next()
})

router.get('/procedural-documents/complete', function (req, res) {
  if (!req.session.data['consultation-completed']) {
    res.redirect('../consultation-documents/consultation-statement-upload')
  } else {
    res.redirect('../application-details')
  }
})

// -----------------------------------------------
// CONSULTATION DOCUMENTS
// -----------------------------------------------

// Specific routes first
router.post('/consultation-documents/consultation-statement-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['consultation-statement-upload-complete'] = 'true'
  res.redirect('scoping-summary-upload')
})

router.post('/consultation-documents/scoping-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-summary-upload-complete'] = 'true'
  res.redirect('proposed-plan-summary-upload')
})

router.post('/consultation-documents/proposed-plan-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['proposed-plan-summary-upload-complete'] = 'true'
  res.redirect('notice-of-intention-upload')
})

router.post('/consultation-documents/notice-of-intention-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['notice-of-intention-upload-complete'] = 'true'
  res.redirect('scoping-full-upload')
})

router.post('/consultation-documents/scoping-full-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-full-upload-complete'] = 'true'
  res.redirect('scoping-feedback-summary-upload')
})

router.post('/consultation-documents/scoping-feedback-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['scoping-feedback-summary-upload-complete'] = 'true'
  res.redirect('gateway1-upload')
})

router.post('/consultation-documents/gateway1-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['gateway1-upload-complete'] = 'true'
  res.redirect('proposed-plan-full-upload')
})

router.post('/consultation-documents/proposed-plan-full-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['proposed-plan-full-upload-complete'] = 'true'
  res.redirect('consultation-summary-upload')
})

router.post('/consultation-documents/consultation-summary-upload', function (req, res) {
  req.session.data['consultation-started'] = 'true'
  req.session.data['consultation-summary-upload-complete'] = 'true'
  req.session.data['consultation-completed'] = 'true'
  res.redirect('complete')
})

// Generic wildcard — after specific routes
router.post('/consultation-documents/:page', function (req, res, next) {
  req.session.data['consultation-started'] = 'true'
  req.session.data[`${req.params.page}-complete`] = 'true'
  next()
})

router.get('/consultation-documents/complete', function (req, res) {
  res.redirect('../application-details')
})

module.exports = router