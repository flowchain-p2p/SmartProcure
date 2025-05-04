const mongoose = require('mongoose');
const Department = require('../models/Department');

const DepartmentController = {
  /**
   * @desc    Get all departments for a tenant
   * @route   GET /api/v1/tenants/:tenantSlug/departments
   * @access  Private
   */
  getDepartments: async (req, res) => {
    try {
      const departments = await Department.find({
        tenantId: req.tenant.id
      }).populate('manager', 'name');

      res.status(200).json({
        success: true,
        count: departments.length,
        data: departments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  },

  /**
   * @desc    Get single department
   * @route   GET /api/v1/tenants/:tenantSlug/departments/:id
   * @access  Private
   */
  getDepartment: async (req, res) => {
    try {
      const department = await Department.findOne({
        _id: req.params.id,
        tenantId: req.tenant.id
      }).populate('manager', 'name');

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.status(200).json({
        success: true,
        data: department
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  },

  /**
   * @desc    Create new department
   * @route   POST /api/v1/tenants/:tenantSlug/departments
   * @access  Private
   */
  createDepartment: async (req, res) => {
    try {
      req.body.tenantId = req.tenant.id;
      const department = await Department.create(req.body);

      res.status(201).json({
        success: true,
        data: department
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * @desc    Update department
   * @route   PUT /api/v1/tenants/:tenantSlug/departments/:id
   * @access  Private
   */
  updateDepartment: async (req, res) => {
    try {
      let department = await Department.findOne({
        _id: req.params.id,
        tenantId: req.tenant.id
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      department = await Department.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: department
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  },

  /**
   * @desc    Delete department
   * @route   DELETE /api/v1/tenants/:tenantSlug/departments/:id
   * @access  Private
   */
  deleteDepartment: async (req, res) => {
    try {
      const department = await Department.findOne({
        _id: req.params.id,
        tenantId: req.tenant.id
      });

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      await department.remove();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Server Error'
      });
    }
  }
};

module.exports = DepartmentController;
