import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginUser from './pages/LoginUser';
import UserDashboard from './pages/UserDashboard';
import VendorDashboard from './pages/VendorDashboard';
import CompanyDetails from './pages/CompanyDetails'; // Import the company details page
import TranscriptionDashboard from './pages/TranscriptionDashboard'; // Import the transcription dashboard

const App = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginUser />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="/company/:id" element={<CompanyDetails />} /> {/* Add route for company details */}
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/transcription-dashboard" element={<TranscriptionDashboard />} />
        </Routes>
    );
};

export default App;