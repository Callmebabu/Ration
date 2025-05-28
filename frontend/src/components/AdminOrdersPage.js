import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminSidebar from "./AdminSidebar";
import "./AdminOrdersPage.css";

function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [areaList, setAreaList] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8000/api/admin/view_orders/",
          {
            headers: {
              Authorization: `Token c443c3310c97c022f737090454810bffe166e858`,
            },
          }
        );

        if (response.data.success) {
          const ordersData = response.data.orders;
          setOrders(ordersData);

          const areas = [...new Set(ordersData.map((order) => order.area))];
          setAreaList(areas);

          setMessage("");
        } else {
          setMessage("Failed to fetch orders.");
          setOrders([]);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
        setMessage("Error loading orders. Make sure you are logged in as admin.");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Filter orders by area
  const filteredOrders = selectedArea
    ? orders.filter((order) => order.area === selectedArea)
    : orders;

  // Group orders by family
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    if (!acc[order.family]) acc[order.family] = [];
    acc[order.family].push(order);
    return acc;
  }, {});

  return (
    <div>
      <AdminSidebar />
      <main className="admin-orders-container" style={{ marginLeft: "240px", padding: "20px" }}>
        <h2>All Orders</h2>

        <select
          className="area-select"
          value={selectedArea}
          onChange={(e) => setSelectedArea(e.target.value)}
        >
          <option value="">All Areas</option>
          {areaList.map((area, i) => (
            <option key={i} value={area}>
              {area}
            </option>
          ))}
        </select>

        {message && <div className="error">{message}</div>}

        {loading ? (
          <p>Loading orders...</p>
        ) : Object.keys(groupedOrders).length === 0 ? (
          <p>No orders found{selectedArea ? ` for area "${selectedArea}"` : ""}.</p>
        ) : (
          Object.entries(groupedOrders).map(([family, orders]) => (
            <section key={family} className="family-section">
              <h3 className="family-name">{family}</h3>
              {orders.map((order) => (
                <article key={order.order_id} className="order-card">
                  <header className="order-header">
                    <span>Token: <strong>{order.token_number}</strong></span>
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                  </header>
                  <div className="order-details">
                    <div><strong>Area:</strong> {order.area}</div>
                    <div><strong>Total Price:</strong> ₹{order.total_price}</div>
                    <div><strong>Status:</strong> {order.payment_status}</div>
                  </div>

                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty (kg)</th>
                        <th>Price/kg</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.item_name}</td>
                          <td>{item.quantity}</td>
                          <td>₹{item.price_per_unit}</td>
                          <td>₹{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </article>
              ))}
            </section>
          ))
        )}
      </main>
    </div>
  );
}

export default AdminOrdersPage;
