import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/register.css'
 
export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
 
  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Register gagal');
      }

      if (password !== confirmPassword) {
        setError("Password tidak sama");
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    }
  };
 
  return (
    <div className="center-container">
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      {error && <p className="error">{error}</p>}
      <p>Email:</p>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
      <br></br>
      <p>Password:</p>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
      <br></br>
      <p>Confirm Password:</p>
      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required />
      <br></br>
      <button type="submit">Register</button>
      <br></br>
      <h4>If you have an account click <Link to="/login">Here!</Link> to login</h4>
    </form>
    </div>
  );
}