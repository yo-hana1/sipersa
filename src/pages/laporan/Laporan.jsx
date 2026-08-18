import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Download, Search, Calendar, Tag, FileText, Loader2 } from 'lucide-react';

function Laporan() {
  const [categories, setCategories] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [narrativeSummary, setNarrativeSummary] = useState('');
  const [isPrintView, setIsPrintView] = useState(false);
  
  const [filters, setFilters] = useState({
    type: 'semua',
    id_kategori: '',
    start_date: '',
    end_date: ''
  });

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/kategori_surat.php');
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`http://localhost/siarsad/api/get_laporan.php?${queryParams}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setReportData(data);
      } else {
        setReportData([]);
        alert('Gagal mengambil data laporan: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Fetch report error:', error);
      alert('Koneksi ke server gagal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleExportPDF = async () => {
    if (reportData.length === 0) {
      alert('Silakan tampilkan data laporan terlebih dahulu.');
      return;
    }

    setGeneratingSummary(true);
    try {
      const selectedCategory = categories.find(c => c.id_kategori == filters.id_kategori)?.nama_kategori || 'Semua Kategori';
      
      const response = await fetch('http://localhost/siarsad/api/generate_report_summary.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filters,
          nama_kategori: selectedCategory,
          total_data: reportData.length
        })
      });
      
      const resData = await response.json();
      if (resData.success) {
        setNarrativeSummary(resData.summary);
        setIsPrintView(true);
        setTimeout(() => {
          window.print();
          setIsPrintView(false);
        }, 800);
      } else {
        alert('Gagal membuat narasi laporan: ' + resData.message);
      }
    } catch (error) {
      console.error('Summary error:', error);
      alert('Gagal menghubungi AI untuk membuat ringkasan.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  return (
    <div className={isPrintView ? 'print-mode' : ''}>
      {isPrintView && (
        <div className="print-header" style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px', letterSpacing: '1px' }}>KB-BA-TPA RESTU 2</h1>
          <hr style={{ borderTop: '3px solid #000', margin: '0 0 30px 0' }} className="print-line" />
          <h2 style={{ fontSize: '20px', fontWeight: 'normal', marginBottom: '30px' }}>Laporan Persuratan</h2>
        </div>
      )}

      <div className="page-header flex justify-between items-center no-print">
        <div>
          <h1 className="page-title">Laporan Sistem Arsip</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Tata Usaha</span>
            <span>/</span>
            <span className="active">Laporan</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={handleExportPDF} disabled={generatingSummary || loading}>
            {generatingSummary ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {generatingSummary ? 'Menyiapkan Narasi AI...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <Card title="Filter Laporan" className="no-print">
        <div className="grid grid-cols-5 items-end gap-4">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}><FileText size={14} style={{ display: 'inline', marginRight: '4px' }}/>Jenis Laporan</label>
            <select name="type" className="form-control" value={filters.type} onChange={handleChange}>
              <option value="semua">Semua Jenis Surat</option>
              <option value="masuk">Surat Masuk</option>
              <option value="keluar">Surat Keluar</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}><Tag size={14} style={{ display: 'inline', marginRight: '4px' }}/>Kategori</label>
            <select name="id_kategori" className="form-control" value={filters.id_kategori} onChange={handleChange}>
              <option value="">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/>Dari Tanggal</label>
            <input name="start_date" type="date" className="form-control" value={filters.start_date} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}><Calendar size={14} style={{ display: 'inline', marginRight: '4px' }}/>Sampai Tanggal</label>
            <input name="end_date" type="date" className="form-control" value={filters.end_date} onChange={handleChange} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <button className="btn btn-primary" style={{ width: '100%', height: '42px' }} onClick={fetchReport} disabled={loading}>
              <Search size={18} />
              {loading ? 'Memuat...' : 'Tampilkan Laporan'}
            </button>
          </div>
        </div>
      </Card>

      {isPrintView && narrativeSummary && (
        <div style={{ marginBottom: '25px', textAlign: 'justify', lineHeight: '1.6', fontSize: '14px' }}>
          {narrativeSummary}
        </div>
      )}

      <Card title={!isPrintView ? `Hasil Laporan ${filters.type !== 'semua' ? ': ' + (filters.type === 'masuk' ? 'Surat Masuk' : 'Surat Keluar') : ''}` : ''}>
        <div className="table-responsive">
          <table className="table report-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                <th style={{ textAlign: 'center' }}>Jenis</th>
                <th style={{ textAlign: 'center' }}>Nomor Surat</th>
                <th style={{ textAlign: 'center' }}>Tanggal</th>
                <th style={{ textAlign: 'center' }}>Kategori</th>
                <th style={{ textAlign: 'center' }}>Pihak Terkait</th>
                <th style={{ textAlign: 'center' }}>Perihal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data laporan...</td></tr>
              ) : reportData.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Silakan atur filter dan klik "Tampilkan Laporan" atau tidak ada data yang cocok.</td></tr>
              ) : (
                reportData.map((item, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td>
                      <span className={`badge ${item.jenis === 'Surat Masuk' ? 'badge-info' : 'badge-success'} no-print`}>
                        {item.jenis}
                      </span>
                      <span className="print-only">{item.jenis}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.letter_number || '-'}</td>
                    <td>{formatDate(item.tanggal)}</td>
                    <td>{item.nama_kategori || '-'}</td>
                    <td>{item.pihak || '-'}</td>
                    <td>{item.subject || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { padding: 0 !important; margin: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: inline !important; }
          .content-area { padding: 2cm !important; overflow: visible !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          .report-table th { background-color: #f0f0f0 !important; border: 1px solid #ddd !important; padding: 8px !important; font-size: 11px !important; color: black !important; }
          .report-table td { border: 1px solid #ddd !important; padding: 8px !important; font-size: 11px !important; color: black !important; }
          .card-header { display: none !important; }
          .app-layout { display: block !important; }
          .sidebar, .navbar { display: none !important; }
          .print-line { border-top: 3px solid black !important; display: block !important; opacity: 1 !important; }
        }
        .print-only { display: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

export default Laporan;
