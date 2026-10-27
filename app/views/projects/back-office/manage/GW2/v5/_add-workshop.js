const express = require('express');
const router = express.Router();
const { DateTime } = require("luxon")

function getAddWorkshopView(req, page) {
  const baseViewPath = (req.baseUrl || '').replace(/^\//, '');
  return `${baseViewPath}/add-workshop/${page}`;
}

function getWorkshopCaseRef(req) {
  return req.session?.data?.currentCaseRef || req.session?.currentCaseRef || '';
}

function getWorkshopDateError(day, month, year, label) {
  const values = [day, month, year].map((value) => String(value || '').trim());
  if (values.every((value) => !value)) return `Enter a ${label}`;
  if (values.some((value) => !value)) return `Enter a complete ${label}`;
  if (!/^\d{1,2}$/.test(values[0]) || !/^\d{1,2}$/.test(values[1]) || !/^\d{4}$/.test(values[2])) {
    return `Enter a valid ${label}`;
  }

  const date = DateTime.fromObject({ day: Number(values[0]), month: Number(values[1]), year: Number(values[2]) });
  return date.isValid && date.day === Number(values[0]) && date.month === Number(values[1]) && date.year === Number(values[2])
    ? ''
    : `Enter a valid ${label}`;
}

function getWorkshopTimeError(hour, minute, label, optional = false) {
  const hourValue = String(hour || '').trim();
  const minuteValue = String(minute || '').trim();
  if (optional && !hourValue && !minuteValue) return '';
  if (!hourValue && !minuteValue) return `Enter a ${label}`;
  if (!hourValue || !minuteValue) return `Enter a complete ${label}`;
  if (!/^\d{1,2}$/.test(hourValue) || !/^\d{1,2}$/.test(minuteValue)) return `Enter a valid ${label}`;

  const hourNumber = Number(hourValue);
  const minuteNumber = Number(minuteValue);
  return hourNumber <= 23 && minuteNumber <= 59 ? '' : `Enter a valid ${label}`;
}

function getWorkshopChoiceError(value, label, choices) {
  return choices.includes(String(value || '').trim()) ? '' : `Select ${label}`;
}

function getWorkshopPositiveNumberError(value, label) {
  const number = Number(String(value || '').trim());
  return Number.isFinite(number) && number > 0 ? '' : `Enter a ${label} greater than 0`;
}

function getWorkshopUrlError(value) {
  const urlValue = String(value || '').trim();
  if (!urlValue) return 'Enter a remote meeting link';

  try {
    const url = new URL(urlValue);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.')
      ? ''
      : 'Enter a valid remote meeting link';
  } catch (error) {
    return 'Enter a valid remote meeting link';
  }
}

function renderWorkshopStepWithErrors(req, res, page, fieldErrors) {
  const errorTargets = {
    date: 'hearing-date-day',
    time: 'hearing-time-hour',
    endTime: 'hearing-end-time-hour',
    hasEstimates: 'hasEstimates',
    estimatedDays: 'hearing-estimation-days',
    isVirtual: 'hearing-virtual-no',
    hasVirtualMeetingLink: 'hearing-virtual-meeting-link-yes',
    virtualMeetingLink: 'virtual-meeting-link',
    hasAddress: 'hearing-address-yes',
    venue: 'hearing-venue',
    addressLine1: 'hearing-address-line1',
    addressTown: 'hearing-address-town',
    addressPostcode: 'hearing-address-postcode'
  };
  const errorList = Object.entries(fieldErrors)
    .filter(([, message]) => message)
    .map(([field, text]) => ({ text, href: `#${errorTargets[field] || field}` }));

  return res.status(400).render(getAddWorkshopView(req, page), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data?.planTitle || req.session.planTitle || '',
    addWorkshop: req.session.data?.addWorkshop || {},
    isEditing: getEditingWorkshopIndex(req) !== null,
    fieldErrors,
    errorList
  });
}

function getWorkshopSubmissionError(addWorkshop = {}) {
  const date = addWorkshop.date || {};
  const time = addWorkshop.time || {};
  const endTime = addWorkshop.endTime || {};
  let fieldErrors = {
    date: getWorkshopDateError(date.day, date.month, date.year, 'workshop date'),
    time: getWorkshopTimeError(time.hour, time.minute, 'start time'),
    endTime: getWorkshopTimeError(endTime.hour, endTime.minute, 'end time', true)
  };
  if (Object.values(fieldErrors).some(Boolean)) return { page: 'index', fieldErrors };

  fieldErrors = {
    hasEstimates: getWorkshopChoiceError(addWorkshop.hasEstimates, 'an answer', ['Yes', 'No']),
    estimatedDays: addWorkshop.hasEstimates === 'Yes'
      ? getWorkshopPositiveNumberError(addWorkshop.estimatedDays, 'number of days')
      : ''
  };
  if (Object.values(fieldErrors).some(Boolean)) return { page: 'has-estimates', fieldErrors };

  fieldErrors = {
    isVirtual: getWorkshopChoiceError(addWorkshop.isVirtual, 'a workshop format', ['In-person', 'Hybrid', 'Virtual'])
  };
  if (Object.values(fieldErrors).some(Boolean)) return { page: 'is-virtual', fieldErrors };

  if (addWorkshop.isVirtual === 'Virtual' || addWorkshop.isVirtual === 'Hybrid') {
    fieldErrors = {
      hasVirtualMeetingLink: getWorkshopChoiceError(addWorkshop.hasVirtualMeetingLink, 'an answer', ['Yes', 'No'])
    };
    if (Object.values(fieldErrors).some(Boolean)) return { page: 'has-virtual-meeting-link', fieldErrors };
    if (addWorkshop.hasVirtualMeetingLink === 'Yes') {
      fieldErrors = { virtualMeetingLink: getWorkshopUrlError(addWorkshop.virtualMeetingLink) };
      if (Object.values(fieldErrors).some(Boolean)) return { page: 'virtual-meeting', fieldErrors };
    }
  }

  if (addWorkshop.isVirtual === 'In-person' || addWorkshop.isVirtual === 'Hybrid') {
    fieldErrors = {
      hasAddress: getWorkshopChoiceError(addWorkshop.hasAddress, 'an answer', ['Yes', 'No'])
    };
    if (Object.values(fieldErrors).some(Boolean)) return { page: 'has-address', fieldErrors };
    if (addWorkshop.hasAddress === 'Yes') {
      fieldErrors = {
        venue: addWorkshop.venue ? '' : 'Enter the venue name',
        addressLine1: addWorkshop.address?.line1 ? '' : 'Enter address line 1',
        addressTown: addWorkshop.address?.town ? '' : 'Enter a town or city',
        addressPostcode: addWorkshop.address?.postcode ? '' : 'Enter a postcode'
      };
      if (Object.values(fieldErrors).some(Boolean)) return { page: 'address', fieldErrors };
    }
  }

  return null;
}

function getEditingWorkshopIndex(req) {
  const rawIndex = req.session?.data?.editWorkshopIndex;
  const hearingIndex = Number.parseInt(rawIndex, 10);

  if (!Number.isInteger(hearingIndex) || hearingIndex < 0) {
    return null;
  }

  if (!Array.isArray(req.session.hearings) || hearingIndex >= req.session.hearings.length) {
    return null;
  }

  return hearingIndex;
}

function hydrateAddWorkshopFromRecord(hearingRecord) {
  const parsedDate = DateTime.fromFormat(hearingRecord?.startDate || '', 'd MMMM yyyy');
  const parsedEndDate = DateTime.fromFormat(hearingRecord?.endDate || '', 'd MMMM yyyy');
  const date = parsedDate.isValid
    ? {
        day: parsedDate.day.toString(),
        month: parsedDate.month.toString(),
        year: parsedDate.year.toString()
      }
    : { day: '', month: '', year: '' };
  const endDate = parsedEndDate.isValid
    ? {
        day: parsedEndDate.day.toString(),
        month: parsedEndDate.month.toString(),
        year: parsedEndDate.year.toString()
      }
    : { day: '', month: '', year: '' };
  const timeParts = (hearingRecord?.time || '').split(':');
  const endTimeParts = (hearingRecord?.endTime || '').split(':');

  return {
    date,
    time: {
      hour: timeParts[0] || '',
      minute: timeParts[1] || ''
    },
    endTime: {
      hour: endTimeParts[0] || '',
      minute: endTimeParts[1] || ''
    },
    estimatedDays: hearingRecord?.estimatedDays || '',
    actualDuration: hearingRecord?.actualDuration || '',
    endDate,
    isVirtual: hearingRecord?.isVirtual || '',
    hasVirtualMeetingLink: hearingRecord?.hasVirtualMeetingLink || 'No',
    virtualMeetingLink: hearingRecord?.virtualMeetingLink || '',
    hasEstimates: hearingRecord?.estimatedDays ? 'Yes' : 'No',
    hasAddress: hearingRecord?.hasAddress || 'No',
    venue: hearingRecord?.venue || '',
    address: hearingRecord?.address || {}
  };
}

function ensureEditingWorkshopData(req) {
  const editingHearingIndex = getEditingWorkshopIndex(req);
  if (editingHearingIndex !== null && !req.session.data.addWorkshop) {
    req.session.data.addWorkshop = hydrateAddWorkshopFromRecord(req.session.hearings[editingHearingIndex]);
  }
  return editingHearingIndex;
}

function clearWorkingWorkshopData(sessionData) {
  delete sessionData.addWorkshop;
  delete sessionData['hearing-date-day'];
  delete sessionData['hearing-date-month'];
  delete sessionData['hearing-date-year'];
  delete sessionData['hearing-time-hour'];
  delete sessionData['hearing-time-minute'];
  delete sessionData['hearing-end-time-hour'];
  delete sessionData['hearing-end-time-minute'];
  delete sessionData.hearingEstimationDays;
  delete sessionData.actualDuration;
  delete sessionData['hearing-end-date-day'];
  delete sessionData['hearing-end-date-month'];
  delete sessionData['hearing-end-date-year'];
  delete sessionData.hasEstimates;
  delete sessionData.isVirtual;
  delete sessionData.hasVirtualMeetingLink;
  delete sessionData.virtualMeetingLink;
  delete sessionData.hasAddress;
  delete sessionData['hearing-venue'];
  delete sessionData['hearing-address-line1'];
  delete sessionData['hearing-address-line2'];
  delete sessionData['hearing-address-town'];
  delete sessionData['hearing-address-postcode'];
}

function syncLatestHearingFields(session) {
  const hearings = Array.isArray(session.hearings) ? session.hearings : [];
  const latestHearing = hearings.length ? hearings[hearings.length - 1] : null;

  if (!latestHearing) {
    delete session.hearingStartDate;
    delete session.hearingTime;
    delete session.hearingEndTime;
    delete session.hearingEstimatedDays;
    delete session.hearingIsVirtual;
    delete session.hearingHasVirtualMeetingLink;
    delete session.hearingVirtualMeetingLink;
    delete session.hearingVenue;
    delete session.hearingAddress;
    delete session.hearingHasAddress;
    return;
  }

  session.hearingStartDate = latestHearing.startDate || '';
  session.hearingTime = latestHearing.time || '';
  session.hearingEndTime = latestHearing.endTime || '';
  session.hearingEstimatedDays = latestHearing.estimatedDays || '';
  session.hearingActualDuration = latestHearing.actualDuration || '';
  session.hearingEndDate = latestHearing.endDate || '';
  session.hearingIsVirtual = latestHearing.isVirtual || '';
  session.hearingHasVirtualMeetingLink = latestHearing.hasVirtualMeetingLink || 'No';
  session.hearingVirtualMeetingLink = latestHearing.virtualMeetingLink || '';
  session.hearingVenue = latestHearing.venue || '-';
  session.hearingAddress = latestHearing.address || {};
  session.hearingHasAddress = latestHearing.hasAddress || 'No';
}

console.log('✓ add-workshop.js module loaded');

// Redirect /add-workshop to /add-workshop/index
router.get('/add-workshop', function (req, res) {
  const requestedEditIndex = Number.parseInt(req.query.edit, 10);
  const requestedStep = (req.query.step || 'index').toString();
  const allowedSteps = [
    'index',
    'has-estimates',
    'is-virtual',
    'has-virtual-meeting-link',
    'virtual-meeting',
    'has-address',
    'address',
    'actual-duration',
    'end-date'
  ];
  const targetStep = allowedSteps.includes(requestedStep) ? requestedStep : 'index';

  if (Number.isInteger(requestedEditIndex) && requestedEditIndex >= 0) {
    req.session.data.editWorkshopIndex = String(requestedEditIndex);
  } else {
    delete req.session.data.editWorkshopIndex;
  }

  clearWorkingWorkshopData(req.session.data);
  res.redirect(`${req.baseUrl}/add-workshop/${targetStep}`);
});

// Cancel route - clears form data only, preserves saved hearing
router.get('/add-workshop/cancel', function (req, res) {
  console.log('Cancel workshop flow - clearing session form data (keeping saved hearing)');
  clearWorkingWorkshopData(req.session.data);
  delete req.session.data.editWorkshopIndex;
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/gateway-2`);
  });
});

router.get('/add-workshop/index', function (req, res) {
  console.log('GET /add-workshop/index');
  console.log('Full session.data:', JSON.stringify(req.session.data, null, 2));
  console.log('hearing-date-day:', req.session.data['hearing-date-day']);
  console.log('hearing-date-month:', req.session.data['hearing-date-month']);
  console.log('hearing-date-year:', req.session.data['hearing-date-year']);
  
  // Rebuild addWorkshop object from form field data if it exists
  if (req.session.data['hearing-date-day'] || req.session.data['hearing-date-month'] || req.session.data['hearing-date-year']) {
    console.log('Rebuilding addWorkshop from form fields...');
    req.session.data.addWorkshop = {
      date: {
        day: req.session.data['hearing-date-day'] || '',
        month: req.session.data['hearing-date-month'] || '',
        year: req.session.data['hearing-date-year'] || ''
      },
      time: {
        hour: req.session.data['hearing-time-hour'] || '',
        minute: req.session.data['hearing-time-minute'] || ''
      },
      endTime: {
        hour: req.session.data['hearing-end-time-hour'] || '',
        minute: req.session.data['hearing-end-time-minute'] || ''
      },
      estimatedDays: req.session.data.hearingEstimationDays || '',
      hasEstimates: req.session.data.hasEstimates || '',
      isVirtual: req.session.data.isVirtual || '',
      hasVirtualMeetingLink: req.session.data.hasVirtualMeetingLink || '',
      virtualMeetingLink: req.session.data.virtualMeetingLink || '',
      hasAddress: req.session.data.hasAddress || '',
      venue: req.session.data['hearing-venue'] || '',
      address: {
        line1: req.session.data['hearing-address-line1'] || '',
        line2: req.session.data['hearing-address-line2'] || '',
        town: req.session.data['hearing-address-town'] || '',
        postcode: req.session.data['hearing-address-postcode'] || ''
      }
    }
    console.log('Rebuilt addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  } else {
    console.log('No form field data found');
  }
  
  // Check if editing existing hearing or adding new
  const editingHearingIndex = ensureEditingWorkshopData(req);
  const hearingData = req.session.data.addWorkshop || {}
  console.log('hearingData being passed to template:', JSON.stringify(hearingData, null, 2));
  
  res.render(getAddWorkshopView(req, 'index'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: editingHearingIndex !== null
  })
})

router.get('/add-workshop/actual-duration', function (req, res) {
  const requestedEditIndex = Number.parseInt(req.query.edit, 10);
  if (Number.isInteger(requestedEditIndex) && requestedEditIndex >= 0) {
    req.session.data.editWorkshopIndex = String(requestedEditIndex);
  }

  const editingHearingIndex = ensureEditingWorkshopData(req);

  const hearingData = req.session.data.addWorkshop || {};

  res.render(getAddWorkshopView(req, 'actual-duration'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: editingHearingIndex !== null
  });
});

router.post('/add-workshop/actual-duration', function (req, res) {
  const editingHearingIndex = getEditingWorkshopIndex(req);

  if (editingHearingIndex === null) {
    return res.redirect(`${req.baseUrl}/add-workshop/check`);
  }

  if (!Array.isArray(req.session.hearings) || !req.session.hearings[editingHearingIndex]) {
    return res.redirect(`${req.baseUrl}/gateway-2`);
  }

  req.session.hearings[editingHearingIndex].actualDuration = req.session.data.actualDuration || '';
  syncLatestHearingFields(req.session);
  clearWorkingWorkshopData(req.session.data);
  delete req.session.data.editWorkshopIndex;
  req.session.notificationMessage = 'Workshop set up';

  req.session.save(() => {
    res.redirect(`${req.baseUrl}/gateway-2`);
  });
});

router.get('/add-workshop/end-date', function (req, res) {
  const requestedEditIndex = Number.parseInt(req.query.edit, 10);
  if (Number.isInteger(requestedEditIndex) && requestedEditIndex >= 0) {
    req.session.data.editWorkshopIndex = String(requestedEditIndex);
  }

  const editingHearingIndex = ensureEditingWorkshopData(req);

  const hearingData = req.session.data.addWorkshop || {};

  res.render(getAddWorkshopView(req, 'end-date'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: editingHearingIndex !== null
  });
});

router.post('/add-workshop/end-date', function (req, res) {
  const editingHearingIndex = getEditingWorkshopIndex(req);

  if (editingHearingIndex === null) {
    return res.redirect(`${req.baseUrl}/add-workshop/check`);
  }

  if (!Array.isArray(req.session.hearings) || !req.session.hearings[editingHearingIndex]) {
    return res.redirect(`${req.baseUrl}/gateway-2`);
  }

  const day = req.session.data['hearing-end-date-day'];
  const month = req.session.data['hearing-end-date-month'];
  const year = req.session.data['hearing-end-date-year'];
  let endDateValue = '';

  if (day && month && year) {
    const parsedEndDate = DateTime.fromObject({
      day: parseInt(day, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10)
    });

    if (parsedEndDate.isValid) {
      endDateValue = parsedEndDate.toFormat('d MMMM yyyy');
    }
  }

  req.session.hearings[editingHearingIndex].endDate = endDateValue;
  syncLatestHearingFields(req.session);
  clearWorkingWorkshopData(req.session.data);
  delete req.session.data.editWorkshopIndex;
  req.session.notificationMessage = 'Workshop set up';

  req.session.save(() => {
    res.redirect(`${req.baseUrl}/gateway-2`);
  });
});

router.post('/add-workshop/index', function (req, res) {
  console.log('POST /add-workshop/index received');
  console.log('Form data:', req.session.data);
  
  // Preserve existing hearing data and only update date/time
  if (!req.session.data.addWorkshop) {
    req.session.data.addWorkshop = {}
  }
  
  req.session.data.addWorkshop.date = {
    day: req.session.data['hearing-date-day'],
    month: req.session.data['hearing-date-month'],
    year: req.session.data['hearing-date-year']
  }
  req.session.data.addWorkshop.time = {
    hour: req.session.data['hearing-time-hour'],
    minute: req.session.data['hearing-time-minute']
  }
  req.session.data.addWorkshop.endTime = {
    hour: req.session.data['hearing-end-time-hour'],
    minute: req.session.data['hearing-end-time-minute']
  }

  const fieldErrors = {
    date: getWorkshopDateError(
      req.session.data['hearing-date-day'],
      req.session.data['hearing-date-month'],
      req.session.data['hearing-date-year'],
      'workshop date'
    ),
    time: getWorkshopTimeError(
      req.session.data['hearing-time-hour'],
      req.session.data['hearing-time-minute'],
      'start time'
    ),
    endTime: getWorkshopTimeError(
      req.session.data['hearing-end-time-hour'],
      req.session.data['hearing-end-time-minute'],
      'end time',
      true
    )
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'index', fieldErrors);
  }
  
  console.log('addWorkshop object updated:', req.session.data.addWorkshop);
  
  req.session.save(() => {
    console.log('Session saved, redirecting to has-estimates...');
    res.redirect(`${req.baseUrl}/add-workshop/has-estimates`)
  })
})

router.get('/add-workshop/has-estimates', function (req, res) {
  console.log('GET /has-estimates - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  console.log('GET /has-estimates - req.session.hearingStartDate:', req.session.hearingStartDate);
  console.log('GET /has-estimates - req.session.data:', JSON.stringify(req.session.data, null, 2));
  ensureEditingWorkshopData(req);
  
  // Always rebuild addWorkshop object from form field data to ensure current values
  if (req.session.data['hearing-date-day'] || req.session.data.hasEstimates) {
    console.log('Rebuilding addWorkshop from form fields...');
    if (!req.session.data.addWorkshop) {
      req.session.data.addWorkshop = {};
    }
    req.session.data.addWorkshop.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addWorkshop.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addWorkshop.endTime = {
      hour: req.session.data['hearing-end-time-hour'] || '',
      minute: req.session.data['hearing-end-time-minute'] || ''
    };
    req.session.data.addWorkshop.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addWorkshop.hasEstimates = req.session.data.hasEstimates || req.session.data.addWorkshop.hasEstimates || '';
    req.session.data.addWorkshop.isVirtual = req.session.data.isVirtual || req.session.data.addWorkshop.isVirtual || '';
    req.session.data.addWorkshop.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addWorkshop.hasVirtualMeetingLink || '';
    req.session.data.addWorkshop.virtualMeetingLink = req.session.data.virtualMeetingLink || req.session.data.addWorkshop.virtualMeetingLink || '';
    req.session.data.addWorkshop.hasAddress = req.session.data.hasAddress || req.session.data.addWorkshop.hasAddress || '';
    req.session.data.addWorkshop.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addWorkshop.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
    console.log('Rebuilt from form fields:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  }
  
  const hearingData = req.session.data.addWorkshop || {}
  console.log('Final hearingData being passed to template:', JSON.stringify(hearingData, null, 2));
  
  res.render(getAddWorkshopView(req, 'has-estimates'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/has-estimates', function (req, res) {
  console.log('POST /has-estimates - form data:', req.session.data);
  console.log('POST /has-estimates - addWorkshop before:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  
  if (!req.session.data.addWorkshop) req.session.data.addWorkshop = {}
  const hasEstimates = String(req.session.data.hasEstimates || '').trim();
  const estimatedDays = String(req.session.data.hearingEstimationDays || '').trim();
  req.session.data.addWorkshop.hasEstimates = hasEstimates;
  req.session.data.addWorkshop.estimatedDays = estimatedDays;

  const fieldErrors = {
    hasEstimates: getWorkshopChoiceError(hasEstimates, 'an answer', ['Yes', 'No']),
    estimatedDays: hasEstimates === 'Yes' ? getWorkshopPositiveNumberError(estimatedDays, 'number of days') : ''
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'has-estimates', fieldErrors);
  }
  
  console.log('POST /has-estimates - addWorkshop after:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/add-workshop/is-virtual`)
  })
})

router.get('/add-workshop/is-virtual', function (req, res) {
  console.log('GET /is-virtual - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  ensureEditingWorkshopData(req);
  
  const hearingData = req.session.data.addWorkshop || {}
  
  res.render(getAddWorkshopView(req, 'is-virtual'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/is-virtual', function (req, res) {
  console.log('POST /is-virtual - form data:', req.session.data);
  
  if (!req.session.data.addWorkshop) req.session.data.addWorkshop = {}
  const isVirtual = String(req.session.data.isVirtual || '').trim();
  req.session.data.addWorkshop.isVirtual = isVirtual;

  const fieldErrors = {
    isVirtual: getWorkshopChoiceError(isVirtual, 'a workshop format', ['In-person', 'Hybrid', 'Virtual'])
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'is-virtual', fieldErrors);
  }
  
  req.session.save(() => {
    if (req.session.data.addWorkshop.isVirtual === 'In-person') {
      res.redirect(`${req.baseUrl}/add-workshop/has-address`)
    } else if (req.session.data.addWorkshop.isVirtual === 'Hybrid') {
      res.redirect(`${req.baseUrl}/add-workshop/has-address`)
    } else {
      res.redirect(`${req.baseUrl}/add-workshop/has-virtual-meeting-link`)
    }
  })
})

router.get('/add-workshop/has-virtual-meeting-link', function (req, res) {
  console.log('GET /has-virtual-meeting-link - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  ensureEditingWorkshopData(req);
  
  const hearingData = req.session.data.addWorkshop || {}
  
  res.render(getAddWorkshopView(req, 'has-virtual-meeting-link'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/has-virtual-meeting-link', function (req, res) {
  console.log('POST /has-virtual-meeting-link - form data:', req.session.data);
  
  if (!req.session.data.addWorkshop) req.session.data.addWorkshop = {}
  req.session.data.addWorkshop.isVirtual = req.session.data.addWorkshop.isVirtual || req.session.data.isVirtual || ''
  const hasVirtualMeetingLink = String(req.session.data.hasVirtualMeetingLink || '').trim();
  req.session.data.addWorkshop.hasVirtualMeetingLink = hasVirtualMeetingLink;
  req.session.data.addWorkshop.virtualMeetingLink = String(req.session.data.virtualMeetingLink || '').trim();

  const fieldErrors = {
    hasVirtualMeetingLink: getWorkshopChoiceError(hasVirtualMeetingLink, 'an answer', ['Yes', 'No'])
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'has-virtual-meeting-link', fieldErrors);
  }
  
  req.session.save(() => {
    if (req.session.data.addWorkshop.hasVirtualMeetingLink === 'Yes') {
      res.redirect(`${req.baseUrl}/add-workshop/virtual-meeting`)
    } else {
      res.redirect(`${req.baseUrl}/add-workshop/check`)
    }
  })
})

router.get('/add-workshop/virtual-meeting', function (req, res) {
  console.log('GET /virtual-meeting - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  ensureEditingWorkshopData(req);
  
  const hearingData = req.session.data.addWorkshop || {}
  
  res.render(getAddWorkshopView(req, 'virtual-meeting'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/virtual-meeting', function (req, res) {
  console.log('POST /virtual-meeting - form data:', req.session.data);
  
  if (!req.session.data.addWorkshop) req.session.data.addWorkshop = {}
  const virtualMeetingLink = String(req.session.data.virtualMeetingLink || '').trim();
  req.session.data.addWorkshop.virtualMeetingLink = virtualMeetingLink;
  const fieldErrors = { virtualMeetingLink: getWorkshopUrlError(virtualMeetingLink) };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'virtual-meeting', fieldErrors);
  }
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/add-workshop/check`)
  })
})

router.get('/add-workshop/has-address', function (req, res) {
  console.log('GET /has-address - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  ensureEditingWorkshopData(req);
  
  // Always rebuild addWorkshop object from form field data to ensure current values
  if (req.session.data['hearing-date-day'] || req.session.data.hasAddress) {
    if (!req.session.data.addWorkshop) {
      req.session.data.addWorkshop = {};
    }
    req.session.data.addWorkshop.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addWorkshop.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addWorkshop.endTime = {
      hour: req.session.data['hearing-end-time-hour'] || '',
      minute: req.session.data['hearing-end-time-minute'] || ''
    };
    req.session.data.addWorkshop.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addWorkshop.hasEstimates = req.session.data.hasEstimates || req.session.data.addWorkshop.hasEstimates || '';
    req.session.data.addWorkshop.hasAddress = req.session.data.hasAddress || req.session.data.addWorkshop.hasAddress || '';
    req.session.data.addWorkshop.isVirtual = req.session.data.isVirtual || '';
    req.session.data.addWorkshop.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addWorkshop.hasVirtualMeetingLink || '';
    req.session.data.addWorkshop.virtualMeetingLink = req.session.data.virtualMeetingLink || '';
    req.session.data.addWorkshop.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addWorkshop.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  const hearingData = req.session.data.addWorkshop || {}
  
  res.render(getAddWorkshopView(req, 'has-address'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/has-address', function (req, res) {
  console.log('POST /has-address - form data:', req.session.data);
  console.log('POST /has-address - addWorkshop before:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  
  if (!req.session.data.addWorkshop) req.session.data.addWorkshop = {}
  req.session.data.addWorkshop.isVirtual = req.session.data.addWorkshop.isVirtual || req.session.data.isVirtual || ''
  const hasAddress = String(req.session.data.hasAddress || '').trim();
  req.session.data.addWorkshop.hasAddress = hasAddress;

  const fieldErrors = {
    hasAddress: getWorkshopChoiceError(hasAddress, 'an answer', ['Yes', 'No'])
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'has-address', fieldErrors);
  }
  
  console.log('POST /has-address - addWorkshop after:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  
  req.session.save(() => {
    if (req.session.data.addWorkshop.hasAddress == 'Yes') {
      res.redirect(`${req.baseUrl}/add-workshop/address`)
    } else if (req.session.data.addWorkshop.isVirtual === 'Hybrid') {
      res.redirect(`${req.baseUrl}/add-workshop/has-virtual-meeting-link`)
    } else {
      res.redirect(`${req.baseUrl}/add-workshop/check`)
    }
  })
})

router.get('/add-workshop/address', function (req, res) {
  console.log('GET /address - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  ensureEditingWorkshopData(req);
  
  // Always rebuild addWorkshop object from form field data to ensure current values
  if (req.session.data['hearing-date-day'] || req.session.data['hearing-venue']) {
    if (!req.session.data.addWorkshop) {
      req.session.data.addWorkshop = {};
    }
    req.session.data.addWorkshop.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addWorkshop.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addWorkshop.endTime = {
      hour: req.session.data['hearing-end-time-hour'] || '',
      minute: req.session.data['hearing-end-time-minute'] || ''
    };
    req.session.data.addWorkshop.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addWorkshop.hasEstimates = req.session.data.hasEstimates || req.session.data.addWorkshop.hasEstimates || '';
    req.session.data.addWorkshop.isVirtual = req.session.data.isVirtual || req.session.data.addWorkshop.isVirtual || '';
    req.session.data.addWorkshop.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addWorkshop.hasVirtualMeetingLink || '';
    req.session.data.addWorkshop.virtualMeetingLink = req.session.data.virtualMeetingLink || req.session.data.addWorkshop.virtualMeetingLink || '';
    req.session.data.addWorkshop.hasAddress = req.session.data.hasAddress || req.session.data.addWorkshop.hasAddress || '';
    req.session.data.addWorkshop.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addWorkshop.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  const hearingData = req.session.data.addWorkshop || {}
  
  res.render(getAddWorkshopView(req, 'address'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: hearingData,
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/address', function (req, res) {
  console.log('POST /address - form data:', req.session.data);
  console.log('POST /address - addWorkshop before:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  
  if (!req.session.data.addWorkshop) req.session.data.addWorkshop = {}
  const venue = String(req.session.data['hearing-venue'] || '').trim();
  const addressLine1 = String(req.session.data['hearing-address-line1'] || '').trim();
  const addressTown = String(req.session.data['hearing-address-town'] || '').trim();
  const addressPostcode = String(req.session.data['hearing-address-postcode'] || '').trim();
  req.session.data.addWorkshop.venue = venue;
  req.session.data.addWorkshop.address = {
    line1: addressLine1,
    line2: String(req.session.data['hearing-address-line2'] || '').trim(),
    town: addressTown,
    postcode: addressPostcode
  }

  const fieldErrors = {
    venue: venue ? '' : 'Enter the venue name',
    addressLine1: addressLine1 ? '' : 'Enter address line 1',
    addressTown: addressTown ? '' : 'Enter a town or city',
    addressPostcode: addressPostcode ? '' : 'Enter a postcode'
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return renderWorkshopStepWithErrors(req, res, 'address', fieldErrors);
  }
  
  console.log('POST /address - addWorkshop after:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  
  req.session.save(() => {
    if (req.session.data.addWorkshop.isVirtual === 'Hybrid') {
      res.redirect(`${req.baseUrl}/add-workshop/has-virtual-meeting-link`)
    } else {
      res.redirect(`${req.baseUrl}/add-workshop/check`)
    }
  })
})

router.get('/add-workshop/check', function (req, res) {
  console.log('GET /check - req.session.data.addWorkshop:', JSON.stringify(req.session.data.addWorkshop, null, 2));
  ensureEditingWorkshopData(req);
  
  // Always rebuild addWorkshop object from form field data to ensure current values
  if (req.session.data['hearing-date-day']) {
    if (!req.session.data.addWorkshop) {
      req.session.data.addWorkshop = {};
    }
    req.session.data.addWorkshop.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addWorkshop.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addWorkshop.endTime = {
      hour: req.session.data['hearing-end-time-hour'] || '',
      minute: req.session.data['hearing-end-time-minute'] || ''
    };
    req.session.data.addWorkshop.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addWorkshop.isVirtual = req.session.data.isVirtual || req.session.data.addWorkshop.isVirtual || '';
    req.session.data.addWorkshop.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addWorkshop.hasVirtualMeetingLink || '';
    req.session.data.addWorkshop.virtualMeetingLink = req.session.data.virtualMeetingLink || req.session.data.addWorkshop.virtualMeetingLink || '';
    req.session.data.addWorkshop.hasEstimates = req.session.data.hasEstimates || req.session.data.addWorkshop.hasEstimates || '';
    req.session.data.addWorkshop.hasAddress = req.session.data.hasAddress || req.session.data.addWorkshop.hasAddress || '';
    req.session.data.addWorkshop.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addWorkshop.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  res.render(getAddWorkshopView(req, 'check'), {
    caseRef: getWorkshopCaseRef(req),
    planTitle: req.session.data.planTitle || '',
    addWorkshop: req.session.data.addWorkshop || {},
    isEditing: getEditingWorkshopIndex(req) !== null
  })
})

router.post('/add-workshop/check', function (req, res) {
  console.log('POST check page - addWorkshop data:', JSON.stringify(req.session.data.addWorkshop, null, 2));

  const submissionError = getWorkshopSubmissionError(req.session.data.addWorkshop);
  if (submissionError) {
    return renderWorkshopStepWithErrors(req, res, submissionError.page, submissionError.fieldErrors);
  }
  
  const { date, time, venue } = req.session.data.addWorkshop
  const endTime = req.session.data.addWorkshop.endTime || {}
  console.log('Extracted - date:', date, 'time:', time, 'venue:', venue);

  // Validate that all fields have values
  if (!date.day || !date.month || !date.year || !time.hour || !time.minute) {
    console.log('Validation failed - day:', date.day, 'month:', date.month, 'year:', date.year, 'hour:', time.hour, 'minute:', time.minute);
    return res.redirect(`${req.baseUrl}/add-workshop/index`)
  }

  const day = parseInt(date.day);
  const month = parseInt(date.month);
  const year = parseInt(date.year);
  const hour = parseInt(time.hour);
  const minute = parseInt(time.minute);

  // Check if all values are valid numbers
  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return res.redirect(`${req.baseUrl}/add-workshop/index`)
  }

  const hearingDate = DateTime.fromObject({
    day: day,
    month: month,
    year: year,
    hours: hour,
    minutes: minute,
  })

  const hearingEndDateInput = req.session.data.addWorkshop.endDate || {};
  const hasCompleteEndDate = hearingEndDateInput.day && hearingEndDateInput.month && hearingEndDateInput.year;
  let endDateValue = '';

  if (hasCompleteEndDate) {
    const parsedEndDate = DateTime.fromObject({
      day: parseInt(hearingEndDateInput.day, 10),
      month: parseInt(hearingEndDateInput.month, 10),
      year: parseInt(hearingEndDateInput.year, 10)
    });

    if (parsedEndDate.isValid) {
      endDateValue = parsedEndDate.toFormat('d MMMM yyyy');
    }
  }

  const hearingRecord = {
    startDate: hearingDate.toFormat('d MMMM yyyy'),
    time: `${time.hour}:${time.minute}`,
    endTime: endTime.hour && endTime.minute ? `${endTime.hour}:${endTime.minute}` : '',
    estimatedDays: req.session.data.addWorkshop.estimatedDays || '',
    actualDuration: req.session.data.addWorkshop.actualDuration || '',
    endDate: endDateValue,
    isVirtual: req.session.data.addWorkshop.isVirtual || req.session.data.isVirtual || '',
    hasVirtualMeetingLink: req.session.data.addWorkshop.hasVirtualMeetingLink || 'No',
    virtualMeetingLink: req.session.data.addWorkshop.virtualMeetingLink || '',
    venue: venue || '-',
    address: req.session.data.addWorkshop.address || {},
    hasAddress: req.session.data.addWorkshop.hasAddress || 'No'
  };

  const editingHearingIndex = getEditingWorkshopIndex(req);

  if (editingHearingIndex !== null) {
    req.session.hearings[editingHearingIndex] = hearingRecord;
  } else {
    if (!Array.isArray(req.session.hearings)) {
      req.session.hearings = [];
    }
    req.session.hearings.push(hearingRecord);
  }

  syncLatestHearingFields(req.session);
  clearWorkingWorkshopData(req.session.data);
  delete req.session.data.editWorkshopIndex;
  req.session.notificationMessage = editingHearingIndex !== null ? 'Workshop updated' : 'Workshop set up';
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/gateway-2`)
  })
})

module.exports = router;