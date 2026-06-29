import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Footer from "./Footer"

function Watchlist() {
  const [movies, setMovies] = useState([])
  const token = localStorage.getItem("token")
  const navigate = useNavigate()
  const isLoggedIn = token && token !== "null" && token !== "undefined"

  const fetchWatchlist = async () => {
    if (!isLoggedIn) return
    try {
      const res = await fetch("http://localhost:5000/watchlist", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (Array.isArray(data)) {
        setMovies(data)
      } else {
        setMovies([])
      }
    } catch (err) {
      console.log(err)
      setMovies([])
    }
  }

  const removeMovie = async (id) => {
    try {
      await fetch(`http://localhost:5000/watchlist/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      fetchWatchlist() // refresh
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    fetchWatchlist()
  }, [])

  return (
    <>
      <div className="watchlist-container">
        <div className="watchlist-header">
          <h1 className="watchlist-title">
            <i className="fa-solid fa-bookmark" style={{ color: "#E50914" }}></i> My Watchlist
          </h1>
          <Link to="/" className="watchlist-back">
            <i className="fa-solid fa-house" style={{ marginRight: "5px" }}></i> Back to Home
          </Link>
        </div>

        {!isLoggedIn ? (
          <div style={{ textAlign: "center", marginTop: "100px", color: "#aaa" }}>
            <p style={{ fontSize: "18px", marginBottom: "15px" }}>
              <i className="fa-solid fa-circle-exclamation" style={{ color: "#E50914", fontSize: "24px", display: "block", marginBottom: "10px" }}></i>
              Please login first to view your watchlist.
            </p>
            <Link to="/login" style={{ color: "#E50914", fontWeight: "600", textDecoration: "none" }}>Go to Login</Link>
          </div>
        ) : movies.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: "100px", color: "#aaa" }}>
            <p style={{ fontSize: "18px", marginBottom: "15px" }}>
              <i className="fa-solid fa-folder-open" style={{ color: "#E50914", fontSize: "28px", display: "block", marginBottom: "10px" }}></i>
              No movies added yet to your vault.
            </p>
            <Link to="/" style={{ color: "#E50914", fontWeight: "600", textDecoration: "none" }}>Go explore movies</Link>
          </div>
        ) : (
          <div className="watchlist-grid">
            {movies.map((movie) => (
              <div className="movie-card" key={movie.movieId} onClick={() => navigate('/movie/' + movie.movieId)} style={{ cursor: "pointer" }}>
                <img
                  src={`https://image.tmdb.org/t/p/w300${movie.poster}`}
                  alt={movie.title}
                />
                <h4 style={{ whiteSpace: "normal", height: "40px", overflow: "hidden" }}>{movie.title}</h4>
                
                <div className="watchlist-card-actions">
                  <button className="watchlist-action-btn play" onClick={(e) => { e.stopPropagation(); navigate('/movie/' + movie.movieId); }}>
                    <i className="fa-solid fa-play"></i> Play
                  </button>
                  <button className="watchlist-action-btn remove" onClick={(e) => { e.stopPropagation(); removeMovie(movie.movieId); }}>
                    <i className="fa-solid fa-trash-can"></i> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}

export default Watchlist