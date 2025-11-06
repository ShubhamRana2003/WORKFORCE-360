// backend/routes/employees.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Employee = require('../models/Employee');
const User = require('../models/User');

// ✅ Create new employee (HR/Manager/Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (!['hr', 'admin', 'manager'].includes(req.fullUser.role)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    const { name, department, salary } = req.body;
    const employee = new Employee({ name, department, salary });
    await employee.save();
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Get all employees (paginated)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const employees = await Employee.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Get single employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Update employee (HR/Manager/Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!['hr', 'admin', 'manager'].includes(req.fullUser.role)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Mark attendance
router.post('/:id/attendance', auth, async (req, res) => {
  try {
    const { date, status } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    employee.attendance.push({
      date: date ? new Date(date) : new Date(),
      status,
    });
    await employee.save();
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Increment tasks completed
router.post('/:id/task', auth, async (req, res) => {
  try {
    const { increment = 1 } = req.body;
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });

    employee.tasksCompleted += increment;
    employee.performanceScore = computePerformance(employee);
    await employee.save();
    res.json(employee);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Run DA increment for top performers (HR/Admin only)
router.post('/run-da-increment', auth, async (req, res) => {
  try {
    if (!['hr', 'admin'].includes(req.fullUser.role)) {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    const allEmployees = await Employee.find();
    allEmployees.forEach((emp) => {
      emp.performanceScore = computePerformance(emp);
    });

    // Sort by performanceScore descending
    allEmployees.sort((a, b) => b.performanceScore - a.performanceScore);

    const topN = Math.max(1, Math.floor(allEmployees.length * 0.1)); // top 10%
    const topPerformers = allEmployees.slice(0, topN);

    // Apply DA increment (5% of salary)
    const updates = [];
    for (const emp of topPerformers) {
      emp.daIncrement = Math.round(emp.salary * 0.05);
      updates.push(emp.save());
    }

    await Promise.all(updates);
    res.json({
      updated: topPerformers.map((e) => ({
        id: e._id,
        name: e.name,
        daIncrement: e.daIncrement,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Helper function: compute performance
function computePerformance(emp) {
  const totalDays = emp.attendance.length || 0;
  const presentDays = emp.attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = totalDays ? presentDays / totalDays : 0;
  return Math.round(emp.tasksCompleted * 2 + attendanceRate * 100);
}

// ✅ Export router
module.exports = router;
