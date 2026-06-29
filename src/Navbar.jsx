import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import logo from "./assets/cinevault-logo.png"

function Navbar({ query, setQuery, searchResults }) {
    const navigate = useNavigate()
    const [showDropdown, setShowDropdown] = useState(false)
    
    const token = localStorage.getItem("token")
    const isLoggedIn = token && token !== "null" && token !== "undefined"
    
    const [username, setUsername] = useState(localStorage.getItem("username") || "User")
    const [profilePicture, setProfilePicture] = useState(localStorage.getItem("profilePicture") || "")

    useEffect(() => {
        const handleStorageChange = () => {
            setUsername(localStorage.getItem("username") || "User")
            setProfilePicture(localStorage.getItem("profilePicture") || "")
        }

        window.addEventListener("storage", handleStorageChange)
        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("username")
        localStorage.removeItem("profilePicture")
        window.location.href = "/"
    }

    return (
        <>
            <div className="nav">

                <div style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "10px", cursor: "pointer" }} onClick={() => navigate('/')}>
                    <img src={logo} alt="CineVault" style={{ height: "54px", objectFit: "contain" }} />
                </div>

                <div className="search-container">

                    <input
                        type="text"
                        placeholder="Search movies..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />

                    {query && searchResults.length > 0 && (
                        <div className="result">
                            {searchResults.map(movie => (
                                <div
                                    className="result-item"
                                    key={movie.id}
                                    onClick={() => {
                                        navigate(`/movie/${movie.id}`)
                                        setQuery("")   // clear search after click
                                    }}
                                >
                                    <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} />
                                    <span>{movie.title}</span>
                                    <span>{movie.release_date?.slice(0,4)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
                
                <div className="nav-btns">
                    {isLoggedIn ? (
                        <div className="profile-container">
                            <div className="profile-badge" onClick={() => setShowDropdown(!showDropdown)}>
                                <div className="avatar">
                                    {profilePicture ? (
                                        <img src={profilePicture} alt={username} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                    ) : (
                                        username[0].toUpperCase()
                                    )}
                                </div>
                                <span className="username">{username}</span>
                                <i className="fa-solid fa-chevron-down dropdown-icon" style={{ marginLeft: "5px", fontSize: "10px" }}></i>
                            </div>
                            {showDropdown && (
                                <div className="profile-dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                        <i className="fa-solid fa-user"></i> My Profile
                                    </Link>
                                    <Link to="/watchlist" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                                        <i className="fa-solid fa-bookmark"></i> My Watchlist
                                    </Link>
                                    <button onClick={handleLogout} className="dropdown-item logout-btn">
                                        <i className="fa-solid fa-sign-out-alt"></i> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className='navbtn' style={{ color: "#ffffff", textDecoration: "none" }}>Login</Link>
                            <Link to="/watchlist" className='navbtn' style={{ color: "#ffffff", textDecoration: "none" }}>MyVault</Link>
                        </>
                    )}
                </div>

            </div>
        </>
    )
}

export default Navbar