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
  'Awaiting Gateway 3 submission': 'govuk-tag--purple',
  'Ready to start': 'govuk-tag--grey',
  'GW2 pending': 'govuk-tag--yellow',
  'GW2 received': 'govuk-tag--turquoise',
  'GW2 workshop confirmed': 'govuk-tag--blue',
  'GW3 pending': 'govuk-tag--yellow',
  'GW3 received': 'govuk-tag--turquoise',
  'Exam pending': 'govuk-tag--yellow',
  'Submission pending': 'govuk-tag--yellow',
  'Submission received': 'govuk-tag--turquoise',
  'Exam in progress': 'govuk-tag--blue',
  'QA': 'govuk-tag--blue',
  'Fact check': 'govuk-tag--blue',
  'Report issued': 'govuk-tag--green',
  'Plan adopted': 'govuk-tag--green',
  'Paused': 'govuk-tag--grey',
  'Withdrawn': 'govuk-tag--grey'
};

function getPlanStatusClasses(statusText) {
  return PLAN_STATUS_CLASS_MAP[statusText] || 'govuk-tag--turquoise';
}

module.exports = {
  PLAN_STATUS_CLASS_MAP,
  getPlanStatusClasses
};