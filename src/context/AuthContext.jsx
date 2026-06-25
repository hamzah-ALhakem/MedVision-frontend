import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load auth state from local storage
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');

            if (storedUser && storedToken) {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            }
        } catch (error) {
            console.error('Failed to parse user from local storage:', error);
            // Clear corrupted state
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
