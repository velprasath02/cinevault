import { useEffect, useState } from "react"
import Navbar from "./Navbar"
import { useNavigate } from "react-router-dom"
import Hero from "./Hero"
import RandomPicker from "./RandomPicker"
import Footer from "./Footer"

function Movies() {
    const [movie, setmovie] = useState([])
    const [trending, settrending] = useState([])
    const [top, settop] = useState([])
    const [upcoming, setupcoming] = useState([])
    const [query, setQuery] = useState("")
    const [searchResults, setSearchResults] = useState([])
    const navigate = useNavigate()

    // Custom Toast Notification State
    const [toast, setToast] = useState({ show: false, message: "", type: "success" })

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" })
        }, 3000)
    }

    useEffect(() => {
        fetch("http://localhost:5000/api/tmdb/trending/movie/day")
            .then(response => response.json())
            .then(data => settrending(data.results))

        fetch("http://localhost:5000/api/tmdb/movie/popular")
            .then(response => response.json())
            .then(data => {
                if (data.results) {
                    setmovie(data.results)
                } else {
                    setmovie([])
                }
            })

        fetch("http://localhost:5000/api/tmdb/movie/top_rated")
            .then(response => response.json())
            .then(data => {
                if (data.results) {
                    settop(data.results)
                } else {
                    settop([])
                }
            })

        fetch("http://localhost:5000/api/tmdb/movie/upcoming")
            .then(response => response.json())
            .then(data => {
                if (data.results) {
                    setupcoming(data.results)
                } else {
                    setupcoming([])
                }
            })
    }, [])

    useEffect(() => {
        if (query.length < 2) {
            setSearchResults([])
            return
        }

        const timeout = setTimeout(() => {
            fetch(`http://localhost:5000/api/tmdb/search/movie?query=${query}`)
                .then(res => res.json())
                .then(data => setSearchResults(data.results))
        }, 400)

        return () => clearTimeout(timeout)
    }, [query])

    const handleAddToWatchlist = async (e, singleMovie) => {
        e.stopPropagation() // Prevent navigating to movie description page
        const token = localStorage.getItem("token")

        if (!token) {
            showToast("Please login first", "error")
            return
        }

        try {
            const res = await fetch("http://localhost:5000/watchlist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    movieId: singleMovie.id,
                    title: singleMovie.title,
                    poster: singleMovie.poster_path
                })
            })

            const data = await res.json()
            if (data.message && (data.message.includes("Added") || data.message.includes("success"))) {
                showToast("Added to watchlist!", "success")
            } else {
                showToast(data.message || "Failed to add to watchlist", "error")
            }
        } catch (err) {
            console.log(err)
            showToast("Failed to add to watchlist", "error")
        }
    }

    return (
        <>
            <Navbar query={query} setQuery={setQuery} searchResults={searchResults} />
            <Hero trending={trending} />

            <div className="section-container">
                <h2 className="section-title">
                    <i className="fa-solid fa-fire" style={{ color: "#E50914", marginRight: "8px" }}></i> Trending Now
                </h2>
                <div className="cards-scrollable">
                    {trending.map(m => (
                        <div className="movie-card" key={m.id} onClick={() => navigate('/movie/' + m.id)}>
                            <img src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt="" />
                            <h4>{m.title}</h4>
                            <h5>{m.release_date}</h5>
                            <button className="watch" onClick={(e) => handleAddToWatchlist(e, m)}>
                                <i className="fa-solid fa-plus"></i> Add to Watchlist
                            </button>
                            <div className="rating-badge">
                                <i className="fa-solid fa-star" style={{ color: "#FFD700" }}></i> {m.vote_average?.toFixed(1)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-title">
                    <i className="fa-solid fa-film" style={{ color: "#E50914", marginRight: "8px" }}></i> Popular Movies
                </h2>
                <div className="cards-scrollable">
                    {movie.map(m => (
                        <div className="movie-card" key={m.id} onClick={() => navigate('/movie/' + m.id)}>
                            <img src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt="" />
                            <h4>{m.title}</h4>
                            <h5>{m.release_date}</h5>
                            <button className="watch" onClick={(e) => handleAddToWatchlist(e, m)}>
                                <i className="fa-solid fa-plus"></i> Add to Watchlist
                            </button>
                            <div className="rating-badge">
                                <i className="fa-solid fa-star" style={{ color: "#FFD700" }}></i> {m.vote_average?.toFixed(1)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-title">
                    <i className="fa-solid fa-star" style={{ color: "#E50914", marginRight: "8px" }}></i> Top Rated
                </h2>
                <div className="cards-scrollable">
                    {top.map(m => (
                        <div className="movie-card" key={m.id} onClick={() => navigate('/movie/' + m.id)}>
                            <img src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt="" />
                            <h4>{m.title}</h4>
                            <h5>{m.release_date}</h5>
                            <button className="watch" onClick={(e) => handleAddToWatchlist(e, m)}>
                                <i className="fa-solid fa-plus"></i> Add to Watchlist
                            </button>
                            <div className="rating-badge">
                                <i className="fa-solid fa-star" style={{ color: "#FFD700" }}></i> {m.vote_average?.toFixed(1)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-container">
                <h2 className="section-title">
                    <i className="fa-solid fa-calendar-days" style={{ color: "#E50914", marginRight: "8px" }}></i> Upcoming
                </h2>
                <div className="cards-scrollable">
                    {upcoming.map(m => (
                        <div className="movie-card" key={m.id} onClick={() => navigate('/movie/' + m.id)}>
                            <img src={`https://image.tmdb.org/t/p/w500${m.poster_path}`} alt="" />
                            <h4>{m.title}</h4>
                            <h5>{m.release_date}</h5>
                            <button className="watch" onClick={(e) => handleAddToWatchlist(e, m)}>
                                <i className="fa-solid fa-plus"></i> Add to Watchlist
                            </button>
                            <div className="rating-badge">
                                <i className="fa-solid fa-star" style={{ color: "#FFD700" }}></i> {m.vote_average?.toFixed(1)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <RandomPicker movies={trending} />

            {/* Custom Toast Alert */}
            <div className={`toast-notification ${toast.type} ${toast.show ? "show" : ""}`}>
                <i className={toast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
                <span>{toast.message}</span>
            </div>

            <Footer />
        </>
    )
}

export default Movies