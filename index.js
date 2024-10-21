const instana = require('@instana/collector');
instana(); // Initialize Instana for monitoring
const express = require('express');
const { setupDatabase, insertEmployee, getEmployees } = require('./db'); // Import functions from db.js
require('dotenv').config();

const app = express();
app.use(express.json());

setupDatabase(); // Setup database on server start

app.post('/employees', async (req, res) => {
  const { first_name, last_name, email, job_title } = req.body;

  try {
    const employeeData = { first_name, last_name, email, job_title };
    const response = await insertEmployee(employeeData);
    res.status(200).json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/employees', async (req, res) => {
  try {
    const employees = await getEmployees();
    res.status(200).json({ employees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
