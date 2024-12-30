


import axios from "axios";

const apiRequest = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:8800/api"
      : "https://campusbackend-v4vp.onrender.com/api",
  withCredentials: true,
});

export default apiRequest;
