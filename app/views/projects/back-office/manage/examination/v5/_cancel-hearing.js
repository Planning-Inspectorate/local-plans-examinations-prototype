const express = require('express');
const router = express.Router();

function syncLatestHearingFields(session) {
  const hearings = Array.isArray(session.hearings) ? session.hearings : [];
  const latestHearing = hearings.length ? hearings[hearings.length - 1] : null;

  if (!latestHearing) {
    delete session.hearingStartDate;
    delete session.hearingTime;
    delete session.hearingEstimatedDays;
    delete session.hearingActualDuration;
    delete session.hearingEndDate;
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

router.get('/cancel-hearing', function (req, res) {
    const sessionData = req.session.data || {};
    const baseViewPath = (req.baseUrl || '').replace(/^\//, '');
    const hearingIndex = Number.parseInt(req.query.index, 10);
    if (Number.isInteger(hearingIndex) && hearingIndex >= 0) {
      req.session.cancelHearingIndex = String(hearingIndex);
      req.session.data.cancelHearingIndex = String(hearingIndex);
    } else {
      delete req.session.cancelHearingIndex;
      delete req.session.data.cancelHearingIndex;
    }
    res.render(`${baseViewPath}/cancel-hearing/index`, {
      caseRef: sessionData.currentCaseRef || '',
      planTitle: sessionData.planTitle || '',
      hearingIndex: Number.isInteger(hearingIndex) && hearingIndex >= 0 ? hearingIndex : ''
    })
  })

  router.post('/cancel-hearing', function (req, res) {
    const rawHearingIndex = req.body.hearingIndex ?? req.query.index ?? req.session.cancelHearingIndex ?? req.session.data.cancelHearingIndex;
    const hearingIndex = Number.parseInt(rawHearingIndex, 10);
    const hearings = Array.isArray(req.session.hearings)
      ? req.session.hearings
      : Array.isArray(req.session.data?.hearings)
        ? req.session.data.hearings
        : null;

    if (Number.isInteger(hearingIndex) && hearingIndex >= 0 && Array.isArray(hearings) && hearingIndex < hearings.length) {
      const updatedHearings = hearings.filter((_, index) => index !== hearingIndex);
      req.session.hearings = updatedHearings;
      if (req.session.data && Array.isArray(req.session.data.hearings)) {
        req.session.data.hearings = updatedHearings;
      }
      delete req.session.cancelHearingIndex;
      delete req.session.data.cancelHearingIndex;
      syncLatestHearingFields(req.session);
    } else {
      delete req.session.cancelHearingIndex;
      delete req.session.data.cancelHearingIndex;
      req.session.notificationMessage = 'Unable to cancel hearing';
      return req.session.save(() => {
        res.redirect(`${req.baseUrl}/examination`)
      })
    }

    req.session.notificationMessage = 'Hearing cancelled'
    req.session.save(() => {
      res.redirect(`${req.baseUrl}/examination`)
    })
  })

module.exports = router;