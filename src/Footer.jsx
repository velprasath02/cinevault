import React from 'react'
import { Link } from 'react-router-dom'
import logo from './assets/cinevault-logo.png'
import './Footer.css'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-brand">
                    <img src={logo} alt="CineVault Logo" className="footer-logo" />
                    <p className="footer-tagline">Your ultimate personal movie vault. Track, discover, and organize your favorite films in one seamless experience.</p>
                </div>
                <div className="footer-links">
                    <div className="footer-column">
                        <h4>Navigation</h4>
                        <Link to="/">Home</Link>
                        <Link to="/watchlist">My Vault</Link>
                        <Link to="/login">Account</Link>
                    </div>
                    <div className="footer-column">
                        <h4>Connect</h4>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                            <i className="fa-brands fa-github"></i> GitHub
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                            <i className="fa-brands fa-x-twitter"></i> Twitter
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                            <i className="fa-brands fa-instagram"></i> Instagram
                        </a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} CineVault. All rights reserved. Crafted for movie enthusiasts.</p>
            </div>
        </footer>
    )
}

export default Footer
