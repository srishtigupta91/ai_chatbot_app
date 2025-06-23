import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import axios from 'axios';
import './UserDashboard.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;


const UserDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  // Fetch companies data from the API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/companies/`);
        setCompanies(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch companies data.');
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleCompanyDoubleClick = async (company) => {
    try {
      // Fetch session_id and company details from the company-specific API
      const response = await axios.get(`${BACKEND_URL}/companies/${company.id}/`);
      const { session_id, data } = response.data;

      if (session_id) {
        // Store session_id in localStorage
        localStorage.setItem('session_id', session_id);
      }

      // Navigate to the company details page with the company data
      navigate(`/company/${company.id}`, { state: { company: data } });
    } catch (err) {
      console.error('Failed to fetch session_id or company details:', err);
      alert('Failed to fetch session details. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Trade Show Lead Management</h1>
        <p>CMPL Mumbai Expo 2025</p>
      </header>
      <div className="companies-grid">
        {companies.map((company) => (
          <div
            key={company.id}
            className="company-card"
            onDoubleClick={() => handleCompanyDoubleClick(company)} // Add double-click handler
          >
            <h2>{company.display_name}</h2>
            <p><strong>{company.company_type === 'product' ? 'Product Company' : 'Service Provider'}</strong></p>
            <p>{company.company_info}</p>
            <p>
              <strong>Products:</strong>{' '}
              {Array.isArray(company.product_info) && company.product_info.length > 0
                ? company.product_info.map((product) => product.product_varieties).join(', ')
                : 'No products available'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;