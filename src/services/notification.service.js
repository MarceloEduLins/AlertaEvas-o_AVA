const REFERENCE_GRADE = 7;
const LEVEL_WEIGHT = { reminder: 1, attention: 2, critical: 3 };

function firstName(student) { return student.name.split(' ')[0]; }
function highestLevel(items) {
  return items.reduce((best, item) => (LEVEL_WEIGHT[item.level] || 0) > (LEVEL_WEIGHT[best] || 0) ? item.level : best, 'reminder');
}

function buildAttendanceNotification(student, subjectAnalysis) {
  const { subject, attendance } = subjectAnalysis;
  const remaining = attendance.remainingAbsences;
  if (!['reminder', 'attention', 'critical'].includes(attendance.alertLevel)) return null;
  const remainingText = remaining > 1 ? `${remaining} faltas` : remaining === 1 ? '1 falta' : 'nenhuma falta adicional';

  if (attendance.alertLevel === 'reminder') return {
    type: 'attendance', level: 'reminder', reference: 'band:reminder',
    subject: `Lembrete de frequência • ${subject.name}`,
    summary: `${subject.name}: restam aproximadamente ${remainingText}.`,
    body: `Olá, ${firstName(student)}! Só um lembrete: em ${subject.name}, sua frequência atual é ${attendance.currentAttendance}% e restam aproximadamente ${remainingText} antes do limite configurado. Não é um alerta crítico; é apenas para você conseguir se organizar com antecedência.`
  };
  if (attendance.alertLevel === 'attention') return {
    type: 'attendance', level: 'attention', reference: 'band:attention',
    subject: `Atenção à frequência • ${subject.name}`,
    summary: `${subject.name}: sua margem caiu para ${remainingText}.`,
    body: `Olá, ${firstName(student)}. Sua margem de frequência em ${subject.name} ficou pequena: restam aproximadamente ${remainingText}. Frequência atual: ${attendance.currentAttendance}%. Vale evitar novas ausências e acompanhar as próximas aulas com atenção.`
  };
  return {
    type: 'attendance', level: 'critical', reference: 'band:critical',
    subject: `Alerta importante de frequência • ${subject.name}`,
    summary: `${subject.name}: frequência em nível crítico (${attendance.currentAttendance}%).`,
    body: `Olá, ${firstName(student)}. Sua frequência em ${subject.name} chegou a um nível crítico. Frequência atual: ${attendance.currentAttendance}%. Margem estimada: ${remainingText}. Se houver alguma dificuldade, procure o professor ou o apoio acadêmico o quanto antes.`
  };
}

function buildAvaNotification(student, subjectAnalysis) {
  const { subject, ava } = subjectAnalysis;
  if (!['attention', 'critical'].includes(ava.alertLevel)) return null;
  if (ava.alertLevel === 'attention') return {
    type: 'ava', level: 'attention', reference: 'band:8d', subject: 'Lembrete sobre seu acesso ao AVA',
    summary: `${ava.inactiveDays} dias sem AVA; ${ava.pendingActivities} pendência(s) em ${subject.name}.`,
    body: `Olá, ${firstName(student)}! Faz ${ava.inactiveDays} dias que você não acessa o AVA. Em ${subject.name}, há ${ava.pendingActivities} atividade(s) pendente(s). Vale dar uma olhada para não acumular conteúdo.`
  };
  return {
    type: 'ava', level: 'critical', reference: 'band:15d', subject: 'Atenção importante ao seu acesso no AVA',
    summary: `${ava.inactiveDays} dias sem AVA e atividades pendentes.`,
    body: `Olá, ${firstName(student)}. Identificamos ${ava.inactiveDays} dias sem acesso ao AVA e ${ava.pendingActivities} atividade(s) pendente(s) em ${subject.name}. Recomendamos verificar o ambiente virtual e, se necessário, procurar apoio acadêmico.`
  };
}

function buildGradeNotification(student, subjectAnalysis) {
  const assessment = subjectAnalysis.assessments?.[0];
  if (!assessment || assessment.grade === null || assessment.grade >= REFERENCE_GRADE) return null;
  const weakest = assessment.weakest;
  const grade = Number(assessment.grade);
  const level = grade < 5 ? 'critical' : grade < 6 ? 'attention' : 'reminder';
  const component = weakest?.type || 'avaliação';
  const componentGrade = Number.isFinite(Number(weakest?.grade)) ? Number(weakest.grade).toFixed(1) : '—';

  const subjects = {
    reminder: `Acompanhe sua ${assessment.name} • ${subjectAnalysis.subject.name}`,
    attention: `Atenção ao resultado de ${assessment.name} • ${subjectAnalysis.subject.name}`,
    critical: `Resultado crítico em ${assessment.name} • ${subjectAnalysis.subject.name}`
  };
  const openings = {
    reminder: 'Seu resultado ficou um pouco abaixo da média de referência 7,0.',
    attention: 'Seu resultado ficou abaixo da média de referência 7,0 e merece atenção.',
    critical: 'Seu resultado ficou bem abaixo da média de referência 7,0.'
  };

  return {
    type: 'grade', level, reference: `${assessment.name}:${assessment.releaseDate || ''}`,
    subject: subjects[level],
    summary: `${subjectAnalysis.subject.name}: ${assessment.name} = ${grade.toFixed(1)}; principal ponto: ${component} (${componentGrade}).`,
    body: `Olá, ${firstName(student)}. ${openings[level]} Em ${assessment.name} de ${subjectAnalysis.subject.name}, sua média foi ${grade.toFixed(1)}. O componente que mais reduziu o resultado foi ${component} (${componentGrade}). Use esse aviso para concentrar a recuperação exatamente onde houve maior dificuldade.`
  };
}

function buildDigestNotification(student, candidates, date) {
  if (!candidates?.length) return null;
  if (candidates.length === 1) return candidates[0];

  const level = highestLevel(candidates);
  const sorted = [...candidates].sort((a, b) => (LEVEL_WEIGHT[b.level] || 0) - (LEVEL_WEIGHT[a.level] || 0));
  const summaries = sorted.slice(0, 4).map((item) => `• ${item.summary || item.subject}`);
  const extra = sorted.length > 4 ? `\n• +${sorted.length - 4} outro(s) ponto(s) no painel` : '';
  const subjects = {
    reminder: 'Resumo preventivo do seu acompanhamento acadêmico',
    attention: 'Atenção ao seu acompanhamento acadêmico',
    critical: 'Alerta importante no seu acompanhamento acadêmico'
  };

  return {
    type: 'digest',
    level,
    reference: `digest:${date}:${sorted.map((item) => `${item.type}:${item.reference}`).sort().join('|')}`,
    sourceReferences: sorted.map((item) => ({ type: item.type, subjectId: item.subjectId, level: item.level, reference: item.reference })),
    subject: subjects[level],
    summary: `${sorted.length} sinais acadêmicos novos foram identificados.`,
    body: `Olá, ${firstName(student)}. O sistema identificou ${sorted.length} mudanças que merecem acompanhamento:\n\n${summaries.join('\n')}${extra}\n\nVocê não receberá outro e-mail sobre esses mesmos sinais; uma nova mensagem só será gerada quando houver uma mudança relevante de nível ou um novo resultado de avaliação.`
  };
}

module.exports = {
  REFERENCE_GRADE,
  LEVEL_WEIGHT,
  buildAttendanceNotification,
  buildAvaNotification,
  buildGradeNotification,
  buildDigestNotification
};
