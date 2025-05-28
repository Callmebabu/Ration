import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import "./CurrentStock.css";

function CurrentStock() {
  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/admin/stock/")
      .then((res) => {
        if (res.data.stock) {
          setStock(res.data.stock);
          setFilteredStock(res.data.stock);
          const areas = [...new Set(res.data.stock.map(item => item.area))];
          setAreaList(areas);
        }
      })
      .catch((err) => console.error("Error loading stock:", err));
  }, []);

  const handleAreaChange = (e) => {
    const area = e.target.value;
    setSelectedArea(area);
    if (area === "") {
      setFilteredStock(stock);
    } else {
      const filtered = stock.filter(item => item.area === area);
      setFilteredStock(filtered);
    }
  };

  return (
    <div>
      <AdminSidebar />
      <div style={{ marginLeft: "240px", padding: "20px" }}>
        <h2>Current Stock</h2>

        {/* Area Dropdown */}
        <select value={selectedArea} onChange={handleAreaChange} className="area-select">
          <option value="">All Areas</option>
          {areaList.map((area, index) => (
            <option key={index} value={area}>{area}</option>
          ))}
        </select>

        {/* Stock Items Grid */}
        <div className="stock-grid">
          {filteredStock.length > 0 ? (
            filteredStock.map((item) => (
              <div className="stock-card" key={item.item_id}>
                {item.image && (
                  <img src={item.image} alt={item.item_name} className="stock-img" />
                )}
                <h3>{item.item_name}</h3>
                <p>{item.quantity_available} kg</p>
                <p>₹{item.price}</p>
              </div>
            ))
          ) : (
            <p>No stock available for this area.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CurrentStock;
