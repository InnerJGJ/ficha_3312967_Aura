const mysql = require('mysql2/promise');

<<<<<<< HEAD
const db = require('../config/db.js');

module.exports = db;
=======
const connection = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospedaje',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = connection;
>>>>>>> Diego
