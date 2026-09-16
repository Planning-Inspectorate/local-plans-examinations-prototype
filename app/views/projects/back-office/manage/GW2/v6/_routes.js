const govukPrototypeKit = require('govuk-prototype-kit');
const router = govukPrototypeKit.requests.setupRouter();
const { DateTime } = require('luxon');

const CONTACTS_KEY = 'gw2v6AssessorContacts';
const PENDING_ASSESSOR_KEY = 'gw2v6PendingAssessor';
const PENDING_NOTIFICATION_KEY = 'gw2v6PendingNotification';

function formatDate(dateString) {
  if (!dateString) return 'Not provided';
  const date = DateTime.fromISO(String(dateString));
  return date.isValid ? date.toFormat('d MMMM yyyy') : dateString;
}

function getContacts(req) {
  return Array.isArray(req.session[CONTACTS_KEY]) ? req.session[CONTACTS_KEY] : [];
}

function renderGateway2(req, res) {
  const notificationMessage = req.session.gw2v6NotificationMessage || '';
  delete req.session.gw2v6NotificationMessage;

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

router.get('/gateway-2', (req, res) => renderGateway2(req, res));

router.get('/additional-contact', (req, res) => {
  const editIndex = req.query.edit;
  const from = req.query.from;
  const contacts = getContacts(req);
  let contact = {};
  if (editIndex !== undefined && editIndex !== '' && contacts[Number(editIndex)]) {
    contact = contacts[Number(editIndex)];
  } else if (from === 'notification' && req.session[PENDING_NOTIFICATION_KEY]) {
    contact = req.session[PENDING_NOTIFICATION_KEY];
  }

  const cancelUrl = (from === 'notification' && (!editIndex || editIndex === ''))
    ? '/projects/back-office/manage/GW2/v6/assessor-notification'
    : '/projects/back-office/manage/GW2/v6/gateway-2';

  res.render('projects/back-office/manage/GW2/v6/additional-contact', {
    contact,
    editIndex: editIndex !== undefined ? editIndex : '',
    from: from || '',
    cancelUrl,
    backUrl: cancelUrl
  });
});

router.post('/additional-contact', (req, res) => {
  const { fullName, editIndex, from } = req.body;
  const cancelUrl = (from === 'notification' && (!editIndex || editIndex === ''))
    ? '/projects/back-office/manage/GW2/v6/assessor-notification'
    : '/projects/back-office/manage/GW2/v6/gateway-2';

  if (!fullName) {
    return res.render('projects/back-office/manage/GW2/v6/additional-contact', {
      contact: { fullName: fullName || '' },
      editIndex: editIndex || '',
      from: from || '',
      cancelUrl,
      backUrl: cancelUrl,
      error: 'Enter the assessor name'
    });
  }

  const contacts = getContacts(req);
  const index = editIndex !== undefined && editIndex !== '' ? Number(editIndex) : '';

  if (index !== '') {
    contacts[index] = {
      ...contacts[index],
      fullName
    };
    req.session[CONTACTS_KEY] = contacts;
    return res.redirect('/projects/back-office/manage/GW2/v6/gateway-2');
  }

  if (from === 'notification' && req.session[PENDING_NOTIFICATION_KEY]) {
    req.session[PENDING_NOTIFICATION_KEY].fullName = fullName;
    if (contacts.length > 0) {
      contacts[contacts.length - 1].fullName = fullName;
      req.session[CONTACTS_KEY] = contacts;
    }
    return res.redirect('/projects/back-office/manage/GW2/v6/assessor-notification');
  }

  const newContact = {
    fullName,
    dateAppointed: DateTime.now().toISODate()
  };

  contacts.push(newContact);
  req.session[CONTACTS_KEY] = contacts;
  req.session[PENDING_NOTIFICATION_KEY] = newContact;
  res.redirect('/projects/back-office/manage/GW2/v6/assessor-notification');
});

router.get('/date-appointed', (req, res) => {
  const pendingNotification = req.session[PENDING_NOTIFICATION_KEY];
  const editIndex = req.query.edit;
  const from = req.query.from;
  const existing = editIndex !== undefined && editIndex !== '' ? getContacts(req)[Number(editIndex)] : null;
  const dateAppointed = (existing && existing.dateAppointed) || (pendingNotification && pendingNotification.dateAppointed) || DateTime.now().toISODate();
  const [year, month, day] = dateAppointed.split('-');

  const cancelUrl = (editIndex !== undefined && editIndex !== '')
    ? '/projects/back-office/manage/GW2/v6/gateway-2'
    : '/projects/back-office/manage/GW2/v6/assessor-notification';

  res.render('projects/back-office/manage/GW2/v6/date-appointed', {
    editIndex: editIndex !== undefined ? editIndex : '',
    from: from || '',
    cancelUrl,
    backUrl: cancelUrl,
    day,
    month,
    year
  });
});

router.post('/date-appointed', (req, res) => {
  const { day, month, year, editIndex, from } = req.body;
  const date = DateTime.fromObject({ day: Number(day), month: Number(month), year: Number(year) });
  const validDate = day && month && year && date.isValid && date.day === Number(day) && date.month === Number(month) && date.year === Number(year);

  const cancelUrl = (editIndex !== undefined && editIndex !== '')
    ? '/projects/back-office/manage/GW2/v6/gateway-2'
    : '/projects/back-office/manage/GW2/v6/assessor-notification';

  if (!validDate) {
    return res.render('projects/back-office/manage/GW2/v6/date-appointed', {
      editIndex: editIndex || '',
      from: from || '',
      cancelUrl,
      backUrl: cancelUrl,
      day: day || '',
      month: month || '',
      year: year || '',
      error: 'Enter a valid date appointed'
    });
  }

  const contacts = getContacts(req);
  const index = editIndex !== undefined && editIndex !== '' ? Number(editIndex) : '';

  if (index !== '') {
    if (contacts[index]) {
      contacts[index].dateAppointed = date.toISODate();
      req.session[CONTACTS_KEY] = contacts;
    }
    return res.redirect('/projects/back-office/manage/GW2/v6/gateway-2');
  }

  if (req.session[PENDING_NOTIFICATION_KEY]) {
    req.session[PENDING_NOTIFICATION_KEY].dateAppointed = date.toISODate();
    if (contacts.length > 0) {
      contacts[contacts.length - 1].dateAppointed = date.toISODate();
      req.session[CONTACTS_KEY] = contacts;
    }
  }

  res.redirect('/projects/back-office/manage/GW2/v6/assessor-notification');
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
    req.session.gw2v6NotificationMessage = `Notification sent to ${contact.fullName}`;
    delete req.session[PENDING_NOTIFICATION_KEY];
  }
  res.redirect('/projects/back-office/manage/GW2/v6/gateway-2');
});

router.get('/remove-assessor', (req, res) => {
  const editIndex = Number(req.query.edit);
  res.render('projects/back-office/manage/GW2/v6/remove-assessor', {
    contact: getContacts(req)[editIndex],
    editIndex: req.query.edit
  });
});

router.post('/remove-assessor', (req, res) => {
  const editIndex = Number(req.body.editIndex);
  const contacts = getContacts(req);
  if (!Number.isNaN(editIndex) && contacts[editIndex]) {
    contacts.splice(editIndex, 1);
    req.session[CONTACTS_KEY] = contacts;
    req.session.gw2v6NotificationMessage = 'Assessor removed';
  }
  res.redirect('/projects/back-office/manage/GW2/v6/gateway-2');
});

module.exports = router;
