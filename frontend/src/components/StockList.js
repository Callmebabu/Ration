import React, { useEffect, useState } from "react";
import axios from "axios";

function StockList() {
  const [stock, setStock] = useState([]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/stock/") // Replace with correct API endpoint
      .then((res) => setStock(res.data.stock))
      .catch((error) => console.error("Error fetching stock:", error));
  }, []);

  return (
    <div>
      <h2>Available Ration Stock</h2>
      <ul>
        {stock.map((item) => (
          <li key={item.item_id}>
            {item.item_name} - {item.quantity_available} kg
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StockList;
