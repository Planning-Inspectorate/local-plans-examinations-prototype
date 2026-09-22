const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const CONTACTS_KEY = 'contacts';
const PENDING_ASSESSOR_KEY = 'gw2V6PendingAssessor';
const PENDING_NOTIFICATION_KEY = 'gw2V6PendingAssessorNotification';

function formatDate(dateString) {
  if (!dateString) return 'Not provided';
  const date = DateTime.fromISO(String(dateString));
  return date.isValid ? date.toFormat('d MMMM yyyy') : dateString;
}

function getContacts(req) {
  return Array.isArray(req.session[CONTACTS_KEY]) ? req.session[CONTACTS_KEY] : [];
}

function renderGateway2(req, res) {
  const notificationMessage = req.session.gw2V6AssessorNotificationMessage || '';
  delete req.session.gw2V6AssessorNotificationMessage;

  res.render('projects/back-office/manage/GW2/v6/gateway-2', {
    caseRef: req.session.data?.currentCaseRef || req.session.currentCaseRef || '',
    planTitle: req.session.data?.planTitle || req.session.planTitle || '',
    notificationMessage,
    assessorContacts: getContacts(req).map((contact) => ({
      ...contact,
      dateAppointedDisplay: formatDate(contact.dateAppointed)
    }))
  });
}

router.use((req, res, next) => {
  res.locals.basePath = req.baseUrl || '';
  next();
});

router.get('/check-contact-details', (req, res) => {
  const notificationMessage = req.session.gw2V6AssessorNotificationMessage || '';
  delete req.session.gw2V6AssessorNotificationMessage;

  res.render('projects/back-office/manage/GW2/v6/check-contact-details', {
    notificationMessage,
    contacts: getContacts(req).map((contact) => ({
      ...contact,
      dateAppointedDisplay: formatDate(contact.dateAppointed)
    }))
  });
});

router.get('/gateway-2', (req, res) => renderGateway2(req, res));

router.get('/additional-contact', (req, res) => {
  const editIndex = req.query.edit;
  const contacts = getContacts(req);
  let contact = {};
  if (editIndex !== undefined && editIndex !== '' && contacts[Number(editIndex)]) {
    contact = contacts[Number(editIndex)];
  }

  res.render('projects/back-office/manage/GW2/v6/additional-contact', {
    contact,
    editIndex: editIndex !== undefined ? editIndex : ''
  });
});

router.post('/additional-contact', (req, res) => {
  const { fullName, editIndex } = req.body;
  if (!fullName) {
    return res.render('projects/back-office/manage/GW2/v6/additional-contact', {
      contact: { fullName: fullName || '' },
      editIndex: editIndex || '',
      error: 'Enter the assessor name'
    });
  }
  req.session[PENDING_ASSESSOR_KEY] = {
    fullName,
    editIndex: editIndex !== undefined && editIndex !== '' ? Number(editIndex) : ''
  };
  res.redirect(`/projects/back-office/manage/GW2/v6/date-appointed${editIndex !== undefined && editIndex !== '' ? `?edit=${editIndex}` : ''}`);
});

router.get('/date-appointed', (req, res) => {
  const editIndex = req.query.edit;
  const pending = req.session[PENDING_ASSESSOR_KEY] || {};
  const existing = editIndex !== undefined && editIndex !== '' ? getContacts(req)[Number(editIndex)] : null;
  const dateAppointed = pending.dateAppointed || existing?.dateAppointed || DateTime.now().toISODate();
  const [year, month, day] = dateAppointed.split('-');

  res.render('projects/back-office/manage/GW2/v6/date-appointed', {
    editIndex: editIndex !== undefined ? editIndex : pending.editIndex,
    day,
    month,
    year
  });
});

router.post('/date-appointed', (req, res) => {
  const { day, month, year, editIndex } = req.body;
  const date = DateTime.fromObject({ day: Number(day), month: Number(month), year: Number(year) });
  const validDate = day && month && year && date.isValid && date.day === Number(day) && date.month === Number(month) && date.year === Number(year);

  if (!validDate) {
    return res.render('projects/back-office/manage/GW2/v6/date-appointed', {
      editIndex: editIndex || '',
      day: day || '',
      month: month || '',
      year: year || '',
      error: 'Enter a valid date appointed'
    });
  }

  const pending = req.session[PENDING_ASSESSOR_KEY] || {};
  const index = editIndex !== undefined && editIndex !== '' ? Number(editIndex) : pending.editIndex;
  const contact = {
    fullName: pending.fullName || getContacts(req)[index]?.fullName || '',
    dateAppointed: date.toISODate()
  };
  if (!Array.isArray(req.session[CONTACTS_KEY])) req.session[CONTACTS_KEY] = [];
  if (index !== undefined && index !== '') req.session[CONTACTS_KEY][Number(index)] = contact;
  else {
    req.session[CONTACTS_KEY].push(contact);
    req.session[PENDING_NOTIFICATION_KEY] = contact;
    delete req.session[PENDING_ASSESSOR_KEY];
    return res.redirect('/projects/back-office/manage/GW2/v6/assessor-notification');
  }
  delete req.session[PENDING_ASSESSOR_KEY];
  res.redirect('/projects/back-office/manage/GW2/v6/check-contact-details');
});

router.get('/assessor-notification', (req, res) => {
  const contact = req.session[PENDING_NOTIFICATION_KEY];
  res.render('projects/back-office/manage/GW2/v6/assessor-notification', {
    contact: contact && { ...contact, dateAppointedDisplay: formatDate(contact.dateAppointed) }
  });
});

router.post('/assessor-notification', (req, res) => {
  const contact = req.session[PENDING_NOTIFICATION_KEY];
  if (contact) {
    req.session.gw2V6AssessorNotificationMessage = `Notification sent to ${contact.fullName}`;
    delete req.session[PENDING_NOTIFICATION_KEY];
  }
  res.redirect('/projects/back-office/manage/GW2/v6/check-contact-details');
});

router.get('/remove-contact-details-page', (req, res) => {
  const editIndex = Number(req.query.edit);
  res.render('projects/back-office/manage/GW2/v6/remove-contact-details', {
    contact: getContacts(req)[editIndex],
    editIndex: req.query.edit
  });
});

router.post('/remove-contact-details-page', (req, res) => {
  const editIndex = Number(req.body.editIndex);
  const contacts = getContacts(req);
  if (!Number.isNaN(editIndex) && contacts[editIndex]) {
    contacts.splice(editIndex, 1);
    req.session[CONTACTS_KEY] = contacts;
    req.session.gw2V6AssessorNotificationMessage = 'Assessor removed';
  }
  res.redirect('/projects/back-office/manage/GW2/v6/check-contact-details');
});

module.exports = router;
