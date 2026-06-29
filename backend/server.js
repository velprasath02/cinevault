const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env") })

const authMiddleware = require("./middleware/auth")
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const fs = require("fs")

const app = express()

app.use(cors())
app.use(express.json())

/* ==========================
   TMDB PROXY
========================== */
app.get("/api/tmdb/*splat", async (req, res) => {
  try {
    const apiPath = req.params.splat || req.path.replace(/^\/api\/tmdb\//, "")
    const queryParams = new URLSearchParams(req.query)
    queryParams.set("api_key", process.env.TMDB_API_KEY)

    const url = `https://api.themoviedb.org/3/${apiPath}?${queryParams.toString()}`
    const response = await fetch(url)
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (err) {
    console.error("TMDB Proxy Error:", err)
    res.status(500).json({ message: "Error fetching data from TMDB" })
  }
})

const DB_FILE = path.join(__dirname, "db.json")

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8")
    return JSON.parse(data)
  } catch (err) {
    return { users: [] }
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8")
}

/* ==========================
   SIGNUP
========================== */

app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body

    const db = readDB()
    const existingUser = db.users.find(u => u.email === email)

    if (existingUser) {
      return res.json({
        message: "User already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = {
      _id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      watchlist: []
    }

    db.users.push(newUser)
    writeDB(db)

    const token = jwt.sign(
      {
        id: newUser._id
      },
      "SECRET_KEY",
      {
        expiresIn: "7d"
      }
    )

    res.json({
      message: "User created successfully",
      token,
      username: newUser.username,
      profilePicture: ""
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "Server error"
    })
  }
})

/* ==========================
   LOGIN
========================== */

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const db = readDB()
    const user = db.users.find(u => u.email === email)

    if (!user) {
      return res.json({
        message: "User not found"
      })
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    )

    if (!isMatch) {
      return res.json({
        message: "Wrong password"
      })
    }

    const token = jwt.sign(
      {
        id: user._id
      },
      "SECRET_KEY",
      {
        expiresIn: "7d"
      }
    )

    res.json({
      token,
      username: user.username,
      profilePicture: user.profilePicture || ""
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "Server error"
    })
  }
})

/* ==========================
   ADD TO WATCHLIST
========================== */

app.post("/watchlist", authMiddleware, async (req, res) => {
  try {
    console.log("USER ID:", req.userId)
    console.log("BODY:", req.body)

    const db = readDB()
    const userIndex = db.users.findIndex(u => u._id === req.userId)

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    const user = db.users[userIndex]

    const exists = user.watchlist.find(
      movie => movie.movieId === req.body.movieId
    )

    if (exists) {
      return res.json({
        message: "Already in watchlist"
      })
    }

    user.watchlist.push({
      movieId: req.body.movieId,
      title: req.body.title,
      poster: req.body.poster
    })

    writeDB(db)

    return res.json({
      message: "Added to watchlist"
    })
  } catch (err) {
    console.log("WATCHLIST ERROR:")
    console.log(err)

    return res.status(500).json({
      message: err.message
    })
  }
})

/* ==========================
   GET WATCHLIST
========================== */

app.get("/watchlist", authMiddleware, async (req, res) => {
  try {
    const db = readDB()
    const user = db.users.find(u => u._id === req.userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    res.json(user.watchlist || [])
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "Failed to fetch watchlist"
    })
  }
})

/* ==========================
   DELETE WATCHLIST MOVIE
========================== */

app.delete("/watchlist/:id", authMiddleware, async (req, res) => {
  try {
    const db = readDB()
    const userIndex = db.users.findIndex(u => u._id === req.userId)

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    const user = db.users[userIndex]

    user.watchlist = user.watchlist.filter(
      movie => movie.movieId != req.params.id
    )

    writeDB(db)

    res.json({
      message: "Movie removed"
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: "Failed to remove movie"
    })
  }
})

/* ==========================
   GET REVIEWS
========================== */

app.get("/movies/:id/reviews", (req, res) => {
  try {
    const db = readDB()
    const reviews = db.reviews || []
    const movieReviews = reviews.filter(r => r.movieId === req.params.id)

    const safeReviews = movieReviews.map(r => ({
      ...r,
      likes: r.likes || [],
      dislikes: r.dislikes || [],
      replies: r.replies || []
    }))

    res.json(safeReviews)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to fetch reviews" })
  }
})

/* ==========================
   POST REVIEW
========================== */

app.post("/movies/:id/reviews", authMiddleware, (req, res) => {
  try {
    const { reviewText } = req.body
    if (!reviewText) {
      return res.status(400).json({ message: "Review text is required" })
    }

    const db = readDB()
    const user = db.users.find(u => u._id === req.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const newReview = {
      id: Date.now().toString(),
      movieId: req.params.id,
      username: user.username,
      reviewText,
      createdAt: new Date().toISOString(),
      likes: [],
      dislikes: [],
      replies: []
    }

    if (!db.reviews) {
      db.reviews = []
    }

    db.reviews.push(newReview)
    writeDB(db)

    res.json({ message: "Review posted successfully", review: newReview })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to post review" })
  }
})

/* ==========================
   CINERATE RATINGS
========================== */

app.get("/movies/:id/rate", (req, res) => {
  try {
    const db = readDB()
    const ratings = db.ratings || []
    const movieRatings = ratings.filter(r => r.movieId === req.params.id)

    let total = 0
    movieRatings.forEach(r => total += Number(r.rating))
    const averageRating = movieRatings.length > 0 ? (total / movieRatings.length).toFixed(1) : "0.0"

    let userRating = null
    const authHeader = req.headers.authorization
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1]
        const decoded = jwt.verify(token, "SECRET_KEY")
        const uRating = movieRatings.find(r => r.userId === decoded.id)
        if (uRating) userRating = uRating.rating
      } catch (e) {
        // ignore invalid tokens for GET
      }
    }

    res.json({
      averageRating: parseFloat(averageRating),
      totalRatings: movieRatings.length,
      userRating
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to fetch ratings" })
  }
})

app.post("/movies/:id/rate", authMiddleware, (req, res) => {
  try {
    const ratingValue = Number(req.body.rating)
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 10) {
      return res.status(400).json({ message: "Rating must be between 1 and 10" })
    }

    const db = readDB()
    if (!db.ratings) db.ratings = []

    const ratingIndex = db.ratings.findIndex(r => r.movieId === req.params.id && r.userId === req.userId)
    if (ratingIndex > -1) {
      return res.status(400).json({ message: "You have already rated this movie" })
    }

    db.ratings.push({
      movieId: req.params.id,
      userId: req.userId,
      rating: ratingValue
    })

    writeDB(db)
    res.json({ message: "Rating submitted successfully" })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to submit rating" })
  }
})

/* ==========================
   REVIEW LIKES & DISLIKES & REPLIES
========================== */

app.post("/reviews/:id/like", authMiddleware, (req, res) => {
  try {
    const db = readDB()
    const reviews = db.reviews || []
    const reviewIndex = reviews.findIndex(r => r.id === req.params.id)
    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" })
    }

    const review = reviews[reviewIndex]
    if (!review.likes) review.likes = []
    if (!review.dislikes) review.dislikes = []

    const likedIndex = review.likes.indexOf(req.userId)
    if (likedIndex > -1) {
      review.likes.splice(likedIndex, 1)
    } else {
      review.likes.push(req.userId)
      const dislikedIndex = review.dislikes.indexOf(req.userId)
      if (dislikedIndex > -1) {
        review.dislikes.splice(dislikedIndex, 1)
      }
    }

    writeDB(db)
    res.json({ message: "Like updated successfully", likes: review.likes, dislikes: review.dislikes })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to update like" })
  }
})

app.post("/reviews/:id/dislike", authMiddleware, (req, res) => {
  try {
    const db = readDB()
    const reviews = db.reviews || []
    const reviewIndex = reviews.findIndex(r => r.id === req.params.id)
    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" })
    }

    const review = reviews[reviewIndex]
    if (!review.likes) review.likes = []
    if (!review.dislikes) review.dislikes = []

    const dislikedIndex = review.dislikes.indexOf(req.userId)
    if (dislikedIndex > -1) {
      review.dislikes.splice(dislikedIndex, 1)
    } else {
      review.dislikes.push(req.userId)
      const likedIndex = review.likes.indexOf(req.userId)
      if (likedIndex > -1) {
        review.likes.splice(likedIndex, 1)
      }
    }

    writeDB(db)
    res.json({ message: "Dislike updated successfully", likes: review.likes, dislikes: review.dislikes })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to update dislike" })
  }
})

app.post("/reviews/:id/reply", authMiddleware, (req, res) => {
  try {
    const { replyText } = req.body
    if (!replyText) {
      return res.status(400).json({ message: "Reply text is required" })
    }

    const db = readDB()
    const reviews = db.reviews || []
    const reviewIndex = reviews.findIndex(r => r.id === req.params.id)
    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" })
    }

    const user = db.users.find(u => u._id === req.userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const review = reviews[reviewIndex]
    if (!review.replies) review.replies = []

    const newReply = {
      id: Date.now().toString(),
      username: user.username,
      replyText,
      createdAt: new Date().toISOString()
    }

    review.replies.push(newReply)
    writeDB(db)

    res.json({ message: "Reply posted successfully", reply: newReply })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to post reply" })
  }
})

/* ==========================
   USER PROFILE API
========================== */

app.get("/profile", authMiddleware, async (req, res) => {
  try {
    const db = readDB()
    const user = db.users.find(u => u._id === req.userId)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      username: user.username,
      email: user.email,
      bio: user.bio || "",
      profilePicture: user.profilePicture || ""
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to fetch profile" })
  }
})

app.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, bio, profilePicture } = req.body
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }

    const db = readDB()

    // Check if another user has the same username (excluding this user)
    const existingUser = db.users.find(u => u.username === username && u._id !== req.userId)
    if (existingUser) {
      return res.status(400).json({ message: "Username is already taken" })
    }

    const userIndex = db.users.findIndex(u => u._id === req.userId)
    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" })
    }

    const oldUsername = db.users[userIndex].username
    db.users[userIndex].username = username
    db.users[userIndex].bio = bio || ""
    db.users[userIndex].profilePicture = profilePicture || ""

    // Update username in all reviews written by this user
    if (db.reviews && oldUsername !== username) {
      db.reviews.forEach(review => {
        if (review.username === oldUsername) {
          review.username = username
        }
        if (review.replies) {
          review.replies.forEach(reply => {
            if (reply.username === oldUsername) {
              reply.username = username
            }
          })
        }
      })
    }

    writeDB(db)

    res.json({
      message: "Profile updated successfully",
      username,
      bio: db.users[userIndex].bio,
      profilePicture: db.users[userIndex].profilePicture
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Failed to update profile" })
  }
})

app.listen(5000, () => {
  console.log("Server running on port 5000")
})