const PLAN_STATUS_CLASS_MAP = {
  'Submitted': 'govuk-tag--green',
  'In progress': 'govuk-tag--blue',
    'Created': 'govuk-tag--green',
  'Awaiting Gateway 2': 'govuk-tag--yellow',
  'Gateway 2 With LPA': 'govuk-tag--yellow',
  'Gateway 2 Validation': 'govuk-tag--blue',
  'Awaiting signed SLA': 'govuk-tag--yellow',
  'Awaiting Gateway 2 submission': 'govuk-tag--yellow',
  'Gateway 2 submission received': 'govuk-tag--turquoise',
  'Gateway 2 workshop confirmed': 'govuk-tag--blue',
  'Gateway 2 report in progress': 'govuk-tag--blue',
  'Awaiting Gateway 3 submission': 'govuk-tag--purple'
};

function getPlanStatusClasses(statusText) {
  return PLAN_STATUS_CLASS_MAP[statusText] || 'govuk-tag--turquoise';
}

module.exports = {
  PLAN_STATUS_CLASS_MAP,
  getPlanStatusClasses
};