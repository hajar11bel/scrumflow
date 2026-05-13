import axios from "axios";

/*
 Axios est la bibliothèque utilisée pour envoyer
 des requêtes HTTP depuis React vers Spring Boot.

 Backend Spring Boot :
 http://localhost:8080/api

 Frontend React :
 http://localhost:5174

 React va donc appeler les endpoints du backend
 grâce à cette configuration centrale.
*/
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
});

api.interceptors.request.use((config) => {
    if (typeof window === "undefined") {
        return config;
    }
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;