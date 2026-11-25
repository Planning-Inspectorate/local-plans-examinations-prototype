const assert = require('node:assert/strict');
const { test } = require('node:test');
const router = require('../app/views/projects/back-office/manage/overview/v2/_routes');

function overview(session) {
  let context;
  router.handle({
    method: 'GET',
    url: '/index',
    session: { data: {}, ...session }
  }, {
    locals: {},
    render(view, values) {
      assert.equal(view, 'projects/back-office/manage/overview/v2/index');
      context = values;
    }
  }, error => {
    if (error) throw error;
    assert.fail('Expected the overview route to handle the request');
  });
  assert.ok(context);
  return context;
}

test('overview receives the stored assessor and website values', () => {
  const context = overview({
    gateway2AssessorName: 'Sarah Johnson',
    gateway3AssessorName: 'James Wilson',
    examinationWebsite: 'https://example.com',
    gateway3PoContact: { email: 'officer@example.com' },
    examinationInspectors: [{ name: 'Jane Smith' }],
    qaInspectors: [{ name: 'Pat Jones' }]
  });

  assert.equal(context.gateway2AssessorName, 'Sarah Johnson');
  assert.equal(context.gateway3AssessorName, 'James Wilson');
  assert.equal(context.examinationWebsite, 'https://example.com');
  assert.equal(context.programmeOfficerContact.email, 'officer@example.com');
  assert.equal(context.examiningInspector1Name, 'Jane Smith');
  assert.equal(context.qaInspector1Name, 'Pat Jones');
});

test('overview handles absent details and legacy missing-value sentinels', () => {
  const empty = overview({});
  assert.deepEqual(empty.programmeOfficerContact, {});
  for (const field of ['gateway2AssessorName', 'gateway3AssessorName', 'examinationWebsite', 'examiningInspector1Name', 'qaInspector1Name']) {
    assert.equal(empty[field], '');
  }

  const legacy = overview({
    gateway2AssessorName: '-',
    gateway3AssessorName: '-',
    examinationWebsite: '-',
    examiningInspector1Name: '-',
    qaInspector1Name: '-'
  });
  for (const field of ['gateway2AssessorName', 'gateway3AssessorName', 'examinationWebsite', 'examiningInspector1Name', 'qaInspector1Name']) {
    assert.equal(legacy[field], '-');
  }
});
