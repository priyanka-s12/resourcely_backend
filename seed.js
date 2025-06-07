const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const connectDB = require('./db/db.connect');
require('dotenv').config();

// Import models
const User = require('./models/user.model');
const Project = require('./models/project.model');
const Assignment = require('./models/assignment.model');

const engineers = [
    {
      "email": "john.doe@resourcely.com",
      "name": "John Doe",
      "password": "password123",
      "role": "engineer",
      "skills": ["React", "Node.js", "MongoDB"],
      "seniority": "senior",
      "maxCapacity": 100,
      "department": "Engineering"
    },
    {
      "email": "jane.smith@resourcely.com",
      "name": "Jane Smith",
      "password": "password123",
      "role": "engineer",
      "skills": ["Python", "Django", "PostgreSQL"],
      "seniority": "mid",
      "maxCapacity": 50,
      "department": "Engineering"
    },
    {
      "email": "mike.wilson@resourcely.com",
      "name": "Mike Wilson",
      "password": "password123",
      "role": "engineer",
      "skills": ["React", "TypeScript", "AWS"],
      "seniority": "junior",
      "maxCapacity": 100,
      "department": "Engineering"
    },
    {
      "email": "sarah.johnson@resourcely.com",
      "name": "Sarah Johnson",
      "password": "password123",
      "role": "engineer",
      "skills": ["Java", "Spring Boot", "MySQL"],
      "seniority": "mid",
      "maxCapacity": 50,
      "department": "Engineering"
    }
  ] 

  const managers = [
    {
      "email": "alex.brown@resourcely.com",
      "name": "Alex Brown",
      "password": "password123",
      "role": "manager",
      "department": "Engineering"
    },
    {
      "email": "emma.davis@resourcely.com",
      "name": "Emma Davis",
      "password": "password123",
      "role": "manager",
      "department": "Engineering"
    }
  ] 

async function seed() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Assignment.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Hash passwords and create users
    const hashedEngineers = await Promise.all(engineers.map(async engineer => ({
      ...engineer,
      password: await bcrypt.hash(engineer.password, 10)
    })));

    const hashedManagers = await Promise.all(managers.map(async manager => ({
      ...manager,
      password: await bcrypt.hash(manager.password, 10)
    })));

    const createdUsers = await User.insertMany([...hashedEngineers, ...hashedManagers]);
    console.log('Created users');

    // Get created managers and engineers
    const createdManagers = createdUsers.filter(user => user.role === 'manager');
    const createdEngineers = createdUsers.filter(user => user.role === 'engineer');

    // Create projects with actual manager IDs
    const projects = [
      {
        "name": "E-commerce Platform",
        "description": "Building a modern e-commerce platform with React and Node.js",
        "startDate": new Date("2025-06-01"),
        "endDate": new Date("2025-06-30"),
        "requiredSkills": ["React", "Node.js", "MongoDB"],
        "teamSize": 4,
        "status": "active",
        "managerId": createdManagers[0]._id
      },
      {
        "name": "Data Analytics Dashboard",
        "description": "Creating a real-time analytics dashboard using Python and Django",
        "startDate": new Date("2025-05-01"),
        "endDate": new Date("2025-7-31"),
        "requiredSkills": ["Python", "Django", "PostgreSQL"],
        "teamSize": 3,
        "status": "planning",
        "managerId": createdManagers[1]._id
      },
      {
        "name": "Cloud Migration Project",
        "description": "Migrating legacy systems to AWS cloud infrastructure",
        "startDate": new Date("2025-06-01"),
        "endDate": new Date("2025-08-30"),
        "requiredSkills": ["AWS", "Java", "Spring Boot"],
        "teamSize": 3,
        "status": "planning",
        "managerId": createdManagers[0]._id
      }
    ];

    const createdProjects = await Project.insertMany(projects);
    console.log('Created projects');

    // Create assignments with actual IDs
    const assignments = [
      {
        "engineerId": createdEngineers[0]._id,
        "projectId": createdProjects[0]._id,
        "allocationPercentage": 100,
        "startDate": new Date("2025-06-01"),
        "endDate": new Date("2025-06-30"),
        "role": "Tech Lead"
      },
      {
        "engineerId": createdEngineers[0]._id,
        "projectId": createdProjects[1]._id,
        "allocationPercentage": 50,
        "startDate": new Date("2025-05-01"),
        "endDate": new Date("2025-7-31"),
        "role": "Developer"
      },
      {
        "engineerId": createdEngineers[1]._id,
        "projectId": createdProjects[0]._id,
        "allocationPercentage": 100,
        "startDate": new Date("2025-06-01"),
        "endDate": new Date("2025-06-30"),
        "role": "Developer"
      },
      {
        "engineerId": createdEngineers[2]._id,
        "projectId": createdProjects[2]._id,
        "allocationPercentage": 50,
        "startDate": new Date("2025-06-01"),
        "endDate": new Date("2025-08-30"),
        "role": "Developer"
      },
      {
        "engineerId": createdEngineers[3]._id,
        "projectId": createdProjects[2]._id,
        "allocationPercentage": 50,
        "startDate": new Date("2025-06-01"),
        "endDate": new Date("2025-08-30"),
        "role": "Tech Lead"
      },
      {
        "engineerId": createdEngineers[1]._id,
        "projectId": createdProjects[1]._id,
        "allocationPercentage": 50,
        "startDate": new Date("2025-05-01"),
        "endDate": new Date("2025-7-31"),
        "role": "Developer"
      }
    ];

    await Assignment.insertMany(assignments);
    console.log('Created assignments');

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed(); 