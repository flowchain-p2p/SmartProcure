const Todo = require('../models/Todo');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all todos for the current user in the current tenant
 * @route   GET /api/v1/todos
 * @access  Private
 */
exports.getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ 
      userId: req.user._id,
      tenantId: req.tenant._id
    });
    
    res.status(200).json({
      success: true,
      count: todos.length,
      data: todos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get single todo
 * @route   GET /api/v1/todos/:id
 * @access  Private
 */
exports.getTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      userId: req.user._id,
      tenantId: req.tenant._id
    });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Create new todo
 * @route   POST /api/v1/todos
 * @access  Private
 */
exports.createTodo = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Add user ID and tenant ID to the request body
    req.body.userId = req.user._id;
    req.body.tenantId = req.tenant._id;
    
    const todo = await Todo.create(req.body);
    
    res.status(201).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update todo
 * @route   PUT /api/v1/todos/:id
 * @access  Private
 */
exports.updateTodo = async (req, res) => {
  try {
    let todo = await Todo.findOne({
      _id: req.params.id,
      userId: req.user._id,
      tenantId: req.tenant._id
    });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    // Set the updatedAt field
    req.body.updatedAt = Date.now();
    
    // Update the todo
    todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete todo
 * @route   DELETE /api/v1/todos/:id
 * @access  Private
 */
exports.deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      userId: req.user._id,
      tenantId: req.tenant._id
    });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    await todo.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Toggle todo completion status
 * @route   PATCH /api/v1/todos/:id/toggle
 * @access  Private
 */
exports.toggleTodoStatus = async (req, res) => {
  try {
    let todo = await Todo.findOne({
      _id: req.params.id,
      userId: req.user._id,
      tenantId: req.tenant._id
    });
    
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: 'Todo not found'
      });
    }
    
    // Toggle the completed status
    todo = await Todo.findByIdAndUpdate(req.params.id, 
      { 
        completed: !todo.completed,
        updatedAt: Date.now() 
      }, 
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: todo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};