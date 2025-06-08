const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const connectDB = require('./db/db.connect');
require('dotenv').config();

// Import models
const User = require('./models/user.model');
const Project = require('./models/project.model');
const Assignment = require('./models/assignment.model');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    // console.log("token: ",token);

    //verify jwt token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoded: ",decoded);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    console.log('Protected route accessed');
    const user = await User.findById(req.user.id);
    // console.log("requested user: ",user);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.status(200).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Engineer Routes
app.get('/api/engineers', authMiddleware, async (req, res) => {
  try {
    const engineers = await User.find({ role: 'engineer' });

    res.json(engineers);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/engineers/:id/capacity', authMiddleware, async (req, res) => {
  try {
    const engineer = await User.findById(req.params.id);
    if (!engineer || engineer.role !== 'engineer') {
      return res.status(404).json({ message: 'Engineer not found' });
    }

    const assignments = await Assignment.find({ engineerId: req.params.id });
    const totalAllocation = assignments.reduce(
      (sum, assignment) => sum + assignment.allocationPercentage,
      0
    );

    res.json({
      maxCapacity: engineer.maxCapacity,
      currentAllocation: totalAllocation,
      availableCapacity: engineer.maxCapacity - totalAllocation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Project Routes
app.get('/api/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find().populate('managerId', 'name email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/projects', authMiddleware, async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/projects/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'managerId',
      'name email'
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assignment Routes
app.get('/api/assignments', authMiddleware, async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('engineerId', 'name email')
      .populate('projectId', 'name');
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/assignments', authMiddleware, async (req, res) => {
  try {
    const assignment = new Assignment(req.body);
    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('engineerId', 'name email')
      .populate('projectId', 'name');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate('engineerId', 'name email')
      .populate('projectId', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/assignments/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndDelete(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Resourcely API' });
});

// Start server
const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
module.exports = app;
