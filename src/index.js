const app = require('./app');
const { port, env } = require('./config');

app.listen(port, () => {
  console.log(`Servidor escuchando en puerto ${port} (env: ${env})`);
});
