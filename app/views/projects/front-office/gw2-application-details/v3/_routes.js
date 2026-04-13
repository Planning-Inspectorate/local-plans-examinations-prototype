const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

const tasks = [
  { id: 'covering-letter',              label: 'Gateway 2 covering letter' },
  { id: 'timetable',                    label: 'Local plan timetable' },
  { id: 'pid',                          label: 'Project initiation document' },
  { id: 'compliance',                   label: 'Draft statement of compliance' },
  { id: 'soundness',                    label: 'Draft statement of soundness' },
  { id: 'consultation-statement',       label: 'Consultation statement' },
  { id: 'scoping-summary',             label: 'Consultation summary for scoping consultation' },
  { id: 'proposed-content-summary',    label: 'Consultation summary for proposed local plan content and evidence documents' },
  { id: 'notice',                       label: 'Notice of intention to commence local plan preparation' },
  { id: 'scoping-docs',                label: 'Scoping consultation documents' },
  { id: 'scoping-feedback',            label: 'Consultation summary of feedback to scoping consultation' },
  { id: 'gateway1',                    label: 'Gateway 1 – Self assessment of readiness' },
  { id: 'proposed-content-consultation', label: 'Consultation on proposed local plan content and evidence documents' },
  { id: 'proposed-content-feedback',   label: 'Consultation summary for the above' }
]

// When user clicks a task link — set current-task from query param and mark as started
router.get('/projects/front-office/gw2-application-details/v3/document-upload', (req, res, next) => {
  if (req.query.task) {
    const task = tasks.find(t => t.id === req.query.task)
    req.session.data['current-task'] = req.query.task
    req.session.data['current-task-label'] = task ? task.label : req.query.task
    req.session.data[req.query.task + '-started'] = 'true'
  }
  next()
})

// When user clicks Continue on document-upload — set dummy file, mark complete, redirect to next task or application-details
router.post('/projects/front-office/gw2-application-details/v3/document-upload', (req, res) => {
  const task = req.session.data['current-task']

  if (task) {
    // Mark as started and store a dummy file for this task
    req.session.data[task + '-started'] = 'true'
    req.session.data[task + '-file'] = 'example-document.pdf'

    // Find the next task that hasn't been started yet
    const currentIndex = tasks.findIndex(t => t.id === task)
    const nextTask = tasks.slice(currentIndex + 1).find(t => !req.session.data[t.id + '-started'])

    if (nextTask) {
      // Set up the next task and redirect to upload page for it
      req.session.data['current-task'] = nextTask.id
      req.session.data['current-task-label'] = nextTask.label
      req.session.data[nextTask.id + '-started'] = 'true'
      res.redirect('document-upload?task=' + nextTask.id)
    } else {
      // All tasks started — go back to application details
      res.redirect('application-details')
    }
  } else {
    res.redirect('application-details')
  }
})

// When user lands on document-category
router.get('/projects/front-office/gw2-application-details/v3/document-category', (req, res, next) => {
  const task = req.session.data['current-task']
  if (task) {
    req.session.data[task + '-started'] = 'true'
  }
  next()
})

// When user submits the complete form on document-category
router.post('/projects/front-office/gw2-application-details/v3/document-category-complete', (req, res) => {
  const task = req.session.data['current-task']
  if (task) {
    if (req.session.data['mark-complete'] === 'yes') {
      req.session.data[task + '-complete'] = 'true'
      req.session.data[task + '-file'] = 'example-document.pdf'
    } else {
      delete req.session.data[task + '-complete']
    }
  }
  res.redirect('application-details')
})

module.exports = router