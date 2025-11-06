const mongoose = require('mongoose');
const EmployeeSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
name: { type: String, required: true },
department: String,
attendance: [{ date: Date, status: { type: String, enum: ['present','absent','leave'] } }],
tasksCompleted: { type: Number, default: 0 },
performanceScore: { type: Number, default: 0 },
salary: { type: Number, default: 0 },
daIncrement: { type: Number, default: 0 } // annual increment amount
}, { timestamps: true });
module.exports = mongoose.model('Employee', EmployeeSchema);