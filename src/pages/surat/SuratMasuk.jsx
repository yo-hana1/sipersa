import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Plus, Upload, Filter, Eye, Download, Tag, Save, X, FileText } from 'lucide-react';

function SuratMasuk() {
  const [letters, setLetters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Attachment & AI Scan State
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [letterToCancel, setLetterToCancel] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    letter_number: '',
    sender: '',
    recipient: 'PAUD Terpadu Restu 2',
    subject: '',
    date_received: new Date().toISOString().split('T')[0],
    id_kategori: ''
  });

  const fetchLetters = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/surat_masuk.php');
      const data = await response.json();
      setLetters(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch letters error:', error);
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/kategori_surat.php');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  useEffect(() => {
    fetchLetters();
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScanAI = async () => {
    if (!file) {
      alert("Pilih file terlebih dahulu sebelum melakukan scan.");
      return;
    }
    setIsScanning(true);
    
    const scanData = new FormData();
    scanData.append('file', file);

    try {
      const response = await fetch('http://localhost/siarsad/api/scan_document.php', {
        method: 'POST',
        body: scanData
      });
      const result = await response.json();
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          letter_number: result.data.letter_number || prev.letter_number,
          subject: result.data.subject || prev.subject,
          sender: result.data.sender || prev.sender,
          date_received: result.data.date || prev.date_received
        }));
        // Optional: show a small success indicator or toast
        console.log("AI Extraction success:", result.data);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Terjadi kesalahan saat memindai dokumen.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancelLetter = async () => {
    if (!letterToCancel) return;
    try {
      const response = await fetch(`http://localhost/siarsad/api/surat_masuk.php?id=${letterToCancel.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('Surat berhasil dibatalkan dan dipindahkan ke Backup & Restore.');
        setShowCancelModal(false);
        setLetterToCancel(null);
        fetchLetters();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Cancel error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    for (const key in formData) {
      submitData.append(key, formData[key]);
    }
    if (file) {
      submitData.append('file', file);
    }

    try {
      const response = await fetch('http://localhost/siarsad/api/surat_masuk.php', {
        method: 'POST',
        body: submitData
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setShowForm(false);
        setFormData({
          letter_number: '',
          sender: '',
          recipient: 'PAUD Terpadu Restu 2',
          subject: '',
          date_received: new Date().toISOString().split('T')[0],
          id_kategori: ''
        });
        setFile(null); // Reset file input state
        fetchLetters();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Surat Masuk</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Surat</span>
            <span>/</span>
            <span className="active">Surat Masuk</span>
          </div>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Catat Surat Masuk
          </button>
        )}
      </div>

      {showForm && (
        <Card title="Form Pencatatan Surat Masuk">
          <form onSubmit={handleSubmit}>
            {/* Attachment & AI Scan Section */}
            <div className="form-group mb-4" style={{ backgroundColor: 'var(--bg-light)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)', marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Upload Dokumen (PDF/Word/JPG)</label>
              <div className="flex items-center gap-4" style={{ marginTop: '0.5rem' }}>
                <input 
                  type="file" 
                  className="form-control" 
                  style={{ flex: 1 }}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <button 
                  type="button" 
                  className={`btn ${isScanning ? 'btn-secondary' : ''}`}
                  style={{ 
                    flexShrink: 0,
                    background: isScanning ? '#6c757d' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1.25rem',
                    transition: 'all 0.3s ease',
                    boxShadow: isScanning ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                    animation: isScanning ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onClick={handleScanAI}
                  disabled={!file || isScanning}
                >
                  {isScanning ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner-border spinner-border-sm" style={{ width: '1rem', height: '1rem' }}></div>
                      <span>Menganalisis Dokumen...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Tag size={18} />
                      <span>Scan dengan AI</span>
                    </div>
                  )}
                </button>
              </div>
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.75rem' }}>
                Lampirkan file surat masuk. Gunakan fitur <strong>"Scan dengan AI"</strong> untuk mengekstrak Nomor Surat dan Perihal secara otomatis.
              </small>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Nomor Surat Asli <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="letter_number"
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: 010/DINAS/IV/2026" 
                  value={formData.letter_number}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori Surat</label>
                <select 
                  name="id_kategori" 
                  className="form-control" 
                  value={formData.id_kategori}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Pengirim <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="sender"
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: Dinas Pendidikan Kota" 
                  value={formData.sender}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Diterima <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="date_received"
                  type="date" 
                  className="form-control" 
                  value={formData.date_received}
                  onChange={handleChange}
                  required 
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Perihal <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input 
                name="subject"
                type="text" 
                className="form-control" 
                placeholder="Isi perihal/tujuan surat masuk" 
                value={formData.subject}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="flex justify-between mt-4 border-t pt-4">
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                <X size={18} />
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} />
                Simpan Data Surat Masuk
              </button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && (
        <Card title="Daftar Surat Masuk">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Nomor Surat</th>
                <th>Tgl Diterima</th>
                <th>Kategori</th>
                <th>Pengirim</th>
                <th>Perihal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : letters.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Belum ada data surat masuk.</td></tr>
              ) : (
                letters.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.letter_number}</td>
                    <td>{item.date_received}</td>
                    <td>
                      {item.nama_kategori ? (
                        <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                          <Tag size={12} />
                          {item.nama_kategori}
                        </span>
                      ) : '-'}
                    </td>
                    <td>{item.sender}</td>
                    <td>{item.subject}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          title="Lihat Detail"
                          onClick={() => {
                            setSelectedLetter(item);
                            setShowDetail(true);
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="btn btn-danger btn-outline" 
                          title="Batal"
                          onClick={() => {
                            setLetterToCancel(item);
                            setShowCancelModal(true);
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      )}
      {/* Modal Detail */}
      {showDetail && selectedLetter && (
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
              <button className="hamburger" onClick={() => setShowDetail(false)} style={{ color: 'white', opacity: 0.8 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: '#fff' }}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="col-span-2" style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #dcfce7', marginBottom: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nomor Surat</label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedLetter.letter_number}>
                    {selectedLetter.letter_number}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Tag size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Kategori</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedLetter.nama_kategori || 'Tanpa Kategori'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Plus size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tgl Masuk</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{new Date(selectedLetter.date_received).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>

                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Upload size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pengirim</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedLetter.sender}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Eye size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Perihal</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem', lineHeight: '1.3' }}>{selectedLetter.subject}</div>
                    </div>
                  </div>
                </div>

                {selectedLetter.file_path && (
                  <div className="col-span-2" style={{ marginTop: '0.25rem' }}>
                    <a 
                      href={`http://localhost/siarsad/api/${selectedLetter.file_path}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn"
                      style={{ 
                        width: '100%', 
                        background: '#f8fafc', 
                        border: '1.5px dashed #cbd5e1', 
                        color: '#475569',
                        padding: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        fontSize: '0.9rem'
                      }}
                    >
                      <Download size={16} />
                      <span style={{ fontWeight: 600 }}>Buka Dokumen Lampiran</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Batal */}
      {showCancelModal && letterToCancel && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title text-danger">Konfirmasi Pembatalan</h3>
              <button className="hamburger" onClick={() => setShowCancelModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                <X size={48} style={{ margin: '0 auto' }} />
              </div>
              <p>Apakah Anda yakin ingin membatalkan surat ini?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Surat akan dipindahkan ke menu Backup & Restore.</p>
              <div className="flex gap-2 mt-6 justify-center">
                <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>Tidak, Kembali</button>
                <button className="btn btn-danger" onClick={handleCancelLetter}>Ya, Batalkan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default SuratMasuk;
