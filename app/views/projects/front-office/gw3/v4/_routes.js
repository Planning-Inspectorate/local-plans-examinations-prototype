const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('*', function(req, res, next){
  // Add return to task list
  res.locals['return'] = true

  next()
})

// -----------------------------------------------
// DOCUMENT DEFINITIONS
// -----------------------------------------------
// `flagged: true` marks documents the inspector raised as needing action
// in the previous (stopped) submission — seeded in on resubmission.

const requiredDocuments = [
  { key: 'proposed-local-plan-upload', label: 'Proposed Local Plan', file: 'proposed-local-plan.pdf', href: 'procedural-documents/proposed-local-plan-upload' },
  { key: 'compliance-statement-upload', label: 'Statement of Compliance', file: 'compliance-statement.pdf', href: 'procedural-documents/compliance-statement-upload' },
  { key: 'soundness-statement-upload', label: 'Statement of Soundness', file: 'soundness-statement.pdf', href: 'procedural-documents/soundness-statement-upload', flagged: true },
  { key: 'examination-library-link', label: 'Link to examination library', href: 'procedural-documents/examination-library-link', isLink: true }
]

const optionalDocuments = [
  { key: 'policies-map-upload', label: 'Map of proposed Local Plan policies', file: 'policies-map.pdf', href: 'procedural-documents/policies-map-upload' },
  { key: 'alterations-statement-upload', label: 'Statement of alterations', file: 'alterations-statement.pdf', href: 'procedural-documents/alterations-statement-upload' },
  { key: 'consultation-engagement-summary-upload', label: 'Summary of consultation and engagement activities', file: 'consultation-engagement-summary.pdf', href: 'consultation-documents/consultation-engagement-summary-upload' },
  { key: 'scoping-consultation-summary-upload', label: 'Summary of scoping consultation', file: 'scoping-consultation-summary.pdf', href: 'consultation-documents/scoping-consultation-summary-upload' },
  { key: 'plan-content-evidence-consultation-summary-upload', label: 'Summary of consultation on proposed Local Plan content and evidence', file: 'plan-content-evidence-consultation-summary.pdf', href: 'consultation-documents/plan-content-evidence-consultation-summary-upload' },
  { key: 'proposed-plan-consultation-summary-upload', label: 'Summary of consultation on proposed Local Plan', file: 'proposed-plan-consultation-summary.pdf', href: 'consultation-documents/proposed-plan-consultation-summary-upload' },
  { key: 'plan-content-evidence-consultation-docs-upload', label: 'Consultation on proposed Local Plan content and evidence documents', file: 'plan-content-evidence-consultation-docs.pdf', href: 'consultation-documents/plan-content-evidence-consultation-docs-upload' },
  { key: 'plan-content-evidence-consultation-summary-2-upload', label: 'Consultation summary on proposed Local Plan content and evidence documents', file: 'plan-content-evidence-consultation-summary-2.pdf', href: 'consultation-documents/plan-content-evidence-consultation-summary-2-upload' },
  { key: 'practical-arrangements-statement-upload', label: 'Statement of practical arrangements demonstrating readiness for examination', file: 'practical-arrangements-statement.pdf', href: 'consultation-documents/practical-arrangements-statement-upload' },
  { key: 'environmental-report-upload', label: 'Environmental report', file: 'environmental-report.pdf', href: 'consultation-documents/environmental-report-upload', flagged: true },
  { key: 'supplementary-plans-statement-upload', label: 'Supplementary plans statement', file: 'supplementary-plans-statement.pdf', href: 'consultation-documents/supplementary-plans-statement-upload' },
  { key: 'representations-upload', label: 'Copies of representations', file: 'representations.pdf', href: 'consultation-documents/representations-upload' },
  { key: 'representations-summary-upload', label: 'Summary of representations', file: 'representations-summary.pdf', href: 'consultation-documents/representations-summary-upload' },
  { key: 'gateway-2-issues-summary-upload', label: 'Summary of how issues raised at Gateway 2 have been addressed', file: 'gateway-2-issues-summary.pdf', href: 'consultation-documents/gateway-2-issues-summary-upload', flagged: true },
  { key: 'supplementary-upload', label: 'Subsequent work towards your Local Plan', file: 'supplementary-doc-1.pdf', href: 'supplementary-documents/supplementary-upload' }
]

const allDocuments = requiredDocuments.concat(optionalDocuments)

// -----------------------------------------------
// HELPERS
// -----------------------------------------------

// On first load of a resubmission, carry over every document from the
// previous submission. Documents the inspector flagged start as
// 'action-needed'; the rest are just there, same as before.
function seedPreviousSubmission (data) {
  allDocuments.forEach(doc => {
    data[`${doc.key}-complete`] = 'true'
    if (doc.isLink) {
      data[doc.key] = 'eastborough.gov.uk/examination-library'
    }
    if (doc.flagged) {
      data[`${doc.key}-status`] = 'action-needed'
    } else {
      delete data[`${doc.key}-status`]
    }
  })
}

// Once a document is (re)uploaded during a resubmission, it's no longer
// awaiting action — it's been updated.
function markUploaded (data, page) {
  data[`${page}-complete`] = 'true'
  if (data['resubmission'] === 'true') {
    data[`${page}-status`] = 'updated'
  } else {
    delete data[`${page}-status`]
  }
}

function buildDocumentRows (documents, data) {
  return documents.map(doc => {
    const complete = data[`${doc.key}-complete`] === 'true'
    const status = data[`${doc.key}-status`]
    const displayValue = doc.isLink ? data[doc.key] : doc.file

    let valueHtml = '<span class="govuk-hint">Not added</span>'

    if (complete) {
      valueHtml = `<a class="govuk-link" href="#">${displayValue}</a>`

      if (status === 'action-needed') {
        valueHtml += ' <strong class="govuk-tag govuk-tag--orange govuk-!-margin-left-1">Action needed</strong>'
        valueHtml += '<br><span class="govuk-hint govuk-!-margin-bottom-0 govuk-!-margin-top-1">The Gateway 3 report explains what to change — <a class="govuk-link" href="application-details-decision?decision=stop">read the report</a></span>'
      } else if (status === 'updated') {
        valueHtml += ' <strong class="govuk-tag govuk-tag--blue govuk-!-margin-left-1">Updated</strong>'
      }
    }

    return {
      key: { text: doc.label },
      value: { html: valueHtml },
      actions: {
        items: [
          complete
            ? { href: `${doc.href}?cya=true`, html: status === 'action-needed' ? 'Update' : 'Change', visuallyHiddenText: doc.label.toLowerCase() }
            : { href: doc.href, html: 'Add', visuallyHiddenText: doc.label.toLowerCase() }
        ]
      }
    }
  })
}

// -----------------------------------------------
// APPLICATION DETAILS
// -----------------------------------------------

router.get('/application-details', function (req, res) {
  const data = req.session.data
  const resubmission = data['resubmission'] === 'true'

  if (resubmission && data['v4-resubmission-seeded'] !== 'true') {
    seedPreviousSubmission(data)
    data['v4-resubmission-seeded'] = 'true'
  }

  const requiredCompletedCount = requiredDocuments.filter(doc => data[`${doc.key}-complete`] === 'true').length
  const requiredActionNeededCount = requiredDocuments.filter(doc => data[`${doc.key}-status`] === 'action-needed').length
  const optionalActionNeededCount = optionalDocuments.filter(doc => data[`${doc.key}-status`] === 'action-needed').length

  res.render('projects/front-office/gw3/v4/application-details', {
    requiredCompletedCount: requiredCompletedCount,
    requiredTotalCount: requiredDocuments.length,
    requiredActionNeededCount: requiredActionNeededCount,
    optionalActionNeededCount: optionalActionNeededCount,
    actionNeededCount: requiredActionNeededCount + optionalActionNeededCount,
    requiredDocumentRows: buildDocumentRows(requiredDocuments, data),
    optionalDocumentRows: buildDocumentRows(optionalDocuments, data)
  })
})

// -----------------------------------------------
// PROCEDURAL DOCUMENTS (required and optional)
// -----------------------------------------------

router.post('/procedural-documents/:page', function (req, res) {
  markUploaded(req.session.data, req.params.page)
  res.redirect('../application-details')
})

// -----------------------------------------------
// OPTIONAL DOCUMENTS
// -----------------------------------------------

// Fallback for any consultation document page
router.post('/consultation-documents/:page', function (req, res) {
  markUploaded(req.session.data, req.params.page)
  res.redirect('../application-details')
})

// Fallback for any supplementary document page
router.post('/supplementary-documents/:page', function (req, res) {
  markUploaded(req.session.data, req.params.page)
  res.redirect('../application-details')
})

module.exports = router
