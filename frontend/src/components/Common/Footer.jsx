import React from 'react';
import './Footer.css';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-content-container">
                {/* Column 1: About Us */}
                <div className="footer-column">
                    <h4>About Us</h4>
                    <p>
                        FRAMES — Facial Recognition Attendance and Monitoring System.
                        A smart campus management solution powered by Raspberry Pi,
                        featuring facial recognition for secure, automated attendance tracking.
                    </p>
                    <div className="footer-social-icons">
                        <a href="https://www.facebook.com/dencmiks/" target="_blank" rel="noopener noreferrer" className="social-icon fb" aria-label="Facebook">
                            <i className="fab fa-facebook-f"></i>
                        </a>
                        <a href="https://www.threads.com/@lenayanaaa?igshid=NTc4MTIwNjQ2YQ==" target="_blank" rel="noopener noreferrer" className="social-icon tw" aria-label="Threads">
                            <i className="fa-brands fa-threads"></i>
                        </a>
                        <a href="https://www.instagram.com/_moneann/" target="_blank" rel="noopener noreferrer" className="social-icon ig" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/angelica-terana-524297258" target="_blank" rel="noopener noreferrer" className="social-icon li" aria-label="LinkedIn">
                            <i className="fab fa-linkedin-in"></i>
                        </a>
                    </div>
                </div>

                {/* Column 2: Contact Info */}
                <div className="footer-column">
                    <h4>Contact Info</h4>
                    <ul className="contact-list">
                        <li>
                            <i className="fas fa-map-marker-alt"></i>
                            <a href="https://maps.google.com/?q=Ayala+Blvd+Ermita+Manila+Philippines" target="_blank" rel="noopener noreferrer">
                                Ayala Blvd., Ermita, Manila 1000, Philippines
                            </a>
                        </li>
                        <li>
                            <i className="fas fa-phone-alt"></i>
                            <a href="tel:09669837650">0966 983 7650</a>
                        </li>
                        <li>
                            <i className="fas fa-envelope"></i>
                            <a href="mailto:framessys01@gmail.com">framessys01@gmail.com</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom-bar">
                <p>&copy; {new Date().getFullYear()} FRAMES. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;