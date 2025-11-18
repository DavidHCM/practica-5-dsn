const express = require('express');
const { getPool } = require('./db');
const { env } = require('./config');

const app = express();

app.use(express.json());
function validarPerro(req, res, next) {
  const { nombre, raza, edad } = req.body;

  if (req.method === 'POST') {
    if (!nombre || !raza || typeof edad !== 'number' || !Number.isInteger(edad) || edad < 0) {
      return res.status(400).json({
        error: 'nombre (string), raza (string) y edad (entero >= 0) son obligatorios'
      });
    }
  }

  if (req.method === 'PUT' || req.method === 'PATCH') {
    const tieneNombre = typeof nombre === 'string';
    const tieneRaza = typeof raza === 'string';
    const tieneEdad =
      typeof edad === 'number' && Number.isInteger(edad) && edad >= 0;

    if (!tieneNombre && !tieneRaza && !tieneEdad) {
      return res.status(400).json({
        error: 'Debes enviar al menos uno de los campos: nombre, raza o edad (entero >= 0)'
      });
    }
  }

  next();
}


app.get('/', (req, res) => {
  res.json({
    name: 'Perros API',
    env,
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      list: 'GET /perros',
      get: 'GET /perros/:id',
      create: 'POST /perros',
      update: 'PUT /perros/:id',
      patch: 'PATCH /perros/:id',
      delete: 'DELETE /perros/:id'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env });
});

app.get('/perros', async (req, res) => {
  const { raza, nombre, minEdad, maxEdad, page = 1, limit = 10 } = req.query;

  const filtros = [];
  const valores = [];

  if (raza) {
    filtros.push('raza = ?');
    valores.push(raza);
  }

  if (nombre) {
    filtros.push('nombre LIKE ?');
    valores.push(`%${nombre}%`);
  }

  if (minEdad !== undefined) {
    filtros.push('edad >= ?');
    valores.push(Number(minEdad));
  }

  if (maxEdad !== undefined) {
    filtros.push('edad <= ?');
    valores.push(Number(maxEdad));
  }

  const pagina = Math.max(Number(page) || 1, 1);
  const limite = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (pagina - 1) * limite;

  const whereClause = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

  try {
    const pool = await getPool();

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM perros ${whereClause}`,
      valores
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM perros ${whereClause} ORDER BY id ASC LIMIT ? OFFSET ?`,
      [...valores, limite, offset]
    );

    res.json({
      page: pagina,
      limit: limite,
      total,
      data: rows
    });
  } catch (err) {
    console.error('Error al obtener perros:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/perros/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM perros WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Perro no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener perro:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/perros', validarPerro, async (req, res) => {
  const { nombre, raza, edad } = req.body;

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO perros (nombre, raza, edad) VALUES (?, ?, ?)',
      [nombre, raza, edad]
    );

    const nuevo = {
      id: result.insertId,
      nombre,
      raza,
      edad
    };

    res
      .status(201)
      .location(`/perros/${result.insertId}`)
      .json(nuevo);
  } catch (err) {
    console.error('Error al crear perro:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});


app.put('/perros/:id', validarPerro, async (req, res) => {
  const { id } = req.params;
  const { nombre, raza, edad } = req.body;

  try {
    const pool = await getPool();

    const [existing] = await pool.query('SELECT * FROM perros WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Perro no encontrado' });
    }

    const actual = existing[0];

    const nuevoNombre = typeof nombre === 'string' ? nombre : actual.nombre;
    const nuevaRaza = typeof raza === 'string' ? raza : actual.raza;
    const nuevaEdad =
      typeof edad === 'number' && Number.isInteger(edad) && edad >= 0
        ? edad
        : actual.edad;

    await pool.query(
      'UPDATE perros SET nombre = ?, raza = ?, edad = ? WHERE id = ?',
      [nuevoNombre, nuevaRaza, nuevaEdad, id]
    );

    res.json({
      id: Number(id),
      nombre: nuevoNombre,
      raza: nuevaRaza,
      edad: nuevaEdad
    });
  } catch (err) {
    console.error('Error al actualizar perro:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});


app.patch('/perros/:id', validarPerro, async (req, res) => {
  const { id } = req.params;
  const { nombre, raza, edad } = req.body;

  try {
    const pool = await getPool();

    const [existing] = await pool.query('SELECT * FROM perros WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Perro no encontrado' });
    }

    const actual = existing[0];

    const nuevoNombre = typeof nombre === 'string' ? nombre : actual.nombre;
    const nuevaRaza = typeof raza === 'string' ? raza : actual.raza;
    const nuevaEdad =
      typeof edad === 'number' && Number.isInteger(edad) && edad >= 0
        ? edad
        : actual.edad;

    await pool.query(
      'UPDATE perros SET nombre = ?, raza = ?, edad = ? WHERE id = ?',
      [nuevoNombre, nuevaRaza, nuevaEdad, id]
    );

    res.json({
      id: Number(id),
      nombre: nuevoNombre,
      raza: nuevaRaza,
      edad: nuevaEdad
    });
  } catch (err) {
    console.error('Error al hacer patch de perro:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});


app.delete('/perros/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await getPool();
    const [result] = await pool.query('DELETE FROM perros WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Perro no encontrado' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error al eliminar perro:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = app;
