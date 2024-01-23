// require('dotenv').config();
// const { Pool } = require('pg');

// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//     ssl: {
//         rejectUnauthorized: false
//     }
// });

// pool.on('error', (err, client) => {
//     console.error('Unexpected error on idle client', err);
//     process.exit(-1);
// });

// module.exports = pool;

const { Pool } = require("pg");

const pool = new Pool({
  user: "charon",
  host: "localhost",
  database: "cubeconnect",
  port: 5432,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = pool;
