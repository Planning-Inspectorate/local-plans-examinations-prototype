const PLAN_STATUS_CLASS_MAP = {
  'Submitted': 'govuk-tag--green',
  'In progress': 'govuk-tag--blue',
  'Created': 'govuk-tag--green',
  'Gateway 2 With LPA': 'govuk-tag--yellow',
  'Gateway 2 Validation': 'govuk-tag--blue'
};

function getPlanStatusClasses(statusText) {
  return PLAN_STATUS_CLASS_MAP[statusText] || 'govuk-tag--turquoise';
}

module.exports = {
  PLAN_STATUS_CLASS_MAP,
  getPlanStatusClasses
};