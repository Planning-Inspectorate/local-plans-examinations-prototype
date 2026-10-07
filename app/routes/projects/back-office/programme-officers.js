const EXAMINATION_PATH = '/projects/back-office/manage/examination/v6';
const GATEWAY_3_PATH = '/projects/back-office/manage/GW3/v1';

function getExaminationProgrammeOfficer(session) {
  if (session.examinationPoContact === undefined) {
    const contact = session.gateway3PoContact;
    if (contact && (contact.firstName || contact.lastName || contact.email || contact.phone)) {
      session.examinationPoContact = { ...contact };
    }
  }
  return session.examinationPoContact || {};
}

function getOverviewProgrammeOfficer(session) {
  const currentCase = (session.cases || []).find((item) => item.caseRef === session.currentCaseRef);
  const stage = String(session.planStage || session.stage || session.data?.planStage || session.data?.stage || currentCase?.planStage || currentCase?.stage || '').trim().toLowerCase();
  const isExamination = stage
    ? ['examination', 'exam'].includes(stage)
    : !!(session.examinationV3StatusState || (session.examinationActualDate && session.examinationActualDate !== '-'));
  return {
    programmeOfficerContact: isExamination ? getExaminationProgrammeOfficer(session) : session.gateway3PoContact || {},
    programmeOfficerEditUrl: isExamination ? `${EXAMINATION_PATH}/programme-officer` : `${GATEWAY_3_PATH}/gateway-3-po-details.html`
  };
}

module.exports = { getExaminationProgrammeOfficer, getOverviewProgrammeOfficer };