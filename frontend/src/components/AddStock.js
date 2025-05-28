import "./AddStock.css";
import React, { useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// List of predefined ration items
const rationItems = ["Rice", "Wheat", "Sugar", "Oil", "Salt", "Dal", "Kerosene"];

const areas = [
  "Tagore Nagar",
  "Muthialpet",
  "Nellithope",
  "Puducherry Town",
  "Villianur",
  "Karaikal",
  "Cuddalore",
  "Bakers Street",
  "Arumparthapuram",
];

function AddStock({ onStockAdded }) {
  const [itemName, setItemName] = useState("");
  const [limit1, setLimit1] = useState("");
  const [limit2, setLimit2] = useState("");
  const [limit3, setLimit3] = useState("");
  const [limit4, setLimit4] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");
  const [image, setImage] = useState(null);

  const handleAddItem = async () => {
    if (!itemName || !limit1 || !limit2 || !limit3 || !limit4 || !totalQuantity || !price || !area || !image) {
      toast.error("❌ Please fill in all fields, including all limits and image.");
      return;
    }

    // Convert limit fields to integers before sending to the backend
    const parsedLimit1 = parseInt(limit1, 10);
    const parsedLimit2 = parseInt(limit2, 10);
    const parsedLimit3 = parseInt(limit3, 10);
    const parsedLimit4 = parseInt(limit4, 10);

    // Validate that limits are valid numbers (avoid NaN)
    if (isNaN(parsedLimit1) || isNaN(parsedLimit2) || isNaN(parsedLimit3) || isNaN(parsedLimit4)) {
      toast.error("❌ Please enter valid numbers for limits.");
      return;
    }

    const formData = new FormData();
    formData.append("name", itemName);
    formData.append("limit_1", parsedLimit1);  // Use parsed integer values
    formData.append("limit_2", parsedLimit2);
    formData.append("limit_3", parsedLimit3);
    formData.append("limit_4", parsedLimit4);
    formData.append("total_quantity", totalQuantity);
    formData.append("price", price);
    formData.append("area", area);
    formData.append("image", image);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/add-item/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("✅ Item added successfully!");
        setItemName("");
        setLimit1(""); setLimit2(""); setLimit3(""); setLimit4("");
        setTotalQuantity("");
        setPrice("");
        setArea("");
        setImage(null);
        document.getElementById("imageInput").value = "";
        if (onStockAdded) onStockAdded();
      } else {
        toast.error(response.data.message || "❌ Failed to add item.");
      }
    } catch (error) {
      console.error("Error adding stock:", error);
      toast.error("❌ Failed to add item. Please try again.");
    }
};


  return (
    <div className="add-stock-page">
      <AdminSidebar />
      <div className="add-stock-content">
        <h3>Add New Stock Item</h3>
        <div className="add-stock-form">
          {/* Item Name Dropdown */}
          <select value={itemName} onChange={(e) => setItemName(e.target.value)}>
            <option value="">Select Item</option>
            {rationItems.map((item, index) => (
              <option key={index} value={item}>{item}</option>
            ))}
          </select>

          {/* Limit Inputs */}
          <div className="limit-inputs">
            <input type="number" placeholder="Limit for 1 member (kg)" value={limit1} onChange={(e) => setLimit1(e.target.value)} />
            <input type="number" placeholder="Limit for 2 members (kg)" value={limit2} onChange={(e) => setLimit2(e.target.value)} />
            <input type="number" placeholder="Limit for 3 members (kg)" value={limit3} onChange={(e) => setLimit3(e.target.value)} />
            <input type="number" placeholder="Limit for 4 members (kg)" value={limit4} onChange={(e) => setLimit4(e.target.value)} />
          </div>

          <input type="number" placeholder="Total Quantity (kg)" value={totalQuantity} onChange={(e) => setTotalQuantity(e.target.value)} />
          <input type="number" placeholder="Price (₹)" value={price} onChange={(e) => setPrice(e.target.value)} />
          
          {/* Area Dropdown */}
          <select value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Select Area</option>
            {areas.map((areaItem, index) => (
              <option key={index} value={areaItem}>{areaItem}</option>
            ))}
          </select>

          {/* Image Input */}
          <input id="imageInput" type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />

          <button onClick={handleAddItem}>Add Item</button>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default AddStock;
