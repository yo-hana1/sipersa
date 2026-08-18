import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

function Login({ setIsAuthenticated, setRole }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost/siarsad/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password })
      });

      const data = await response.json();

      if (data.success) {
        setRole(data.user.role);
        localStorage.setItem('sipersa_user', JSON.stringify(data.user));
        
        // Record login activity
        await fetch('http://localhost/siarsad/api/activity_logs.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: data.user.id,
            action: 'Login',
            description: 'Pengguna berhasil masuk ke sistem'
          })
        });

        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Gagal terhubung ke server database.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/img/logorestu2.png" alt="Logo" style={{ width: '120px', marginBottom: '0.5rem' }} />
          <h2 style={{ margin: 0 }}>Login SIPERSA</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', marginBottom: '1.5rem' }}>
            Sistem Informasi Persuratan dan Arsip
          </p>
        </div>
        
        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              name="email_address" 
              type="email" 
              className="form-control" 
              placeholder="Masukkan email anda" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="one-time-code" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              name="secret_key" 
              type="password" 
              className="form-control" 
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password" 
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input type="checkbox" id="remember" style={{ width: 'auto', margin: 0, cursor: 'pointer' }} />
            <label htmlFor="remember" className="form-label" style={{ marginBottom: 0, cursor: 'pointer' }}>Ingat Saya</label>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            <LogIn size={18} />
            Login
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          <Link to="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Lupa password?
          </Link>
        </div>
        

      </div>
    </div>
  );
}

export default Login;
