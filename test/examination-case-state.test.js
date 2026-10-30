const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  saveExaminationCaseState,
  restoreExaminationCaseState
} = require('../app/routes/projects/back-office/examination-case-state');

for (const version of ['v2', 'v3', 'v4', 'v5', 'v6', 'v21']) {
  const router = require(`../app/routes/create-case-${version}`);

  function loadCase(session, caseRef) {
    let destination;
    router.handle({
      method: 'GET',
      url: `/projects/back-office/create-case/${version}/load-case`,
      query: { caseRef },
      session
    }, {
      redirect(value) { destination = value; }
    }, (error) => {
      if (error) throw error;
      assert.fail('Expected the load-case route to handle the request');
    });
    assert.ok(destination);
    return destination;
  }

  test(`${version}: outcome and pause survive switching plans and reloading`, () => {
    let session = {
      cases: [
        { caseRef: 'PLAN/000001', planTitle: 'First plan' },
        { caseRef: 'PLAN/000002', planTitle: 'Second plan' }
      ],
      data: {}
    };
    loadCase(session, 'PLAN/000001');
    const firstPlanState = {
      planSoundness: 'Sound with modifications',
      soundUnsoundDate: '28/10/2026',
      planPauseDate: '1/10/2026',
      planPauseReason: 'More evidence required',
      planPauseActualEndDate: '14/10/2026',
      planPauseDecision: 'Resolved',
      planPauseDecisionReason: 'Evidence received',
      planPauseStatusState: 'resolved',
      examinationV3StatusState: 'exam-in-progress',
      examinationV6PauseHistory: [{ date: '1/9/2026', reason: 'Earlier pause', status: 'resolved' }],
      examinationV6PauseDraft: { date: '29/10/2026' },
      withdrawalSupportingEvidence: [{ id: 'document-1', name: 'evidence.pdf' }]
    };
    Object.assign(session, structuredClone(firstPlanState));
    Object.assign(session.data, structuredClone(firstPlanState));

    loadCase(session, 'PLAN/000002');
    assert.equal(session.currentCaseRef, 'PLAN/000002');
    assert.equal(session.planTitle, 'Second plan');
    assert.deepEqual(session.cases[0].examinationOutcomeAndPause, firstPlanState);
    for (const field of Object.keys(firstPlanState)) {
      assert.equal(session[field], undefined, `${field} must not leak into another plan`);
      assert.equal(session.data[field], undefined, `${field} must not leak through session data`);
    }

    const secondPlanState = {
      planSoundness: 'Unsound',
      soundUnsoundDate: '27/10/2026',
      planPauseDate: '20/10/2026',
      planPauseReason: 'Awaiting response',
      planPauseStatusState: 'paused',
      planPauseStatusBefore: 'qa',
      examinationV3StatusState: 'paused'
    };
    Object.assign(session, secondPlanState);
    session = JSON.parse(JSON.stringify(session));
    loadCase(session, 'PLAN/000001');
    assert.deepEqual(session.cases[1].examinationOutcomeAndPause, secondPlanState);
    for (const [field, value] of Object.entries(firstPlanState)) {
      assert.deepEqual(session[field], value);
      assert.deepEqual(session.data[field], value);
    }
    assert.equal(session.planPauseStatusBefore, undefined);

    loadCase(session, 'PLAN/000001');
    assert.equal(session.planSoundness, 'Sound with modifications');
    assert.equal(session.planPauseDecision, 'Resolved');
    delete session.planPauseActualEndDate;
    delete session.planPauseDecision;
    session.examinationV6PauseHistory.push({ date: '2/10/2026', status: 'resolved' });

    loadCase(session, 'PLAN/000002');
    for (const [field, value] of Object.entries(secondPlanState)) {
      assert.deepEqual(session[field], value);
    }
    loadCase(session, 'PLAN/000001');
    assert.equal(session.planPauseActualEndDate, undefined);
    assert.equal(session.planPauseDecision, undefined);
    assert.equal(session.examinationV6PauseHistory.length, 2);
  });

  test(`${version}: an unknown plan leaves active state unchanged`, () => {
    const session = {
      cases: [{ caseRef: 'PLAN/000001' }],
      currentCaseRef: 'PLAN/000001',
      planSoundness: 'Sound',
      planPauseReason: 'Active pause'
    };
    const before = structuredClone(session);
    loadCase(session, 'PLAN/missing');
    assert.deepEqual(session, before);
  });

  test(`${version}: withdrawal state stays with its plan`, () => {
    const session = {
      cases: [{ caseRef: 'PLAN/000001' }, { caseRef: 'PLAN/000002' }],
      currentCaseRef: 'PLAN/000001',
      withdrawnDate: '28/10/2026',
      planPauseDecision: 'Withdrawn',
      planPauseDecisionReason: 'Plan withdrawn by the authority',
      planPauseStatusState: 'withdrawn',
      examinationV3StatusState: 'withdrawn',
      data: {}
    };
    loadCase(session, 'PLAN/000002');
    assert.equal(session.withdrawnDate, undefined);
    assert.equal(session.planPauseStatusState, undefined);
    loadCase(session, 'PLAN/000001');
    assert.equal(session.withdrawnDate, '28/10/2026');
    assert.equal(session.planPauseDecision, 'Withdrawn');
    assert.equal(session.planPauseDecisionReason, 'Plan withdrawn by the authority');
    assert.equal(session.planPauseStatusState, 'withdrawn');
    assert.equal(session.examinationV3StatusState, 'withdrawn');
  });
}

test('stored pause history and restored data do not share mutable references', () => {
  const session = {
    cases: [{ caseRef: 'PLAN/000001' }],
    currentCaseRef: 'PLAN/000001',
    examinationV6PauseHistory: [{ reason: 'Original reason' }],
    data: {}
  };
  saveExaminationCaseState(session);
  session.examinationV6PauseHistory[0].reason = 'Unsaved change';
  assert.equal(session.cases[0].examinationOutcomeAndPause.examinationV6PauseHistory[0].reason, 'Original reason');
  restoreExaminationCaseState(session, session.cases[0]);
  session.data.examinationV6PauseHistory[0].reason = 'Form data change';
  assert.equal(session.examinationV6PauseHistory[0].reason, 'Original reason');
});

test('legacy case fields are restored when no snapshot exists', () => {
  const session = { data: { planPauseReason: 'Another plan' } };
  restoreExaminationCaseState(session, {
    planSoundness: 'Sound',
    planPauseDate: '1/10/2026',
    planPauseStatusState: 'paused'
  });
  assert.equal(session.planSoundness, 'Sound');
  assert.equal(session.planPauseDate, '1/10/2026');
  assert.equal(session.data.planPauseStatusState, 'paused');
  assert.equal(session.data.planPauseReason, undefined);
});
