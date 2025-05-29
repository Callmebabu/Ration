import axios from "axios";

const api = axios.create({
  baseURL: "https://ration-a9md.onrender.com/api",
// Replace with your Django backend API base URL
});

export default api;
