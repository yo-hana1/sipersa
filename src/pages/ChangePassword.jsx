import { useState } from 'react';
import Card from '../components/Card';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';

function ChangePassword() {
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('sipersa_user'));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      alert("Password dan Konfirmasi Password harus sama!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost/siarsad/api/change_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setFormData({ new_password: '', confirm_password: '' });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Terjadi kesalahan saat menghubungi server.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.new_password !== '' && 
                      formData.confirm_password !== '' && 
                      formData.new_password === formData.confirm_password;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Keamanan Akun</h1>
        <div className="breadcrumb d-none d-md-flex">
          <span>Pengaturan</span>
          <span>/</span>
          <span className="active">Ganti Password</span>
        </div>
      </div>

      <div style={{ maxWidth: '500px' }}>
        <Card title="Ganti Password">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input 
                  name="new_password" 
                  type={showPassword ? 'text' : 'password'} 
                  className="form-control" 
                  placeholder="Masukkan password baru" 
                  value={formData.new_password}
                  onChange={handleChange}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Password Baru</label>
              <div style={{ position: 'relative' }}>
                <input 
                  name="confirm_password" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="form-control" 
                  placeholder="Ulangi password baru" 
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required 
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formData.confirm_password && formData.new_password !== formData.confirm_password && (
                <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Password tidak cocok
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!isFormValid || loading}
                style={{ opacity: isFormValid ? 1 : 0.6 }}
              >
                <Save size={18} />
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default ChangePassword;
