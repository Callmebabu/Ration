import React from 'react';
import './Loader.css';
import wheatLoader from '../assets/images/w.png'; // Your loader image

function Loader() {
  return (
    <div className="loader-container">
      <img src={wheatLoader} alt="Loading..." className="loader-image" />
    </div>
  );
}

export default Loader;
