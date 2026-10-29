const repository = require('../repositories/academic.repository');
const academic = require('../services/academic.service');
const notifications = require('../services/notification.service');
const { clusterClass, checkPython } = require('../services/clustering.service');
const { validateAcademicData } = require('../services/data-validation.service');
const simulation = require('../services/simulation.service');


async function getSystemStatus(_req, res) {
  const dataCheck = validateAcademicData(repository.readData());
  const ai = await checkPython();
  res.json({
    ok: dataCheck.ok,
    version: repository.readData().meta?.version || '4.0.0',
    data: dataCheck,
    ai,
    notifications: {
      mode: 'simulated',
      description: 'As comunicações são geradas automaticamente e registradas no histórico demonstrativo.'
    }
  });
}

function listClasses(_req, res) {
  res.json(repository.listClasses());
}

function getDashboard(req, res) {
  const dashboard = academic.getClassDashboard(req.params.classId);
  if (!dashboard) return res.status(404).json({ message: 'Turma não encontrada.' });
  res.json(dashboard);
}

function getStudentProfile(req, res) {
  const profile = academic.getStudentProfile(req.params.studentId);
  if (!profile) return res.status(404).json({ message: 'Estudante não encontrado.' });
  res.json(profile);
}

function updateSubject(req, res) {
  const current = repository.getEnrollment(req.params.studentId, req.params.subjectId);
  if (!current) return res.status(404).json({ message: 'Matrícula na disciplina não encontrada.' });

  const patch = {};
  if (req.body.absences !== undefined) {
    const absences = Number(req.body.absences);
    if (!Number.isInteger(absences) || absences < 0) return res.status(400).json({ message: 'Faltas inválidas.' });
    patch.absences = absences;
  }
  if (req.body.classesHeld !== undefined) {
    const classesHeld = Number(req.body.classesHeld);
    if (!Number.isInteger(classesHeld) || classesHeld < 0) return res.status(400).json({ message: 'Aulas realizadas inválidas.' });
    patch.classesHeld = classesHeld;
  }
  if (req.body.pendingActivities !== undefined) {
    const pending = Number(req.body.pendingActivities);
    if (!Number.isInteger(pending) || pending < 0) return res.status(400).json({ message: 'Pendências inválidas.' });
    patch.pendingActivities = pending;
  }
  if (req.body.lastAvaAccess !== undefined) patch.lastAvaAccess = String(req.body.lastAvaAccess);
  if (req.body.assessments !== undefined) patch.assessments = req.body.assessments;

  repository.updateEnrollment(req.params.studentId, req.params.subjectId, patch);
  res.json(academic.getStudentProfile(req.params.studentId));
}

function previewNotifications(req, res) {
  const profile = academic.getStudentProfile(req.params.studentId);
  if (!profile) return res.status(404).json({ message: 'Estudante não encontrado.' });

  const sent = repository.listNotifications().filter((item) => ['simulated_sent','auto_sent_simulated'].includes(item.status));
  const alreadySent = (candidate) => sent.some((item) => {
    if (item.studentId !== profile.student.id) return false;
    if (Array.isArray(item.sourceReferences)) {
      return item.sourceReferences.some((source) =>
        source.type === candidate.type && source.subjectId === candidate.subjectId && source.level === candidate.level && (source.reference || '') === (candidate.reference || '')
      );
    }
    return item.subjectId === candidate.subjectId && item.type === candidate.type && item.level === candidate.level && (item.reference || '') === (candidate.reference || '');
  });

  const candidates = [];
  profile.subjects.forEach((subjectAnalysis) => {
    const attendance = notifications.buildAttendanceNotification(profile.student, subjectAnalysis);
    const grade = notifications.buildGradeNotification(profile.student, subjectAnalysis);
    if (attendance) candidates.push({ ...attendance, studentId: profile.student.id, subjectId: subjectAnalysis.subject.id });
    if (grade) candidates.push({ ...grade, studentId: profile.student.id, subjectId: subjectAnalysis.subject.id });
  });
  const avaContext = [...profile.subjects].sort((a,b)=>(b.ava.pendingActivities-a.ava.pendingActivities)||(b.ava.inactiveDays-a.ava.inactiveDays))[0];
  const ava = avaContext ? notifications.buildAvaNotification(profile.student, avaContext) : null;
  if (ava) candidates.push({ ...ava, studentId: profile.student.id, subjectId: avaContext.subject.id });

  const fresh = candidates.filter((candidate) => !alreadySent(candidate));
  if (!fresh.length) return res.json([]);
  const date = academic.simulationReferenceDate().toISOString().slice(0, 10);
  const digest = notifications.buildDigestNotification(profile.student, fresh, date);
  res.json([{ ...digest, studentId: profile.student.id, subjectId: digest.subjectId || fresh[0]?.subjectId || null }]);
}

function generateNotification(req, res) {
  const student = repository.getStudentById(req.body.studentId);
  if (!student) return res.status(404).json({ message: 'Estudante não encontrado.' });
  const created = repository.addNotification({
    studentId: student.id,
    to: student.email,
    subjectId: req.body.subjectId || null,
    type: req.body.type || 'manual',
    level: req.body.level || 'reminder',
    reference: req.body.reference || null,
    sourceReferences: Array.isArray(req.body.sourceReferences) ? req.body.sourceReferences : undefined,
    subject: String(req.body.subject || 'Alerta acadêmico'),
    body: String(req.body.body || '')
  });
  res.status(201).json(created);
}

function listNotifications(_req, res) {
  res.json(repository.listNotifications());
}

function simulateSend(req, res) {
  const notification = repository.markNotificationSent(req.params.notificationId);
  if (!notification) return res.status(404).json({ message: 'Notificação não encontrada.' });
  res.json({ ...notification, message: 'Envio simulado. Integração SMTP/Nodemailer fica para a próxima etapa.' });
}

async function getClusters(req, res, next) {
  try {
    const result = await clusterClass(req.params.classId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}


function getSimulation(_req, res) { res.json(simulation.getStatus()); }
function advanceSimulation(req, res) { res.json(simulation.advance(Number(req.body?.days || 7))); }
function nextSimulationEvent(_req, res) { res.json(simulation.advanceToNextEvent()); }
function resetSimulation(_req, res) { res.json(simulation.reset()); }

module.exports = {
  getSystemStatus,
  listClasses,
  getDashboard,
  getStudentProfile,
  updateSubject,
  previewNotifications,
  generateNotification,
  listNotifications,
  simulateSend,
  getClusters,
  getSimulation,
  advanceSimulation,
  nextSimulationEvent,
  resetSimulation
};
