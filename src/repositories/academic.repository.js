const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'academic.json');
const SEED_FILE = path.join(__dirname, '..', 'data', 'academic.seed.json');

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  // Escrita atômica: evita que uma leitura enxergue JSON parcial enquanto
  // a simulação está persistindo muitos eventos/notificações.
  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tempFile, DATA_FILE);
  return data;
}


function resetData() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  writeData(seed);
  return seed;
}

function getClassById(id) {
  const data = readData();
  return data.classes.find((item) => item.id === id) || null;
}

function listClasses() {
  return readData().classes;
}

function listSubjects() {
  return readData().subjects;
}

function listStudents(classId) {
  return readData().students.filter((student) => !classId || student.classId === classId);
}

function getStudentById(id) {
  return readData().students.find((student) => student.id === id) || null;
}

function getSubjectById(id) {
  return readData().subjects.find((subject) => subject.id === id) || null;
}

function getEnrollment(studentId, subjectId) {
  return readData().enrollments.find(
    (item) => item.studentId === studentId && item.subjectId === subjectId
  ) || null;
}

function listEnrollmentsForStudent(studentId) {
  return readData().enrollments.filter((item) => item.studentId === studentId);
}

function listEnrollmentsForClass(classId) {
  const data = readData();
  const ids = new Set(data.students.filter((student) => student.classId === classId).map((student) => student.id));
  return data.enrollments.filter((item) => ids.has(item.studentId));
}

function updateEnrollment(studentId, subjectId, patch) {
  const data = readData();
  const index = data.enrollments.findIndex(
    (item) => item.studentId === studentId && item.subjectId === subjectId
  );
  if (index === -1) return null;
  data.enrollments[index] = { ...data.enrollments[index], ...patch };
  writeData(data);
  return data.enrollments[index];
}

function addNotification(notification) {
  const data = readData();
  const created = {
    id: `n${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'preview',
    ...notification
  };
  data.notifications.unshift(created);
  writeData(data);
  return created;
}

function listNotifications() {
  return readData().notifications || [];
}

function markNotificationSent(id) {
  const data = readData();
  const notification = data.notifications.find((item) => item.id === id);
  if (!notification) return null;
  notification.status = 'simulated_sent';
  notification.sentAt = new Date().toISOString();
  writeData(data);
  return notification;
}

module.exports = {
  readData,
  writeData,
  listClasses,
  getClassById,
  listSubjects,
  listStudents,
  getStudentById,
  getSubjectById,
  getEnrollment,
  listEnrollmentsForStudent,
  listEnrollmentsForClass,
  updateEnrollment,
  addNotification,
  listNotifications,
  markNotificationSent,
  resetData
};
