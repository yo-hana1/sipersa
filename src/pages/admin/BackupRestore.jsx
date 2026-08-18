import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Database, Eye, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';

function BackupRestore() {
  const [deletedLetters, setDeletedLetters] = useState([]);
  const [deletedIncoming, setDeletedIncoming] = useState([]);
  const [deletedRequests, setDeletedRequests] = useState([]);
  const [deletedCategories, setDeletedCategories] = useState([]);
  const [deletedTemplates, setDeletedTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingIncoming, setLoadingIncoming] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailType, setDetailType] = useState('letter'); // 'letter', 'incoming', 'request', 'category', or 'template'
  
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedForRestore, setSelectedForRestore] = useState(null);
  const [restoreType, setRestoreType] = useState('letter'); // 'letter', 'incoming', 'request', 'category', or 'template'
  
  const [isExpandedLetters, setIsExpandedLetters] = useState(false);
  const [isExpandedIncoming, setIsExpandedIncoming] = useState(false);
  const [isExpandedRequests, setIsExpandedRequests] = useState(false);
  const [isExpandedCategories, setIsExpandedCategories] = useState(false);
  const [isExpandedTemplates, setIsExpandedTemplates] = useState(false);

  const fetchDeletedLetters = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php?deleted=1');
      const data = await response.json();
      setDeletedLetters(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  const fetchDeletedCategories = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/kategori_surat.php?deleted=1');
      const data = await response.json();
      setDeletedCategories(data);
      setLoadingCats(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoadingCats(false);
    }
  };

  const fetchDeletedRequests = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/permohonan.php?deleted=1');
      const data = await response.json();
      setDeletedRequests(data);
      setLoadingRequests(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoadingRequests(false);
    }
  };

  const fetchDeletedIncoming = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/surat_masuk.php?deleted=1');
      const data = await response.json();
      setDeletedIncoming(data);
      setLoadingIncoming(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoadingIncoming(false);
    }
  };

  const fetchDeletedTemplates = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/templates.php?deleted=1');
      const data = await response.json();
      setDeletedTemplates(data);
      setLoadingTemplates(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchDeletedLetters();
    fetchDeletedIncoming();
    fetchDeletedRequests();
    fetchDeletedCategories();
    fetchDeletedTemplates();
  }, []);

  const handleDetailClick = (item, type = 'letter') => {
    setSelectedDetail(item);
    setDetailType(type);
    setShowDetailModal(true);
  };

  const handleRestoreClick = (item, type = 'letter') => {
    setSelectedForRestore(item);
    setRestoreType(type);
    setShowRestoreModal(true);
  };

  const handleConfirmRestore = async () => {
    try {
      const url = restoreType === 'letter' 
        ? 'http://localhost/siarsad/api/surat_keluar.php' 
        : restoreType === 'incoming'
          ? 'http://localhost/siarsad/api/surat_masuk.php'
          : restoreType === 'request'
            ? 'http://localhost/siarsad/api/permohonan.php'
            : restoreType === 'category'
              ? 'http://localhost/siarsad/api/kategori_surat.php'
              : 'http://localhost/siarsad/api/templates.php';
      
      const body = (restoreType === 'letter' || restoreType === 'incoming' || restoreType === 'request')
        ? { id: selectedForRestore.id, is_deleted: 0 }
        : restoreType === 'category'
          ? { id_kategori: selectedForRestore.id_kategori, is_deleted: 0 }
          : { id: selectedForRestore.id, action: 'restore' };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (result.success) {
        setShowRestoreModal(false);
        setSelectedForRestore(null);
        if (restoreType === 'letter') {
          fetchDeletedLetters();
        } else if (restoreType === 'incoming') {
          fetchDeletedIncoming();
        } else if (restoreType === 'request') {
          fetchDeletedRequests();
        } else if (restoreType === 'category') {
          fetchDeletedCategories();
        } else {
          fetchDeletedTemplates();
        }
      } else {
        alert('Gagal me-restore: ' + result.message);
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Terjadi kesalahan saat memulihkan data.');
    }
  };

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Backup & Restore</h1>
          <div className="breadcrumb">
            <span>Admin</span>
            <span>/</span>
            <span className="active">Backup & Restore</span>
          </div>
        </div>
      </div>

      <Card title="Daftar Surat Keluar yang Dibatalkan">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor Surat</th>
                <th>Tanggal Dibatalkan</th>
                <th>Tujuan</th>
                <th>Perihal</th>
                <th>Status Asal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : deletedLetters.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Tidak ada surat yang dibatalkan.</td></tr>
              ) : (
                (isExpandedLetters ? deletedLetters : deletedLetters.slice(0, 5)).map((item) => (
                  <tr key={item.id}>
                    <td>{item.letter_number || '(Draft)'}</td>
                    <td>{item.deleted_at || '-'}</td>
                    <td>{item.recipient}</td>
                    <td>{item.subject}</td>
                    <td><span className="badge badge-secondary">{item.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDetailClick(item)}
                          title="Detail"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleRestoreClick(item)}
                          title="Restore"
                        >
                          <RefreshCw size={14} /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {deletedLetters.length > 5 && (
          <div className="flex justify-center mt-4 pt-2 border-t">
            <button 
              className="btn btn-link flex items-center gap-1" 
              style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}
              onClick={() => setIsExpandedLetters(!isExpandedLetters)}
            >
              {isExpandedLetters ? (
                <>Sembunyikan <ChevronUp size={16} /></>
              ) : (
                <>Baca Selengkapnya <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </Card>
      <Card title="Daftar Surat Masuk yang Dibatalkan">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor Surat</th>
                <th>Tanggal Dibatalkan</th>
                <th>Pengirim</th>
                <th>Perihal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingIncoming ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : deletedIncoming.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Tidak ada surat masuk yang dibatalkan.</td></tr>
              ) : (
                (isExpandedIncoming ? deletedIncoming : deletedIncoming.slice(0, 5)).map((item) => (
                  <tr key={item.id}>
                    <td>{item.letter_number}</td>
                    <td>{item.deleted_at || '-'}</td>
                    <td>{item.sender}</td>
                    <td>{item.subject}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDetailClick(item, 'incoming')}
                          title="Detail"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleRestoreClick(item, 'incoming')}
                          title="Restore"
                        >
                          <RefreshCw size={14} /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {deletedIncoming.length > 5 && (
          <div className="flex justify-center mt-4 pt-2 border-t">
            <button 
              className="btn btn-link flex items-center gap-1" 
              style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}
              onClick={() => setIsExpandedIncoming(!isExpandedIncoming)}
            >
              {isExpandedIncoming ? (
                <>Sembunyikan <ChevronUp size={16} /></>
              ) : (
                <>Baca Selengkapnya <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </Card>
      <Card title="Daftar Permohonan Surat yang Dibatalkan">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal Pengajuan</th>
                <th>Tujuan</th>
                <th>Perihal</th>
                <th>Pemohon</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingRequests ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : deletedRequests.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Tidak ada permohonan yang dibatalkan.</td></tr>
              ) : (
                (isExpandedRequests ? deletedRequests : deletedRequests.slice(0, 5)).map((item) => (
                  <tr key={item.id}>
                    <td>{item.date_requested}</td>
                    <td>{item.letter_type}</td>
                    <td>{item.subject}</td>
                    <td>{item.pemohon}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDetailClick(item, 'request')}
                          title="Detail"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleRestoreClick(item, 'request')}
                          title="Restore"
                        >
                          <RefreshCw size={14} /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {deletedRequests.length > 5 && (
          <div className="flex justify-center mt-4 pt-2 border-t">
            <button 
              className="btn btn-link flex items-center gap-1" 
              style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}
              onClick={() => setIsExpandedRequests(!isExpandedRequests)}
            >
              {isExpandedRequests ? (
                <>Sembunyikan <ChevronUp size={16} /></>
              ) : (
                <>Baca Selengkapnya <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </Card>
      <Card title="Daftar Kategori Surat yang Terhapus">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Nama Kategori</th>
                <th>Deskripsi</th>
                <th>Tanggal Terhapus</th>
                <th style={{ width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingCats ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : deletedCategories.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Tidak ada kategori yang terhapus.</td></tr>
              ) : (
                (isExpandedCategories ? deletedCategories : deletedCategories.slice(0, 5)).map((item, index) => (
                  <tr key={item.id_kategori}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.nama_kategori}</td>
                    <td>{item.deskripsi || '-'}</td>
                    <td>{item.deleted_at || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDetailClick(item, 'category')}
                          title="Detail"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleRestoreClick(item, 'category')}
                          title="Restore"
                        >
                          <RefreshCw size={14} /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {deletedCategories.length > 5 && (
          <div className="flex justify-center mt-4 pt-2 border-t">
            <button 
              className="btn btn-link flex items-center gap-1" 
              style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}
              onClick={() => setIsExpandedCategories(!isExpandedCategories)}
            >
              {isExpandedCategories ? (
                <>Sembunyikan <ChevronUp size={16} /></>
              ) : (
                <>Baca Selengkapnya <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </Card>

      <Card title="Daftar Template Surat yang Terhapus">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Nama Template</th>
                <th>Format Nomor</th>
                <th>Tanggal Terhapus</th>
                <th style={{ width: '150px' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingTemplates ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : deletedTemplates.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>Tidak ada template yang terhapus.</td></tr>
              ) : (
                (isExpandedTemplates ? deletedTemplates : deletedTemplates.slice(0, 5)).map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td><code>{item.number_format}</code></td>
                    <td>{item.deleted_at || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleDetailClick(item, 'template')}
                          title="Detail"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        <button 
                          className="btn btn-success" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleRestoreClick(item, 'template')}
                          title="Restore"
                        >
                          <RefreshCw size={14} /> Restore
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {deletedTemplates.length > 5 && (
          <div className="flex justify-center mt-4 pt-2 border-t">
            <button 
              className="btn btn-link flex items-center gap-1" 
              style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 600 }}
              onClick={() => setIsExpandedTemplates(!isExpandedTemplates)}
            >
              {isExpandedTemplates ? (
                <>Sembunyikan <ChevronUp size={16} /></>
              ) : (
                <>Baca Selengkapnya <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </Card>

      {/* Modal Konfirmasi Restore */}
      {showRestoreModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">Konfirmasi Restore</h3>
              <button className="hamburger" onClick={() => setShowRestoreModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p>Apakah Anda yakin ingin memulihkan (restore) {restoreType === 'letter' ? 'surat' : restoreType === 'category' ? 'kategori' : 'template'} ini?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {restoreType === 'letter' 
                  ? 'Surat ini akan dikembalikan ke halaman Surat Keluar.'
                  : restoreType === 'category'
                    ? 'Kategori ini akan dikembalikan ke halaman Master Data Kategori Surat.'
                    : 'Template ini akan dikembalikan ke halaman Master Template Surat.'}
              </p>
              <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowRestoreModal(false)}>Batal</button>
                <button className="btn btn-success" onClick={handleConfirmRestore}>Ya, Restore</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail */}
      {showDetailModal && selectedDetail && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">
                {detailType === 'letter' ? 'Detail Surat Dibatalkan' : 
                 detailType === 'category' ? 'Detail Kategori Terhapus' : 
                 'Preview Template Terhapus'}
              </h3>
              <button className="hamburger" onClick={() => setShowDetailModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {(detailType === 'letter' || detailType === 'incoming' || detailType === 'request') ? (
                <table cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ width: '30%', fontWeight: 'bold' }}>{detailType === 'request' ? 'Perihal' : 'No Surat'}</td>
                      <td>: {detailType === 'request' ? selectedDetail.subject : (selectedDetail.letter_number || '-')}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>{detailType === 'incoming' ? 'Pengirim' : (detailType === 'request' ? 'Tujuan' : 'Tujuan')}</td>
                      <td>: {detailType === 'incoming' ? selectedDetail.sender : (detailType === 'request' ? selectedDetail.letter_type : (selectedDetail.recipient || '-'))}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>{detailType === 'request' ? 'Pemohon' : 'Perihal'}</td>
                      <td>: {detailType === 'request' ? selectedDetail.pemohon : selectedDetail.subject || '-'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>Tanggal</td>
                      <td>: {detailType === 'incoming' ? selectedDetail.date_received : (detailType === 'request' ? selectedDetail.date_requested : (selectedDetail.date_sent || '-'))}</td>
                    </tr>
                    {(selectedDetail.file_path || selectedDetail.file_url) && (
                       <tr style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ fontWeight: 'bold' }}>Lampiran</td>
                        <td>: <a href={selectedDetail.file_url || `http://localhost/siarsad/api/${selectedDetail.file_path}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}>Buka Dokumen</a></td>
                      </tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>Dihapus Pada</td>
                      <td>: {selectedDetail.deleted_at || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              ) : detailType === 'category' ? (
                <table cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ width: '30%', fontWeight: 'bold' }}>ID Kategori</td>
                      <td>: {selectedDetail.id_kategori}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>Nama Kategori</td>
                      <td>: {selectedDetail.nama_kategori}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>Deskripsi</td>
                      <td>: {selectedDetail.deskripsi || '-'}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ fontWeight: 'bold' }}>Dihapus Pada</td>
                      <td>: {selectedDetail.deleted_at || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    backgroundColor: 'white', 
                    padding: '20mm 15mm', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontFamily: '"Times New Roman", Times, serif',
                    fontSize: '12pt',
                    lineHeight: '1.5',
                    color: 'black'
                  }}>
                    {/* Kop Surat */}
                    <div style={{ display: 'flex', alignItems: 'center', borderBottom: '4px double black', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '60px', height: '60px', marginRight: '0.5rem' }} />
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <h1 style={{ fontSize: '12pt', fontWeight: 'bold', margin: 0 }}>KB/BA/TPA "RESTU 2"</h1>
                        <h2 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>Dharma Wanita Persatuan MAN 2 Kota Malang</h2>
                        <p style={{ fontSize: '8pt', margin: 0 }}>Jl. Pandeglang No. 7 Malang Fax/Telp. (0341) 587678</p>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '1rem', fontWeight: 'bold' }}>
                      {selectedDetail.name}
                    </div>

                    <div dangerouslySetInnerHTML={{ __html: selectedDetail.content }} />

                    {/* Signature */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
                      <div style={{ textAlign: 'center', minWidth: '150px' }}>
                        <p style={{ margin: 0 }}>Mengetahui</p>
                        <p style={{ margin: 0 }}>Kepala KB/BA "RESTU 2"</p>
                        <div style={{ height: '50px' }}></div>
                        <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>Maslichah Hartatik, S.S</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white border rounded">
                    <p style={{ fontSize: '0.85rem' }}><strong>Format Penomoran:</strong> <code>{selectedDetail.number_format}</code></p>
                    <p style={{ fontSize: '0.85rem' }}><strong>Dihapus Pada:</strong> {selectedDetail.deleted_at}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BackupRestore;
