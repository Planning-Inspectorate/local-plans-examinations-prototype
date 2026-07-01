const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/documents/local-plan-upload', function (req, res) {
  req.session.data['local-plan-upload-complete'] = 'true'
  req.session.data['local-plan-completed'] = 'true'
  res.redirect('../application-details')
})

module.exports = router