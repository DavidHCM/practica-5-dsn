const mysql = require('mysql2/promise');
const { dbConfig, env } = require('./config');

let pool = null;

async function initDB() {
  if (!pool) {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        console.log(
          `Conectando a MySQL (env=${env}) host=${dbConfig.host} db=${dbConfig.database} intento ${retries + 1}/${maxRetries}`
        );

        pool = mysql.createPool({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password,
          database: dbConfig.database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });

        await pool.query('SELECT 1');
        console.log('Conexión exitosa a MySQL');
        return pool;
      } catch (err) {
        retries++;
        console.error(
          `Error al conectar a MySQL. Reintentando (${retries}/${maxRetries})...`,
          err.message
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    throw new Error('No se pudo conectar a MySQL después de varios intentos');
  }

  return pool;
}

async function getPool() {
  if (!pool) {
    await initDB();
  }
  return pool;
}

module.exports = { getPool };
