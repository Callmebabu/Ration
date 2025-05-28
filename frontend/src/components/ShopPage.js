import React, { useEffect, useState } from 'react';

function ShopPage() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Retrieve user data from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserData(user);
    } else {
      // Redirect to login if no user data is found
      window.location.href = '/';
    }
  }, []);

  return (
    <div className="shop-page">
      <h1>Welcome to the Shop, {userData ? userData.name : 'Loading...'}</h1>
      {userData ? (
        <>
          <p>Family ID: {userData.family_id}</p>
          <p>Area: {userData.area}</p>
          {/* Add your shop functionality here */}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default ShopPage;
