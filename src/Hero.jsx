import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './Herocss.css'

function Hero({ trending }) {
    const [index, setindex] = useState(0)
    const nav = useNavigate()
    useEffect(() => {
        if (trending.length == 0) {
            return
        }
        const interval = setInterval(() => {
            setindex(prev => (prev + 1) % trending.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [trending])
    if (trending.length === 0) return null
    const movie = trending[index]
    return (
        <div className="h"
            style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }} >
            <div className="h-overlay">
                <div className="h-content">

                    <h1>{movie.title}</h1>

                    <div className="meta">
                        <i className="fa-solid fa-star" style={{ color: "#FFD700", marginRight: "4px" }}></i> {movie.vote_average?.toFixed(1)}
                        <span><i className="fa-solid fa-calendar-days" style={{ marginLeft: "12px", marginRight: "6px" }}></i> {movie.release_date}</span>
                    </div>

                    <div className="h-buttons">
                        <button
                            className="action-btn"
                            onClick={() => nav(`/movie/${movie.id}`)}
                        >
                            <i className="fa-solid fa-play" style={{ marginRight: "6px" }}></i> Watch Now
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
export default Hero