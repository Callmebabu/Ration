import React, { useState } from "react";
import api from "../api";

function OrderForm() {
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");

  const handleOrder = () => {
    const user = JSON.parse(localStorage.getItem("user"));

    api
      .post("/order/", {
        aadhar: user?.aadhar,
        item,
        quantity,
      })
      .then(() => {
        alert("Order placed successfully");
      })
      .catch(() => {
        alert("Failed to place order");
      });
  };

  return (
    <div>
      <h2>Place an Order</h2>
      <input
        type="text"
        placeholder="Item Name"
        value={item}
        onChange={(e) => setItem(e.target.value)}
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <button onClick={handleOrder}>Order</button>
    </div>
  );
}

export default OrderForm;
