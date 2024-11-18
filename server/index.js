const express = require('express');
const cors = require('cors');
const {Pool} = require('pg');

const app = express();
const port = 3000;

// Set up PostgreSQL connection pool
const pool = new Pool({
    user: 'postgres', // Default PostgreSQL user
    host: 'npd-assistant.c5k0qqise3au.eu-west-2.rds.amazonaws.com',
    database: 'cluster0',
    password: 'eQWZdOplmXJuSERQR4vg',
    port: 5432, // Default PostgreSQL port
    ssl: {
      rejectUnauthorized: false // For AWS RDS, you may need to disable strict SSL
    }
  });

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Define a route to post email and password to the database
app.post('/register', async (req, res) => {
    const SentEmail = req.body.Email;
    const SentPassword = req.body.Password;
    try {
      const result = await pool.query(
        'INSERT INTO profile (email, password) VALUES ($1, $2)',
        [SentEmail, SentPassword]
      );
      console.log('Data inserted:', result.rows[0]);
      res.status(201).json({ message: 'Data inserted' });
    } catch (err) {
      console.error('Error inserting data', err.stack);
      res.status(500).json({ error: 'Database insert failed' });
    }
  });

// Define a route to log in if email and password are correct
app.post('/login', async (req, res) => {
    const SentEmail = req.body.Email;
    const SentPassword = req.body.Password;
    try {
      const result = await pool.query(
        'SELECT * FROM profile WHERE email = $1 AND password = $2',
        [SentEmail, SentPassword]
      );
      if (result.rows.length > 0) {
        console.log('Data retrieved:', result.rows[0]);
        const id = result.rows[0].id;
        const patient_name = result.rows[0].patient_name;
        const email = result.rows[0].email;
        const prescription = result.rows[0].prescription;
        const diagnosis = result.rows[0].diagnosis;
        const notes = result.rows[0].notes;
        const phone_number = result.rows[0].phone_number;
        const user_group = result.rows[0].user_group;
        res.status(200).json({ message: 'Login successful', id, patient_name, email, prescription, diagnosis, notes, phone_number, user_group });
      } else {
        console.log('Login details incorrect')
        res.status(401).json({ message: 'Login credentials incorrect' });
      }
    } catch (err) {
      console.error('Error retrieving data', err.stack);
      res.status(500).json({ error: 'Database retrieval failed' });
    }
  });

app.post('/createDetails', async (req, res) => {
  const sentName = req.body.Name;
  const email = req.body.Email;
  const phoneNumber = req.body.Phone;
  const diagnosis = req.body.Diagnosis;
  const prescription = req.body.Prescription;
  const notes = req.body.Notes;
  const user_group = req.body.User_Group;
  console.log('Data received:', sentName, email, phoneNumber, diagnosis, prescription, notes, user_group);
  try {
    const result = await pool.query(
      `UPDATE profile
      SET patient_name = $1,
      prescription = $3,
      diagnosis = $4,
      notes = $5,
      user_group = $6,
      phone_number = $7
      WHERE email = $2;`,
      [sentName, email, prescription, diagnosis, notes, user_group, phoneNumber]
    );
    res.status(201).json({message: 'Data inserted'});
  } catch (err) {
    console.error('Error inserting or updating data', err.stack);
    // drop the user from the database
    const result = await pool.query(
      'DELETE FROM profile WHERE email = $1',
      [email]
    );
    res.status(500).json({ error: 'Failed to insert or update data' });
  }
});

app.post('/update-details', async (req, res) => {
  const sentName = req.body.Name;
  const email = req.body.Email;
  const phoneNumber = req.body.Phone;
  const diagnosis = req.body.Diagnosis;
  const prescription = req.body.Prescription;
  const notes = req.body.Notes;
  try {
    const result = await pool.query(
      `INSERT INTO profile (name, email, prescription, diagnosis, notes, phone_number) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        ON CONFLICT (email) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          prescription = EXCLUDED.prescription,
          diagnosis = EXCLUDED.diagnosis,
          notes = EXCLUDED.notes,
          phone_number = EXCLUDED.phone_number
        RETURNING *`,
      [sentName, email, prescription, diagnosis, notes, phoneNumber]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting or updating data', err.stack);
    res.status(500).json({ error: 'Failed to insert or update data' });
  }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });