const express = require('express');
const router = express.Router();
const { DateTime } = require('luxon');
const lpaToRegionSimple = require('../../../../../../data/lpa-to-region-simple.json');
const lpaList = require('../../../../../../data/lpa-list.json');
const caseOfficers = require('../../../../../../data/case-officers.json');
const { getOverviewProgrammeOfficer } = require('../../../../../../routes/projects/back-office/programme-officers');

const overviewIndexUrl = '/projects/back-office/manage/overview/v2/index';

router.use((req, res, next) => {
  res.locals.caseRef = req.session.data?.currentCaseRef || req.session.currentCaseRef || '';
  next();
});

function formatDateForDisplay(value) {
  if (!value || value === '-') return value || '';
  const parsed = DateTime.fromFormat(value, 'd/M/yyyy');
  return parsed.isValid ? parsed.toFormat('d MMMM yyyy') : value;
}

function parseProtocolDate(value) {
  if (!value || value === '-') return null;

  for (const format of ['d/M/yyyy', 'd MMMM yyyy']) {
    const parsed = DateTime.fromFormat(value, format, { locale: 'en-GB' });
    if (parsed.isValid) return parsed.startOf('day');
  }

  return null;
}

function getProtocolDateFromRequest(req, prefix) {
  const day = (req.body[`${prefix}-day`] || '').trim();
  const month = (req.body[`${prefix}-month`] || '').trim();
  const year = (req.body[`${prefix}-year`] || '').trim();
  if (!day || !month || !year) return '';

  const parsed = DateTime.fromFormat(`${day}/${month}/${year}`, 'd/M/yyyy', { locale: 'en-GB' });
  return parsed.isValid ? parsed.toFormat('d/M/yyyy') : '';
}

function getProtocolDateInputValues(value) {
  const parsed = parseProtocolDate(value);
  return {
    day: parsed ? String(parsed.day) : '',
    month: parsed ? String(parsed.month) : '',
    year: parsed ? String(parsed.year) : ''
  };
}

function getProtocolTotalDays(sentDate, receivedDate) {
  const sent = parseProtocolDate(sentDate);
  const received = parseProtocolDate(receivedDate);
  if (!sent || !received) return '';

  return Math.abs(received.diff(sent, 'days').days);
}

function parseProtocolRecordIndex(value) {
  if (value === undefined || value === null || value === '') return null;
  const index = Number.parseInt(value, 10);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function getProtocolRecords(req) {
  if (!Array.isArray(req.session.protocolRecords)) {
    const hasLegacyRecord = req.session.protocolType
      || req.session.protocolSentDate
      || req.session.protocolReceivedDate;
    req.session.protocolRecords = hasLegacyRecord ? [{
      type: req.session.protocolType || '',
      sentDate: req.session.protocolSentDate || '',
      receivedDate: req.session.protocolReceivedDate || ''
    }] : [];
  }

  return req.session.protocolRecords;
}

function getProtocolRecordsForDisplay(req) {
  return getProtocolRecords(req).map((record, index) => ({
    ...record,
    index,
    sentDateDisplay: formatDateForDisplay(record.sentDate),
    receivedDateDisplay: formatDateForDisplay(record.receivedDate),
    totalDays: getProtocolTotalDays(record.sentDate, record.receivedDate)
  }));
}

function getCurrentCase(req, preferredRef) {
  const caseRef = preferredRef || req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  const matchedCase = caseRef ? cases.find(item => item.caseRef === caseRef) : null;

  if (matchedCase) {
    if (!Array.isArray(matchedCase.caseNotes)) matchedCase.caseNotes = [];
    return { reference: matchedCase.caseRef, caseNotes: matchedCase.caseNotes };
  }

  if (!Array.isArray(req.session.caseNotes)) req.session.caseNotes = [];
  return { reference: caseRef || 'PLAN/000001', caseNotes: req.session.caseNotes };
}

function buildCaseNote(now, text, userName) {
  const tableDate = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const tableTime = now
    .toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
    .toLowerCase()
    .replace(' ', '');

  return {
    text,
    meta: `${tableDate} at ${tableTime} by ${userName}`,
    tableDate,
    tableTime,
    tableUser: userName
  };
}

function getContactNameParts(contact = {}) {
  if (contact.firstName || contact.lastName) {
    return {
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      fullName: [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim()
    };
  }

  const fullName = contact.name || '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
    fullName
  };
}

function hasContactInformation(contact = {}) {
  return ['name', 'email', 'phone', 'organisation'].some((field) => {
    const value = contact[field];
    return typeof value === 'string' ? value.trim() !== '' && value !== '-' : Boolean(value);
  });
}

function buildOverviewContext(req) {
  const currentCase = getCurrentCase(req);
  const mainContact = req.session.mainContact || {};
  const mainContactNameParts = getContactNameParts(mainContact);
  const contacts = Array.isArray(req.session.contacts) ? req.session.contacts : [];
  const lpas = Array.isArray(req.session.lpas) ? req.session.lpas : [];
  const lpaRegions = req.session.lpaRegions && typeof req.session.lpaRegions === 'object'
    ? { ...req.session.lpaRegions }
    : {};

  // Ensure each selected LPA has a region value for display in overview.
  lpas.forEach((lpa, index) => {
    if (!lpaRegions[lpa]) {
      if (lpaToRegionSimple[lpa]) {
        lpaRegions[lpa] = lpaToRegionSimple[lpa];
      } else if (index === 0 && req.session.lpaRegion) {
        lpaRegions[lpa] = req.session.lpaRegion;
      }
    }
  });

  req.session.lpaRegions = lpaRegions;

  const normalizedContacts = contacts.map((contact) => {
    const nameParts = getContactNameParts(contact);
    return {
      ...contact,
      name: contact.name || nameParts.fullName,
      firstName: contact.firstName || nameParts.firstName,
      lastName: contact.lastName || nameParts.lastName
    };
  });
  const additionalContactRecords = normalizedContacts
    .map((contact, index) => ({ ...contact, index }))
    .filter(hasContactInformation);
  const nextAdditionalContactIndex = Array.from({ length: 5 }, (_, index) => index)
    .find((index) => !hasContactInformation(normalizedContacts[index]));

  const examinationInspectors = Array.isArray(req.session.examinationInspectors)
    ? req.session.examinationInspectors
    : null;
  const qaInspectors = Array.isArray(req.session.qaInspectors)
    ? req.session.qaInspectors
    : null;

  return {
    ...getOverviewProgrammeOfficer(req.session),
    caseRef: req.session.currentCaseRef || '',
    planTitle: req.session.planTitle || '',
    planType: req.session.planType || '',
    lpas,
    lpaRegions,
    caseOfficer: req.session.caseOfficer || '',
    examiningInspector1Name: examinationInspectors ? examinationInspectors[0]?.name || '' : req.session.examiningInspector1Name || '',
    examiningInspector2Name: examinationInspectors ? examinationInspectors[1]?.name || '' : req.session.examiningInspector2Name || '',
    examiningInspector3Name: examinationInspectors ? examinationInspectors[2]?.name || '' : req.session.examiningInspector3Name || '',
    qaInspector1Name: qaInspectors ? qaInspectors[0]?.name || '' : req.session.qaInspector1Name || '',
    qaInspector2Name: qaInspectors ? qaInspectors[1]?.name || '' : req.session.qaInspector2Name || '',
    qaInspector3Name: qaInspectors ? qaInspectors[2]?.name || '' : req.session.qaInspector3Name || '',
    contacts: normalizedContacts,
    additionalContactRecords,
    nextAdditionalContactIndex,
    mainContactName: mainContactNameParts.fullName,
    mainContactEmail: mainContact.email || '',
    mainContactPhone: mainContact.phone || '',
    mainContactOrg: mainContact.organisation || '',
    noticeOfIntentionDate: formatDateForDisplay(req.session.noticeOfIntentionDate),
    gateway1EstimatedDate: formatDateForDisplay(req.session.gateway1EstimatedDate),
    gateway2EstimatedDate: formatDateForDisplay(req.session.gateway2EstimatedDate),
    gateway3EstimatedDate: formatDateForDisplay(req.session.gateway3EstimatedDate),
    submissionDate: formatDateForDisplay(req.session.submissionDate),
    protocolRecords: getProtocolRecordsForDisplay(req),
    planBand: req.session.planBand || '',
    currentCase
  };
}

const purchaseOrderStageLabels = {
  '1': 'Gateway 2',
  '2': 'Gateway 3',
  '3': 'Examination'
};

function getPurchaseOrderStore(req) {
  const caseRef = req.session.data?.currentCaseRef || req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  return (caseRef && cases.find((item) => item.caseRef === caseRef)) || req.session;
}

function getPurchaseOrders(req) {
  const store = getPurchaseOrderStore(req);
  if (!Array.isArray(store.purchaseOrders)) store.purchaseOrders = [];
  return store.purchaseOrders;
}

function parsePurchaseOrderIndex(value) {
  if (value === undefined || value === null || value === '') return null;
  const index = Number.parseInt(value, 10);
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function getPurchaseOrderDraft(req) {
  return getPurchaseOrderStore(req).purchaseOrderDraft;
}

function getPurchaseOrdersForDisplay(req) {
  const store = getPurchaseOrderStore(req);
  const purchaseOrders = getPurchaseOrders(req);
  if (store.purchaseOrderExamplesSeeded) {
    const gateway3Example = purchaseOrders.find((purchaseOrder) => purchaseOrder.ponNumber === 'FO-PO-2026-002');
    if (gateway3Example?.notes === 'Example Gateway 3 purchase order') gateway3Example.notes = '';
    const backOfficeExample = purchaseOrders.find((purchaseOrder) => purchaseOrder.ponNumber === 'BO-PO-2026-001');
    if (backOfficeExample?.notes === 'Example back-office purchase order') backOfficeExample.notes = '';
    return purchaseOrders.map((purchaseOrder, index) => ({ ...purchaseOrder, index })).reverse();
  }

  if (!purchaseOrders.some((purchaseOrder) => purchaseOrder.source === 'front-office')) {
    purchaseOrders.push(
      {
        stage: '1',
        stageLabel: purchaseOrderStageLabels['1'],
        ponNumber: 'FO-PO-2026-001',
        dateAdded: '15 September 2026',
        source: 'front-office',
        notes: 'Example LPA purchase order'
      },
      {
        stage: '2',
        stageLabel: purchaseOrderStageLabels['2'],
        ponNumber: 'FO-PO-2026-002',
        dateAdded: '25 September 2026',
        source: 'front-office',
        notes: ''
      }
    );
  }

  if (!purchaseOrders.some((purchaseOrder) => purchaseOrder.source === 'back-office')) {
    purchaseOrders.push({
      stage: '3',
      stageLabel: purchaseOrderStageLabels['3'],
      ponNumber: 'BO-PO-2026-001',
      dateAdded: '1 October 2026',
      source: 'back-office',
      sourceName: 'Example case officer',
      notes: ''
    });
  }

  store.purchaseOrderExamplesSeeded = true;
  return purchaseOrders.map((purchaseOrder, index) => ({ ...purchaseOrder, index })).reverse();
}

router.get(['/pon', '/pon.html'], (req, res) => {
  const editIndex = parsePurchaseOrderIndex(req.query.edit);
  const existing = editIndex === null ? {} : getPurchaseOrders(req)[editIndex] || {};

  res.render('projects/back-office/manage/overview/v2/pon', {
    planStage: existing.stage || '',
    editIndex: editIndex === null ? '' : editIndex,
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: editIndex !== null
  });
});

router.post('/pon', (req, res) => {
  const stage = req.body['plan-stage'];
  if (!purchaseOrderStageLabels[stage]) {
    return res.redirect(`${req.baseUrl}/pon?edit=${req.body.editIndex || ''}`);
  }

  const editIndex = parsePurchaseOrderIndex(req.body.editIndex);
  const existing = editIndex === null ? {} : getPurchaseOrders(req)[editIndex] || {};
  getPurchaseOrderStore(req).purchaseOrderDraft = {
    stage,
    ponNumber: existing.ponNumber || '',
    dateAdded: existing.dateAdded || '',
    notes: existing.notes || '',
    editIndex,
    returnUrl: req.body.returnUrl || overviewIndexUrl
  };
  req.session.save(() => res.redirect(`${req.baseUrl}/pon-number`));
});

router.get(['/pon-number', '/pon-number.html'], (req, res) => {
  const draft = getPurchaseOrderDraft(req);
  if (!draft) return res.redirect(`${req.baseUrl}/pon`);

  res.render('projects/back-office/manage/overview/v2/pon-number', {
    ponNumber: draft.ponNumber || '',
    editIndex: draft.editIndex === null ? '' : draft.editIndex,
    returnUrl: draft.returnUrl || overviewIndexUrl,
    isEdit: draft.editIndex !== null
  });
});

router.post('/pon-number', (req, res) => {
  const draft = getPurchaseOrderDraft(req);
  if (!draft) return res.redirect(`${req.baseUrl}/pon`);

  const ponNumber = (req.body['pon-number'] || '').trim();
  if (ponNumber && (!draft.dateAdded || ponNumber !== draft.ponNumber)) {
    draft.dateAdded = DateTime.now().toFormat('d MMMM yyyy');
  }
  draft.ponNumber = ponNumber;
  req.session.save(() => res.redirect(`${req.baseUrl}/pon-note`));
});

router.get(['/pon-note', '/pon-note.html'], (req, res) => {
  if (['front-office', 'back-office'].includes(req.query.source)) {
    const purchaseOrderIndex = parsePurchaseOrderIndex(req.query.index);
    const purchaseOrder = purchaseOrderIndex === null ? null : getPurchaseOrders(req)[purchaseOrderIndex];
    if (!purchaseOrder || purchaseOrder.source !== req.query.source) {
      return res.redirect(`${req.baseUrl}/index`);
    }

    return res.render('projects/back-office/manage/overview/v2/pon-note', {
      notes: purchaseOrder.notes || '',
      returnUrl: req.query.returnUrl || overviewIndexUrl,
      isEdit: Boolean(purchaseOrder.notes),
      purchaseOrderNoteMode: true,
      noteSource: purchaseOrder.source,
      purchaseOrderIndex
    });
  }

  const draft = getPurchaseOrderDraft(req);
  if (!draft) return res.redirect(`${req.baseUrl}/pon`);

  res.render('projects/back-office/manage/overview/v2/pon-note', {
    notes: draft.notes || '',
    editIndex: draft.editIndex === null ? '' : draft.editIndex,
    returnUrl: draft.returnUrl || overviewIndexUrl,
    isEdit: draft.editIndex !== null
  });
});

router.post('/pon-note', (req, res) => {
  if (['front-office', 'back-office'].includes(req.body.source)) {
    const purchaseOrderIndex = parsePurchaseOrderIndex(req.body.purchaseOrderIndex);
    const purchaseOrder = purchaseOrderIndex === null ? null : getPurchaseOrders(req)[purchaseOrderIndex];
    if (!purchaseOrder || purchaseOrder.source !== req.body.source) {
      return res.redirect(`${req.baseUrl}/index`);
    }

    purchaseOrder.notes = (req.body.notes || '').trim();
    return req.session.save(() => res.redirect(req.body.returnUrl || overviewIndexUrl));
  }

  const store = getPurchaseOrderStore(req);
  const draft = store.purchaseOrderDraft;
  if (!draft) return res.redirect(`${req.baseUrl}/pon`);

  const purchaseOrder = {
    stage: draft.stage,
    stageLabel: purchaseOrderStageLabels[draft.stage],
    ponNumber: draft.ponNumber,
    dateAdded: draft.dateAdded,
    source: 'back-office',
    sourceName: req.session.caseOfficer || 'Case officer',
    notes: (req.body.notes || '').trim()
  };
  const purchaseOrders = getPurchaseOrders(req);
  if (draft.editIndex !== null && purchaseOrders[draft.editIndex]) {
    purchaseOrders[draft.editIndex] = purchaseOrder;
  } else {
    purchaseOrders.push(purchaseOrder);
  }

  const returnUrl = draft.returnUrl || overviewIndexUrl;
  delete store.purchaseOrderDraft;
  req.session.save(() => res.redirect(returnUrl));
});

router.get(['/purchase-orders', '/purchase-orders.html'], (req, res) => {
  res.render('projects/back-office/manage/overview/v2/purchase-orders', {
    purchaseOrders: getPurchaseOrdersForDisplay(req),
    returnUrl: req.query.returnUrl || overviewIndexUrl
  });
});

router.get('/purchase-orders/remove', (req, res) => {
  const index = parsePurchaseOrderIndex(req.query.index);
  const purchaseOrder = index === null ? null : getPurchaseOrders(req)[index];
  if (!purchaseOrder) return res.redirect(req.query.returnUrl || overviewIndexUrl);

  res.render('projects/back-office/manage/overview/v2/pon-remove-confirm', {
    purchaseOrder,
    purchaseOrderIndex: index,
    returnUrl: req.query.returnUrl || overviewIndexUrl
  });
});

router.post('/purchase-orders/remove', (req, res) => {
  const index = parsePurchaseOrderIndex(req.body.purchaseOrderIndex);
  const purchaseOrders = getPurchaseOrders(req);
  if (index !== null && purchaseOrders[index]) purchaseOrders.splice(index, 1);

  req.session.save(() => res.redirect(req.body.returnUrl || overviewIndexUrl));
});

router.get(['/plan-title', '/plan-title.html'], (req, res) => {
  res.render('projects/back-office/manage/overview/v2/plan-title', {
    planTitle: req.session.planTitle || '',
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true
  });
});

router.get(['/plan-type', '/plan-type.html'], (req, res) => {
  res.render('projects/back-office/manage/overview/v2/plan-type', {
    planType: req.session.planType || '',
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true,
    textHtml: ''
  });
});

router.get(['/plan-band', '/plan-band.html'], (req, res) => {
  res.render('projects/back-office/manage/overview/v2/plan-band', {
    planBand: req.session.planBand || '',
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true
  });
});

router.get(['/select-LPA', '/select-LPA.html'], (req, res) => {
  const requestedIndex = Number.parseInt(req.query.index, 10);
  const index = Number.isInteger(requestedIndex) && requestedIndex >= 0 ? requestedIndex : 0;
  const lpas = Array.isArray(req.session.lpas) ? req.session.lpas : [];

  res.render('projects/back-office/manage/overview/v2/select-LPA', {
    selectedLPA: lpas[index] || req.session.lpaName || '',
    lpaList,
    index,
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true
  });
});

router.get(['/case-officer-name', '/case-officer-name.html'], (req, res) => {
  res.render('projects/back-office/manage/overview/v2/case-officer-name', {
    caseOfficer: req.session.caseOfficer || '',
    caseOfficers,
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true
  });
});

router.get(['/main-contact', '/main-contact.html'], (req, res) => {
  res.render('projects/back-office/manage/overview/v2/main-contact', {
    mainContact: req.session.mainContact || {},
    lpaName: req.session.lpaName || '',
    lpas: req.session.lpas || [],
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true
  });
});

router.get(['/additional-contact', '/additional-contact.html'], (req, res) => {
  const requestedIndex = Number.parseInt(req.query.index, 10);
  const index = Number.isInteger(requestedIndex) && requestedIndex >= 0 ? requestedIndex : 0;
  if (!Array.isArray(req.session.contacts)) req.session.contacts = [];
  while (req.session.contacts.length <= index) req.session.contacts.push({});

  res.render('projects/back-office/manage/overview/v2/additional-contact', {
    contact: req.session.contacts[index],
    contactIndex: index,
    editIndex: index,
    fromCheckAnswers: false,
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: true
  });
});

router.get(['/protocol', '/protocol.html'], (req, res) => {
  const recordIndex = parseProtocolRecordIndex(req.query.recordIndex);
  const record = recordIndex === null ? null : getProtocolRecords(req)[recordIndex];
  if (recordIndex !== null && !record) return res.redirect(overviewIndexUrl);

  res.render('projects/back-office/manage/overview/v2/protocol', {
    protocolType: record?.type || '',
    recordIndex: record ? recordIndex : '',
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: Boolean(record)
  });
});

router.get('/set-protocol-state', (req, res) => {
  const protocolState = req.query.state;

  if (protocolState === 'none') {
    req.session.protocolRecords = [];
  } else if (protocolState === 'sent') {
    req.session.protocolRecords = [{ type: 'report', sentDate: '1/10/2026', receivedDate: '' }];
  } else if (protocolState === 'received') {
    req.session.protocolRecords = [{ type: 'report', sentDate: '1/10/2026', receivedDate: '6/10/2026' }];
  } else {
    return res.redirect(overviewIndexUrl);
  }
  delete req.session.protocolDraft;

  req.session.save(() => res.redirect(overviewIndexUrl));
});

router.get('/protocol/remove', (req, res) => {
  const recordIndex = parseProtocolRecordIndex(req.query.recordIndex);
  const record = recordIndex === null ? null : getProtocolRecords(req)[recordIndex];
  if (!record) return res.redirect(req.query.returnUrl || overviewIndexUrl);

  res.render('projects/back-office/manage/overview/v2/protocol-remove-confirm', {
    protocol: {
      ...record,
      type: record.type ? record.type[0].toUpperCase() + record.type.slice(1) : '',
      sentDateDisplay: formatDateForDisplay(record.sentDate) || 'Not provided',
      receivedDateDisplay: formatDateForDisplay(record.receivedDate) || 'Not provided'
    },
    protocolNumber: recordIndex + 1,
    recordIndex,
    returnUrl: req.query.returnUrl || overviewIndexUrl
  });
});

router.post('/protocol/remove', (req, res) => {
  const recordIndex = parseProtocolRecordIndex(req.body.recordIndex);
  const records = getProtocolRecords(req);
  if (recordIndex === null || !records[recordIndex]) {
    return res.redirect(req.body.returnUrl || overviewIndexUrl);
  }

  records.splice(recordIndex, 1);
  if (req.session.protocolDraft?.recordIndex === recordIndex) delete req.session.protocolDraft;
  req.session.protocolSuccessMessage = `Protocol ${recordIndex + 1} removed`;
  req.session.save(() => res.redirect(req.body.returnUrl || overviewIndexUrl));
});

router.post('/protocol', (req, res) => {
  const protocolType = req.body['protocol-type'];
  if (!['report', 'letter'].includes(protocolType)) {
    return res.redirect(`${req.baseUrl}/protocol?returnUrl=${encodeURIComponent(req.body.returnUrl || overviewIndexUrl)}`);
  }

  const records = getProtocolRecords(req);
  const requestedIndex = parseProtocolRecordIndex(req.body.recordIndex);
  const record = requestedIndex === null ? null : records[requestedIndex];
  if (req.body.recordIndex && !record) return res.redirect(overviewIndexUrl);

  const returnUrl = req.body.returnUrl || overviewIndexUrl;
  const query = new URLSearchParams({ returnUrl });
  req.session.protocolDraft = {
    type: protocolType,
    sentDate: record?.sentDate || '',
    receivedDate: record?.receivedDate || '',
    recordIndex: record ? requestedIndex : null,
    returnUrl
  };
  if (record) query.set('recordIndex', String(requestedIndex));
  req.session.save(() => res.redirect(`${req.baseUrl}/protocol-sent?${query.toString()}`));
});

router.get(['/protocol-sent', '/protocol-sent.html'], (req, res) => {
  const requestedIndex = parseProtocolRecordIndex(req.query.recordIndex);
  let draft = req.session.protocolDraft;
  if (requestedIndex !== null) {
    const record = getProtocolRecords(req)[requestedIndex];
    if (!record) return res.redirect(overviewIndexUrl);
    if (!draft || draft.recordIndex !== requestedIndex) {
      draft = {
        type: record.type,
        sentDate: record.sentDate,
        receivedDate: record.receivedDate,
        recordIndex: requestedIndex,
        returnUrl: req.query.returnUrl || overviewIndexUrl
      };
      req.session.protocolDraft = draft;
    }
  }
  if (!draft) return res.redirect(`${req.baseUrl}/protocol`);

  res.render('projects/back-office/manage/overview/v2/protocol-sent', {
    protocolSentDateValues: getProtocolDateInputValues(draft.sentDate),
    recordIndex: draft.recordIndex === null ? '' : draft.recordIndex,
    returnUrl: draft.returnUrl || req.query.returnUrl || overviewIndexUrl,
    isEdit: draft.recordIndex !== null
  });
});

router.post('/protocol-sent', (req, res) => {
  const draft = req.session.protocolDraft;
  if (!draft) return res.redirect(`${req.baseUrl}/protocol`);

  const records = getProtocolRecords(req);
  const isEdit = draft.recordIndex !== null && records[draft.recordIndex];
  const record = {
    type: draft.type,
    sentDate: getProtocolDateFromRequest(req, 'protocol-sent-date'),
    receivedDate: draft.receivedDate || ''
  };
  if (isEdit) records[draft.recordIndex] = record;
  else records.push(record);

  delete req.session.protocolDraft;
  req.session.protocolSuccessMessage = isEdit
    ? 'Protocol details updated'
    : 'Protocol details added';
  req.session.save(() => res.redirect(req.body.returnUrl || draft.returnUrl || overviewIndexUrl));
});

router.get(['/protocol-received', '/protocol-received.html'], (req, res) => {
  const recordIndex = parseProtocolRecordIndex(req.query.recordIndex);
  const record = recordIndex === null ? null : getProtocolRecords(req)[recordIndex];
  if (!record) return res.redirect(overviewIndexUrl);

  res.render('projects/back-office/manage/overview/v2/protocol-received', {
    protocolReceivedDateValues: getProtocolDateInputValues(record.receivedDate),
    recordIndex,
    returnUrl: req.query.returnUrl || overviewIndexUrl,
    isEdit: Boolean(record.receivedDate)
  });
});

router.post('/protocol-received', (req, res) => {
  const recordIndex = parseProtocolRecordIndex(req.body.recordIndex);
  const records = getProtocolRecords(req);
  const record = recordIndex === null ? null : records[recordIndex];
  if (!record) return res.redirect(overviewIndexUrl);

  const isEdit = Boolean(record.receivedDate);
  record.receivedDate = getProtocolDateFromRequest(req, 'protocol-received-date');
  req.session.protocolSuccessMessage = isEdit
    ? 'Protocol received date updated'
    : 'Protocol received date added';
  req.session.save(() => res.redirect(req.body.returnUrl || overviewIndexUrl));
});

// GET v2 index
router.get(['/index', '/index.html'], function (req, res) {
  const protocolSuccessMessage = req.session.protocolSuccessMessage || '';
  delete req.session.protocolSuccessMessage;

  res.render('projects/back-office/manage/overview/v2/index', {
    ...buildOverviewContext(req),
    purchaseOrders: getPurchaseOrdersForDisplay(req),
    protocolSuccessMessage
  });
});

// POST add case note
router.post('/index', function (req, res) {
  const comment = (req.body.comment || '').trim();
  const returnTo = req.body.returnTo || '/projects/back-office/manage/overview/v2/index';
  if (!comment) return res.redirect(returnTo);

  const userName = req.session.caseOfficer || 'Case officer';
  const newNote = buildCaseNote(new Date(), comment, userName);

  const caseRef = req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  const matchedCase = caseRef ? cases.find(item => item.caseRef === caseRef) : null;

  if (matchedCase) {
    if (!Array.isArray(matchedCase.caseNotes)) matchedCase.caseNotes = [];
    matchedCase.caseNotes.unshift(newNote);
  } else {
    if (!Array.isArray(req.session.caseNotes)) req.session.caseNotes = [];
    req.session.caseNotes.unshift(newNote);
  }

  req.session.save(() => res.redirect(returnTo));
});

router.get('/index-side', function (req, res) {
  res.render('projects/back-office/manage/overview/v2/index-side', buildOverviewContext(req));
});

router.post('/index-side', function (req, res) {
  const comment = (req.body.comment || '').trim();
  const returnTo = req.body.returnTo || '/projects/back-office/manage/overview/v2/index-side';
  if (!comment) return res.redirect(returnTo);

  const userName = req.session.caseOfficer || 'Case officer';
  const newNote = buildCaseNote(new Date(), comment, userName);

  const caseRef = req.session.currentCaseRef || '';
  const cases = Array.isArray(req.session.cases) ? req.session.cases : [];
  const matchedCase = caseRef ? cases.find(item => item.caseRef === caseRef) : null;

  if (matchedCase) {
    if (!Array.isArray(matchedCase.caseNotes)) matchedCase.caseNotes = [];
    matchedCase.caseNotes.unshift(newNote);
  } else {
    if (!Array.isArray(req.session.caseNotes)) req.session.caseNotes = [];
    req.session.caseNotes.unshift(newNote);
  }

  req.session.save(() => res.redirect(returnTo));
});

// GET all case notes
router.get('/all-case-notes', function (req, res) {
  const currentCase = getCurrentCase(req, req.query.ref);
  res.render('projects/back-office/manage/overview/v2/case-notes', { currentCase });
});

// Backward-compatible route used by v2 overview links
router.get('/case-notes', function (req, res) {
  const currentCase = getCurrentCase(req, req.query.ref);
  res.render('projects/back-office/manage/overview/v2/case-notes', { currentCase });
});

module.exports = router;
