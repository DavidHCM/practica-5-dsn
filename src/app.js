const express = require('express');
const { getPool } = require('./db');
const { env } = require('./config');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env });
});

app.get('/perros', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM perros');
    res.json(rows);
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

app.post('/perros', async (req, res) => {
  const { nombre, raza, edad } = req.body;

  if (!nombre || !raza || typeof edad !== 'number') {
    return res.status(400).json({ error: 'nombre, raza y edad (number) son obligatorios' });
  }

  try {
    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO perros (nombre, raza, edad) VALUES (?, ?, ?)',
      [nombre, raza, edad]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      raza,
      edad
    });
  } catch (err) {
    console.error('Error al crear perro:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.put('/perros/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, raza, edad } = req.body;

  try {
    const pool = await getPool();

    const [existing] = await pool.query('SELECT * FROM perros WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Perro no encontrado' });
    }

    const nuevoNombre = nombre ?? existing[0].nombre;
    const nuevaRaza = raza ?? existing[0].raza;
    const nuevaEdad = typeof edad === 'number' ? edad : existing[0].edad;

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
