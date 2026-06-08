const express = require('express');
const router = express.Router();
const { DateTime } = require("luxon")

function getAddHearingView(req, page) {
  const baseViewPath = (req.baseUrl || '').replace(/^\//, '');
  return `${baseViewPath}/add-hearing/${page}`;
}

function getEditingHearingIndex(req) {
  const rawIndex = req.session?.data?.editHearingIndex;
  const hearingIndex = Number.parseInt(rawIndex, 10);

  if (!Number.isInteger(hearingIndex) || hearingIndex < 0) {
    return null;
  }

  if (!Array.isArray(req.session.hearings) || hearingIndex >= req.session.hearings.length) {
    return null;
  }

  return hearingIndex;
}

function hydrateAddHearingFromRecord(hearingRecord) {
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

  return {
    date,
    time: {
      hour: timeParts[0] || '',
      minute: timeParts[1] || ''
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

function clearWorkingHearingData(sessionData) {
  delete sessionData.addHearing;
  delete sessionData['hearing-date-day'];
  delete sessionData['hearing-date-month'];
  delete sessionData['hearing-date-year'];
  delete sessionData['hearing-time-hour'];
  delete sessionData['hearing-time-minute'];
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

console.log('✓ add-hearing.js module loaded');

// Redirect /add-hearing to /add-hearing/index
router.get('/add-hearing', function (req, res) {
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
    req.session.data.editHearingIndex = String(requestedEditIndex);
  } else {
    delete req.session.data.editHearingIndex;
  }

  clearWorkingHearingData(req.session.data);
  res.redirect(`${req.baseUrl}/add-hearing/${targetStep}`);
});

// Cancel route - clears form data only, preserves saved hearing
router.get('/add-hearing/cancel', function (req, res) {
  console.log('Cancel hearing flow - clearing session form data (keeping saved hearing)');
  clearWorkingHearingData(req.session.data);
  delete req.session.data.editHearingIndex;
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/examination`);
  });
});

router.get('/add-hearing/index', function (req, res) {
  console.log('GET /add-hearing/index');
  console.log('Full session.data:', JSON.stringify(req.session.data, null, 2));
  console.log('hearing-date-day:', req.session.data['hearing-date-day']);
  console.log('hearing-date-month:', req.session.data['hearing-date-month']);
  console.log('hearing-date-year:', req.session.data['hearing-date-year']);
  
  // Rebuild addHearing object from form field data if it exists
  if (req.session.data['hearing-date-day'] || req.session.data['hearing-date-month'] || req.session.data['hearing-date-year']) {
    console.log('Rebuilding addHearing from form fields...');
    req.session.data.addHearing = {
      date: {
        day: req.session.data['hearing-date-day'] || '',
        month: req.session.data['hearing-date-month'] || '',
        year: req.session.data['hearing-date-year'] || ''
      },
      time: {
        hour: req.session.data['hearing-time-hour'] || '',
        minute: req.session.data['hearing-time-minute'] || ''
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
    console.log('Rebuilt addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  } else {
    console.log('No form field data found');
  }
  
  // Check if editing existing hearing or adding new
  let hearingData = req.session.data.addHearing || {}
  const editingHearingIndex = getEditingHearingIndex(req);
  console.log('hearingData being passed to template:', JSON.stringify(hearingData, null, 2));

  if (!req.session.data.addHearing && editingHearingIndex !== null) {
    hearingData = hydrateAddHearingFromRecord(req.session.hearings[editingHearingIndex]);
    req.session.data.addHearing = hearingData;
  }
  
  res.render(getAddHearingView(req, 'index'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: editingHearingIndex !== null
  })
})

router.get('/add-hearing/actual-duration', function (req, res) {
  const requestedEditIndex = Number.parseInt(req.query.edit, 10);
  if (Number.isInteger(requestedEditIndex) && requestedEditIndex >= 0) {
    req.session.data.editHearingIndex = String(requestedEditIndex);
  }

  const editingHearingIndex = getEditingHearingIndex(req);
  if (!req.session.data.addHearing && editingHearingIndex !== null) {
    req.session.data.addHearing = hydrateAddHearingFromRecord(req.session.hearings[editingHearingIndex]);
  }

  const hearingData = req.session.data.addHearing || {};

  res.render(getAddHearingView(req, 'actual-duration'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: editingHearingIndex !== null
  });
});

router.post('/add-hearing/actual-duration', function (req, res) {
  const editingHearingIndex = getEditingHearingIndex(req);

  if (editingHearingIndex === null) {
    return res.redirect(`${req.baseUrl}/add-hearing/check`);
  }

  if (!Array.isArray(req.session.hearings) || !req.session.hearings[editingHearingIndex]) {
    return res.redirect(`${req.baseUrl}/examination`);
  }

  req.session.hearings[editingHearingIndex].actualDuration = req.session.data.actualDuration || '';
  syncLatestHearingFields(req.session);
  clearWorkingHearingData(req.session.data);
  delete req.session.data.editHearingIndex;
  req.session.notificationMessage = 'Hearing updated';

  req.session.save(() => {
    res.redirect(`${req.baseUrl}/examination`);
  });
});

router.get('/add-hearing/end-date', function (req, res) {
  const requestedEditIndex = Number.parseInt(req.query.edit, 10);
  if (Number.isInteger(requestedEditIndex) && requestedEditIndex >= 0) {
    req.session.data.editHearingIndex = String(requestedEditIndex);
  }

  const editingHearingIndex = getEditingHearingIndex(req);
  if (!req.session.data.addHearing && editingHearingIndex !== null) {
    req.session.data.addHearing = hydrateAddHearingFromRecord(req.session.hearings[editingHearingIndex]);
  }

  const hearingData = req.session.data.addHearing || {};

  res.render(getAddHearingView(req, 'end-date'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: editingHearingIndex !== null
  });
});

router.post('/add-hearing/end-date', function (req, res) {
  const editingHearingIndex = getEditingHearingIndex(req);

  if (editingHearingIndex === null) {
    return res.redirect(`${req.baseUrl}/add-hearing/check`);
  }

  if (!Array.isArray(req.session.hearings) || !req.session.hearings[editingHearingIndex]) {
    return res.redirect(`${req.baseUrl}/examination`);
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
  clearWorkingHearingData(req.session.data);
  delete req.session.data.editHearingIndex;
  req.session.notificationMessage = 'Hearing updated';

  req.session.save(() => {
    res.redirect(`${req.baseUrl}/examination`);
  });
});

router.post('/add-hearing/index', function (req, res) {
  console.log('POST /add-hearing/index received');
  console.log('Form data:', req.session.data);
  
  // Preserve existing hearing data and only update date/time
  if (!req.session.data.addHearing) {
    req.session.data.addHearing = {}
  }
  
  req.session.data.addHearing.date = {
    day: req.session.data['hearing-date-day'],
    month: req.session.data['hearing-date-month'],
    year: req.session.data['hearing-date-year']
  }
  req.session.data.addHearing.time = {
    hour: req.session.data['hearing-time-hour'],
    minute: req.session.data['hearing-time-minute']
  }
  
  console.log('addHearing object updated:', req.session.data.addHearing);
  
  req.session.save(() => {
    console.log('Session saved, redirecting to has-estimates...');
    res.redirect(`${req.baseUrl}/add-hearing/has-estimates`)
  })
})

router.get('/add-hearing/has-estimates', function (req, res) {
  console.log('GET /has-estimates - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  console.log('GET /has-estimates - req.session.hearingStartDate:', req.session.hearingStartDate);
  console.log('GET /has-estimates - req.session.data:', JSON.stringify(req.session.data, null, 2));
  
  // If in edit mode and form data is empty, rebuild from saved hearing
  if (!req.session.data.addHearing && req.session.hearingStartDate) {
    console.log('In edit mode - rebuilding from saved hearing data...');
    const parsedDate = DateTime.fromFormat(req.session.hearingStartDate, 'd MMMM yyyy');
    req.session.data.addHearing = {
      date: {
        day: parsedDate.day.toString(),
        month: parsedDate.month.toString(),
        year: parsedDate.year.toString()
      },
      time: req.session.hearingTime ? {
        hour: req.session.hearingTime.split(':')[0],
        minute: req.session.hearingTime.split(':')[1]
      } : { hour: '', minute: '' },
      estimatedDays: req.session.hearingEstimatedDays || '',
      isVirtual: req.session.hearingIsVirtual || '',
      hasVirtualMeetingLink: req.session.hearingHasVirtualMeetingLink || 'No',
      virtualMeetingLink: req.session.hearingVirtualMeetingLink || '',
      hasEstimates: req.session.hearingEstimatedDays ? 'Yes' : 'No',
      hasAddress: req.session.hearingHasAddress || 'No',
      venue: req.session.hearingVenue || '',
      address: req.session.hearingAddress || {}
    };
    console.log('Rebuilt from saved data:', JSON.stringify(req.session.data.addHearing, null, 2));
  }
  
  // Always rebuild addHearing object from form field data to ensure current values
  if (req.session.data['hearing-date-day'] || req.session.data.hasEstimates) {
    console.log('Rebuilding addHearing from form fields...');
    if (!req.session.data.addHearing) {
      req.session.data.addHearing = {};
    }
    req.session.data.addHearing.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addHearing.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addHearing.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || req.session.data.addHearing.hasEstimates || '';
    req.session.data.addHearing.isVirtual = req.session.data.isVirtual || req.session.data.addHearing.isVirtual || '';
    req.session.data.addHearing.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addHearing.hasVirtualMeetingLink || '';
    req.session.data.addHearing.virtualMeetingLink = req.session.data.virtualMeetingLink || req.session.data.addHearing.virtualMeetingLink || '';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || req.session.data.addHearing.hasAddress || '';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
    console.log('Rebuilt from form fields:', JSON.stringify(req.session.data.addHearing, null, 2));
  }
  
  const hearingData = req.session.data.addHearing || {}
  console.log('Final hearingData being passed to template:', JSON.stringify(hearingData, null, 2));
  
  res.render(getAddHearingView(req, 'has-estimates'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/has-estimates', function (req, res) {
  console.log('POST /has-estimates - form data:', req.session.data);
  console.log('POST /has-estimates - addHearing before:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates
  req.session.data.addHearing.estimatedDays = req.session.data.hearingEstimationDays
  
  console.log('POST /has-estimates - addHearing after:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/add-hearing/is-virtual`)
  })
})

router.get('/add-hearing/is-virtual', function (req, res) {
  console.log('GET /is-virtual - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render(getAddHearingView(req, 'is-virtual'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/is-virtual', function (req, res) {
  console.log('POST /is-virtual - form data:', req.session.data);
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.isVirtual = req.session.data.isVirtual || req.session.data.addHearing.isVirtual || ''
  
  req.session.save(() => {
    if (req.session.data.addHearing.isVirtual === 'In-person') {
      res.redirect(`${req.baseUrl}/add-hearing/has-address`)
    } else {
      res.redirect(`${req.baseUrl}/add-hearing/has-virtual-meeting-link`)
    }
  })
})

router.get('/add-hearing/has-virtual-meeting-link', function (req, res) {
  console.log('GET /has-virtual-meeting-link - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render(getAddHearingView(req, 'has-virtual-meeting-link'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/has-virtual-meeting-link', function (req, res) {
  console.log('POST /has-virtual-meeting-link - form data:', req.session.data);
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.isVirtual = req.session.data.addHearing.isVirtual || req.session.data.isVirtual || ''
  req.session.data.addHearing.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink
  req.session.data.addHearing.virtualMeetingLink = req.session.data.virtualMeetingLink || ''
  
  req.session.save(() => {
    if (req.session.data.addHearing.hasVirtualMeetingLink === 'Yes') {
      res.redirect(`${req.baseUrl}/add-hearing/virtual-meeting`)
    } else {
      res.redirect(`${req.baseUrl}/add-hearing/check`)
    }
  })
})

router.get('/add-hearing/virtual-meeting', function (req, res) {
  console.log('GET /virtual-meeting - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render(getAddHearingView(req, 'virtual-meeting'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/virtual-meeting', function (req, res) {
  console.log('POST /virtual-meeting - form data:', req.session.data);
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.virtualMeetingLink = req.session.data.virtualMeetingLink || ''
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/add-hearing/check`)
  })
})

router.get('/add-hearing/has-address', function (req, res) {
  console.log('GET /has-address - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  // If in edit mode and form data is empty, rebuild from saved hearing
  if (!req.session.data.addHearing && req.session.hearingStartDate) {
    console.log('In edit mode - rebuilding from saved hearing data...');
    const parsedDate = DateTime.fromFormat(req.session.hearingStartDate, 'd MMMM yyyy');
    req.session.data.addHearing = {
      date: {
        day: parsedDate.day.toString(),
        month: parsedDate.month.toString(),
        year: parsedDate.year.toString()
      },
      time: req.session.hearingTime ? {
        hour: req.session.hearingTime.split(':')[0],
        minute: req.session.hearingTime.split(':')[1]
      } : { hour: '', minute: '' },
      estimatedDays: req.session.hearingEstimatedDays || '',
      isVirtual: req.session.hearingIsVirtual || '',
      hasEstimates: req.session.hearingEstimatedDays ? 'Yes' : 'No',
      hasAddress: req.session.hearingHasAddress || 'No',
      venue: req.session.hearingVenue || '',
      address: req.session.hearingAddress || {}
    };
  }
  
  // Always rebuild addHearing object from form field data to ensure current values
  if (req.session.data['hearing-date-day'] || req.session.data.hasAddress) {
    if (!req.session.data.addHearing) {
      req.session.data.addHearing = {};
    }
    req.session.data.addHearing.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addHearing.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addHearing.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || req.session.data.addHearing.hasEstimates || '';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || req.session.data.addHearing.hasAddress || '';
    req.session.data.addHearing.isVirtual = req.session.data.isVirtual || '';
    req.session.data.addHearing.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addHearing.hasVirtualMeetingLink || '';
    req.session.data.addHearing.virtualMeetingLink = req.session.data.virtualMeetingLink || '';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render(getAddHearingView(req, 'has-address'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/has-address', function (req, res) {
  console.log('POST /has-address - form data:', req.session.data);
  console.log('POST /has-address - addHearing before:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.isVirtual = req.session.data.addHearing.isVirtual || req.session.data.isVirtual || ''
  req.session.data.addHearing.hasAddress = req.session.data.hasAddress
  
  console.log('POST /has-address - addHearing after:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  req.session.save(() => {
    if(req.session.data.addHearing.hasAddress == 'Yes') {
      res.redirect(`${req.baseUrl}/add-hearing/address`)
    } else {
      res.redirect(`${req.baseUrl}/add-hearing/check`)
    }
  })
})

router.get('/add-hearing/address', function (req, res) {
  console.log('GET /address - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  // If in edit mode and form data is empty, rebuild from saved hearing
  if (!req.session.data.addHearing && req.session.hearingStartDate) {
    console.log('In edit mode - rebuilding from saved hearing data...');
    const parsedDate = DateTime.fromFormat(req.session.hearingStartDate, 'd MMMM yyyy');
    req.session.data.addHearing = {
      date: {
        day: parsedDate.day.toString(),
        month: parsedDate.month.toString(),
        year: parsedDate.year.toString()
      },
      time: req.session.hearingTime ? {
        hour: req.session.hearingTime.split(':')[0],
        minute: req.session.hearingTime.split(':')[1]
      } : { hour: '', minute: '' },
      estimatedDays: req.session.hearingEstimatedDays || '',
      isVirtual: req.session.hearingIsVirtual || '',
      hasEstimates: req.session.hearingEstimatedDays ? 'Yes' : 'No',
      hasAddress: req.session.hearingHasAddress || 'No',
      venue: req.session.hearingVenue || '',
      address: req.session.hearingAddress || {}
    };
  }
  
  // Always rebuild addHearing object from form field data to ensure current values
  if (req.session.data['hearing-date-day'] || req.session.data['hearing-venue']) {
    if (!req.session.data.addHearing) {
      req.session.data.addHearing = {};
    }
    req.session.data.addHearing.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addHearing.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addHearing.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || req.session.data.addHearing.hasEstimates || '';
    req.session.data.addHearing.isVirtual = req.session.data.isVirtual || req.session.data.addHearing.isVirtual || '';
    req.session.data.addHearing.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addHearing.hasVirtualMeetingLink || '';
    req.session.data.addHearing.virtualMeetingLink = req.session.data.virtualMeetingLink || req.session.data.addHearing.virtualMeetingLink || '';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || req.session.data.addHearing.hasAddress || '';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render(getAddHearingView(req, 'address'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/address', function (req, res) {
  console.log('POST /address - form data:', req.session.data);
  console.log('POST /address - addHearing before:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.venue = req.session.data['hearing-venue']
  req.session.data.addHearing.address = {
    line1: req.session.data['hearing-address-line1'],
    line2: req.session.data['hearing-address-line2'],
    town: req.session.data['hearing-address-town'],
    postcode: req.session.data['hearing-address-postcode']
  }
  
  console.log('POST /address - addHearing after:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/add-hearing/check`)
  })
})

router.get('/add-hearing/check', function (req, res) {
  console.log('GET /check - req.session.data.addHearing:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  // If in edit mode and form data is empty, rebuild from saved hearing
  if (!req.session.data.addHearing && req.session.hearingStartDate) {
    console.log('In edit mode - rebuilding from saved hearing data...');
    const parsedDate = DateTime.fromFormat(req.session.hearingStartDate, 'd MMMM yyyy');
    req.session.data.addHearing = {
      date: {
        day: parsedDate.day.toString(),
        month: parsedDate.month.toString(),
        year: parsedDate.year.toString()
      },
      time: req.session.hearingTime ? {
        hour: req.session.hearingTime.split(':')[0],
        minute: req.session.hearingTime.split(':')[1]
      } : { hour: '', minute: '' },
      estimatedDays: req.session.hearingEstimatedDays || '',
      isVirtual: req.session.hearingIsVirtual || '',
      hasVirtualMeetingLink: req.session.hearingHasVirtualMeetingLink || 'No',
      virtualMeetingLink: req.session.hearingVirtualMeetingLink || '',
      hasEstimates: req.session.hearingEstimatedDays ? 'Yes' : 'No',
      hasAddress: req.session.hearingHasAddress || 'No',
      venue: req.session.hearingVenue || '',
      address: req.session.hearingAddress || {}
    };
  }
  
  // Always rebuild addHearing object from form field data to ensure current values
  if (req.session.data['hearing-date-day']) {
    if (!req.session.data.addHearing) {
      req.session.data.addHearing = {};
    }
    req.session.data.addHearing.date = {
      day: req.session.data['hearing-date-day'] || '',
      month: req.session.data['hearing-date-month'] || '',
      year: req.session.data['hearing-date-year'] || ''
    };
    req.session.data.addHearing.time = {
      hour: req.session.data['hearing-time-hour'] || '',
      minute: req.session.data['hearing-time-minute'] || ''
    };
    req.session.data.addHearing.estimatedDays = req.session.data.hearingEstimationDays || '';
    req.session.data.addHearing.isVirtual = req.session.data.isVirtual || req.session.data.addHearing.isVirtual || '';
    req.session.data.addHearing.hasVirtualMeetingLink = req.session.data.hasVirtualMeetingLink || req.session.data.addHearing.hasVirtualMeetingLink || '';
    req.session.data.addHearing.virtualMeetingLink = req.session.data.virtualMeetingLink || req.session.data.addHearing.virtualMeetingLink || '';
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || req.session.data.addHearing.hasEstimates || '';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || req.session.data.addHearing.hasAddress || '';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  res.render(getAddHearingView(req, 'check'), {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: req.session.data.addHearing || {},
    isEditing: getEditingHearingIndex(req) !== null
  })
})

router.post('/add-hearing/check', function (req, res) {
  console.log('POST check page - addHearing data:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing || !req.session.data.addHearing.date) {
    console.log('Missing addHearing or date object');
    return res.redirect(`${req.baseUrl}/add-hearing/index`)
  }
  
  const { date, time, venue } = req.session.data.addHearing
  console.log('Extracted - date:', date, 'time:', time, 'venue:', venue);

  // Validate that all fields have values
  if (!date.day || !date.month || !date.year || !time.hour || !time.minute) {
    console.log('Validation failed - day:', date.day, 'month:', date.month, 'year:', date.year, 'hour:', time.hour, 'minute:', time.minute);
    return res.redirect(`${req.baseUrl}/add-hearing/index`)
  }

  const day = parseInt(date.day);
  const month = parseInt(date.month);
  const year = parseInt(date.year);
  const hour = parseInt(time.hour);
  const minute = parseInt(time.minute);

  // Check if all values are valid numbers
  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return res.redirect(`${req.baseUrl}/add-hearing/index`)
  }

  const hearingDate = DateTime.fromObject({
    day: day,
    month: month,
    year: year,
    hours: hour,
    minutes: minute,
  })

  const hearingEndDateInput = req.session.data.addHearing.endDate || {};
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
    estimatedDays: req.session.data.addHearing.estimatedDays || '',
    actualDuration: req.session.data.addHearing.actualDuration || '',
    endDate: endDateValue,
    isVirtual: req.session.data.addHearing.isVirtual || req.session.data.isVirtual || '',
    hasVirtualMeetingLink: req.session.data.addHearing.hasVirtualMeetingLink || 'No',
    virtualMeetingLink: req.session.data.addHearing.virtualMeetingLink || '',
    venue: venue || '-',
    address: req.session.data.addHearing.address || {},
    hasAddress: req.session.data.addHearing.hasAddress || 'No'
  };

  const editingHearingIndex = getEditingHearingIndex(req);

  if (editingHearingIndex !== null) {
    req.session.hearings[editingHearingIndex] = hearingRecord;
  } else {
    if (!Array.isArray(req.session.hearings)) {
      req.session.hearings = [];
    }
    req.session.hearings.push(hearingRecord);
  }

  syncLatestHearingFields(req.session);
  clearWorkingHearingData(req.session.data);
  delete req.session.data.editHearingIndex;
  req.session.notificationMessage = editingHearingIndex !== null ? 'Hearing updated' : 'Hearing created';
  req.session.save(() => {
    res.redirect(`${req.baseUrl}/examination`)
  })
})

module.exports = router;