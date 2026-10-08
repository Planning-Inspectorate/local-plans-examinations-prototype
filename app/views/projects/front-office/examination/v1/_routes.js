const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('*', function (req, res, next) {
  // Add return to task list
  res.locals['return'] = true

  next()
})

router.post('/documents/examination-website-link', function (req, res) {
  req.session.data['examination-website-link-complete'] = 'true'
  res.redirect('../application-details')
})

router.post('/documents/document-upload', function (req, res) {
  req.session.data[`document-upload-${req.session.data['doc']}-complete`] = 'true'
  res.redirect('../application-details')
})

// Fallback for any other document page (statement of changes, new documentation)
router.post('/documents/:page', function (req, res) {
  req.session.data[`${req.params.page}-complete`] = 'true'
  res.redirect('../application-details')
})

module.exports = router
