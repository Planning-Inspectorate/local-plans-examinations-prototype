const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const WORKSHOP_DOCS_KEY = 'gw2v3WorkshopDocuments';

function formatDateForDisplay(dateString) {
  if (!dateString || dateString === '-') return '-';

  const slashParsed = DateTime.fromFormat(dateString, 'd/M/yyyy');
  if (slashParsed.isValid) {
    return slashParsed.toFormat('d MMMM yyyy');
  }

  return dateString;
}

function getUploadedDocuments(req) {
  if (Array.isArray(req.session[WORKSHOP_DOCS_KEY])) {
    return req.session[WORKSHOP_DOCS_KEY];
  }

  if (req.session.data && Array.isArray(req.session.data[WORKSHOP_DOCS_KEY])) {
    req.session[WORKSHOP_DOCS_KEY] = req.session.data[WORKSHOP_DOCS_KEY];
    return req.session[WORKSHOP_DOCS_KEY];
  }

  return [];
}

function buildGateway2ViewModel(req, notificationMessage = '') {
  return {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    planTitle: req.session.data?.planTitle || req.session.planTitle || '',
    notificationMessage,
    gateway2EstimatedDate: formatDateForDisplay(req.session.gateway2EstimatedDate),
    gateway2ActualDate: formatDateForDisplay(req.session.gateway2ActualDate),
    gateway2ValidDate: formatDateForDisplay(req.session.gateway2ValidDate),
    gateway2AssessorName: req.session.gateway2AssessorName || '-',
    gateway2AssessorAppointmentDate: formatDateForDisplay(req.session.gateway2AssessorAppointmentDate),
    gateway2ReportIssuedDate: formatDateForDisplay(req.session.gateway2ReportIssuedDate),
    gateway2ReportPublishedDate: formatDateForDisplay(req.session.gateway2ReportPublishedDate),
    hearings: Array.isArray(req.session.hearings) ? req.session.hearings : [],
    uploadedDocuments: getUploadedDocuments(req)
  };
}

router.use((req, res, next) => {
  res.locals.basePath = req.baseUrl || '';
  next();
});

router.get('/gateway-2', (req, res) => {
  const notificationMessage = req.session.notificationMessage || '';
  delete req.session.notificationMessage;

  res.render('projects/back-office/manage/GW2/v4/gateway-2', buildGateway2ViewModel(req, notificationMessage));
  req.session.save();
});

router.get('/gateway-2.html', (req, res) => {
  res.redirect('/projects/back-office/manage/GW2/v4/gateway-2');
});

router.use('/', require('./_add-workshop'));
router.use('/', require('./_cancel-workshop'));

module.exports = router;
