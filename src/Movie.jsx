import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import Footer from "./Footer"

function Movie() {
    const castGridRef = useRef(null)
    const [Post, setPost] = useState({})
    const { id } = useParams()
    const [Loading, setLoading] = useState(true)
    const [credits, setCredits] = useState({ cast: [], crew: [] })
    const [reviews, setReviews] = useState([])
    const [newReviewText, setNewReviewText] = useState("")
    const [submittingReview, setSubmittingReview] = useState(false)

    // CineRate and Review Interactions States
    const [cineRate, setCineRate] = useState({ averageRating: 0.0, totalRatings: 0, userRating: null })
    const [selectedRating, setSelectedRating] = useState(null)
    const [submittingRating, setSubmittingRating] = useState(false)
    const [expandedReplies, setExpandedReplies] = useState({})
    const [replyInputs, setReplyInputs] = useState({})

    // Custom Toast Notification State
    const [toast, setToast] = useState({ show: false, message: "", type: "success" })

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" })
        }, 3000)
    }

    const token = localStorage.getItem("token")
    const isLoggedIn = token && token !== "null" && token !== "undefined"

    // Parse JWT to extract userId
    const getUserIdFromToken = (t) => {
        if (!t) return null
        try {
            const base64Url = t.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            return JSON.parse(jsonPayload).id
        } catch (e) {
            return null
        }
    }
    const currentUserId = getUserIdFromToken(token)

    const fetchReviews = async () => {
        try {
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/movies/${id}/reviews`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setReviews(data)
            } else {
                setReviews([])
            }
        } catch (err) {
            console.error("Failed to load reviews:", err)
        }
    }

    const fetchRating = async () => {
        try {
            const headers = {}
            if (isLoggedIn) {
                headers["Authorization"] = `Bearer ${token}`
            }
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/movies/${id}/rate`, { headers })
            const data = await res.json()
            if (data) {
                setCineRate({
                    averageRating: data.averageRating || 0.0,
                    totalRatings: data.totalRatings || 0,
                    userRating: data.userRating || null
                })
                if (data.userRating !== null) {
                    setSelectedRating(data.userRating)
                }
            }
        } catch (err) {
            console.error("Failed to load rating:", err)
        }
    }

    const handleRateMovie = async () => {
        if (!isLoggedIn) {
            showToast("Please login first", "error")
            return
        }
        if (selectedRating === null) {
            showToast("Please select a rating value first", "error")
            return
        }
        if (cineRate.userRating !== null) {
            showToast("You have already rated this movie", "error")
            return
        }
        setSubmittingRating(true)
        try {
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/movies/${id}/rate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ rating: selectedRating })
            })
            const data = await res.json()
            if (res.ok) {
                showToast("Rating submitted successfully!", "success")
                fetchRating()
            } else {
                showToast(data.message || "Failed to submit rating", "error")
            }
        } catch (err) {
            console.error("Failed to rate movie:", err)
            showToast("Error submitting rating", "error")
        } finally {
            setSubmittingRating(false)
        }
    }

    const handleLikeReview = async (reviewId) => {
        if (!isLoggedIn) {
            showToast("Please login first", "error")
            return
        }
        try {
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/reviews/${reviewId}/like`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (res.ok) {
                fetchReviews()
            } else {
                showToast(data.message || "Failed to update like", "error")
            }
        } catch (err) {
            console.error("Like review failed:", err)
        }
    }

    const handleDislikeReview = async (reviewId) => {
        if (!isLoggedIn) {
            showToast("Please login first", "error")
            return
        }
        try {
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/reviews/${reviewId}/dislike`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            const data = await res.json()
            if (res.ok) {
                fetchReviews()
            } else {
                showToast(data.message || "Failed to update dislike", "error")
            }
        } catch (err) {
            console.error("Dislike review failed:", err)
        }
    }

    const handleReplyChange = (reviewId, text) => {
        setReplyInputs(prev => ({
            ...prev,
            [reviewId]: text
        }))
    }

    const toggleReplies = (reviewId) => {
        setExpandedReplies(prev => ({
            ...prev,
            [reviewId]: !prev[reviewId]
        }))
    }

    const handleReplySubmit = async (e, reviewId) => {
        e.preventDefault()
        const text = replyInputs[reviewId] || ""
        if (!text.trim()) return

        if (!isLoggedIn) {
            showToast("Please login first", "error")
            return
        }

        try {
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/reviews/${reviewId}/reply`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ replyText: text })
            })
            const data = await res.json()
            if (res.ok) {
                showToast("Reply submitted successfully!", "success")
                setReplyInputs(prev => ({ ...prev, [reviewId]: "" }))
                fetchReviews()
            } else {
                showToast(data.message || "Failed to submit reply", "error")
            }
        } catch (err) {
            console.error("Reply failed:", err)
            showToast("Error submitting reply", "error")
        }
    }

    const handleSubmitReview = async (e) => {
        e.preventDefault()
        if (!newReviewText.trim()) return
        setSubmittingReview(true)
        try {
            const res = await fetch(`https://cinevault-backend-nh60.onrender.com/movies/${id}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reviewText: newReviewText })
            })
            const data = await res.json()
            if (data.message && data.message.includes("success")) {
                showToast("Review posted successfully!", "success")
            } else {
                showToast(data.message || "Failed to post review", "error")
            }
            setNewReviewText("")
            fetchReviews() // reload reviews
        } catch (err) {
            console.error("Failed to submit review:", err)
            showToast("Error submitting review", "error")
        } finally {
            setSubmittingReview(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        // Fetch details
        fetch(`https://cinevault-backend-nh60.onrender.com/api/tmdb/movie/${id}`)
            .then(response => response.json())
            .then(data => {
                setPost(data)
                setLoading(false)
            })
            .catch(err => console.error("Error fetching details:", err))

        // Fetch credits (cast & crew)
        fetch(`https://cinevault-backend-nh60.onrender.com/api/tmdb/movie/${id}/credits`)
            .then(response => response.json())
            .then(data => {
                if (data.cast && data.crew) {
                    setCredits(data)
                }
            })
            .catch(err => console.error("Error fetching credits:", err))

        // Fetch reviews
        fetchReviews()

        // Fetch ratings
        fetchRating()
    }, [id])

    const addToWatchlist = async () => {
        if (!isLoggedIn) {
            showToast("Please login first", "error")
            return
        }

        try {
            const res = await fetch(
                "https://cinevault-backend-nh60.onrender.com/watchlist",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        movieId: Post.id,
                        title: Post.title,
                        poster: Post.poster_path
                    })
                }
            )

            const data = await res.json()
            if (data.message && data.message.includes("Added")) {
                showToast("Added to watchlist!", "success")
            } else {
                showToast(data.message || "Failed to add to watchlist", "error")
            }
        } catch (err) {
            console.log(err)
            showToast("Failed to add to watchlist", "error")
        }
    }

    if (Loading) {
        return (
            <div className="hero skeleton-hero" style={{ background: "#0b0808", minHeight: "100vh" }}>
                <div className="overlay" style={{ background: "rgba(0, 0, 0, 0.8)", padding: "100px 40px" }}>
                    <div className="back" style={{ visibility: "hidden", marginBottom: "30px" }}>
                        <i className="fa-solid fa-arrow-left" style={{ marginRight: "5px" }}></i> Back
                    </div>

                    <div className="hero-content">
                        <div className="poster skeleton" style={{ width: "300px", height: "450px", borderRadius: "12px" }}></div>

                        <div className="info" style={{ display: "flex", flexDirection: "column", gap: "20px", marginLeft: "40px" }}>
                            <div className="skeleton" style={{ height: "45px", width: "350px", borderRadius: "6px" }}></div>
                            <div className="skeleton" style={{ height: "20px", width: "200px", borderRadius: "4px" }}></div>

                            <div className="meta" style={{ display: "flex", gap: "15px" }}>
                                <div className="skeleton" style={{ height: "20px", width: "80px", borderRadius: "4px" }}></div>
                                <div className="skeleton" style={{ height: "20px", width: "50px", borderRadius: "4px" }}></div>
                                <div className="skeleton" style={{ height: "20px", width: "120px", borderRadius: "4px" }}></div>
                            </div>

                            <div className="genres" style={{ display: "flex", gap: "10px" }}>
                                <div className="skeleton" style={{ height: "24px", width: "70px", borderRadius: "12px" }}></div>
                                <div className="skeleton" style={{ height: "24px", width: "90px", borderRadius: "12px" }}></div>
                                <div className="skeleton" style={{ height: "24px", width: "60px", borderRadius: "12px" }}></div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                                <div className="skeleton" style={{ height: "16px", width: "500px", borderRadius: "4px" }}></div>
                                <div className="skeleton" style={{ height: "16px", width: "480px", borderRadius: "4px" }}></div>
                                <div className="skeleton" style={{ height: "16px", width: "450px", borderRadius: "4px" }}></div>
                                <div className="skeleton" style={{ height: "16px", width: "200px", borderRadius: "4px" }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const director = credits.crew?.find(member => member.job === "Director")?.name

    return (
        <>
            <div
                className="hero"
                style={{
                    backgroundImage: `url(https://image.tmdb.org/t/p/original${Post.backdrop_path})`
                }}
            >
                <div className="overlay">
                    <Link to="/" className="back">
                        <i className="fa-solid fa-arrow-left" style={{ marginRight: "5px" }}></i> Back
                    </Link>

                    <div className="hero-content">
                        <img
                            src={`https://image.tmdb.org/t/p/w500${Post.poster_path}`}
                            className="poster"
                            alt={Post.title}
                        />

                        <div className="info">
                            <h1>{Post.title}</h1>
                            <p className="tagline">{Post.tagline}</p>

                            <div className="meta">
                                <span><i className="fa-solid fa-star" style={{ color: "#FFD700" }}></i> {Post.vote_average?.toFixed(1)}</span>
                                <span>({Post.vote_count})</span>
                                <span><i className="fa-solid fa-calendar-days"></i> {Post.release_date}</span>
                            </div>

                            <div className="genres">
                                {Post.genres?.map(g => (
                                    <span key={g.id}>{g.name}</span>
                                ))}
                            </div>

                            <p className="overview">{Post.overview}</p>

                            {director && (
                                <div className="credits-section">
                                    <div className="credits-title">Director</div>
                                    <div className="director-name">{director}</div>
                                </div>
                            )}

                            {credits.cast && credits.cast.length > 0 && (
                                <div className="credits-section" style={{ borderTop: "none", paddingTop: 0 }}>
                                    <div className="credits-title">Top Billed Cast</div>
                                    <div className="cast-slider-wrapper">
                                        <div className="cast-grid" ref={castGridRef}>
                                            {credits.cast.slice(0, 15).map(actor => (
                                                <div key={actor.cast_id} className="cast-member">
                                                    <img 
                                                        src={actor.profile_path ? `https://image.tmdb.org/t/p/w185${actor.profile_path}` : "https://via.placeholder.com/185x278?text=No+Image"} 
                                                        alt={actor.name} 
                                                    />
                                                    <div className="cast-name">{actor.name}</div>
                                                    <div className="cast-character">{actor.character}</div>
                                                </div>
                                            ))}
                                        </div>
                                        {credits.cast.length > 3 && (
                                            <button 
                                                className="cast-next-btn" 
                                                onClick={() => castGridRef.current.scrollBy({ left: 240, behavior: 'smooth' })}
                                                type="button"
                                                aria-label="Next Cast"
                                            >
                                                <i className="fa-solid fa-chevron-right"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="btns">
                                <a href={Post.homepage} target="_blank" rel="noopener noreferrer" className="watch-now">
                                    <i className="fa-solid fa-play" style={{ marginRight: "6px" }}></i> Watch Now
                                </a>
                                <button className="watch" onClick={addToWatchlist}>
                                    <i className="fa-solid fa-plus"></i> Add to Watchlist
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CineRate Rating System */}
            <div className="cinerate-container">
                <div className="cinerate-card">
                    <div className="cinerate-score-display">
                        <i className="fa-solid fa-star"></i>
                        <div className="cinerate-score-text">
                            <h3>CineRate</h3>
                            <h2>{cineRate.averageRating ? cineRate.averageRating.toFixed(1) : "0.0"}<span>/10</span></h2>
                            <p>{cineRate.totalRatings || 0} {cineRate.totalRatings === 1 ? "rating" : "ratings"}</p>
                        </div>
                    </div>
                    
                    <div className="cinerate-user-picker">
                        <span className="cinerate-picker-title">
                            <i className="fa-solid fa-circle-play"></i>
                            {isLoggedIn 
                                ? (cineRate.userRating ? `Your Rating: ${cineRate.userRating}/10` : "Rate this movie")
                                : "Login to rate"
                            }
                        </span>
                        {isLoggedIn ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-end" }}>
                                <div className="cinerate-pills">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                                        <button
                                            key={val}
                                            className={`cinerate-pill ${selectedRating === val ? "active" : ""}`}
                                            onClick={() => {
                                                if (cineRate.userRating === null) {
                                                    setSelectedRating(val)
                                                }
                                            }}
                                            disabled={cineRate.userRating !== null}
                                            style={cineRate.userRating !== null ? { cursor: "not-allowed", opacity: 0.8 } : {}}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                {cineRate.userRating === null ? (
                                    <button 
                                        className="review-submit-btn" 
                                        style={{ marginTop: "5px", padding: "8px 16px", fontSize: "13px" }}
                                        onClick={handleRateMovie}
                                        disabled={selectedRating === null || submittingRating}
                                    >
                                        {submittingRating ? "Submitting..." : "Submit Rating"}
                                    </button>
                                ) : (
                                    <span style={{ fontSize: "12px", color: "#2ecc71", fontWeight: "600" }}>
                                        <i className="fa-solid fa-circle-check" style={{ marginRight: "4px" }}></i> Rating Submitted
                                    </span>
                                )}
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>
                                Please <Link to="/login" style={{ color: "#E50914", textDecoration: "none", fontWeight: "600" }}>login</Link> to rate.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="reviews-container">
                <h2 className="reviews-section-title">
                    <i className="fa-solid fa-comments" style={{ color: "#E50914", marginRight: "8px" }}></i> User Reviews
                </h2>
                
                {isLoggedIn ? (
                    <form onSubmit={handleSubmitReview} className="review-form">
                        <h3><i className="fa-solid fa-pen-to-square" style={{ color: "#E50914" }}></i> Write a Review</h3>
                        <div className="comment-input-wrapper">
                            <div className="comment-input-avatar">
                                {localStorage.getItem("username") ? localStorage.getItem("username")[0].toUpperCase() : "U"}
                            </div>
                            <div className="comment-textarea-container">
                                <textarea
                                    placeholder="Share your thoughts about this movie..."
                                    value={newReviewText}
                                    onChange={(e) => setNewReviewText(e.target.value)}
                                    required
                                ></textarea>
                                <div className="comment-actions-bar">
                                    <button type="submit" className="review-submit-btn" disabled={submittingReview}>
                                        {submittingReview ? "Submitting..." : <><i className="fa-solid fa-paper-plane" style={{ marginRight: "6px" }}></i> Submit Review</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="review-form" style={{ textAlign: "center", color: "#aaa" }}>
                        <p style={{ margin: "0 0 10px 0" }}>You must be logged in to write a review.</p>
                        <Link to="/login" style={{ color: "#E50914", fontWeight: "600", textDecoration: "none" }}>Log In Here</Link>
                    </div>
                )}

                <div className="reviews-list">
                    {reviews.length === 0 ? (
                        <p style={{ color: "#aaa", fontStyle: "italic", margin: "10px 0" }}>No reviews posted yet. Be the first to write one!</p>
                    ) : (
                        reviews.map(review => {
                            const likesCount = review.likes ? review.likes.length : 0
                            const dislikesCount = review.dislikes ? review.dislikes.length : 0
                            const hasLiked = review.likes && currentUserId && review.likes.includes(currentUserId)
                            const hasDisliked = review.dislikes && currentUserId && review.dislikes.includes(currentUserId)
                            const isExpanded = expandedReplies[review.id]

                            return (
                                <div key={review.id} className="review-card-item">
                                    <div className="review-header">
                                        <span className="review-author">
                                            <i className="fa-solid fa-user-circle"></i> {review.username}
                                        </span>
                                        <span className="review-date">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="review-content">{review.reviewText}</p>

                                    {/* Action Buttons: Like, Dislike, Reply */}
                                    <div className="review-actions">
                                        <button 
                                            className={`action-btn-inline ${hasLiked ? "liked" : ""}`}
                                            onClick={() => handleLikeReview(review.id)}
                                        >
                                            <i className="fa-solid fa-thumbs-up"></i> {likesCount}
                                        </button>
                                        <button 
                                            className={`action-btn-inline ${hasDisliked ? "disliked" : ""}`}
                                            onClick={() => handleDislikeReview(review.id)}
                                        >
                                            <i className="fa-solid fa-thumbs-down"></i> {dislikesCount}
                                        </button>
                                        <button 
                                            className="action-btn-inline"
                                            onClick={() => toggleReplies(review.id)}
                                        >
                                            <i className="fa-solid fa-reply"></i> Reply {review.replies && review.replies.length > 0 && `(${review.replies.length})`}
                                        </button>
                                    </div>

                                    {/* Expandable Replies Thread */}
                                    {isExpanded && (
                                        <div className="review-replies-feed">
                                            {review.replies && review.replies.map(reply => (
                                                <div key={reply.id} className="reply-item">
                                                    <div className="reply-header">
                                                        <span className="reply-author">
                                                            <i className="fa-solid fa-user-circle"></i> {reply.username}
                                                        </span>
                                                        <span className="reply-date">
                                                            {new Date(reply.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="reply-content">{reply.replyText}</p>
                                                </div>
                                            ))}

                                            {/* Sub-reply Input Form */}
                                            {isLoggedIn ? (
                                                <form onSubmit={(e) => handleReplySubmit(e, review.id)} className="reply-input-form">
                                                    <input 
                                                        type="text" 
                                                        placeholder="Write a reply..."
                                                        value={replyInputs[review.id] || ""}
                                                        onChange={(e) => handleReplyChange(review.id, e.target.value)}
                                                        required
                                                    />
                                                    <button type="submit" className="reply-submit-btn">
                                                        Reply
                                                    </button>
                                                </form>
                                            ) : (
                                                <div style={{ padding: "5px 0", fontSize: "12px", color: "#888" }}>
                                                    Please <Link to="/login" style={{ color: "#E50914", textDecoration: "none", fontWeight: "600" }}>login</Link> to reply.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Custom Toast Alert */}
            <div className={`toast-notification ${toast.type} ${toast.show ? "show" : ""}`}>
                <i className={toast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
                <span>{toast.message}</span>
            </div>

            <Footer />
        </>
    )
}

export default Movie