import { useState, useRef, useEffect } from 'react';
import { Menu, Bell, User, Lock, Settings, LogOut, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Navbar({ toggleSidebar, role, setRole, setIsAuthenticated }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sipersa_user')) || { 
    full_name: 'Guest User', 
    email: 'guest@sipersa.id',
    role: 'guru' 
  });

  const fileInputRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`http://localhost/siarsad/api/notifications.php?user_id=${user.id}&role=${role}`);
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  const markAsRead = async (notifId = null) => {
    try {
      await fetch('http://localhost/siarsad/api/notifications.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          user_id: user.id,
          notif_id: notifId
        })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [user.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Utility for role name formatting
  const formatRole = (r) => {
    if (!r) return 'Guest';
    return r.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleLogout = () => {
    localStorage.removeItem('sipersa_user');
    setIsAuthenticated(false);
    navigate('/login');
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
        const updatedUser = { ...user, profile_picture: data.profile_picture };
        localStorage.setItem('sipersa_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        alert(data.message);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Terjadi kesalahan saat mengunggah foto profil.');
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="hamburger" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <div className="breadcrumb d-none d-md-flex">
          <span style={{ color: 'var(--text-secondary)' }}>SIPERSA</span>
          <span>/</span>
          <span className="active">{formatRole(role)}</span>
        </div>
      </div>
      
      <div className="navbar-right">
        <div className="notification-container" ref={notifRef}>
          <button 
            className="hamburger" 
            style={{ position: 'relative' }} 
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadCount > 0) markAsRead();
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '4px',
                width: '10px', height: '10px', backgroundColor: 'var(--danger)', 
                borderRadius: '50%', border: '2px solid white'
              }}></span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <span style={{ fontWeight: 600 }}>Pemberitahuan</span>
                {unreadCount > 0 && <span className="unread-badge">{unreadCount} Baru</span>}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">Tidak ada pemberitahuan</div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className={`notification-item ${!notif.is_read ? 'unread' : ''}`}>
                      <div className={`notification-dot ${notif.type}`}></div>
                      <div className="notification-content">
                        <div className="notification-title">{notif.title}</div>
                        <div className="notification-message">{notif.message}</div>
                        <div className="notification-time">
                          {new Date(notif.created_at).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="notification-footer" onClick={() => markAsRead()}>
                  Tandai semua telah dibaca
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="user-profile-container" ref={dropdownRef}>
          <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
            {user.profile_picture ? (
               <img src={`http://localhost/siarsad/api/${user.profile_picture}`} alt="Profile" className="avatar" style={{ objectFit: 'cover' }} />
            ) : (
               <div className="avatar">{(user?.full_name || 'G').charAt(0)}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }} className="d-none d-sm-flex">
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.full_name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatRole(role)}</span>
            </div>
          </div>

          {showDropdown && (
            <div className="user-dropdown">
              <div className="user-dropdown-header">
                <div 
                  className="user-dropdown-avatar-wrapper" 
                  style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => fileInputRef.current.click()}
                  title="Klik untuk ubah foto profil"
                >
                  {user.profile_picture ? (
                    <img src={`http://localhost/siarsad/api/${user.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ 
                      fontSize: '2rem', fontWeight: 'bold', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'
                    }}>
                      {(user?.full_name || 'G').charAt(0)}
                    </div>
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, 
                    backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', 
                    fontSize: '0.6rem', textAlign: 'center', padding: '2px 0'
                  }}>
                    Upload
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".jpg,.jpeg,.png" 
                  onChange={handleAvatarUpload} 
                />
                <div className="user-dropdown-name">{user?.full_name || 'Guest User'}</div>
                <div className="user-dropdown-email">{user.email || 'user@sipersa.id'}</div>
              </div>
              
              <div className="user-dropdown-menu">
                <div className="user-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/profile'); }}>
                  <User size={18} />
                  <span>Profile Saya</span>
                </div>
                <div className="user-dropdown-item" onClick={() => { setShowDropdown(false); navigate('/change-password'); }}>
                  <Lock size={18} />
                  <span>Password</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
                <div className="user-dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                  <LogOut size={18} />
                  <span>Keluar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
