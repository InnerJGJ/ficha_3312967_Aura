const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
<<<<<<< HEAD
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'aura_travel',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
=======
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
>>>>>>> Diego
});

module.exports = db;