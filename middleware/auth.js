const jwt = require(`jsonwebtoken`);
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  const authHeader = req.headers[`authorization`];
  const token = authHeader && authHeader.split(` `)[1];
  if (token == null) {
    return res.status(401).json({ error: `Token Tidak Ditemukan` });
  }
  jwt.verify(token, JWT_SECRET, (err, decodedPayload) => {
    if (err) {
      return res.status(403).json({ error: `Token tidak valid` });
    }
    req.user = decodedPayload.user;

    next();
  });
}
function authorizeRole(role) {
  return (req, res, next) => {
    //Middleware ini harus dijalankan SETELAH authenticateToken
    if (req.user && req.user.role === role) {
      next();
    } else {
      //Pengguna terautentikasi, tetapi tidak memiliki izin
      return res
        .status(403)
        .json({ error: `Akses dilarang: Peran tidak memadai` });
    }
  };
}

module.exports = {
  authenticateToken,
  authorizeRole,
};
