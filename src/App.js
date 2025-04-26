import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginUser from './pages/LoginUser';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginUser />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
        </Routes>
    );
};

export default App;
