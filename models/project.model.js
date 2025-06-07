const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  
  },
  description: {
    type: String,
    required: true,
   
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  requiredSkills: {
    type: [String],
  },
  teamSize: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed'],
    default: 'planning'
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'resourcelyUser',
    required: true
  }
}, {
  timestamps: true
});



const Project = mongoose.model('resourcelyProject', projectSchema);

module.exports = Project; 