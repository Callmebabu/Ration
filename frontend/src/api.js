import axios from "axios";

const api = axios.create({
  baseURL: "https://your-django-backend.onrender.com/api", // Your Render backend URL here
});

export default api;
