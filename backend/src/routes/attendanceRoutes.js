const express = require('express');
const AttendanceController = require('../controllers/attendanceController');

const router = express.Router();

router.post('/check-in', AttendanceController.checkIn);
router.post('/check-out', AttendanceController.checkOut);
router.get('/', AttendanceController.getAttendance);
router.get('/stats', AttendanceController.getAttendanceStats);
router.get('/status', AttendanceController.getCurrentStatus);

module.exports = router;