import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Mail, Inbox, Send, AlertCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

// Data default jika API gagal
const defaultChartData = [
  { name: 'Mar', masuk: 0, keluar: 0 },
  { name: 'Apr', masuk: 0, keluar: 0 },
];

const dashboardConfigs = {
  admin: { welcome: "Selamat Datang, Admin", showCharts: true, stats: true },
  tata_usaha: { welcome: "Dashboard Tata Usaha", showCharts: true, stats: true },
  kepala_sekolah: { welcome: "Dashboard Approval Kepala Sekolah", showCharts: true, stats: true },
  guru: { welcome: "Selamat Datang, Guru / Staf", showCharts: false, stats: false }
};

function Dashboard({ role }) {
  const config = dashboardConfigs[role] || dashboardConfigs.guru;

  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    myActive: 0,
    masuk: 0,
    keluar: 0,
    activities: []
  });
  const [chartData, setChartData] = useState(defaultChartData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('sipersa_user'));
        const userId = user?.id || '';
        
        const response = await fetch(`http://localhost/siarsad/api/dashboard_stats.php?user_id=${userId}&role=${role}`);
        const data = await response.json();
        
        setStats({
          total: data.total_permohonan,
          waiting: data.menunggu_persetujuan,
          myActive: data.my_active_requests,
          masuk: data.total_masuk,
          keluar: data.total_keluar,
          activities: data.activities || []
        });
        
        if (data.chart_data && data.chart_data.length > 0) {
          setChartData(data.chart_data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Fetch stats error:', error);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{config.welcome}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Ringkasan informasi bulan ini.</p>
      </div>

      {config.stats && (
        <div className="grid grid-cols-4 mb-4">
          <Card>
            <div className="stat-card">
              <div className="stat-icon primary"><Mail size={24} /></div>
              <div className="stat-details">
                <h4>{role === 'tata_usaha' || role === 'admin' ? 'Permohonan Surat' : 'Total Surat'}</h4>
                <p>{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="stat-card">
              <div className="stat-icon success"><Inbox size={24} /></div>
              <div className="stat-details">
                <h4>Surat Masuk</h4>
                <p>{stats.masuk}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="stat-card">
              <div className="stat-icon info"><Send size={24} /></div>
              <div className="stat-details">
                <h4>Surat Keluar</h4>
                <p>{stats.keluar}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="stat-card">
              <div className="stat-icon warning"><AlertCircle size={24} /></div>
              <div className="stat-details">
                <h4>Menunggu Persetujuan</h4>
                <p>{stats.waiting}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {role === 'guru' && (
        <div className="grid grid-cols-2 mb-4">
          <Card title="Status Permohonan Saya">
            <div className="stat-card">
              <div className="stat-icon warning"><Clock size={24} /></div>
              <div className="stat-details">
                <h4>Menunggu Diproses</h4>
                <p>{stats.myActive}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-3 mb-4">
        {config.showCharts && (
          <div style={{ gridColumn: 'span 2' }}>
            <Card title="Statistik Surat Masuk & Keluar">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Legend />
                    <Bar dataKey="masuk" name="Surat Masuk" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="keluar" name="Surat Keluar" fill="var(--info)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        <div style={{ gridColumn: config.showCharts ? 'span 1' : 'span 3' }}>
          <Card title="Aktivitas Terbaru">
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {stats.activities.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tidak ada aktivitas terbaru.</p>
              ) : (
                stats.activities.map((act, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '1rem', borderBottom: idx !== stats.activities.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: '0.5rem' }}>
                    <div style={{ color: act.type === 'masuk' ? 'var(--success)' : act.type === 'menunggu' ? 'var(--warning)' : 'var(--info)', marginTop: '2px' }}>
                      {act.type === 'masuk' ? <Inbox size={18} /> : act.type === 'menunggu' ? <AlertCircle size={18} /> : <Send size={18} />}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{act.title}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{act.subtitle}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
