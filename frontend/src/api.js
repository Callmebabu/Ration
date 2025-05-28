import axios from "axios";

const api = axios.create({
  baseURL: "https://my-backend.onrender.com/api", // Replace with your Django backend API base URL
});

export default api;
