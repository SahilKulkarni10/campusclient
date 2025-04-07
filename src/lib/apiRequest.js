import axios from "axios";

const apiRequest = axios.create({
  baseURL:
    import.meta.env.MODE === "development"
      ? `${import.meta.env.VITE_API_URL_DEV}/api`
      : `${import.meta.env.VITE_API_URL}/api`,
  withCredentials: true,
});

export default apiRequest;
