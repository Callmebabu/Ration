// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./components/Login";
import StockList from "./components/StockList";
import OrderForm from "./components/OrderForm";
import HomePage from "./components/HomePage";
import ShopItems from "./components/ShopItems";
import FamilyDashboard from "./components/FamilyDashboard";
import AdminDashboard from "./components/AdminDashboard";
import AddStock from "./components/AddStock";
import AddAadhar from "./components/AddFamily";
import AdminSidebar from "./components/AdminSidebar";
import Navbar from "./components/Navbar";
import BuySingleItem from "./components/BuySingleItem";
import AdminProfile from "./components/AdminProfile";
import Loader from "./components/Loader";
import PlaceOrderPage from "./components/PlaceOrderPage";
import NotificationPage from './components/NotificationPage';
import AdminOrdersPage from './components/AdminOrdersPage';
import './App.css';
import CurrentStock from "./components/CurrentStock";
import ChatBot from "./components/ChatBot";



function AppContent() {
  const user = JSON.parse(localStorage.getItem("user"));

  const location = useLocation();
  const [initialLoading, setInitialLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setRouteLoading(true);
    const timeout = setTimeout(() => setRouteLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [location]);

  const isLoginPage = location.pathname === "/";

  return (
    <div className="App">
      {(initialLoading || routeLoading) && !isLoginPage && <Loader />}

      {/* Always render Navbar, but conditionally hide it */}
      <Navbar hidden={isLoginPage || location.pathname.startsWith("/admin")} />

      <Routes>
        <Route path="/chatbot" element={<ChatBot />} />

        <Route path="/" element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/stock" element={<StockList />} />
        <Route path="/order" element={<OrderForm />} />
        <Route path="/user" element={<FamilyDashboard />} />
        <Route path="/item" element={<ShopItems />} />
        <Route path="/shop" element={<HomePage />} />
        <Route path="/buy" element={<BuySingleItem />} />
        <Route path="/place-order" element={<PlaceOrderPage />} />
      <Route path="/notifications" element={<NotificationPage userArea={user ? user.area : null} />} />
        

        {/* Admin Routes */}
        <Route path="/admin" element={<><AdminSidebar /><AdminDashboard /></>} />
        <Route path="/admin-dashboard" element={<><AdminSidebar /><AdminDashboard /></>} />
        <Route path="/admin/add-stock" element={<><AdminSidebar /><AddStock /></>} />
        <Route path="/admin/current-stock" element={<><AdminSidebar /><CurrentStock /></>} />
        <Route path="/admin/add-aadhar" element={<><AdminSidebar /><AddAadhar /></>} />
        <Route path="/admin/admin-profile" element={<><AdminSidebar /><AdminProfile /></>} />
        <Route path="/admin/view-orders" element={<AdminOrdersPage />} />

      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
