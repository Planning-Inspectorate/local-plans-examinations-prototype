const { getPlanStatusClasses } = require('./plan-status-classes');

const FLOW_STATUSES = [
  'Awaiting signed SLA',
  'Awaiting Gateway 2 submission',
  'Gateway 2 submission received',
  'Gateway 2 workshop confirmed',
  'Gateway 2 report in progress',
  'Awaiting Gateway 3 submission'
];

const BASELINE_STATUSES = new Set([
  '',
  '-',
  'Submitted',
  'Draft',
  'In progress',
  'Created',
  'Awaiting Gateway 2',
  'Gateway 2 With LPA',
  'Gateway 2 Validation',
  'Ready for Gateway 2',
  'Ready for Gateway 3',
  'Gateway 2 awaiting workshop',
  'Gateway 2 documents submitted'
]);

const STATUS_EVENT_TARGET = {
  SLA_PENDING: 'Awaiting signed SLA',
  SLA_CONFIRMED: 'Awaiting Gateway 2 submission',
  GW2_SUBMISSION_RECEIVED: 'Gateway 2 submission received',
  WORKSHOP_CONFIRMED: 'Gateway 2 workshop confirmed',
  WORKSHOP_COMPLETED: 'Gateway 2 report in progress',
  GW2_REPORT_ISSUED: 'Awaiting Gateway 3 submission',
  FLOW_RESET: 'Awaiting signed SLA'
};

function ensureSessionData(req) {
  if (!req.session.data) req.session.data = {};
}

function syncStatusToCase(req, statusText) {
  const caseRef = req.session.currentCaseRef || '';
  if (!caseRef || !Array.isArray(req.session.cases)) return;

  const currentCase = req.session.cases.find((item) => item.caseRef === caseRef);
  if (currentCase) {
    currentCase.status = statusText;
  }
}

function addStatusHistory(req, historyEntry) {
  if (!Array.isArray(req.session.statusHistory)) {
    req.session.statusHistory = [];
  }

  req.session.statusHistory.push(historyEntry);
  if (req.session.statusHistory.length > 100) {
    req.session.statusHistory = req.session.statusHistory.slice(-100);
  }
}

function setStatus(req, statusText, options = {}) {
  const {
    force = false,
    event = 'MANUAL',
    source = '',
    res
  } = options;

  const targetStatus = String(statusText || '').trim();
  if (!targetStatus) return false;

  const fromStatus = String(req.session.planStatus || '').trim();
  const targetIndex = FLOW_STATUSES.indexOf(targetStatus);
  const currentIndex = FLOW_STATUSES.indexOf(fromStatus);

  let applied = true;
  if (!force) {
    if (targetIndex === -1) {
      applied = false;
    } else if (currentIndex !== -1 && targetIndex < currentIndex) {
      applied = false;
    } else if (currentIndex === -1 && fromStatus && !BASELINE_STATUSES.has(fromStatus)) {
      applied = false;
    }
  }

  if (applied) {
    ensureSessionData(req);
    req.session.planStatus = targetStatus;
    req.session.data.planStatus = targetStatus;
    req.session.data.planStatusClasses = getPlanStatusClasses(targetStatus);
    syncStatusToCase(req, targetStatus);

    if (res && res.locals) {
      res.locals.planStatus = targetStatus;
      if (res.locals.headerStatus) {
        res.locals.headerStatus.text = targetStatus;
        res.locals.headerStatus.classes = getPlanStatusClasses(targetStatus);
      }
    }
  }

  addStatusHistory(req, {
    timestamp: new Date().toISOString(),
    event,
    source,
    from: fromStatus || '-',
    to: applied ? targetStatus : fromStatus || '-',
    applied
  });

  return applied;
}

function applyStatusEvent(req, eventName, options = {}) {
  const statusText = STATUS_EVENT_TARGET[eventName];
  if (!statusText) return false;

  return setStatus(req, statusText, {
    ...options,
    force: options.force || eventName === 'FLOW_RESET',
    event: eventName
  });
}

function getStatusHistory(req) {
  return Array.isArray(req.session.statusHistory) ? req.session.statusHistory : [];
}

module.exports = {
  FLOW_STATUSES,
  STATUS_EVENT_TARGET,
  applyStatusEvent,
  setStatus,
  getStatusHistory
};
