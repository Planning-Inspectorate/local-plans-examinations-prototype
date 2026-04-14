const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Array defining the sequence of pages for the "Continue" flow
const uploadFlow = [
  'cover-letter-upload',
  'timetable-upload',
  'pid-upload',
  'compliance-upload',
  'soundness-upload',
  'consultation-statement-upload',
  'scoping-summary-upload',
  'proposed-plan-summary-upload',
  'notice-of-intention-upload',
  'scoping-full-upload',
  'scoping-feedback-summary-upload',
  'gateway1-upload',
  'proposed-plan-full-upload',
  'consultation-summary-upload'
]

router.post('/document-upload/:page', function (req, res) {
  const currentPage = req.params.page
  const currentIndex = uploadFlow.indexOf(currentPage)
  
  // 1. Mark this specific page as "uploaded" by saving a dummy filename
  // This satisfies your requirement to show a filename in the task list
  req.session.data[currentPage + '-file'] = 'document_v1.pdf'

  // 2. Determine where to go next
  if (currentIndex !== -1 && currentIndex < uploadFlow.length - 1) {
    // Go to the next page in the sequence
    const nextPage = uploadFlow[currentIndex + 1]
    res.redirect(nextPage)
  } else {
    // It's the last page (consultation-summary-upload), go back to task list
    res.redirect('../application-details')
  }
})

module.exports = router