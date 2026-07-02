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

router.get('/cancel-workshop', function (req, res) {
    const sessionData = req.session.data || {};
    const baseViewPath = (req.baseUrl || '').replace(/^\//, '');
    const workshopIndex = Number.parseInt(req.query.index, 10);
    if (Number.isInteger(workshopIndex) && workshopIndex >= 0) {
      req.session.cancelWorkshopIndex = String(workshopIndex);
      req.session.data.cancelWorkshopIndex = String(workshopIndex);
    } else {
      delete req.session.cancelWorkshopIndex;
      delete req.session.data.cancelWorkshopIndex;
    }
    res.render(`${baseViewPath}/cancel-workshop/index`, {
      caseRef: sessionData.currentCaseRef || '',
      planTitle: sessionData.planTitle || '',
      workshopIndex: Number.isInteger(workshopIndex) && workshopIndex >= 0 ? workshopIndex : ''
    })
  })

  router.post('/cancel-workshop', function (req, res) {
    const rawHearingIndex = req.body.workshopIndex ?? req.query.index ?? req.session.cancelWorkshopIndex ?? req.session.data.cancelWorkshopIndex;
    const workshopIndex = Number.parseInt(rawHearingIndex, 10);
    const hearings = Array.isArray(req.session.hearings)
      ? req.session.hearings
      : Array.isArray(req.session.data?.hearings)
        ? req.session.data.hearings
        : null;

    if (Number.isInteger(workshopIndex) && workshopIndex >= 0 && Array.isArray(hearings) && workshopIndex < hearings.length) {
      const updatedHearings = hearings.filter((_, index) => index !== workshopIndex);
      req.session.hearings = updatedHearings;
      if (req.session.data && Array.isArray(req.session.data.hearings)) {
        req.session.data.hearings = updatedHearings;
      }
      delete req.session.cancelWorkshopIndex;
      delete req.session.data.cancelWorkshopIndex;
      syncLatestHearingFields(req.session);
    } else {
      delete req.session.cancelWorkshopIndex;
      delete req.session.data.cancelWorkshopIndex;
      req.session.notificationMessage = 'Unable to cancel workshop';
      return req.session.save(() => {
        res.redirect(`${req.baseUrl}/gateway-2`)
      })
    }

    req.session.notificationMessage = 'Workshop cancelled'
    req.session.save(() => {
      res.redirect(`${req.baseUrl}/gateway-2`)
    })
  })

module.exports = router;