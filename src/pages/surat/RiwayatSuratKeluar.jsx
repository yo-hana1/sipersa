import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import {
  Eye, Download, Trash2, FileText, CheckCircle, X,
  Send, Tag, Calendar, User, Hash, AlignLeft, Layers, Check
} from 'lucide-react';
import LetterPreview from '../../components/LetterPreview';

function RiwayatSuratKeluar({ role }) {
  const [letters, setLetters]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php');
      const data = await response.json();
      const approvedLetters = data.filter(item =>
        item.status === 'Disetujui' || item.status === 'Selesai'
      );
      setLetters(approvedLetters);
    } catch (error) {
      console.error('Fetch riwayat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSelesai = async (id) => {
    if (!window.confirm('Tandai surat ini sebagai Selesai? Surat akan dapat diunduh oleh pemohon.')) return;
    try {
      const user = JSON.parse(localStorage.getItem('sipersa_user'));
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id,
          status: 'Selesai',
          user_id: user?.id
        })
      });
      const result = await response.json();
      if (result.success) {
        // Also update the letter_request status
        const letter = letters.find(l => l.id === id);
        if (letter && letter.request_id) {
          await fetch('http://localhost/siarsad/api/permohonan.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: letter.request_id,
              status: 'Selesai',
              user_id: user?.id
            })
          });
        }
        alert('Surat berhasil ditandai sebagai Selesai!');
        setSelectedDetail(null);
        fetchRiwayat();
      }
    } catch (error) {
      console.error('Finish error:', error);
    }
  };

  useEffect(() => { fetchRiwayat(); }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getDraftData = (item) => {
    if (!item.draft_data) return {};
    try {
      let parsed = typeof item.draft_data === 'string' ? JSON.parse(item.draft_data) : item.draft_data;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed || {};
    } catch { return {}; }
  };

  const handleOpenDetail = (item) => setSelectedDetail(item);
  const handleCloseDetail = () => setSelectedDetail(null);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Riwayat Surat Keluar</h1>
        <div className="breadcrumb d-none d-md-flex">
          <span>Surat</span>
          <span>/</span>
          <span className="active">Riwayat Surat Keluar</span>
        </div>
      </div>

      <Card title="Daftar Riwayat Surat Keluar (Ter-Approve)">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Nomor Surat</th>
                <th>Tujuan Surat</th>
                <th>Tanggal Approve</th>
                <th>Perihal</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Memuat data riwayat...</td></tr>
              ) : letters.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <div className="flex flex-col items-center">
                      <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Belum ada riwayat surat yang disetujui.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                letters.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.letter_number}</td>
                    <td>{item.recipient || '-'}</td>
                    <td>{formatDateShort(item.date_sent || item.updated_at)}</td>
                    <td>{item.subject}</td>
                    <td>
                      <span className={`badge badge-${item.status === 'Selesai' ? 'success' : 'info'} flex items-center gap-1 w-fit`}>
                        {item.status === 'Selesai' ? <CheckCircle size={12} /> : <Check size={12} />} {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-center">
                         <button
                          className="btn btn-outline btn-sm"
                          title="Lihat Detail"
                          onClick={() => handleOpenDetail(item)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} /> Lihat
                        </button>
                        {item.status === 'Disetujui' && (
                          <button 
                            className="btn btn-success btn-sm" 
                            title="Tandai Selesai"
                            onClick={() => handleMarkAsSelesai(item.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CheckCircle size={14} /> Selesaikan
                          </button>
                        )}
                        {(role === 'admin' || role === 'tata_usaha') && (
                          <button 
                            className="btn btn-danger btn-sm flex items-center justify-center" 
                            title="Hapus dari Riwayat"
                            onClick={async () => {
                              if (window.confirm('Apakah Anda yakin ingin menghapus surat ini dari riwayat? Surat akan dipindahkan ke menu Backup & Restore.')) {
                                try {
                                  const user = JSON.parse(localStorage.getItem('sipersa_user'));
                                  const response = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      id: item.id,
                                      is_deleted: 1,
                                      admin_id: user?.id
                                    })
                                  });
                                  const result = await response.json();
                                  if (result.success) {
                                    alert('Surat berhasil dipindahkan ke Backup & Restore.');
                                    fetchRiwayat();
                                  } else {
                                    alert(result.message);
                                  }
                                } catch (error) {
                                  console.error('Delete history error:', error);
                                  alert('Gagal menghapus riwayat.');
                                }
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detail Surat Keluar - Using LetterPreview */}
      {selectedDetail && (
        <LetterPreview 
          letter={selectedDetail} 
          onClose={handleCloseDetail} 
          showActions={true}
          onFinish={handleMarkAsSelesai}
        />
      )}
      </div>
  );
}

export default RiwayatSuratKeluar;
