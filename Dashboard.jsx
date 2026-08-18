import Card from '../../components/Card';
import { Mail, Inbox, Send, AlertCircle, Clock } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';

const data = [
    { name: 'Jan', masuk: 4000, keluar: 2400 },
    { name: 'Feb', masuk: 3000, keluar: 1398 },
    { name: 'Mar', masuk: 2000, keluar: 9800 },
    { name: 'Apr', masuk: 2780, keluar: 3908 },
    { name: 'Mei', masuk: 1890, keluar: 4800 },
    { name: 'Jun', masuk: 2390, keluar: 3800 },
];

const dashboardConfigs = {
    admin: { welcome: "Selamat Datang, Admin", showCharts: true, stats: true },
    tata_usaha: { welcome: "Dashboard Tata Usaha", showCharts: true, stats: true },
    kepala_sekolah: { welcome: "Dashboard Approval Kepala Sekolah", showCharts: false, stats: true },
    guru: { welcome: "Dashboard Guru / Staf", showCharts: false, stats: false }
};

function Dashboard({ role }) {
    const config = dashboardConfigs[role] || dashboardConfigs.guru;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{config.welcome}</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Ringkasan informasi sistem arsip hari ini.</p>
            </div>

            {config.stats && (
                <div className="grid grid-cols-4 mb-4">
                    <Card>
                        <div className="stat-card">
                            <div className="stat-icon primary"><Mail size={24} /></div>
                            <div className="stat-details">
                                <h4>Total Surat</h4>
                                <p>1,240</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="stat-card">
                            <div className="stat-icon success"><Inbox size={24} /></div>
                            <div className="stat-details">
                                <h4>Surat Masuk</h4>
                                <p>845</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="stat-card">
                            <div className="stat-icon info"><Send size={24} /></div>
                            <div className="stat-details">
                                <h4>Surat Keluar</h4>
                                <p>395</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="stat-card">
                            <div className="stat-icon warning"><AlertCircle size={24} /></div>
                            <div className="stat-details">
                                <h4>Menunggu Persetujuan</h4>
                                <p>12</p>
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
                                <p>2</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-3 mb-4">
                {config.showCharts && (
                    <div style={{ gridColumn: 'span 2' }}>
                        <Card title="Statistik Surat (6 Bulan Terakhir)">
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                            <li style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <div style={{ color: 'var(--success)', marginTop: '2px' }}><Inbox size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Surat Edaran Dinas ditambahkan</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Oleh: Tata Usaha - 2 jam yang lalu</p>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                <div style={{ color: 'var(--warning)', marginTop: '2px' }}><AlertCircle size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Permohonan Surat Keterangan diajukan</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Oleh: Budi (Guru) - 3 jam yang lalu</p>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ color: 'var(--info)', marginTop: '2px' }}><Send size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Surat Keluar telah disetujui Kepala Sekolah</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Oleh: Sistem - 5 jam yang lalu</p>
                                </div>
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
