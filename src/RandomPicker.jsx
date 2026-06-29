import { useState } from "react"
import { useNavigate } from "react-router-dom"

function RandomPicker({ movies }) {
    const [show, setShow] = useState(false)
    const [currentMovie, setCurrentMovie] = useState(null)
    const [spinning, setSpinning] = useState(false)
    const [flipClass, setFlipClass] = useState("")

    const navigate = useNavigate()

    const handleOpen = () => {
        if (!movies || movies.length === 0) return
        setCurrentMovie(movies[Math.floor(Math.random() * movies.length)])
        setShow(true)
    }

    const spinRoulette = () => {
        if (!movies || movies.length === 0 || spinning) return

        setSpinning(true)
        setFlipClass("spin-3d")
        let duration = 2500 // 2.5 seconds spin
        let startTime = Date.now()

        const interval = setInterval(() => {
            const random = movies[Math.floor(Math.random() * movies.length)]
            setCurrentMovie(random)

            if (Date.now() - startTime >= duration) {
                clearInterval(interval)
                setSpinning(false)
                setFlipClass("winner-glow")
            }
        }, 120)
    }

    return (
        <>
            {/* 🎲 BUTTON */}
            <div className="picker-btn" onClick={handleOpen}>
                <i className="fa-solid fa-dice" style={{ fontSize: "26px" }}></i>
            </div>

            {/* 🎬 POPUP */}
            {show && currentMovie && (
                <div className="picker-overlay" onClick={() => setShow(false)}>

                    <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setShow(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>

                        <h2>
                            <i className="fa-solid fa-clapperboard" style={{ color: "#E50914", marginRight: "8px" }}></i> Pick For Me
                        </h2>
                        <p style={{ color: "#aaa", fontSize: "13px", marginTop: "-5px" }}>Can't decide? Let us pick a movie for you</p>

                        {/* 🎯 3D FLIPPING CARD CONTAINER */}
                        <div className="card-container-3d">
                            <div className={`movie-card-3d ${flipClass}`}>
                                <img
                                    src={`https://image.tmdb.org/t/p/w300${currentMovie.poster_path}`}
                                    alt={currentMovie.title}
                                />
                            </div>
                        </div>

                        <h3 className="winner-title">{currentMovie.title}</h3>

                        <div className="picker-actions">
                            <button className="action-btn" onClick={spinRoulette} disabled={spinning}>
                                <i className="fa-solid fa-sync-alt"></i> {spinning ? "Spinning..." : "Roll Again"}
                            </button>

                            <button
                                className="action-btn watch-btn"
                                onClick={() => {
                                    setShow(false)
                                    navigate(`/movie/${currentMovie.id}`)
                                }}
                            >
                                <i className="fa-solid fa-play"></i> Watch Now
                            </button>
                        </div>

                    </div>

                </div>
            )}
        </>
    )
}

export default RandomPicker