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
  'examination-library-link-complete',
  'proposed-local-plan-upload-complete',
  'policies-map-upload-complete',
  'compliance-statement-upload-complete',
  'soundness-statement-upload-complete',
  'consultation-engagement-summary-upload-complete',
  'scoping-consultation-summary-upload-complete',
  'plan-content-evidence-consultation-summary-upload-complete',
  'proposed-plan-consultation-summary-upload-complete',
  'practical-arrangements-statement-upload-complete'
]

const requiredQuestionKeys = [
  'reg28-representations',
  'reg29-supplementary-plan',
  'reg12-environmental-report',
  'reg9-screening-determination'
]

const conditionalRequiredDocuments = [
  { condition: 'reg28-representations', key: 'representations-upload-complete' },
  { condition: 'reg29-supplementary-plan', key: 'supplementary-plans-statement-upload-complete' },
  { condition: 'reg12-environmental-report', key: 'environmental-report-upload-complete' },
  { condition: 'reg9-screening-determination', key: 'screening-determination-statement-upload-complete' }
]

const optionalDocumentKeys = [
  'representations-upload-complete',
  'supplementary-plans-statement-upload-complete',
  'environmental-report-upload-complete',
  'screening-determination-statement-upload-complete',
  'progress-representations-summary-upload-complete',
  'gateway-2-issues-summary-upload-complete',
  'plan-changes-statement-upload-complete',
  'other-documents-upload-complete'
]

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data

  if (req.query.resubmission === 'true') {
    const keysToClear = [
      ...requiredDocumentKeys,
      ...optionalDocumentKeys,
      ...requiredQuestionKeys,
      'examination-library-link'
    ]
    // Also clear res.locals.data - govuk-prototype-kit snapshots session
    // data into it before this route runs, so the page rendered on this
    // same request would otherwise still show the stale values.
    keysToClear.forEach(key => {
      delete data[key]
      delete res.locals.data[key]
    })
  }

  const applicableConditionalKeys = conditionalRequiredDocuments
    .filter(doc => data[doc.condition] == 'yes')
    .map(doc => doc.key)

  const requiredCompletedCount = requiredDocumentKeys.filter(key => data[key] == 'true').length +
    applicableConditionalKeys.filter(key => data[key] == 'true').length +
    requiredQuestionKeys.filter(key => data[key]).length
  const requiredTotalCount = requiredDocumentKeys.length + applicableConditionalKeys.length + requiredQuestionKeys.length

  res.render('projects/front-office/gw3/v1/application-details', {
    requiredCompletedCount: requiredCompletedCount,
    requiredTotalCount: requiredTotalCount
  })
})

// -----------------------------------------------
// ABOUT YOUR PLAN
// -----------------------------------------------

router.post('/about-your-plan/:page', function (req, res) {
  res.redirect('../application-details')
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS (required and optional)
// -----------------------------------------------

router.post('/procedural-documents/:page', function (req, res) {
  if (req.params.page === 'examination-library-link' && !req.session.data['examination-library-link']) {
    req.session.data['examination-library-link'] = 'https://www.eastborough.gov.uk/examination-library'
  }
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
