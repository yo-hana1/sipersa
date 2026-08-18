import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Activity, Clock, User, Shield, RefreshCw } from 'lucide-react';

function LogAktivitas() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resUsers, resLogs] = await Promise.all([
        fetch('http://localhost/siarsad/api/activity_logs.php?type=users'),
        fetch('http://localhost/siarsad/api/activity_logs.php?type=logs')
      ]);
      
      const usersData = await resUsers.json();
      const logsData = await resLogs.json();
      
      setActiveUsers(Array.isArray(usersData) ? usersData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isUserOnline = (lastActivity) => {
    if (!lastActivity) return false;
    const last = new Date(lastActivity).getTime();
    const now = new Date().getTime();
    // If activity in last 5 minutes, consider online
    return (now - last) < 5 * 60 * 1000;
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'kepala_sekolah': return 'warning';
      case 'tata_usaha': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Log Aktivitas Sistem</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Admin</span>
            <span>/</span>
            <span className="active">Log Aktivitas</span>
          </div>
        </div>
        <button className="btn btn-outline flex items-center gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
        {/* Monitoring User Aktif */}
        <Card title="Status Pengguna (Real-time Monitoring)">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>User / Nama</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Menu Terakhir</th>
                  <th>Aktivitas Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center">{loading ? 'Memuat...' : 'Tidak ada data pengguna'}</td></tr>
                ) : (
                  activeUsers.map((user, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ padding: '6px', backgroundColor: '#f0f4f8', borderRadius: '50%' }}>
                            <User size={14} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getRoleBadge(user.role)}`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {isUserOnline(user.last_activity) ? (
                          <span className="badge badge-success flex items-center gap-1 w-fit">
                            <span style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', display: 'inline-block' }}></span>
                            Online
                          </span>
                        ) : (
                          <span className="badge badge-secondary">Offline</span>
                        )}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.85rem' }}>{user.last_menu || '-'}</code>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {formatTimestamp(user.last_activity)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Riwayat Aktivitas */}
        <Card title="Riwayat Aktivitas Sistem">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Detail Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan="4" className="text-center">{loading ? 'Memuat...' : 'Belum ada riwayat aktivitas'}</td></tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={idx}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        <div className="flex items-center gap-2 text-secondary">
                          <Clock size={14} />
                          {formatTimestamp(log.created_at)}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.full_name || 'System'}</div>
                        <div style={{ fontSize: '0.75rem' }} className={`text-${getRoleBadge(log.role)}`}>
                          {log.role?.replace('_', ' ')}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{log.action}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default LogAktivitas;

