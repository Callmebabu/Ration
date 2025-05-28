// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // Check if the user is logged in (You can adjust this based on your authentication mechanism)
  const user = JSON.parse(localStorage.getItem('user')); // Assuming you're storing user data in localStorage

  if (!user) {
    // If no user is found in localStorage, redirect to the login page
    return <Navigate to="/" />;
  }

  return children; // If the user is logged in, render the protected content (children)
};

export default ProtectedRoute;
