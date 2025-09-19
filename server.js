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
});
