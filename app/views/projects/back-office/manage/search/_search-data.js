const { PLAN_STATUS_CLASS_MAP } = require('../../../../../routes/projects/back-office/plan-status-classes');
const allLpas = require('../../../../../data/lpa-list.json');
const pageSizes = [25, 50, 100];
const statusAliases = {
  'Gateway 2 validation': 'Gateway 2 Validation'
};
const activeStatuses = [...new Set([
  'Submission pending',
  'Exam pending',
  'GW2 pending',
  'Withdrawn',
  'Report issued',
  'Awaiting signed SLA',
  'Fact check',
  'GW2 workshop confirmed',
  'Exam in progress',
  'GW3 received',
  'Submission received',
  'Paused',
  'GW2 received',
  'Plan adopted',
  'GW3 pending',
  'QA',
])];
const sampleCaseOfficers = ['Jane Smith', 'John Doe', 'Alex Johnson', 'Michael Brown', 'Sophie Green', 'Sam Patel'];
const sampleAssessors = ['Aisha Khan', 'Daniel Moore', 'Emily Carter', 'Peter Evans'];
const sampleInspectors = ['Alice Bennett', 'David Hughes', 'Helen Clarke', 'Richard Wilson'];
const gw2AssignedStatuses = new Set(['GW2 received', 'GW2 workshop confirmed', 'GW3 pending', 'GW3 received', 'Exam pending', 'Exam in progress', 'QA', 'Fact check', 'Report issued', 'Plan adopted']);
const gw3AssignedStatuses = new Set(['GW3 received', 'Exam pending', 'Exam in progress', 'QA', 'Fact check', 'Report issued', 'Plan adopted']);
const examiningAssignedStatuses = new Set(['Exam pending', 'Exam in progress', 'QA', 'Fact check', 'Report issued', 'Plan adopted']);
const qaAssignedStatuses = new Set(['QA', 'Fact check', 'Report issued', 'Plan adopted']);

function sampleRoles(status, index) {
  return {
    gateway2Assessors: gw2AssignedStatuses.has(status) ? [sampleAssessors[index % sampleAssessors.length]] : [],
    gateway3Assessors: gw3AssignedStatuses.has(status)
      ? [sampleAssessors[index % sampleAssessors.length], ...(index % 2 ? [sampleAssessors[(index + 1) % sampleAssessors.length]] : [])]
      : [],
    examiningInspectors: examiningAssignedStatuses.has(status) ? [sampleInspectors[index % sampleInspectors.length]] : [],
    qaInspectors: qaAssignedStatuses.has(status) ? [sampleInspectors[(index + 1) % sampleInspectors.length]] : []
  };
}

const samplePlans = allLpas.map((lpa, index) => ({
  caseRef: `PLAN/${String(index + 1).padStart(6, '0')}`,
  planTitle: `${lpa} Local Plan`,
  planType: 'Local plan',
  caseOfficer: sampleCaseOfficers[index % sampleCaseOfficers.length],
  lpas: [lpa],
  status: activeStatuses[index % activeStatuses.length],
  ...sampleRoles(activeStatuses[index % activeStatuses.length], index)
}));
const paginationDemoPlans = Array.from({ length: 50 }, (_, index) => {
  const lpa = allLpas[index % allLpas.length];
  return {
    planTitle: `Demo: ${lpa} Local Plan`,
    planType: 'Local plan',
    caseOfficer: sampleCaseOfficers[index % sampleCaseOfficers.length],
    lpas: [lpa],
    status: activeStatuses[index % activeStatuses.length],
    ...sampleRoles(activeStatuses[index % activeStatuses.length], index)
  };
});
const sampleDeletedCases = Array.from({ length: 5 }, (_, index) => {
  const lpa = allLpas[index];
  const planNumber = index === 0 ? 0 : allLpas.length + index;
  return {
    caseRef: `PLAN/${String(planNumber).padStart(6, '0')}`,
    planTitle: `${lpa} Local Plan`,
    planType: 'Local plan',
    caseOfficer: sampleCaseOfficers[index % sampleCaseOfficers.length],
    lpas: [lpa],
    status: 'Deleted'
  };
});

function normalizeStatus(status) {
  const label = String(status || '').trim();
  return statusAliases[label] || label;
}

function normalizePlanType(planType) {
  const label = String(planType || '').trim();
  return label.toLowerCase() === 'local plan' ? 'Local plan' : label;
}

function getSelectedValues(value) {
  return [].concat(value || []).filter(item => item && item !== '_unchecked');
}

function getRoleNames(...values) {
  return [...new Set(values.flat().filter(value => typeof value === 'string' && value.trim() && value.trim() !== '-').map(value => value.trim()))];
}

function getRequestedPageSize(value) {
  if (value === undefined) return 25;
  return pageSizes.map(String).includes(value) ? Number(value) : null;
}

function buildSearchHref(searchPath, query, statuses, lpas, caseOfficers, page = 1, showDeletedCases = false, pageSize = 25, roleFilters = {}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (showDeletedCases) params.set('showDeletedCases', 'true');
  statuses.forEach(status => params.append('status', status));
  lpas.forEach(lpa => params.append('lpa', lpa));
  caseOfficers.forEach(caseOfficer => params.append('caseOfficer', caseOfficer));
  (roleFilters.assessors || []).forEach(assessor => params.append('assessor', assessor));
  (roleFilters.inspectors || []).forEach(inspector => params.append('inspector', inspector));
  if (pageSize !== 25) params.set('pageSize', pageSize);
  if (page > 1) params.set('page', page);
  const queryString = params.toString();
  return queryString ? `${searchPath}?${queryString}` : searchPath;
}

function getSearchData(req, searchPath, { pageSize = 25, roleFilters = false } = {}) {
  const sessionPlans = Array.isArray(req.session.cases) ? req.session.cases : [];
  const selectedStatuses = getSelectedValues(req.query.status);
  const showDeletedCases = getSelectedValues(req.query.showDeletedCases).includes('true');
  const lastPlanNumber = sessionPlans.reduce((highest, plan) => {
    const match = /^PLAN\/(\d+)$/i.exec(String(plan.caseRef || ''));
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, allLpas.length);
  const demoPlans = paginationDemoPlans
    .slice(0, Math.max(0, 50 - sessionPlans.length))
    .map((plan, index) => ({
      ...plan,
      caseRef: `PLAN/${String(lastPlanNumber + index + 1).padStart(6, '0')}`
    }));
  const plans = sessionPlans.length
    ? [...sessionPlans, ...demoPlans]
    : samplePlans;
  const deletedPlans = showDeletedCases
    ? (Array.isArray(req.session.deletedCases) && req.session.deletedCases.length
      ? req.session.deletedCases
      : sampleDeletedCases).map(plan => ({
      ...plan,
      status: 'Deleted',
      lpas: Array.isArray(plan.lpas) ? plan.lpas : (plan.lpaName ? [plan.lpaName] : [])
    }))
    : [];
  const searchablePlans = showDeletedCases ? deletedPlans : plans;
  const distinctStatuses = new Set(searchablePlans.map(plan => normalizeStatus(plan.status)).filter(status => status && status !== 'Draft'));
  const showStatusRange = searchablePlans.length > 1 && distinctStatuses.size <= 1;
  const displayPlans = searchablePlans.map((plan, index) => {
    const status = plan.status === 'Deleted'
      ? 'Deleted'
      : (!plan.status || plan.status === 'Draft' || showStatusRange
        ? samplePlans[index % samplePlans.length].status
        : normalizeStatus(plan.status));
    const roles = samplePlans.includes(plan) || demoPlans.includes(plan)
      ? sampleRoles(status, index)
      : {
          gateway2Assessors: getRoleNames(plan.gateway2Assessors, plan.gateway2AssessorName),
          gateway3Assessors: getRoleNames(plan.gateway3Assessors, plan.gateway3AssessorName),
          examiningInspectors: getRoleNames(plan.examiningInspectors, plan.examiningInspector1Name, plan.examiningInspector2Name, plan.examiningInspector3Name),
          qaInspectors: getRoleNames(plan.qaInspectors, plan.qaInspector1Name, plan.qaInspector2Name, plan.qaInspector3Name)
        };
    return {
      ...plan,
      planType: normalizePlanType(plan.planType),
      status,
      ...(roleFilters ? roles : {})
    };
  });
  const query = String(req.query.q || '').trim();
  const normalizedQuery = query.toLowerCase();
  const selectedLpas = getSelectedValues(req.query.lpa);
  const selectedCaseOfficers = getSelectedValues(req.query.caseOfficer);
  const selectedAssessors = roleFilters ? getSelectedValues(req.query.assessor) : [];
  const selectedInspectors = roleFilters ? getSelectedValues(req.query.inspector) : [];
  const currentRoles = { assessors: selectedAssessors, inspectors: selectedInspectors };
  const searchHref = (statuses, authorities, officers, page = 1, deleted = showDeletedCases, size = pageSize, roles = currentRoles) =>
    buildSearchHref(searchPath, query, statuses, authorities, officers, page, deleted, size, roles);
  const assessors = [...new Set(displayPlans.flatMap(plan => [...(plan.gateway2Assessors || []), ...(plan.gateway3Assessors || [])]))].sort();
  const inspectors = [...new Set(displayPlans.flatMap(plan => [...(plan.examiningInspectors || []), ...(plan.qaInspectors || [])]))].sort();
  const statuses = activeStatuses.slice().sort();
  const lpas = [...new Set([...allLpas, ...displayPlans.flatMap(plan => Array.isArray(plan.lpas) ? plan.lpas : [])])].sort();
  const caseOfficers = [...new Set(displayPlans.map(plan => plan.caseOfficer).filter(Boolean))].sort();
  const selectedFilterGroups = [
    {
      heading: 'Status',
      items: selectedStatuses.map(status => ({
        text: status,
        href: searchHref(selectedStatuses.filter(value => value !== status), selectedLpas, selectedCaseOfficers)
      }))
    },
    {
      heading: 'Deleted cases',
      items: showDeletedCases ? [{
        text: 'Show deleted cases',
        href: searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, 1, false)
      }] : []
    },
    {
      heading: 'Planning authority',
      items: selectedLpas.map(lpa => ({
        text: lpa,
        href: searchHref(selectedStatuses, selectedLpas.filter(value => value !== lpa), selectedCaseOfficers)
      }))
    },
    {
      heading: 'Case officer',
      items: selectedCaseOfficers.map(caseOfficer => ({
        text: caseOfficer,
        href: searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers.filter(value => value !== caseOfficer))
      }))
    },
    {
      heading: 'Assessor',
      items: selectedAssessors.map(assessor => ({
        text: assessor,
        href: searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, 1, showDeletedCases, pageSize, { ...currentRoles, assessors: selectedAssessors.filter(value => value !== assessor) })
      }))
    },
    {
      heading: 'Inspector',
      items: selectedInspectors.map(inspector => ({
        text: inspector,
        href: searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, 1, showDeletedCases, pageSize, { ...currentRoles, inspectors: selectedInspectors.filter(value => value !== inspector) })
      }))
    }
  ].filter(group => group.items.length);
  const clearFiltersHref = buildSearchHref(searchPath, query, [], [], [], 1, false, pageSize);
  const filteredPlans = displayPlans.filter(plan => {
    const matchesQuery = !normalizedQuery || [
      plan.caseRef,
      plan.planTitle,
      plan.status,
      plan.caseOfficer,
      ...(Array.isArray(plan.lpas) ? plan.lpas : [])
    ].some(value => String(value || '').toLowerCase().includes(normalizedQuery));
    const matchesStatus = !selectedStatuses.length || selectedStatuses.includes(plan.status);
    const matchesLpa = !selectedLpas.length || (plan.lpas || []).some(lpa => selectedLpas.includes(lpa));
    const matchesCaseOfficer = !selectedCaseOfficers.length || selectedCaseOfficers.includes(plan.caseOfficer);
    const matchesAssessor = !selectedAssessors.length || [...(plan.gateway2Assessors || []), ...(plan.gateway3Assessors || [])].some(name => selectedAssessors.includes(name));
    const matchesInspector = !selectedInspectors.length || [...(plan.examiningInspectors || []), ...(plan.qaInspectors || [])].some(name => selectedInspectors.includes(name));

    return matchesQuery && matchesStatus && matchesLpa && matchesCaseOfficer && matchesAssessor && matchesInspector;
  });
  const totalResults = filteredPlans.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const requestedPage = Number.parseInt(req.query.page, 10) || 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPlans = filteredPlans.slice(startIndex, startIndex + pageSize);
  const pagination = {
    currentPage,
    pageSize,
    totalPages,
    totalResults,
    firstResult: totalResults ? startIndex + 1 : 0,
    lastResult: Math.min(startIndex + pageSize, totalResults),
    previousHref: currentPage > 1
      ? searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, currentPage - 1)
      : '',
    nextHref: currentPage < totalPages
      ? searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, currentPage + 1)
      : '',
    pages: Array.from({ length: totalPages }, (_, index) => ({
      number: index + 1,
      current: index + 1 === currentPage,
      href: searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, index + 1)
    })),
    pageSizes: pageSizes.map(size => ({
      size,
      current: size === pageSize,
      href: searchHref(selectedStatuses, selectedLpas, selectedCaseOfficers, 1, showDeletedCases, size)
    }))
  };

  return {
    plans: paginatedPlans,
    cases: displayPlans,
    filteredCases: paginatedPlans,
    planCount: displayPlans.length,
    filteredPlanCount: totalResults,
    pagination,
    query,
    statuses,
    lpas,
    caseOfficers,
    selectedStatuses,
    showDeletedCases,
    selectedLpas,
    selectedCaseOfficers,
    assessors,
    inspectors,
    selectedAssessors,
    selectedInspectors,
    selectedFilterGroups,
    clearFiltersHref,
    planStatusClassMap: PLAN_STATUS_CLASS_MAP
  };
}

module.exports = { getSearchData, getRequestedPageSize };
