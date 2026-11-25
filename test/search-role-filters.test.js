const assert = require('node:assert/strict');
const { test } = require('node:test');
const { getSearchData } = require('../app/views/projects/back-office/manage/search/_search-data');

const path = '/projects/back-office/manage/search/v1';

function search(query = {}, cases = []) {
  return getSearchData({ query, session: { cases } }, path, { roleFilters: true });
}

test('sample roles reflect stages and allow multiple GW3 assessors', () => {
  const data = search();
  const pending = data.filteredCases.find(plan => plan.status === 'Submission pending');
  const gw3 = data.filteredCases.find(plan => plan.gateway3Assessors.length > 1);
  assert.deepEqual(pending.gateway2Assessors, []);
  assert.deepEqual(pending.examiningInspectors, []);
  assert.ok(gw3);
  const filtered = search({ assessor: gw3.gateway3Assessors[1] });
  assert.ok(filtered.filteredCases.some(plan => plan.caseRef === gw3.caseRef));
});

test('role filters match both roles, combine, and use stored assignments', () => {
  const cases = [{
    caseRef: 'PLAN/999999',
    planTitle: 'Real plan',
    status: 'Exam in progress',
    gateway2AssessorName: 'First Assessor',
    gateway3Assessors: ['Second Assessor', 'Third Assessor'],
    examiningInspector1Name: 'First Inspector',
    qaInspector1Name: 'Second Inspector'
  }];
  const data = search({ assessor: 'Third Assessor', inspector: 'Second Inspector' }, cases);
  assert.equal(data.pagination.totalResults, 1);
  assert.deepEqual(data.filteredCases[0].gateway3Assessors, ['Second Assessor', 'Third Assessor']);
  assert.deepEqual(data.filteredCases[0].qaInspectors, ['Second Inspector']);
  assert.equal(search({ assessor: 'First Assessor', inspector: 'First Inspector' }, cases).pagination.totalResults, 1);
  assert.equal(search({ assessor: 'Third Assessor', inspector: 'Other Inspector' }, cases).pagination.totalResults, 0);
});

test('pagination and removing one filter retain the other selections', () => {
  const data = search({ assessor: 'Aisha Khan', inspector: 'Alice Bennett', q: 'Plan' });
  assert.ok(data.pagination.totalPages > 1);
  const next = new URL(data.pagination.nextHref, 'http://localhost');
  assert.equal(next.searchParams.get('assessor'), 'Aisha Khan');
  assert.equal(next.searchParams.get('inspector'), 'Alice Bennett');
  assert.equal(next.searchParams.get('q'), 'Plan');
  const assessorTag = data.selectedFilterGroups.find(group => group.heading === 'Assessor').items[0];
  const removed = new URL(assessorTag.href, 'http://localhost');
  assert.equal(removed.searchParams.has('assessor'), false);
  assert.equal(removed.searchParams.get('inspector'), 'Alice Bennett');
  const cleared = new URL(data.clearFiltersHref, 'http://localhost');
  assert.equal(cleared.searchParams.has('assessor'), false);
  assert.equal(cleared.searchParams.has('inspector'), false);
  assert.equal(cleared.searchParams.get('q'), 'Plan');
});

test('other search versions do not apply role filters', () => {
  const data = getSearchData({ query: { assessor: 'Nobody' }, session: {} }, '/search/v2');
  assert.ok(data.pagination.totalResults > 0);
  assert.equal(data.selectedAssessors.length, 0);
});
