const express = require('express');
const { check } = require('express-validator');
const { 
  getTodos, 
  getTodo, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  toggleTodoStatus
} = require('../controllers/todoController');
const { identifyTenantFromToken } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Protect all routes
router.use(identifyTenantFromToken);

// Get all todos for the current user
router.get('/', getTodos);

// Get single todo
router.get('/:id', getTodo);

// Create a new todo
router.post('/', 
  [
    check('title', 'Title is required').not().isEmpty(),
  ],
  createTodo
);

// Update todo
router.put('/:id', updateTodo);

// Delete todo
router.delete('/:id', deleteTodo);

// Toggle todo completion status
router.patch('/:id/toggle', toggleTodoStatus);

module.exports = router;