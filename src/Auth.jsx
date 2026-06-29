import { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import logo from "./assets/cinevault-logo.png";

function Auth() {
    const nav = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Custom Toast Notification State
    const [toast, setToast] = useState({ show: false, message: "", type: "success" })

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type })
        setTimeout(() => {
            setToast({ show: false, message: "", type: "success" })
        }, 3000)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isLogin) {
                // LOGIN
                const res = await fetch("http://localhost:5000/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                })

                const data = await res.json()

                if (data.token) {
                    localStorage.setItem("token", data.token)
                    localStorage.setItem("username", data.username || "User")
                    localStorage.setItem("profilePicture", data.profilePicture || "")
                    
                    showToast("Login successful!", "success")
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 1000)
                } else {
                    showToast(data.message || "Login failed", "error")
                }

            } else {
                // SIGNUP
                const res = await fetch("http://localhost:5000/signup", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ email, password, username })
                })

                const data = await res.json()

                if (data.token) {
                    localStorage.setItem("token", data.token)
                    localStorage.setItem("username", data.username || "User")
                    localStorage.setItem("profilePicture", data.profilePicture || "")
                    
                    showToast("Signup successful! Logging you in...", "success")
                    setTimeout(() => {
                        window.location.href = "/"
                    }, 1000)
                } else if (data.message && data.message.includes("success")) {
                    showToast(data.message, "success")
                    setTimeout(() => {
                        setIsLogin(true)
                    }, 1500)
                } else {
                    showToast(data.message || "Signup failed", "error")
                }
            }

        } catch (err) {
            console.log(err)
            showToast("Something went wrong", "error")
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div style={{ cursor: "pointer", display: "inline-block" }} onClick={() => nav("/")}>
                    <img src={logo} alt="CineVault" style={{ height: "70px", objectFit: "contain", marginBottom: "20px" }} />
                </div>
                <h2>
                    {isLogin ? (
                        <><i className="fa-solid fa-lock" style={{ marginRight: "8px" }}></i> Login</>
                    ) : (
                        <><i className="fa-solid fa-user-plus" style={{ marginRight: "8px" }}></i> Create Account</>
                    )}
                </h2>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <div className="password-input-container" style={{ position: "relative", width: "100%" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingRight: "40px", boxSizing: "border-box" }}
                        />
                        <i 
                            className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute",
                                right: "15px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#888",
                                fontSize: "14px",
                                transition: "color 0.2s"
                            }}
                        ></i>
                    </div>

                    <button type="submit">
                        {isLogin ? "Login" : "Sign Up"}
                    </button>
                </form>

                <p className="switch">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <span onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? " Sign Up" : " Login"}
                    </span>
                </p>
            </div>

            {/* Custom Toast Alert */}
            <div className={`toast-notification ${toast.type} ${toast.show ? "show" : ""}`}>
                <i className={toast.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
                <span>{toast.message}</span>
            </div>
        </div>
    )
}

export default Auth;