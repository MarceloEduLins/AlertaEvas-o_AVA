const express = require('express');
const controller = require('../controllers/academic.controller');

const router = express.Router();

router.get('/system/status', controller.getSystemStatus);

router.get('/simulation', controller.getSimulation);
router.post('/simulation/advance', controller.advanceSimulation);
router.post('/simulation/next-event', controller.nextSimulationEvent);
router.post('/simulation/reset', controller.resetSimulation);

router.get('/classes', controller.listClasses);
router.get('/classes/:classId/dashboard', controller.getDashboard);
router.get('/classes/:classId/clusters', controller.getClusters);
router.get('/students/:studentId/profile', controller.getStudentProfile);
router.patch('/students/:studentId/subjects/:subjectId', controller.updateSubject);
router.get('/students/:studentId/notifications/preview', controller.previewNotifications);
router.get('/notifications', controller.listNotifications);
router.post('/notifications', controller.generateNotification);
router.post('/notifications/:notificationId/send', controller.simulateSend);

module.exports = router;
