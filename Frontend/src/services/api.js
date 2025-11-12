import axios from "axios";

export const api = axios.create({
  //withCredentials: true,
  baseURL: process.env.REACT_APP_NESA_BACKEND_URL,
});

export default api

