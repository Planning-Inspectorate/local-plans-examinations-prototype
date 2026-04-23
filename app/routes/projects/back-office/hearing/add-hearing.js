const express = require('express');
const router = express.Router();
const { DateTime } = require("luxon")

console.log('✓ add-hearing.js module loaded');

// Redirect /add-hearing to /add-hearing/index
router.get('/projects/back-office/manage/examination/v1/add-hearing', function (req, res) {
  res.redirect('/projects/back-office/manage/examination/v1/add-hearing/index');
});

// Cancel route - clears form data only, preserves saved hearing
router.get('/projects/back-office/manage/examination/v1/add-hearing/cancel', function (req, res) {
  console.log('Cancel hearing flow - clearing session form data (keeping saved hearing)');
  
  // Clear only the working form data from req.session.data
  // Do NOT delete the saved hearing data (hearingStartDate, hearingTime, etc.)
  delete req.session.data.addHearing;
  delete req.session.data['hearing-date-day'];
  delete req.session.data['hearing-date-month'];
  delete req.session.data['hearing-date-year'];
  delete req.session.data['hearing-time-hour'];
  delete req.session.data['hearing-time-minute'];
  delete req.session.data.hearingEstimationDays;
  delete req.session.data.hasEstimates;
  delete req.session.data.hasAddress;
  delete req.session.data['hearing-venue'];
  delete req.session.data['hearing-address-line1'];
  delete req.session.data['hearing-address-line2'];
  delete req.session.data['hearing-address-town'];
  delete req.session.data['hearing-address-postcode'];
  
  req.session.save(() => {
    res.redirect('/projects/back-office/manage/examination/v1/examination');
  });
});

router.get('/projects/back-office/manage/examination/v1/add-hearing/index', function (req, res) {
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
      hasEstimates: req.session.data.hasEstimates || 'No',
      hasAddress: req.session.data.hasAddress || 'No',
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
  console.log('hearingData being passed to template:', JSON.stringify(hearingData, null, 2));
  
  // If no working data but there's existing hearing data, pre-fill for edit
  if (!req.session.data.addHearing && req.session.hearingStartDate) {
    // Parse the formatted date string back to day/month/year
    const parsedDate = DateTime.fromFormat(req.session.hearingStartDate, 'd MMMM yyyy')
    
    // Initialize addHearing with all existing data so it carries through the flow
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
      hasEstimates: req.session.hearingEstimatedDays ? 'Yes' : 'No',
      hasAddress: req.session.hearingHasAddress || 'No',
      venue: req.session.hearingVenue || '',
      address: req.session.hearingAddress || {}
    }
    hearingData = req.session.data.addHearing
  }
  
  res.render('projects/back-office/manage/examination/v1/add-hearing/index', {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: !!req.session.hearingStartDate
  })
})

router.post('/projects/back-office/manage/examination/v1/add-hearing/index', function (req, res) {
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
    res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/has-estimates`)
  })
})

router.get('/projects/back-office/manage/examination/v1/add-hearing/has-estimates', function (req, res) {
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
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || 'No';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || 'No';
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
  
  res.render('projects/back-office/manage/examination/v1/add-hearing/has-estimates', {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: !!req.session.hearingStartDate
  })
})

router.post('/projects/back-office/manage/examination/v1/add-hearing/has-estimates', function (req, res) {
  console.log('POST /has-estimates - form data:', req.session.data);
  console.log('POST /has-estimates - addHearing before:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates
  req.session.data.addHearing.estimatedDays = req.session.data.hearingEstimationDays
  
  console.log('POST /has-estimates - addHearing after:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/has-address`)
  })
})


router.get('/projects/back-office/manage/examination/v1/add-hearing/has-address', function (req, res) {
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
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || 'No';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || 'No';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render('projects/back-office/manage/examination/v1/add-hearing/has-address', {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: !!req.session.hearingStartDate
  })
})

router.post('/projects/back-office/manage/examination/v1/add-hearing/has-address', function (req, res) {
  console.log('POST /has-address - form data:', req.session.data);
  console.log('POST /has-address - addHearing before:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing) req.session.data.addHearing = {}
  req.session.data.addHearing.hasAddress = req.session.data.hasAddress
  
  console.log('POST /has-address - addHearing after:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  req.session.save(() => {
    if(req.session.data.addHearing.hasAddress == 'Yes') {
      res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/address`)
    } else {
      res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/check`)
    }
  })
})

router.get('/projects/back-office/manage/examination/v1/add-hearing/address', function (req, res) {
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
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || 'No';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || 'No';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  const hearingData = req.session.data.addHearing || {}
  
  res.render('projects/back-office/manage/examination/v1/add-hearing/address', {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: hearingData,
    isEditing: !!req.session.hearingStartDate
  })
})

router.post('/projects/back-office/manage/examination/v1/add-hearing/address', function (req, res) {
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
    res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/check`)
  })
})

router.get('/projects/back-office/manage/examination/v1/add-hearing/check', function (req, res) {
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
    req.session.data.addHearing.hasEstimates = req.session.data.hasEstimates || 'No';
    req.session.data.addHearing.hasAddress = req.session.data.hasAddress || 'No';
    req.session.data.addHearing.venue = req.session.data['hearing-venue'] || '';
    req.session.data.addHearing.address = {
      line1: req.session.data['hearing-address-line1'] || '',
      line2: req.session.data['hearing-address-line2'] || '',
      town: req.session.data['hearing-address-town'] || '',
      postcode: req.session.data['hearing-address-postcode'] || ''
    };
  }
  
  res.render('projects/back-office/manage/examination/v1/add-hearing/check', {
    caseRef: req.session.data.currentCaseRef || '',
    planTitle: req.session.data.planTitle || '',
    addHearing: req.session.data.addHearing || {},
    isEditing: !!req.session.hearingStartDate
  })
})

router.post('/projects/back-office/manage/examination/v1/add-hearing/check', function (req, res) {
  console.log('POST check page - addHearing data:', JSON.stringify(req.session.data.addHearing, null, 2));
  
  if (!req.session.data.addHearing || !req.session.data.addHearing.date) {
    console.log('Missing addHearing or date object');
    return res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/index`)
  }
  
  const { date, time, venue } = req.session.data.addHearing
  console.log('Extracted - date:', date, 'time:', time, 'venue:', venue);

  // Validate that all fields have values
  if (!date.day || !date.month || !date.year || !time.hour || !time.minute) {
    console.log('Validation failed - day:', date.day, 'month:', date.month, 'year:', date.year, 'hour:', time.hour, 'minute:', time.minute);
    return res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/index`)
  }

  const day = parseInt(date.day);
  const month = parseInt(date.month);
  const year = parseInt(date.year);
  const hour = parseInt(time.hour);
  const minute = parseInt(time.minute);

  // Check if all values are valid numbers
  if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hour) || isNaN(minute)) {
    return res.redirect(`/projects/back-office/manage/examination/v1/add-hearing/index`)
  }

  const hearingDate = DateTime.fromObject({
    day: day,
    month: month,
    year: year,
    hours: hour,
    minutes: minute,
  })

  const isUpdate = req.session.hearingStartDate ? true : false
  
  req.session.hearingStartDate = hearingDate.toFormat('d MMMM yyyy')
  req.session.hearingTime = `${time.hour}:${time.minute}`
  req.session.hearingEstimatedDays = req.session.data.addHearing.estimatedDays || ''
  req.session.hearingVenue = venue || '-'
  req.session.hearingAddress = req.session.data.addHearing.address || {}
  req.session.hearingHasAddress = req.session.data.addHearing.hasAddress || 'No'
  
  delete req.session.data.addHearing
  req.session.notificationMessage = isUpdate ? 'Hearing updated' : 'Hearing created'
  req.session.save(() => {
    res.redirect(`/projects/back-office/manage/examination/v1/examination`)
  })
})

module.exports = router;