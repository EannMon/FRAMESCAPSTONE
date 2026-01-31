import React from 'react';
import './Footer.css'; // New CSS file for the footer

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-content-container">
                {/* Column 1: About Us */}
                <div className="footer-column">
                    <h4>About Us</h4>
                    <p>
                        We are dedicated to providing innovative solutions that 
                        help our campus grow and succeed in the digital age.
                    </p>
                    {/* Social icons from the image (optional) */}
                    <div className="footer-social-icons">
                        <a href="#!" className="social-icon fb"><i className="fab fa-facebook-f"></i></a>
                        <a href="#!" className="social-icon tw"><i className="fab fa-twitter"></i></a>
                        <a href="#!" className="social-icon ig"><i className="fab fa-instagram"></i></a>
                        <a href="#!" className="social-icon li"><i className="fab fa-linkedin-in"></i></a>
                    </div>
                </div>

                {/* Column 2: Contact Info */}
                <div className="footer-column">
                    <h4>Contact Info</h4>
                    <ul className="contact-list">
                        <li>
                            <i className="fas fa-map-marker-alt"></i>
                            <span>Ayala Blvd., Ermita, Manila 1000, Philippines</span>
                        </li>
                        <li>
                            <i className="fas fa-phone-alt"></i>
                            <span>+1 (234) 567-890</span>
                        </li>
                        <li>
                            <i className="fas fa-envelope"></i>
                            <span>contact@university.edu</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom Copyright Bar */}
            <div className="footer-bottom-bar">
                <p>© 2025 FRAMES. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;