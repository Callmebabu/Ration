import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", 
  // Replace with your Django backend API base URL
});

export default api;
