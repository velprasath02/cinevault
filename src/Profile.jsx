import React, { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"
import "./Profile.css"

// Premium inline SVG Movie-Themed Avatars
const PRESET_AVATARS = [
  {
    id: "popcorn",
    name: "Popcorn Bucket",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%23FF5252" rx="20"/><path d="M25 45 L30 90 H70 L75 45 Z" fill="%23ECEFF1"/><path d="M35 45 L38 90 H44 L41 45 Z" fill="%23D32F2F"/><path d="M56 45 L59 90 H65 L62 45 Z" fill="%23D32F2F"/><circle cx="50" cy="30" r="12" fill="%23FFE082"/><circle cx="38" cy="35" r="10" fill="%23FFD54F"/><circle cx="62" cy="35" r="10" fill="%23FFD54F"/><circle cx="48" cy="40" r="9" fill="%23FFCA28"/><circle cx="30" cy="40" r="8" fill="%23FFE082"/><circle cx="70" cy="40" r="8" fill="%23FFE082"/></svg>`
  },
  {
    id: "clapperboard",
    name: "Director Slate",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%2337474F" rx="20"/><rect x="20" y="35" width="60" height="40" rx="3" fill="%23212121"/><path d="M20 25 L80 30 L80 36 L20 31 Z" fill="%23212121"/><path d="M22 25 L30 25 L25 31 L20 31 Z M38 26 L46 27 L41 33 L33 32 Z M54 28 L62 29 L57 35 L49 34 Z M70 29 L78 30 L73 36 L65 35 Z" fill="%23FFFFFF"/><circle cx="50" cy="55" r="3" fill="%23E50914"/><text x="50" y="68" fill="%23757575" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle">SCENE 1</text></svg>`
  },
  {
    id: "film_reel",
    name: "Film Reel",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%2378909C" rx="20"/><circle cx="50" cy="50" r="32" fill="%2337474F" stroke="%23ECEFF1" stroke-width="4"/><circle cx="50" cy="50" r="8" fill="%23ECEFF1"/><circle cx="50" cy="28" r="7" fill="%2378909C"/><circle cx="50" cy="72" r="7" fill="%2378909C"/><circle cx="28" cy="50" r="7" fill="%2378909C"/><circle cx="72" cy="50" r="7" fill="%2378909C"/><circle cx="35" cy="35" r="7" fill="%2378909C"/><circle cx="65" cy="65" r="7" fill="%2378909C"/><circle cx="35" cy="65" r="7" fill="%2378909C"/><circle cx="65" cy="35" r="7" fill="%2378909C"/></svg>`
  },
  {
    id: "3d_glasses",
    name: "3D Glasses",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%23263238" rx="20"/><path d="M15 45 C15 40, 85 40, 85 45 L80 60 C80 65, 55 65, 53 58 C52 53, 48 53, 47 58 C45 65, 20 65, 20 60 Z" fill="%231a1a1a" stroke="%23ffffff" stroke-width="3"/><path d="M22 47 H44 V58 C44 58, 40 61, 33 61 C26 61, 22 58, 22 58 Z" fill="%2300B0FF"/><path d="M56 47 H78 V58 C78 58, 74 61, 67 61 C60 61, 56 58, 56 58 Z" fill="%23FF1744"/><rect x="10" y="43" width="8" height="5" rx="1" fill="%23ffffff"/><rect x="82" y="43" width="8" height="5" rx="1" fill="%23ffffff"/></svg>`
  },
  {
    id: "ticket",
    name: "Golden Ticket",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%23FF8F00" rx="20"/><path d="M20 30 H80 V45 C75 45, 75 55, 80 55 V70 H20 V55 C25 55, 25 45, 20 45 Z" fill="%23FFD54F" stroke="%23FF8F00" stroke-width="2"/><line x1="32" y1="36" x2="32" y2="64" stroke="%23FF8F00" stroke-dasharray="2,2" stroke-width="2"/><line x1="68" y1="36" x2="68" y2="64" stroke="%23FF8F00" stroke-dasharray="2,2" stroke-width="2"/><text x="50" y="54" fill="%23C62828" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1">ADMIT ONE</text></svg>`
  },
  {
    id: "director_chair",
    name: "Megaphone",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" y="0" width="100" height="100" fill="%2300E676" rx="20"/><path d="M30 45 L65 30 L75 60 L40 75 Z" fill="%23ECEFF1" stroke="%2337474F" stroke-width="3"/><path d="M63 31 L68 25 C70 24, 75 26, 76 28 L80 40 L73 43 Z" fill="%23FF3D00"/><path d="M25 48 C20 48, 20 58, 25 58 L32 55 L31 51 Z" fill="%2337474F"/><rect x="42" y="60" width="10" height="20" rx="2" fill="%2337474F" transform="rotate(-15 42 60)"/></svg>`
  }
]

function Profile() {
  const navigate = useNavigate()
  const token = localStorage.getItem("token")
  const isLoggedIn = token && token !== "null" && token !== "undefined"

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [profilePicture, setProfilePicture] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [activeAvatar, setActiveAvatar] = useState("")

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" })
    }, 3000)
  }

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login")
      return
    }

    // Fetch user profile data
    fetch("https://cinevault-backend-nh60.onrender.com/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to load profile")
        }
        return res.json()
      })
      .then(data => {
        setUsername(data.username || "")
        setEmail(data.email || "")
        setBio(data.bio || "")
        setProfilePicture(data.profilePicture || "")
        
        // Determine if profile picture is custom URL or preset
        const matchingPreset = PRESET_AVATARS.find(avatar => avatar.svg === data.profilePicture)
        if (matchingPreset) {
          setActiveAvatar(matchingPreset.id)
          setCustomUrl("")
        } else if (data.profilePicture) {
          setActiveAvatar("custom")
          setCustomUrl(data.profilePicture)
        } else {
          setActiveAvatar("")
          setCustomUrl("")
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        showToast("Error loading profile details", "error")
        setLoading(false)
      })
  }, [isLoggedIn, navigate, token])

  const handleSelectPreset = (avatar) => {
    setActiveAvatar(avatar.id)
    setProfilePicture(avatar.svg)
    setCustomUrl("")
  }

  const handleCustomUrlChange = (val) => {
    setCustomUrl(val)
    setActiveAvatar("custom")
    setProfilePicture(val)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      showToast("Username cannot be empty", "error")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("https://cinevault-backend-nh60.onrender.com/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          bio,
          profilePicture: customUrl ? customUrl.trim() : profilePicture
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Update local storage values
        localStorage.setItem("username", data.username)
        localStorage.setItem("profilePicture", data.profilePicture)
        
        showToast("Profile updated successfully!", "success")
        
        // Dispatch custom storage event to notify Navbar
        window.dispatchEvent(new Event("storage"))
      } else {
        showToast(data.message || "Failed to update profile", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Failed to save changes", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar query="" setQuery={() => {}} searchResults={[]} />
        <div className="profile-container-page">
          <div className="profile-card-layout">
            <div className="profile-skeleton-container">
              <div className="profile-skeleton-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "20px", marginBottom: "30px" }}>
                <div className="skeleton" style={{ height: "36px", width: "200px", borderRadius: "6px" }}></div>
                <div className="skeleton" style={{ height: "36px", width: "100px", borderRadius: "20px" }}></div>
              </div>
              <div className="profile-form-body">
                <div className="profile-left-col" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="skeleton" style={{ width: "150px", height: "150px", borderRadius: "50%", marginBottom: "20px" }}></div>
                  <div className="skeleton" style={{ width: "100%", height: "120px", borderRadius: "8px" }}></div>
                </div>
                <div className="profile-right-col" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div>
                    <div className="skeleton" style={{ height: "16px", width: "100px", marginBottom: "8px", borderRadius: "4px" }}></div>
                    <div className="skeleton" style={{ height: "45px", width: "100%", borderRadius: "6px" }}></div>
                  </div>
                  <div>
                    <div className="skeleton" style={{ height: "16px", width: "120px", marginBottom: "8px", borderRadius: "4px" }}></div>
                    <div className="skeleton" style={{ height: "45px", width: "100%", borderRadius: "6px" }}></div>
                  </div>
                  <div>
                    <div className="skeleton" style={{ height: "16px", width: "150px", marginBottom: "12px", borderRadius: "4px" }}></div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: "12px" }}>
                      {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: "8px" }}></div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="skeleton" style={{ height: "16px", width: "180px", marginBottom: "8px", borderRadius: "4px" }}></div>
                    <div className="skeleton" style={{ height: "45px", width: "100%", borderRadius: "6px" }}></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                    <div className="skeleton" style={{ height: "45px", width: "150px", borderRadius: "8px" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar query="" setQuery={() => {}} searchResults={[]} />

      <div className="profile-container-page">
        <div className="profile-card-layout">
          
          {/* Header */}
          <div className="profile-header">
            <h1>
              <i className="fa-solid fa-user-gear"></i> Edit Profile
            </h1>
            <Link to="/" className="back-link">
              <i className="fa-solid fa-house"></i> Home
            </Link>
          </div>

          <form onSubmit={handleSave} className="profile-form-body">
            
            {/* Left Column: Avatar Section */}
            <div className="profile-left-col">
              <div className="avatar-preview-box">
                {profilePicture ? (
                  <img src={profilePicture} alt="Avatar Preview" className="avatar-large-preview" />
                ) : (
                  <div className="avatar-large-text">{username ? username[0].toUpperCase() : "U"}</div>
                )}
                <span className="preview-label">Avatar Preview</span>
              </div>

              {/* Bio Field */}
              <div className="form-group bio-group">
                <label htmlFor="bio">About Me / Bio</label>
                <textarea
                  id="bio"
                  placeholder="Tell us about your favorite movie genres, actors, or what makes you a true cinephile..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="4"
                />
              </div>
            </div>

            {/* Right Column: User info & preset selector */}
            <div className="profile-right-col">
              
              {/* Username Input */}
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter username"
                />
              </div>

              {/* Email Input (Readonly) */}
              <div className="form-group">
                <label htmlFor="email">Email Address <span className="readonly-badge">Read-only</span></label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  readOnly
                  disabled
                  title="Email cannot be changed"
                />
              </div>

              {/* Presets Grid */}
              <div className="avatar-selection-section">
                <label>Choose a Movie Icon Avatar</label>
                <div className="avatars-grid">
                  {PRESET_AVATARS.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`avatar-preset-item ${activeAvatar === avatar.id ? "selected" : ""}`}
                      onClick={() => handleSelectPreset(avatar)}
                      title={avatar.name}
                    >
                      <img src={avatar.svg} alt={avatar.name} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Image URL Field */}
              <div className="form-group custom-url-group">
                <label htmlFor="custom-url">Or use custom Avatar Image URL</label>
                <div className="custom-url-input-wrapper">
                  <input
                    type="url"
                    id="custom-url"
                    value={customUrl}
                    onChange={(e) => handleCustomUrlChange(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                  />
                  {customUrl && (
                    <button type="button" className="clear-url-btn" onClick={() => { setCustomUrl(""); setProfilePicture(""); setActiveAvatar(""); }}>
                      <i className="fa-solid fa-circle-xmark"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="profile-actions-bar">
                <button type="submit" className="save-profile-btn" disabled={saving}>
                  {saving ? (
                    <><div className="small-spinner"></div> Saving...</>
                  ) : (
                    <><i className="fa-solid fa-circle-check"></i> Save Changes</>
                  )}
                </button>
              </div>

            </div>

          </form>

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

export default Profile
