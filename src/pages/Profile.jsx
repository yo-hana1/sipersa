import { useState, useRef } from 'react';
import Card from '../components/Card';
import { User, Mail, Briefcase, Shield, Upload } from 'lucide-react';

function Profile() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sipersa_user')) || {});
  const fileInputRef = useRef(null);

  const formatRole = (r) => {
    if (!r) return '-';
    return r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user.id) {
      alert("Gagal: ID User tidak ditemukan");
      return;
    }

    const formData = new FormData();
    formData.append('user_id', user.id);
    formData.append('profile_picture', file);

    try {
      const response = await fetch('http://localhost/siarsad/api/upload_profile.php', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      
      if (data.success) {
        // Update local storage and state
        const updatedUser = { ...user, profile_picture: data.profile_picture };
        localStorage.setItem('sipersa_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Also fire a custom event so Navbar can update if it listens, 
        // but simplest is just refreshing the page or relying on state
        window.location.reload(); 
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat mengunggah foto profil.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Profile Saya</h1>
        <div className="breadcrumb d-none d-md-flex">
          <span>SIPERSA</span>
          <span>/</span>
          <span className="active">Profile</span>
        </div>
      </div>

      <Card>
        <div style={{ padding: '2rem 1rem' }}>
          <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
            Selamat datang, {user.full_name}
          </h2>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            {/* Foto Profil Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div 
                style={{ 
                  width: '150px', height: '150px', 
                  borderRadius: '50%', overflow: 'hidden', 
                  backgroundColor: 'var(--primary-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '4rem', fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {user.profile_picture ? (
                  <img src={`http://localhost/siarsad/api/${user.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.full_name?.charAt(0) || 'U'
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".jpg,.jpeg,.png" 
                onChange={handleAvatarUpload} 
              />
              
              <button 
                onClick={() => fileInputRef.current.click()}
                style={{
                  background: 'none', border: 'none', 
                  color: 'var(--primary-color)', textDecoration: 'underline',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.875rem'
                }}
              >
                <Upload size={16} />
                ubah foto profile
              </button>
            </div>

            {/* Informasi Umum Section */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                Informasi Umum
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nama Lengkap</div>
                    <div style={{ fontWeight: 600 }}>{user.full_name || '-'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email</div>
                    <div style={{ fontWeight: 600 }}>{user.email || '-'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <Shield size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role Sistem</div>
                    <div style={{ fontWeight: 600 }}>{formatRole(user.role)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                    <Briefcase size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Jabatan</div>
                    <div style={{ fontWeight: 600 }}>{user.jabatan || formatRole(user.role)}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </Card>
    </div>
  );
}

export default Profile;
