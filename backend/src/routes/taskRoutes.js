const express = require('express');
const TaskController = require('../controllers/taskController');

const router = express.Router();

router.get('/', TaskController.getAllTasks);
router.get('/stats', TaskController.getTaskStats);
router.get('/:id', TaskController.getTaskById);
router.post('/', TaskController.createTask);
router.put('/:id', TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

module.exports = router;