import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout({ role, setRole, setIsAuthenticated }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const [refreshKey, setRefreshKey] = useState(0);

  // Close sidebar on mobile and Scroll to top on navigation
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
    window.scrollTo(0, 0);
  }, [location]);

  const refreshContent = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Update activity log in DB when location changes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('sipersa_user'));
    if (user && user.id) {
      fetch('http://localhost/siarsad/api/activity_logs.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          last_menu: location.pathname
        })
      }).catch(err => console.error('Activity update failed', err));
    }
  }, [location]);

  return (
    <div className="app-layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        role={role} 
        setIsAuthenticated={setIsAuthenticated}
        onMenuClick={refreshContent}
      />
      <div className="main-wrapper">
        <Navbar 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          role={role}
          setRole={setRole}
          setIsAuthenticated={setIsAuthenticated}
        />
        <div className="content-area" key={location.pathname + refreshKey}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
