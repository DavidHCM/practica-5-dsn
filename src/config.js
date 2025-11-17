require('dotenv').config();

const APP_ENV = process.env.APP_ENV || 'local';

const configs = {
  local: {
    db: {
      host: process.env.DB_HOST_LOCAL || 'localhost',
      port: process.env.DB_PORT_LOCAL || 3306,
      user: process.env.DB_USER_LOCAL || 'root',
      password: process.env.DB_PASS_LOCAL || 'password',
      database: process.env.DB_NAME_LOCAL || 'practica_local'
    }
  },
  prod: {
    db: {
      host: process.env.DB_HOST_PROD,
      port: process.env.DB_PORT_PROD || 3306,
      user: process.env.DB_USER_PROD,
      password: process.env.DB_PASS_PROD,
      database: process.env.DB_NAME_PROD || 'practica_prod'
    }
  }
};

if (!configs[APP_ENV]) {
  throw new Error(`APP_ENV inválido: ${APP_ENV}`);
}

const PORT = process.env.PORT || 3000;

module.exports = {
  env: APP_ENV,
  port: PORT,
  dbConfig: configs[APP_ENV].db
};
