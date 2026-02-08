import React from 'react';
import PropTypes from 'prop-types';
import logo from '../../assets/frames_logo.png';

const Logo = ({ className = '', size = 40, lightContainer = false, colorShift = false }) => {
  const containerStyle = lightContainer
    ? {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        width: typeof size === 'number' ? size + 12 : `calc(${size} + 12px)`,
        height: typeof size === 'number' ? size + 12 : `calc(${size} + 12px)`,
      }
    : {};

  const imageStyle = colorShift 
    ? { 
        display: 'block', 
        filter: 'hue-rotate(180deg) invert(1) brightness(1.5)' // Rotate and Invert to keep green, make navy light
      } 
    : { display: 'block' };

  return (
    <div className={`logo-container ${className}`} style={containerStyle}>
      <img
        src={logo}
        alt="Frames Logo"
        width={size}
        height={size}
        style={imageStyle}
      />
    </div>
  );
};

Logo.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  lightContainer: PropTypes.bool,
  colorShift: PropTypes.bool,
};

export default Logo;
