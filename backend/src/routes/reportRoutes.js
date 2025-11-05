const express = require('express');
const ReportController = require('../controllers/reportController');

const router = express.Router();

router.get('/', ReportController.getAllReports);
router.post('/', ReportController.createReport);
router.put('/:id', ReportController.updateReport);

module.exports = router;