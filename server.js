const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let reviews = [
  {
    id: 1,
    filmId: "2baf70d1-42bb-4437-b551-e5fed5a87abe",
    user: "Andi",
    rating: 5,
    comment: "Film animasi terbaik sepanjang masa!"
  }
];

// Route cek server hidup
app.get("/status", (req, res) => {
  res.json({ message: "Server hidup!" });
});

// Route lihat semua review
app.get("/reviews", (req, res) => {
  res.json(reviews);
});

// Ambil 1 review berdasarkan id
app.get("/reviews/:id", (req, res) => {
  const id = Number(req.params.id); // ambil id dari URL
  const review = reviews.find(r => r.id === id); // cari review
  if (!review) {
    return res.status(404).json({ error: "Review tidak ditemukan" });
  }
  res.json(review);
});


app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
