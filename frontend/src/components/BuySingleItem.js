import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./Navbar";

function BuySingleItem() {
  const { state } = useLocation();
  const item = state?.item;
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);  // New state for payment method
  const navigate = useNavigate();

  const handleBuy = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !item) return;

    // Sending the order to the backend
    axios.post("http://127.0.0.1:8000/api/place-order/", {
      family_id: user.family_id,
      items: [{ item_id: item.item_id, quantity }]
    }).then((res) => {
      setMessage(`✅ Order Placed: OTP ${res.data.otp}, Token ${res.data.token_number}, Total ₹${res.data.total_price}`);
      
      // Now redirect to the payment page after order placement
      if (paymentMethod === 'cash') {
        setMessage('Cash on Delivery selected');
        // You can further handle this in the backend to mark order as COD
        navigate("/order-confirmation");
      } else if (paymentMethod === 'phonepe') {
        setMessage('Redirecting to PhonePe...');
        // Simulate PhonePe payment redirection (replace with actual integration)
        setTimeout(() => {
          alert('PhonePe payment successful');
          navigate("/order-confirmation"); // Redirect to order confirmation after payment
        }, 2000);
      }
    }).catch(() => {
      setMessage("❌ Failed to place order");
    });
  };

  // If item doesn't exist, return a message
  if (!item) return <div>No item selected.</div>;

  return (
    <div className="buy-single-item-wrapper">
      <Navbar />
      <h2>Buy: {item.item_name}</h2>
      <img src={item.image} alt={item.item_name} style={{ maxWidth: "200px" }} />
      <p>Available: {item.quantity_available} kg</p>
      <p>Price: ₹{item.price}</p>

      {/* Quantity Input */}
      <div>
        <label>Select Quantity (kg):</label>
        <input
          type="number"
          min="1"
          max={item.quantity_available}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
        />
      </div>

      {/* Payment Method Options */}
      <div style={{ marginTop: "20px" }}>
        <h3>Payment Method</h3>
        <button onClick={() => setPaymentMethod('cash')}>Cash on Delivery</button>
        <button onClick={() => setPaymentMethod('phonepe')}>PhonePe</button>
      </div>

      {/* Place Order Button */}
      <button onClick={handleBuy} style={{ marginTop: "20px" }}>
        Place Order
      </button>

      {/* Show message */}
      {message && <p>{message}</p>}
    </div>
  );
}

export default BuySingleItem;
