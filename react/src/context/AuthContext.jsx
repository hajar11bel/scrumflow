import { createContext, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext();
export { AuthContext };

export function AuthProvider({ children }) {

    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem("token");
    });

    const login = async (email, password) => {
        const authResponse = await authService.login({ email, password });

        const loggedUser = {
            userId: authResponse.userId,
            fullName: authResponse.fullName,
            email: authResponse.email,
            role: authResponse.role,
        };

        setUser(loggedUser);
        setToken(authResponse.token ?? null);

        localStorage.setItem("user", JSON.stringify(loggedUser));
        if (authResponse.token) {
            localStorage.setItem("token", authResponse.token);
        } else {
            localStorage.removeItem("token");
        }

        return loggedUser;
    };

    const register = async (fullName, email, password, role) => {
        return authService.register({
            fullName,
            email,
            password,
            role,
        });
    };

    const logout = () => {
        setUser(null);
        setToken(null);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    const value = useMemo(() => ({
        user,
        token,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
    }), [user, token]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}