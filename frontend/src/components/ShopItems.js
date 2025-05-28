import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from './Navbar';
import './ShopItems.css';
import monkeyImg from '../assets/images/monkey.png';

function ShopItems() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const totalRef = useRef(null);
  const prevTotalRef = useRef(0);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const baseURL = `${window.location.protocol}//${window.location.hostname}:8000`;

    if (storedUser?.family_id) {
      axios.get(`${baseURL}/api/stock/`, {
        params: { family_id: storedUser.family_id }
      })
      .then((res) => {
        setItems(res.data.stock);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading items:", err);
        setLoading(false);
      });
    } else {
      alert(t('userNotLoggedIn'));
      setLoading(false);
    }
  }, [t]);

  const toggleItemSelection = (item, index) => {
    if (item.total_quantity < item.limit) {
      alert(t('stockOverAlert'));
      return;
    }

    const key = `${item.id}-${index}`;
    setSelectedItems((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
        new Audio("/sounds/c2.mp3").play().catch(() => {});
      } else {
        updated[key] = {
          quantity: item.limit,
          price: item.price,
          item_id: item.id,
          name: item.name || t('unnamedItem'),
          image: item.image,
        };
        new Audio("/sounds/c.mp3").play().catch(() => {});
      }
      return updated;
    });
  };

  const handleBuyNow = () => {
    const selectedArray = Object.values(selectedItems);
    const user = JSON.parse(localStorage.getItem("user"));
    localStorage.setItem("selectedItems", JSON.stringify(selectedArray));
    navigate("/place-order", {
      state: {
        selectedItems: selectedArray,
        user,
      },
    });
  };

  const animateTotalPrice = (element, start, end, duration = 800) => {
    const range = end - start;
    let startTimestamp = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * range + start);
      element.textContent = '₹' + current.toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.classList.remove('animate');
      }
    };

    element.classList.add('animate');
    window.requestAnimationFrame(step);
  };

  const currentTotal = Object.values(selectedItems).reduce(
    (total, { quantity, price }) => total + quantity * price,
    0
  );

  useEffect(() => {
    if (totalRef.current) {
      animateTotalPrice(totalRef.current, prevTotalRef.current, currentTotal);
      prevTotalRef.current = currentTotal;
    }
  }, [currentTotal]);

  const calculateTimeLeft = (createdAt) => {
    const created = new Date(createdAt);
    const expires = new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const diff = expires - now;
    if (diff <= 0) return t('expired');

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    return `${days}d ${hours}h ${minutes}m ${t('left')}`;
  };

  const visibleItems = items.filter(item => item.total_quantity > 0 && item.limit > 0);

  if (loading) {
    return (
      <div className="shop-page-wrapper">
        <Navbar />
        <div className="shop-content"><p>{t('loadingItems')}</p></div>
      </div>
    );
  }

  return (
    <div className="shop-page-wrapper">
      <Navbar />
      <div className="shop-content">
        <div className="shop-header">
          <div className="total-price">
            <strong ref={totalRef}>₹{currentTotal.toLocaleString()}</strong>
          </div>
          <h2>{t('shopItems')}</h2>
          <button
            onClick={handleBuyNow}
            className="place-order-btn"
            disabled={Object.keys(selectedItems).length === 0}
          >
            {t('buyNow')}
          </button>
        </div>

        {visibleItems.length === 0 ? (
          <div className="no-stock-message">
            <img src={monkeyImg} alt="No stock" className="no-stock-img" />
            <p>{t('noStockAvailable')}<br />{t('checkBackLater')}</p>
          </div>
        ) : (
          <ul className="item-list">
            {visibleItems.map((item, index) => {
              const key = `${item.id}-${index}`;
              const selected = selectedItems[key];
              const baseURL = `${window.location.protocol}//${window.location.hostname}:8000`;

              return (
                <li
                  key={key}
                  className={`item ${selected ? "selected" : ""} ${item.total_quantity < item.limit ? "out-of-stock" : ""}`}
                  onClick={() => toggleItemSelection(item, index)}
                  style={{
                    cursor: item.total_quantity < item.limit ? 'not-allowed' : 'pointer',
                    opacity: item.total_quantity < item.limit ? 0.5 : 1
                  }}
                >
                  <div className="item-image-wrapper">
                    <img
                      src={item.image?.startsWith('http') ? item.image : `${baseURL}/media/${item.image}`}
                      alt={item.name || t('unnamedItem')}
                      className="item-image"
                    />
                  </div>
                  <div className="item-details">
                    <strong>{item.name ? t(item.name) : t('unnamedItem')}</strong>

                    <div className="item-price">₹{item.price} {t('perKg')}</div>
                    <div className="item-stock">{item.total_quantity} {t('kgAvailable')}</div>
                    <div className="item-limit">{t('limit', { count: item.limit })}</div>
                    <div className="item-time-left">
                      <small style={{ color: '#777' }}>{calculateTimeLeft(item.created_at)}</small>
                    </div>
                    {item.total_quantity < item.limit && (
                      <div style={{ color: 'red', fontWeight: 'bold' }}>
                        {t('stockOverVisit')}
                      </div>
                    )}
                    {selected && (
                      <div className="item-selected-quantity">
                        <strong>{t('selected_kg', { count: item.limit })}</strong>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

if (/Android/i.test(navigator.userAgent)) {
  document.body.classList.add('android-device');
}

export default ShopItems;
