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

const requiredDocumentKeys = [
  'proposed-local-plan-upload-complete',
  'compliance-statement-upload-complete',
  'soundness-statement-upload-complete',
  'examination-library-link-complete'
]

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data

  const requiredCompletedCount = requiredDocumentKeys.filter(key => data[key] == 'true').length

  res.render('projects/front-office/gw3/v3/application-details', {
    requiredCompletedCount: requiredCompletedCount,
    requiredTotalCount: requiredDocumentKeys.length
  })
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS (required and optional)
// -----------------------------------------------

router.post('/procedural-documents/:page', function (req, res) {
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

// -----------------------------------------------
// OPTIONAL DOCUMENTS
// -----------------------------------------------

// Fallback for any consultation document page
router.post('/consultation-documents/:page', function (req, res) {
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

// Fallback for any supplementary document page
router.post('/supplementary-documents/:page', function (req, res) {
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

module.exports = router
