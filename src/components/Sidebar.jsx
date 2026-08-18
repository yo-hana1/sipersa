import { Link, useLocation } from 'react-router-dom';
const logo = '/img/logorestu2.png';
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  LogOut,
  Mail,
  Send,
  Inbox,
  FileText,
  Archive,
  BarChart2,
  CheckSquare,
  Eye,
  FilePlus,
  Clock,
  History,
  Activity,
  Tag
} from 'lucide-react';

function Sidebar({ isOpen, role, setIsAuthenticated, onMenuClick }) {
  const location = useLocation();
  const path = location.pathname;

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Define menus based on role
  const menus = {
    admin: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { name: 'Manajemen User', path: '/manajemen-user', icon: <Users size={20} /> },
      { name: 'Kategori Surat', path: '/kategori-surat', icon: <Tag size={20} /> },
      { name: 'Log Aktivitas', path: '/log-aktivitas', icon: <Activity size={20} /> },
      { name: 'Permohonan Surat', path: '/permohonan-surat', icon: <Mail size={20} /> },
      { name: 'Persetujuan Surat', path: '/persetujuan-surat', icon: <CheckSquare size={20} /> },
      { name: 'Monitoring Surat', path: '/monitoring-surat', icon: <Eye size={20} /> },
      { name: 'Surat Keluar', path: '/surat-keluar', icon: <Send size={20} /> },
      { name: 'Riwayat Surat Keluar', path: '/riwayat-surat-keluar', icon: <History size={20} /> },
      { name: 'Surat Masuk', path: '/surat-masuk', icon: <Inbox size={20} /> },
      { name: 'Template Surat', path: '/template-surat', icon: <FileText size={20} /> },
      { name: 'Arsip Surat', path: '/arsip-surat', icon: <Archive size={20} /> },
      { name: 'Laporan', path: '/laporan', icon: <BarChart2 size={20} /> },
      { name: 'Backup & Restore', path: '/backup-restore', icon: <Database size={20} /> },
    ],
    tata_usaha: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { name: 'Permohonan Surat', path: '/permohonan-surat', icon: <Mail size={20} /> },
      { name: 'Kategori Surat', path: '/kategori-surat', icon: <Tag size={20} /> },
      { name: 'Surat Keluar', path: '/surat-keluar', icon: <Send size={20} /> },
      { name: 'Riwayat Surat Keluar', path: '/riwayat-surat-keluar', icon: <History size={20} /> },
      { name: 'Surat Masuk', path: '/surat-masuk', icon: <Inbox size={20} /> },
      { name: 'Template Surat', path: '/template-surat', icon: <FileText size={20} /> },
      { name: 'Arsip Surat', path: '/arsip-surat', icon: <Archive size={20} /> },
      { name: 'Laporan', path: '/laporan', icon: <BarChart2 size={20} /> },
    ],
    kepala_sekolah: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { name: 'Permohonan Surat', path: '/permohonan-surat', icon: <Mail size={20} /> },
      { name: 'Persetujuan Surat', path: '/persetujuan-surat', icon: <CheckSquare size={20} /> },
      { name: 'Monitoring Surat', path: '/monitoring-surat', icon: <Eye size={20} /> }, 
    ],
    guru: [
      { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { name: 'Ajukan Permohonan', path: '/permohonan-surat', icon: <FilePlus size={20} /> },
      { name: 'Riwayat Surat', path: '/riwayat-surat', icon: <History size={20} /> },
    ]
  };

  const currentMenu = menus[role] || menus.guru;

  return (
    <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', height: 'auto', padding: '1rem 1.5rem' }}>
        <img src={logo} alt="Logo Restu 2" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '50%', padding: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.2rem' }}>
          <span style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>SIPERSA</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>KB-BA-TPA Restu 2</span>
        </div>
      </div>
      
      <div className="sidebar-nav">
        {currentMenu.map((item, index) => (
          <Link 
            key={index} 
            to={item.path} 
            className={`nav-item ${path.includes(item.path) && item.path !== '#' ? 'active' : ''}`}
            onClick={onMenuClick}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
      
      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={handleLogout} 
          className="nav-item" 
          style={{ width: '100%', background: 'transparent', border: 'none', textAlign: 'left', fontWeight: 'inherit', fontSize: 'inherit' }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
