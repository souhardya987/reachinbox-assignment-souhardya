import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

interface User {
    id: string;
    displayName: string;
    email: string;
    photo: string;
}

interface AuthContextType {
    user: User | null;
    login: () => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        // We must use withCredentials: true for cross-origin cookies if backend is on a different domain
        axios.get(`${API_URL}/auth/me`, { withCredentials: true })
            .then(res => {
                setUser(res.data);
            })
            .catch(() => {
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    const logout = () => {
        window.location.href = `${API_URL}/auth/logout`;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
