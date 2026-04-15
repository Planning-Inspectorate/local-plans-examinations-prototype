const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('/projects/front-office/application-details-g2/archive/v1/document-upload', (req, res, next) => {
  if (req.query.task) {
    req.session.data['current-task'] = req.query.task
    req.session.data[req.query.task + '-started'] = true
  }
  next()
})

router.post('/projects/front-office/application-details-g2/archive/v1/document-upload', (req, res) => {
  const task = req.session.data['current-task']
  res.redirect('/projects/front-office/application-details-g2/archive/v1/document-category')
})

router.get('/projects/front-office/application-details-g2/archive/v1/document-category', (req, res, next) => {
  const task = req.session.data['current-task']
  if (task) {
    req.session.data[task + '-started'] = true
  }
  next()
})

router.post('/projects/front-office/application-details-g2/archive/v1/document-category-complete', (req, res) => {
  const task = req.body['current-task']

  if (task) {
    if (req.body['mark-complete'] && req.body['mark-complete'].includes('yes')) {
      req.session.data[task + '-complete'] = true
    } else {
      delete req.session.data[task + '-complete']
    }
  }

  res.redirect('/projects/front-office/application-details-g2/archive/v1/application-details')
})

router.post('/projects/front-office/application-details-g2/archive/v1/upload-documents', (req, res) => {
  res.json({
    files: [
      {
        originalname: req.file ? req.file.originalname : 'uploaded-file.pdf',
        size: req.file ? req.file.size : 0
      }
    ]
  })
})

module.exports = router