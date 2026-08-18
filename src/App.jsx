import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layout
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/auth/Login';


// Dashboard & Profile
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

// Surat Pages
import PermohonanSurat from './pages/surat/PermohonanSurat';
import SuratKeluar from './pages/surat/SuratKeluar';
import SuratMasuk from './pages/surat/SuratMasuk';
import BuatSurat from './pages/surat/BuatSurat';
import PersetujuanSurat from './pages/surat/PersetujuanSurat';
import MonitoringSurat from './pages/surat/MonitoringSurat';
import RiwayatSuratKeluar from './pages/surat/RiwayatSuratKeluar';

// Arsip & Laporan & Admin
import TemplateSurat from './pages/arsip/TemplateSurat';
import ArsipSurat from './pages/arsip/ArsipSurat';
import Laporan from './pages/laporan/Laporan';
import ManajemenUser from './pages/admin/ManajemenUser';
import LogAktivitas from './pages/admin/LogAktivitas';
import KategoriSurat from './pages/admin/KategoriSurat';
import BackupRestore from './pages/admin/BackupRestore';

function App() {
  // Initial state from localStorage for persistence
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('sipersa_user')));
  const [role, setRole] = useState(() => user?.role || 'guru'); 
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!user);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setRole={setRole} />} />


        {/* Protected Routes inside Layout */}
        {isAuthenticated ? (
          <Route element={<Layout role={role} setRole={setRole} setIsAuthenticated={setIsAuthenticated} />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard role={role} />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            {/* Guru / Staff */}
            <Route path="/permohonan-surat" element={<PermohonanSurat role={role} view="aktif" />} />
            <Route path="/riwayat-surat" element={<PermohonanSurat role={role} view="riwayat" />} />
            
            {/* Tata Usaha */}
            <Route path="/surat-keluar" element={<SuratKeluar />} />
            <Route path="/surat-masuk" element={<SuratMasuk />} />
            <Route path="/buat-surat" element={<BuatSurat />} />
            <Route path="/template-surat" element={<TemplateSurat role={role} />} />
            <Route path="/arsip-surat" element={<ArsipSurat />} />
            <Route path="/laporan" element={<Laporan />} />

            {/* Kepala Sekolah */}
            <Route path="/persetujuan-surat" element={<PersetujuanSurat />} />
            <Route path="/monitoring-surat" element={<MonitoringSurat />} />
            
            {/* Admin */}
            <Route path="/manajemen-user" element={<ManajemenUser />} />
            <Route path="/log-aktivitas" element={<LogAktivitas />} />
            <Route path="/kategori-surat" element={<KategoriSurat role={role} />} />
            <Route path="/backup-restore" element={<BackupRestore />} />
            
            {/* Shared (Admin & TU) */}
            <Route path="/riwayat-surat-keluar" element={<RiwayatSuratKeluar role={role} />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
