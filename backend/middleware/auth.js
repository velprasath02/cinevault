const jwt = require("jsonwebtoken")

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization

  if (!header) {
    return res.status(401).json({ message: "No token" })
  }

  // Expect: Bearer TOKEN
  const token = header.split(" ")[1]

  try {
    const decoded = jwt.verify(token, "SECRET_KEY")
    req.userId = decoded.id   // 👈 IMPORTANT
    next()
  } catch (err) {
    res.status(401).json({ message: "Invalid token" })
  }
}

module.exports = authMiddleware