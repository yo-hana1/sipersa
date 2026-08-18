import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Eye, Download, Printer, ChevronDown, ChevronUp, X, FileText, Tag, Plus, Upload } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import LetterPreview from '../../components/LetterPreview';

function MonitoringSurat() {
  const [suratMasuk, setSuratMasuk] = useState([]);
  const [suratKeluar, setSuratKeluar] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAllMasuk, setShowAllMasuk] = useState(false);
  const [showAllKeluar, setShowAllKeluar] = useState(false);

  // States for Detail Views
  const [selectedLetterMasuk, setSelectedLetterMasuk] = useState(null);
  const [showDetailMasuk, setShowDetailMasuk] = useState(false);
  const [selectedLetterKeluar, setSelectedLetterKeluar] = useState(null);
  const [showDetailKeluar, setShowDetailKeluar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('sipersa_user'));
        const role = user?.role || 'admin';
        const userId = user?.id || '';

        const [resMasuk, resKeluar, resStats] = await Promise.all([
          fetch('http://localhost/siarsad/api/surat_masuk.php'),
          fetch('http://localhost/siarsad/api/surat_keluar.php'),
          fetch(`http://localhost/siarsad/api/dashboard_stats.php?user_id=${userId}&role=${role}`)
        ]);

        const dataMasuk = await resMasuk.json();
        const dataKeluar = await resKeluar.json();
        const dataStats = await resStats.json();

        setSuratMasuk(Array.isArray(dataMasuk) ? dataMasuk : []);
        
        // Filter Surat Keluar to only Disetujui or Selesai for Monitoring
        const filteredKeluar = Array.isArray(dataKeluar) 
          ? dataKeluar.filter(item => ['Disetujui', 'Selesai'].includes(item.status))
          : [];
        setSuratKeluar(filteredKeluar);
        
        setChartData(dataStats.chart_data || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayedMasuk = showAllMasuk ? suratMasuk : suratMasuk.slice(0, 5);
  const displayedKeluar = showAllKeluar ? suratKeluar : suratKeluar.slice(0, 5);

  const getTicks = (data, key) => {
    if (!data || data.length === 0) return [0, 5];
    const max = Math.max(...data.map(item => item[key] || 0));
    const ceiling = Math.max(25, Math.ceil((max || 1) / 5) * 5);
    const ticks = [];
    for (let i = 0; i <= ceiling; i += 5) {
      ticks.push(i);
    }
    return ticks;
  };

  const masukTicks = getTicks(chartData, 'masuk');
  const keluarTicks = getTicks(chartData, 'keluar');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitoring Surat</h1>
        <div className="breadcrumb d-none d-md-flex">
          <span>Surat</span>
          <span>/</span>
          <span className="active">Monitoring Surat</span>
        </div>
      </div>

      <div className="grid grid-cols-1" style={{ gap: '1.5rem' }}>
        {/* Analytics Surat Masuk */}
        <Card title="Analitik Surat Masuk">
          <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis orientation="left" ticks={masukTicks} domain={[0, Math.max(...masukTicks)]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="masuk" name="Jumlah Surat Masuk" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monitoring Surat Masuk */}
        <Card title="Daftar Surat Masuk">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor Surat</th>
                  <th>Tgl Diterima</th>
                  <th>Pengirim</th>
                  <th>Perihal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedMasuk.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      {loading ? 'Memuat data...' : 'Tidak ada data surat masuk.'}
                    </td>
                  </tr>
                ) : (
                  displayedMasuk.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{item.letter_number}</td>
                      <td>{item.date_received}</td>
                      <td>{item.sender}</td>
                      <td>{item.subject}</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-outline" 
                            title="Lihat Detail"
                            onClick={() => {
                              setSelectedLetterMasuk(item);
                              setShowDetailMasuk(true);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {suratMasuk.length > 5 && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowAllMasuk(!showAllMasuk)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {showAllMasuk ? (
                  <>Sembunyikan <ChevronUp size={16} /></>
                ) : (
                  <>Baca Selengkapnya ({suratMasuk.length - 5} lainnya) <ChevronDown size={16} /></>
                )}
              </button>
            </div>
          )}
        </Card>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />

        {/* Analytics Surat Keluar */}
        <Card title="Analitik Surat Keluar">
          <div style={{ width: '100%', height: '300px', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis orientation="left" ticks={keluarTicks} domain={[0, Math.max(...keluarTicks)]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="keluar" name="Jumlah Surat Keluar" fill="#ff4d4d" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monitoring Surat Keluar */}
        <Card title="Daftar Surat Keluar">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Nomor Surat</th>
                  <th>Tanggal</th>
                  <th>Tujuan</th>
                  <th>Perihal</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayedKeluar.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      {loading ? 'Memuat data...' : 'Tidak ada data surat keluar.'}
                    </td>
                  </tr>
                ) : (
                  displayedKeluar.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{item.letter_number || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Belum ada</span>}</td>
                      <td>{item.date_sent || item.created_at?.split(' ')[0] || '-'}</td>
                      <td>{item.recipient}</td>
                      <td>{item.subject}</td>
                      <td>
                        <span className={`badge badge-${item.status === 'Selesai' || item.status === 'Disetujui' ? 'success' : item.status === 'Ditolak' ? 'danger' : 'warning'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-outline" 
                            title="Lihat"
                            onClick={() => {
                              setSelectedLetterKeluar(item);
                              setShowDetailKeluar(true);
                            }}
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {suratKeluar.length > 5 && (
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowAllKeluar(!showAllKeluar)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {showAllKeluar ? (
                  <>Sembunyikan <ChevronUp size={16} /></>
                ) : (
                  <>Baca Selengkapnya ({suratKeluar.length - 5} lainnya) <ChevronDown size={16} /></>
                )}
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Detail Surat Masuk (Identical to Tata Usaha) */}
      {showDetailMasuk && selectedLetterMasuk && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', marginBottom: 0, borderRadius: '16px', overflow: 'hidden', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', color: 'white', padding: '1.25rem 1.5rem', border: 'none' }}>
              <div className="flex items-center gap-3">
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '10px' }}>
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="card-title" style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>Detail Surat Masuk</h3>
                  <p style={{ fontSize: '0.75rem', opacity: 0.9, margin: 0 }}>Informasi lengkap dokumen yang tercatat</p>
                </div>
              </div>
              <button className="hamburger" onClick={() => setShowDetailMasuk(false)} style={{ color: 'white', opacity: 0.8 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: '#fff' }}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="col-span-2" style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #dcfce7', marginBottom: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nomor Surat</label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedLetterMasuk.letter_number}>
                    {selectedLetterMasuk.letter_number}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Tag size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Kategori</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedLetterMasuk.nama_kategori || 'Tanpa Kategori'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Plus size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tgl Masuk</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{new Date(selectedLetterMasuk.date_received).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>

                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Upload size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pengirim</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedLetterMasuk.sender}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Eye size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Perihal</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem', lineHeight: '1.3' }}>{selectedLetterMasuk.subject}</div>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Surat Keluar (Using LetterPreview directly) */}
      {showDetailKeluar && selectedLetterKeluar && (
        <LetterPreview 
          letter={selectedLetterKeluar} 
          onClose={() => setShowDetailKeluar(false)} 
        />
      )}
    </div>
  );
}

export default MonitoringSurat;


