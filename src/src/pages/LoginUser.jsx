import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginUser.css'; // Import the CSS file for styling

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LoginUser = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const role = data.user_details.role;
        const userId = data.user_details.id; // Assuming `user_id` is part of the response

        // Store user_id in local storage
        localStorage.setItem('user_id', userId);
        console.log('User ID stored in local storage:', userId); // Debugging log

        if (role === 'vendor') {
          navigate('/vendor-dashboard');
        } else {
          navigate('/user-dashboard');
        }
      } else {
        console.error('Login failed');
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <div className="login-container">
      <h1>User Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default LoginUser;