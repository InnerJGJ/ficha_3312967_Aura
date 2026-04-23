const db = require('../config/db');

const getAll = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM estadosreserva';
    db.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

module.exports = { getAll };