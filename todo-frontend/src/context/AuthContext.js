import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const signup = async (username, password) => {
        await axios.post('http://localhost:5000/signup', { username, password });
    };

    const login = async (username, password) => {
        const response = await axios.post('http://localhost:5000/login', { username, password });
        setUser(response.data);
        localStorage.setItem('token', response.data);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
