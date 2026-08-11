const PLAN_STATUS_CLASS_MAP = {
  'Submitted': 'govuk-tag--green',
  'In progress': 'govuk-tag--blue',
  'Created': 'govuk-tag--green',

  // Current flow labels
  'Awaiting SLA': 'govuk-tag--yellow',
  'GW2 submission': 'govuk-tag--yellow',
  'GW2 submitted': 'govuk-tag--turquoise',
  'GW2 workshop confirmed': 'govuk-tag--blue',
  'GW2 report': 'govuk-tag--blue',
  'GW3 submission': 'govuk-tag--yellow',

  // Variant labels used in some journeys/views
  'GW2 submission received': 'govuk-tag--turquoise',

  // Legacy labels kept for backwards compatibility with seeded/demo data
  'Awaiting Gateway 2': 'govuk-tag--yellow',
  'Gateway 2 With LPA': 'govuk-tag--yellow',
  'Gateway 2 Validation': 'govuk-tag--blue',
  'Awaiting signed SLA': 'govuk-tag--yellow',
  'Awaiting Gateway 2 submission': 'govuk-tag--yellow',
  'Gateway 2 workshop confirmed': 'govuk-tag--blue',
  'Gateway 2 report in progress': 'govuk-tag--blue',
  'Awaiting Gateway 3 submission': 'govuk-tag--yellow'
};

function getPlanStatusClasses(statusText) {
  return PLAN_STATUS_CLASS_MAP[statusText] || 'govuk-tag--turquoise';
}

module.exports = {
  PLAN_STATUS_CLASS_MAP,
  getPlanStatusClasses
};