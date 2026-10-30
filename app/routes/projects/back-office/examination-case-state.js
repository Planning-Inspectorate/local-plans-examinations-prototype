const EXAMINATION_CASE_FIELDS = [
  'planSoundness',
  'soundUnsound',
  'soundUnsoundDate',
  'adoptionDate',
  'approvedForCilDate',
  'planPauseDate',
  'planPauseReason',
  'planPauseEndDate',
  'planPauseActualEndDate',
  'planPauseDecision',
  'planPauseDecisionReason',
  'planPauseStatusState',
  'planPauseStatusBefore',
  'examinationV6PauseHistory',
  'examinationV6PauseDraft',
  'withdrawnDate',
  'withdrawalSupportingEvidence',
  'examinationV3StatusState'
];

function saveExaminationCaseState(session) {
  const currentCase = session.cases?.find((item) => item.caseRef === session.currentCaseRef);
  if (!currentCase) return;

  currentCase.examinationOutcomeAndPause = {};
  EXAMINATION_CASE_FIELDS.forEach((field) => {
    if (session[field] !== undefined) {
      currentCase.examinationOutcomeAndPause[field] = structuredClone(session[field]);
    }
  });
}

function restoreExaminationCaseState(session, caseRecord) {
  const savedState = caseRecord.examinationOutcomeAndPause || caseRecord;
  EXAMINATION_CASE_FIELDS.forEach((field) => {
    delete session[field];
    if (session.data) delete session.data[field];
    if (savedState[field] !== undefined) {
      session[field] = structuredClone(savedState[field]);
      if (session.data) session.data[field] = structuredClone(savedState[field]);
    }
  });
}

module.exports = { saveExaminationCaseState, restoreExaminationCaseState };
