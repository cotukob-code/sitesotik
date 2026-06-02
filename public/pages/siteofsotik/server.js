const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Разрешаем запросы с Laragon (например, http://site5.test)
app.use(cors({
  origin: ['http://site5.test', 'http://localhost:63342', 'http://localhost:5173'], // Добавьте нужные домены
  credentials: true
}));

app.use(express.json());

// Убираем раздачу статики — пусть Laragon сам отдаёт index.html
// app.use(express.static(path.join(__dirname)));

// Настройка PostgreSQL
const client = new Client({
  user: 'postgres',
  host: 'supa-postgres',
  database: 'postgres',
  password: 'pass',
  port: 5432,
});

client.connect()
  .then(() => console.log('✅ Подключено к PostgreSQL'))
  .catch(err => console.error('❌ Ошибка подключения к PostgreSQL:', err));

// === API Роуты ===

// Получить все сообщения
app.get('/api/messages', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT m.id, m.content, u.name, u.nickname, m.created_at 
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at ASC
    `);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Получить последний донат
app.get('/api/donations/latest', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT d.amount, d.method, d.bank, u.name, u.nickname, d.created_at
      FROM donations d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 1
    `);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отправить сообщение
app.post('/api/messages', async (req, res) => {
  const { name, content, nickname } = req.body;

  try {
    // Получить или создать пользователя
    let user = await client.query('SELECT * FROM users WHERE name = $1', [name]);
    if (user.rows.length === 0) {
      user = await client.query(
        'INSERT INTO users (name, nickname) VALUES ($1, $2) RETURNING *',
        [name, nickname || null]
      );
    } else if (nickname && !user.rows[0].nickname) {
      // Обновить ник, если он не был установлен
      await client.query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname, user.rows[0].id]);
      user.rows[0].nickname = nickname;
    }
    const userId = user.rows[0].id;

    // Вставить сообщение
    const result = await client.query(
      'INSERT INTO messages (user_id, content) VALUES ($1, $2) RETURNING *',
      [userId, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Отправить донат
app.post('/api/donations', async (req, res) => {
  const { name, amount, method, bank, nickname } = req.body;

  try {
    // Получить или создать пользователя
    let user = await client.query('SELECT * FROM users WHERE name = $1', [name]);
    if (user.rows.length === 0) {
      user = await client.query(
        'INSERT INTO users (name, nickname) VALUES ($1, $2) RETURNING *',
        [name, nickname || null]
      );
    } else if (nickname && !user.rows[0].nickname) {
      // Обновить ник, если он не был установлен
      await client.query('UPDATE users SET nickname = $1 WHERE id = $2', [nickname, user.rows[0].id]);
      user.rows[0].nickname = nickname;
    }
    const userId = user.rows[0].id;

    // Вставить донат
    const result = await client.query(
      'INSERT INTO donations (user_id, amount, method, bank) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, amount, method, bank]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер API запущен на http://localhost:${PORT}`);
  console.log(`💡 Доступно для: http://site5.test, http://localhost:63342`);
});