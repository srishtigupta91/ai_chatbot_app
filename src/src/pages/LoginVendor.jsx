import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginVendor = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // ...existing code for authentication...
    navigate('/vendor-dashboard');
  };

  return (
    <div>
      <h1>Vendor Login</h1>
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

export default LoginVendor;
