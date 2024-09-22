const instana = require('@instana/collector');
instana();
require('dotenv').config();
const oracledb = require('oracledb');
const express = require('express');
const app = express();
app.use(express.json());

async function setupDatabase() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECTION_STRING,
    });

    console.log('Successfully connected to the database');

    const createTableQuery = `
      DECLARE
        table_exists NUMBER := 0;
      BEGIN
        SELECT COUNT(*)
        INTO table_exists
        FROM user_tables
        WHERE table_name = 'EMPLOYEES';

        IF table_exists = 0 THEN
          EXECUTE IMMEDIATE '
            CREATE TABLE employees (
              employee_id NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
              first_name VARCHAR2(50),
              last_name VARCHAR2(50),
              email VARCHAR2(100),
              hire_date DATE,
              job_title VARCHAR2(50)
            )';
        END IF;
      END;`;

    await connection.execute(createTableQuery);
    console.log('Table "employees" checked/created successfully');
    await connection.commit();
  } catch (err) {
    console.error('Error setting up the database:', err);
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed');
      } catch (err) {
        console.error('Error closing the connection:', err);
      }
    }
  }
}

setupDatabase();

app.post('/employees', async (req, res) => {
  let connection;
  const { first_name, last_name, email, job_title } = req.body;

  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECTION_STRING,
    });
    const insertDataQuery = `
      INSERT INTO employees (first_name, last_name, email, hire_date, job_title)
      VALUES (:first_name, :last_name, :email, SYSDATE, :job_title)`;

    await connection.execute(insertDataQuery, {
      first_name,
      last_name,
      email,
      job_title,
    });
    await connection.commit();

    res.status(200).json({ message: 'Employee data inserted successfully' });
  } catch (err) {
    console.error('Error inserting data:', err);
    res
      .status(500)
      .json({ message: 'Error inserting data', error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed');
      } catch (err) {
        console.error('Error closing the connection:', err);
      }
    }
  }
});

app.get('/employees', async (req, res) => {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectionString: process.env.DB_CONNECTION_STRING,
    });
    const result = await connection.execute('SELECT * FROM employees');
    res.status(200).json({ employees: result.rows });
  } catch (err) {
    console.error('Error fetching data:', err);
    res
      .status(500)
      .json({ message: 'Error fetching data', error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log('Connection closed');
      } catch (err) {
        console.error('Error closing the connection:', err);
      }
    }
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
