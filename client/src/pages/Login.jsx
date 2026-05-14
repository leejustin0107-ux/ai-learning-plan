import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/login.css';
 
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }
 
  return (
    <div className="center-container">
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
      {error && <p className="error">{error}</p>}
      <p>Email:</p>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <br></br>
      <p>Password:</p>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
      <br></br>
      <button type="submit">Masuk</button>
      <br></br>
      <h4>If you dont have an account click <Link to="/register">Here!</Link> to register</h4>
    </form>
    </div>
  );
}