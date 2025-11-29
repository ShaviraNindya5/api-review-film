<<<<<<< HEAD
require(`dotenv`).config();
const express = require(`express`);
const cors = require(`cors`);
const db = require(`./db.js`); // Menggunakan modul pg baru
const bcrypt = require(`bcryptjs`);
const jwt = require(`jsonwebtoken`);
const { authenticateToken, authorizeRole } = require(`./middleware/auth.js`);
const app = express();
const PORT = process.env.PORT || 3300;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get(`/status`, (req, res) => {
  res.json({ ok: true, service: `film-api` });
});

// === AUTH ROUTES (Refactored for pg) ===
app.post(`/auth/register`, async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res
      .status(400)
      .json({ error: `Username dan password (min 6 char) harus diisi` });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username`;
    const result = await db.query(sql, [
      username.toLowerCase(),
      hashedPassword,
      `user`,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === `23505`) {
      // kode error unik PostgreSQL
      return res.status(409).json({ error: `Username sudah digunakan` });
    }
    next(err);
  }
});

app.post(`/auth/register-admin`, async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res
      .status(400)
      .json({ error: `Username dan password (min 6 char) harus diisi` });
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username`;
    const result = await db.query(sql, [
      username.toLowerCase(),
      hashedPassword,
      `admin`,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === `23505`) {
      return res.status(409).json({ error: `Username sudah digunakan` });
    }
    next(err);
  }
});

app.post(`/auth/login`, async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const sql = `SELECT * FROM users WHERE username = $1`;
    const result = await db.query(sql, [username.toLowerCase()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: `Kredensial tidak valid` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: `Kredensial tidak valid` });
    }

    const payload = {
      user: { id: user.id, username: user.username, role: user.role },
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: `1h` });
    res.json({ message: "Login Berhasil!", token: token });
  } catch (err) {
    next(err);
  }
});

// === MOVIE ROUTES (Refactored for pg) ===
app.get(`/movies`, async (req, res, next) => {
  const sql = `SELECT m.id, m.title, m.year, d.id as director_id, 
  d.name as director_name 
  FROM movies m LEFT JOIN directors d ON m.director_id = d.id
  ORDER BY m.id ASC`;
  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get(`/movies/:id`, async (req, res, next) => {
  const sql = `SELECT m.id, m.title, m.year, d.id as director_id, d.name as director_name FROM movies m LEFT JOIN directors d ON m.director_id = d.id WHERE m.id = $1`;
  try {
    const result = await db.query(sql, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Film tidak ditemukan` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.post(`/movies`, authenticateToken, async (req, res, next) => {
  const { title, director_id, year } = req.body;
  if (!title || !director_id || !year) {
    return res
      .status(400)
      .json({ error: `title, director_id, year wajib diisi` });
  }

  const sql = `INSERT INTO movies (title, director_id, year) VALUES ($1, $2, $3) RETURNING *`;
  try {
    const result = await db.query(sql, [title, director_id, year]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

app.put(
  `/movies/:id`,
  [authenticateToken, authorizeRole(`admin`)],
  async (req, res, next) => {
    const { title, director_id, year } = req.body;
    const sql = `UPDATE movies SET title = $1, director_id = $2, year = $3 WHERE id = $4 RETURNING *`;
    try {
      const result = await db.query(sql, [
        title,
        director_id,
        year,
        req.params.id,
      ]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: `Film tidak ditemukan` });
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

app.put(
  `/movies/:id`,
  [authenticateToken, authorizeRole(`admin`)],
  async (req, res, next) => {
    const { title, director_id, year } = req.body;
    const sql = `Update movies SET tittle = $1, director_id = $2, year = $3 WHERE id = $4 RETURNING *`;
    try {
      const result = await db.query(sql, [
        title,
        director_id,
        year,
        req.params.id,
      ]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: `Film tidak ditemukan` });
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

app.delete(
  `/movies/:id`,
  [authenticateToken, authorizeRole(`admin`)],
  async (req, res, next) => {
    const sql = `DELETE FROM movies WHERE id = $1 RETURNING *`;
    try {
      const result = await db.query(sql, [req.params.id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: `Film tidak ditemukan` });
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

//===DIRECTOR ROUTES (TUGAS PRAKTIKUM)===
//(Mahasiswa harus me-refactor endpoint/directors dengan pola yang sama)

// === FALLBACK & ERROR HANDLING ===
app.use((req, res) => {
  res.status(404).json({ error: `Rute tidak ditemukan` });
});

app.use((err, req, res, next) => {
  console.error(`[SERVER ERROR]`, err.stack);
  res.status(500).json({ error: `Terjadi kesalahan pada server` });
});

// Start server
app.listen(PORT, `0.0.0.0`, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
=======
const express = require("express");
const app = express();
const PORT = 3000;

// Middleware supaya bisa baca body JSON
app.use(express.json());

// Variabel untuk menyimpan data review dan auto-increment id
let nextId = 2; // karena data awal id=1
let reviews = [
  {
    id: 1,
    filmId: "2baf70d1-42bb-4437-b551-e5fed5a87abe",
    user: "Andi",
    rating: 5,
    comment: "Film animasi terbaik sepanjang masa!"
  }
];

// GET

// Cek server hidup
app.get("/status", (req, res) => {
  res.json({ message: "Server hidup!" });
});

// Lihat semua review
app.get("/reviews", (req, res) => {
  res.json(reviews);
});

// Ambil 1 review berdasarkan id
app.get("/reviews/:id", (req, res) => {
  const id = Number(req.params.id);
  const review = reviews.find(r => r.id === id);
  if (!review) {
    return res.status(404).json({ error: "Review tidak ditemukan" });
  }
  res.json(review);
});

// POST
// Tambah review baru
app.post("/reviews", (req, res) => {
  const { filmId, user, rating, comment } = req.body;

  // Validasi input
  if (!filmId || !user || !rating) {
    return res.status(400).json({ error: "filmId, user, dan rating wajib diisi" });
  }

  const newReview = {
    id: nextId++,
    filmId,
    user,
    rating,
    comment: comment || "" // jika kosong, isi string kosong
  };

  reviews.push(newReview);
  res.status(201).json(newReview);
});

//PUT 
// Update review berdasarkan id
app.put("/reviews/:id", (req, res) => {
  const id = Number(req.params.id);
  const reviewIndex = reviews.findIndex(r => r.id === id);

  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review tidak ditemukan" });
  }

  // Update hanya field yang dikirim user
  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    ...req.body,
    id // pastikan id tidak berubah
  };

  res.json(reviews[reviewIndex]);
});

//DELETE
// Hapus review berdasarkan id
app.delete("/reviews/:id", (req, res) => {
  const id = Number(req.params.id);
  const reviewIndex = reviews.findIndex(r => r.id === id);

  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review tidak ditemukan" });
  }

  reviews.splice(reviewIndex, 1);
  res.json({ message: "Review berhasil dihapus" });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
>>>>>>> c4603a5c7b371d16df898bc0d534527967e85121
});
