import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { Plus, Upload, Filter, FileText, X, Send, MessageSquare, AlertCircle, Trash2, Download, Printer, ArrowLeft, CheckCircle } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import LetterPreview from '../../components/LetterPreview';

function PermohonanSurat({ role, view = 'aktif' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showProcessDecisionModal, setShowProcessDecisionModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedForCancel, setSelectedForCancel] = useState(null);
  const [showFinalPreview, setShowFinalPreview] = useState(false);
  const [selectedFinalLetter, setSelectedFinalLetter] = useState(null);

  // Reset state setiap kali pindah halaman/menu
  useEffect(() => {
    setSelectedDetail(null);
    handleCloseForm();
  }, [location.pathname]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Field State for Validation
  const [permohonanData, setPermohonanData] = useState({
    id_kategori: '',
    judul: '',
    tujuan: '',
    deadline_date: '',
    keterangan: ''
  });

  const handleInputChange = (e) => {
    setPermohonanData({
      ...permohonanData,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = permohonanData.id_kategori !== '' && 
                    permohonanData.judul.trim() !== '' && 
                    permohonanData.tujuan.trim() !== '' && 
                    permohonanData.deadline_date !== '' &&
                    permohonanData.keterangan.trim() !== '';

  // Filter logic
  const filteredData = requests.filter(item => {
    const user = JSON.parse(localStorage.getItem('sipersa_user'));
    
    // Filter logic:
    // 1. Guru always sees only their own requests
    if (role === 'guru' && parseInt(item.user_id) !== parseInt(user?.id)) {
      return false;
    }
    
    // 2. Kepala Sekolah sees only their own requests in 'aktif' view, 
    //    but sees ALL requests in 'riwayat' view (Global History)
    if (role === 'kepala_sekolah' && view === 'aktif' && parseInt(item.user_id) !== parseInt(user?.id)) {
      return false;
    }

    if (view === 'aktif') {
      if (!['menunggu', 'disetujui', 'diproses', 'ditolak', 'selesai'].includes(item.status.toLowerCase())) return false;
    } else {
      if (!['ditolak', 'selesai', 'disetujui'].includes(item.status.toLowerCase())) return false;
    }

    // 3. Search Filter (Subject, Recipient, or Body Content)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const inSubject = item.subject?.toLowerCase().includes(searchLower);
      const inRecipient = item.letter_type?.toLowerCase().includes(searchLower);
      const inContent = item.content?.toLowerCase().includes(searchLower);
      const inExtracted = item.extracted_text?.toLowerCase().includes(searchLower); // Placeholder for AI reading

      if (!inSubject && !inRecipient && !inContent && !inExtracted) {
        return false;
      }
    }

    // 4. Category Filter
    if (filterCategory && parseInt(item.id_kategori) !== parseInt(filterCategory)) {
      return false;
    }

    return true;
  });

  const isHistoryPersetujuan = role === 'kepala_sekolah' && view === 'riwayat';

  const sortedData = [...filteredData].sort((a, b) => {
    // 1. History view for Principal: Sort by action date (newest first)
    if (isHistoryPersetujuan) {
      const dateA = new Date(a.date_requested).getTime();
      const dateB = new Date(b.date_requested).getTime();
      return dateB - dateA;
    }

    // 2. Default: Sort by Deadline for TU/Admin/Principal (Active View)
    if (role === 'tata_usaha' || role === 'admin' || role === 'kepala_sekolah') {
      const dateA = new Date(a.deadline_date || a.date_requested).getTime();
      const dateB = new Date(b.deadline_date || b.date_requested).getTime();
      return dateA - dateB;
    } 
    
    // 3. Other views (e.g., Guru): Sort by request date
    const dateA = new Date(a.date_requested).getTime();
    const dateB = new Date(b.date_requested).getTime();
    return dateA - dateB;
  });

  // Fetch data dari database MySQL melalui PHP API
  const isUrgent = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day comparison
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const fetchRequests = async () => {
    try {
      const url = isHistoryPersetujuan 
        ? `http://localhost/siarsad/api/surat_keluar.php?t=${Date.now()}`
        : `http://localhost/siarsad/api/permohonan.php?t=${Date.now()}`;
        
      const response = await fetch(url);
      let data = await response.json();
      
      if (isHistoryPersetujuan) {
        // Map surat_keluar data to permohonan format for the table
        data = data.filter(item => ['Disetujui', 'Ditolak', 'Terkirim', 'Selesai'].includes(item.status))
                   .map(item => ({
          ...item,
          date_requested: item.created_at,
          pemohon: item.created_by_name || 'Staff TU',
          letter_type: item.subject,
          badge: item.status === 'Disetujui' || item.status === 'Terkirim' || item.status === 'Selesai' ? 'success' : 'danger'
        }));
      }
      
      setRequests(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
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
    fetchRequests();
    fetchCategories();
    fetchTemplates();
  }, [role, view]); // Refetch when role or view changes

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataRaw = new FormData(e.target);
    const user = JSON.parse(localStorage.getItem('sipersa_user'));

    const formData = new FormData();
    formData.append('user_id', user?.id || 1);
    formData.append('id_kategori', permohonanData.id_kategori);
    formData.append('letter_type', permohonanData.tujuan); // Tujuan mapped to Kepada
    formData.append('subject', permohonanData.judul);      // Judul mapped to Perihal
    formData.append('deadline_date', permohonanData.deadline_date);
    formData.append('content', permohonanData.keterangan);
    if (selectedFile) {
      formData.append('attachment', selectedFile);
    }

    try {
      const response = await fetch('http://localhost/siarsad/api/permohonan.php', {
        method: 'POST',
        body: formData // Fetch handles Content-Type automatically for FormData
      });
      const result = await response.json();
      if (result.success) {
        alert('Permohonan berhasil disimpan di database!');
        setShowForm(false);
        setSelectedFile(null);
        setPermohonanData({ id_kategori: '', judul: '', tujuan: '', deadline_date: '', keterangan: '' });
        fetchRequests(); // Refresh data
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setPermohonanData({ id_kategori: '', judul: '', tujuan: '', deadline_date: '', keterangan: '' });
    setSelectedFile(null);
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/templates.php');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const handleProcessLetter = async (template) => {
    try {
      // 1. Update status permohonan ke 'Diproses'
      const responseStatus = await fetch('http://localhost/siarsad/api/permohonan.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDetail.id,
          status: 'Diproses'
        })
      });
      const resultStatus = await responseStatus.json();
      if (!resultStatus.success) {
        alert('Gagal memperbarui status: ' + resultStatus.message);
        return;
      }

      // 2. Generate Nomor Surat
      const responseNum = await fetch(`http://localhost/siarsad/api/generate_number.php?template_id=${template.id}`);
      const resultNum = await responseNum.json();
      const nextNumber = resultNum.next_number;

      // 3. Buat Draft di Surat Keluar
      const responseDraft = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter_number: nextNumber,
          recipient: selectedDetail.letter_type,
          subject: selectedDetail.subject,
          status: 'Draft',
          template_id: template.id,
          request_id: selectedDetail.id,
          sender: 'PAUD Terpadu Restu 2'
        })
      });
      const resultDraft = await responseDraft.json();
      
      if (!resultDraft.success) {
        alert('Gagal membuat draft: ' + resultDraft.message);
        return;
      }

      // 4. Navigasi ke halaman buat-surat (2-panel editor)
      const navigationState = { 
        permohonan: selectedDetail,
        template: template,
        outgoing_id: resultDraft.id,
        letter_number: nextNumber
      };

      navigate('/buat-surat', { state: navigationState });
    } catch (error) {
      console.error('Process letter error details:', error);
      alert('Terjadi kesalahan saat memproses surat: ' + error.message);
    }
  };

  const handleRejectLetter = () => {
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Silakan isi alasan penolakan.');
      return;
    }

    try {
      const response = await fetch('http://localhost/siarsad/api/permohonan.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDetail.id,
          status: 'Ditolak',
          rejection_reason: rejectionReason
        })
      });
      const result = await response.json();
      if (result.success) {
        alert('Permohonan berhasil ditolak.');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedDetail(null);
        fetchRequests();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Reject letter error:', error);
      alert('Terjadi kesalahan saat menolak permohonan.');
    }
  };

  const handleCancelRequest = (item) => {
    setSelectedForCancel(item);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedForCancel) return;
    
    try {
      const response = await fetch(`http://localhost/siarsad/api/permohonan.php?id=${selectedForCancel.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('Permohonan berhasil dibatalkan dan dipindahkan ke Backup & Restore.');
        setShowCancelModal(false);
        setSelectedForCancel(null);
        fetchRequests();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Cancel request error:', error);
      alert('Terjadi kesalahan saat membatalkan permohonan.');
    }
  };

  const pageTitle = isHistoryPersetujuan ? 'Riwayat Persetujuan Surat' : (view === 'aktif' ? 'Permohonan Surat' : 'Riwayat Permohonan Surat');
  const breadcrumbActive = isHistoryPersetujuan ? 'Riwayat Persetujuan' : (view === 'aktif' ? 'Permohonan' : 'Riwayat');
  const cardTitle = isHistoryPersetujuan ? 'Daftar Persetujuan Surat' : `Daftar ${pageTitle}`;

  if (selectedDetail) {
    if (isHistoryPersetujuan || selectedDetail.status === 'Selesai' || selectedDetail.status === 'Disetujui') {
      // Use LetterPreview for finalized or rejected official letters in history
      const letterData = {
        ...selectedDetail,
        letter_number: selectedDetail.letter_number || selectedDetail.final_number,
        draft_data: selectedDetail.draft_data || selectedDetail.final_draft_data,
        template_name: selectedDetail.template_name
      };

      return (
        <LetterPreview 
          letter={letterData} 
          onClose={() => setSelectedDetail(null)} 
          showActions={false} 
        />
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title">Preview Permohonan Surat</h1>
            <div className="breadcrumb d-none d-md-flex">
              <span>Surat</span>
              <span>/</span>
              <span>{breadcrumbActive}</span>
              <span>/</span>
              <span className="active">Preview</span>
            </div>
          </div>
        </div>

        <Card>
          {/* Bagian Kop Surat */}
          <div style={{ textAlign: 'center', borderBottom: '3px solid black', paddingBottom: '1rem', marginBottom: '3rem', marginTop: '1cm' }}>
            <h2 style={{ margin: 0, fontWeight: 'bold' }}>KB-BA-TPA Restu 2</h2>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Jl. Pandeglang No.7, Penanggungan, Kec. Klojen, Kota Malang, Jawa Timur 65113 | Telp: (0341) 587678</p>
          </div>
          
          <div style={{ marginBottom: '2rem' }}>
            <table cellPadding="4">
              <tbody>
                <tr><td><strong>Perihal</strong></td><td>: {selectedDetail.subject}</td></tr>
                <tr><td><strong>Kepada</strong></td><td>: Yth. {selectedDetail.letter_type}</td></tr>
                <tr><td><strong>Pemohon</strong></td><td>: {selectedDetail.pemohon || 'Staff TU'}</td></tr>
                <tr><td><strong>Tanggal Pengajuan</strong></td><td>: {selectedDetail.date_requested}</td></tr>
                <tr><td><strong>Tanggal Deadline</strong></td><td>: {selectedDetail.deadline_date || '-'}</td></tr>
                <tr className="no-print"><td><strong>Status</strong></td><td>: <span className={`badge badge-${selectedDetail.badge}`}>{selectedDetail.status}</span></td></tr>
              </tbody>
            </table>
          </div>
          
          <div style={{ minHeight: '200px', lineHeight: '1.6', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #eee' }}>
            <div dangerouslySetInnerHTML={{ __html: selectedDetail.content }} />
            <p style={{ marginTop: '2rem' }}>Demikian permohonan ini saya ajukan untuk dapat diproses lebih lanjut.</p>
          </div>

          {selectedDetail.rejection_reason && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff5f5', borderRadius: '8px', borderLeft: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>
                <MessageSquare size={18} />
                <span style={{ fontWeight: 600 }}>Alasan Penolakan:</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', margin: 0 }}>
                "{selectedDetail.rejection_reason}"
              </p>
            </div>
          )}

          {selectedDetail.file_path && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <FileText size={24} color="var(--primary-color)" />
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>Dokumen Lampiran Terdeteksi</p>
                <a 
                  href={selectedDetail.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                >
                  Buka Lampiran
                </a>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4 border-t pt-4 no-print" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-outline" onClick={() => setSelectedDetail(null)}>Kembali ke Daftar</button>
            <div className="flex gap-2">
               {selectedDetail.status === 'Selesai' && (
                 <button 
                  className="btn btn-success" 
                  onClick={() => {
                    const letterData = {
                      ...selectedDetail,
                      letter_number: selectedDetail.final_number,
                      draft_data: selectedDetail.final_draft_data,
                      template_name: selectedDetail.template_name
                    };
                    setSelectedFinalLetter(letterData);
                    setShowFinalPreview(true);
                  }}
                 >
                   Lihat Surat Resmi
                 </button>
               )}
               <button className="btn btn-outline" onClick={() => window.print()}>Cetak Draft</button>
               {(role === 'tata_usaha' || role === 'admin') && (
                 <>
                   <button className="btn btn-danger" onClick={handleRejectLetter} disabled={selectedDetail.status.toLowerCase() === 'ditolak'} style={{ opacity: selectedDetail.status.toLowerCase() === 'ditolak' ? 0.5 : 1, cursor: selectedDetail.status.toLowerCase() === 'ditolak' ? 'not-allowed' : 'pointer' }}>Tolak</button>
                    {view === 'aktif' && (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => {
                          if (selectedDetail.status === 'Diproses') {
                            setShowProcessDecisionModal(true);
                          } else {
                            fetchTemplates();
                            setShowTemplateModal(true);
                          }
                        }}
                        disabled={selectedDetail.status.toLowerCase() === 'ditolak'}
                        style={{ opacity: selectedDetail.status.toLowerCase() === 'ditolak' ? 0.5 : 1, cursor: selectedDetail.status.toLowerCase() === 'ditolak' ? 'not-allowed' : 'pointer' }}
                      >Proses Menjadi Surat Resmi</button>
                    )}
                 </>
               )}
            </div>
          </div>
        </Card>

        {/* Modal Keputusan Proses (Jika sudah pernah diproses) */}
        {showProcessDecisionModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 120, padding: '1rem'
          }}>
            <div className="card" style={{ width: '100%', maxWidth: '450px', marginBottom: 0 }}>
              <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>Permohonan Sudah Diproses</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowProcessDecisionModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                <AlertCircle size={48} style={{ color: 'var(--warning)', marginBottom: '1rem' }} />
                <p style={{ marginBottom: '1.5rem' }}>Permohonan ini sudah pernah diproses menjadi draft surat resmi sebelumnya. Apakah Anda ingin mengganti template atau melanjutkan yang sudah ada?</p>
                <div className="flex gap-2 justify-center">
                  <button 
                    className="btn btn-outline" 
                    onClick={async () => {
                      // GANTI: Soft delete existing draft and reset sequence
                      if (window.confirm('Mengganti template akan memindahkan draft saat ini ke Backup & Restore. Lanjutkan?')) {
                        try {
                          // Find the existing draft ID first
                          const res = await fetch(`http://localhost/siarsad/api/surat_keluar.php`);
                          const allOut = await res.json();
                          const existing = allOut.find(o => parseInt(o.request_id) === parseInt(selectedDetail.id) && o.is_deleted == 0);
                          
                          if (existing) {
                            await fetch(`http://localhost/siarsad/api/surat_keluar.php`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: existing.id,
                                is_deleted: 1 // Move to backup
                              })
                            });
                          }
                          
                          // Reset status permohonan ke 'Menunggu' agar bisa diproses ulang
                          await fetch('http://localhost/siarsad/api/permohonan.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              id: selectedDetail.id,
                              status: 'Menunggu'
                            })
                          });

                          // Fetch new templates and show picker
                          fetchTemplates();
                          setShowProcessDecisionModal(false);
                          setShowTemplateModal(true);
                        } catch (error) {
                          alert('Gagal memproses penggantian template.');
                        }
                      }
                    }}
                  >
                    Ganti Template
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={async () => {
                      // LANJUT: Fetch existing draft and go to editor
                      try {
                        const res = await fetch(`http://localhost/siarsad/api/surat_keluar.php`);
                        const allOut = await res.json();
                        const existing = allOut.find(o => parseInt(o.request_id) === parseInt(selectedDetail.id) && o.is_deleted == 0);
                        
                        if (existing) {
                          // Make sure templates are loaded
                          let currentTemplates = templates;
                          if (currentTemplates.length === 0) {
                            const resp = await fetch('http://localhost/siarsad/api/templates.php');
                            currentTemplates = await resp.json();
                            setTemplates(currentTemplates);
                          }

                          const template = currentTemplates.find(t => t.id == existing.template_id);
                          if (!template) {
                            alert('Template surat yang digunakan sebelumnya sudah dihapus. Silakan pilih template baru.');
                            
                            // Move existing draft to backup
                            await fetch(`http://localhost/siarsad/api/surat_keluar.php`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: existing.id,
                                is_deleted: 1
                              })
                            });
                            
                            // Reset status permohonan ke 'Menunggu' agar bisa diproses ulang
                            await fetch('http://localhost/siarsad/api/permohonan.php', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                id: selectedDetail.id,
                                status: 'Menunggu'
                              })
                            });
                            
                            // Fetch new templates and show picker
                            fetchTemplates();
                            setShowProcessDecisionModal(false);
                            setShowTemplateModal(true);
                            return;
                          }
                          navigate('/buat-surat', { state: { 
                            permohonan: selectedDetail,
                            template: template,
                            outgoing_id: existing.id,
                            letter_number: existing.letter_number,
                            draft_data: existing.draft_data
                          }});
                        } else {
                          alert('Draft tidak ditemukan.');
                        }
                      } catch (error) {
                        alert('Gagal mengambil data draft.');
                      }
                    }}
                  >
                    Lanjut Pemrosesan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Pilih Template */}
        {showTemplateModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 100, padding: '1rem'
          }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', marginBottom: 0, position: 'relative' }}>
              <div className="card-header">
                <h3 className="card-title">Pilih Template Surat Resmi</h3>
                <button className="hamburger" onClick={() => setShowTemplateModal(false)}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {templates.map(t => (
                  <button 
                    key={t.id} 
                    className="btn btn-outline" 
                    style={{ justifyContent: 'flex-start', padding: '1rem' }}
                    onClick={() => handleProcessLetter(t)}
                  >
                    <FileText size={20} style={{ color: 'var(--primary-color)' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Format: {t.number_format}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal Alasan Penolakan */}
        {showRejectModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 110, padding: '1rem'
          }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
              <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>Alasan Penolakan</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowRejectModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '1.25rem 0' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Masukkan alasan penolakan permohonan surat ini..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ resize: 'none' }}
                    autoFocus
                  ></textarea>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-outline" onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}>Batal</button>
                <button className="btn btn-danger flex items-center gap-2" onClick={handleConfirmReject}>
                  <Send size={16} /> Kirim
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Surat</span>
            <span>/</span>
            <span className="active">{breadcrumbActive}</span>
          </div>
        </div>
        {view === 'aktif' && (role === 'guru' || role === 'tata_usaha' || role === 'kepala_sekolah' || role === 'admin') && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            Ajukan Permohonan Baru
          </button>
        )}
      </div>

      {showForm && (
        <Card title="Form Pengajuan Permohonan Surat">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Kategori Surat <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select 
                  name="id_kategori" 
                  className="form-control" 
                  value={permohonanData.id_kategori}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline Surat <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="deadline_date" 
                  type="date" 
                  className="form-control" 
                  value={permohonanData.deadline_date}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Perihal / Judul Surat <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="judul" 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: Permohonan Izin Kegiatan" 
                  value={permohonanData.judul}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tujuan / Subject (Kepada Yth.) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="tujuan" 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: Kepala Dinas Pendidikan" 
                  value={permohonanData.tujuan}
                  onChange={handleInputChange}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Isi / keterangan <span style={{ color: 'var(--danger)' }}>*</span></label>
              <Editor
                apiKey="nh44to6bwzt0o2tfojx566lbso5zaa43c817zljd7up7rzur"
                value={permohonanData.keterangan}
                init={{
                  height: 300,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist | ' +
                    'image table | removeformat | help',
                }}
                onEditorChange={(newContent) => setPermohonanData({...permohonanData, keterangan: newContent})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Upload Lampiran (Opsional)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="d-none" 
                  onChange={handleFileChange} 
                  accept=".pdf,.doc,.docx,.jpg,.jpeg"
                />
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ padding: '2rem', width: '100%', borderStyle: 'dashed', position: 'relative' }}
                  onClick={() => document.getElementById('file-upload').click()}
                >
                  <Upload size={24} style={{ marginBottom: '0.5rem' }} />
                  <br />
                  {selectedFile ? `File terpilih: ${selectedFile.name}` : 'Klik atau Drop file disini (PDF/Word/JPG)'}
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={!isFormValid}
                style={{ opacity: isFormValid ? 1 : 0.6, cursor: isFormValid ? 'pointer' : 'not-allowed' }}
              >
                Ajukan Permohonan
              </button>
              <button type="button" className="btn btn-outline" onClick={handleCloseForm}>Batal</button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && (
        <Card title={cardTitle}>
          <div className="flex justify-between items-center mb-4 gap-2">
            <div className="flex gap-2 items-center" style={{ flex: 1 }}>
              <div style={{ position: 'relative', width: '250px' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Cari perihal/tujuan..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              </div>
              
              <select 
                className="form-control" 
                style={{ width: '200px' }}
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                ))}
              </select>

              {(searchTerm || filterCategory) && (
                <button 
                  className="btn btn-outline" 
                  onClick={() => { setSearchTerm(''); setFilterCategory(''); }}
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                >
                  <X size={16} /> Reset
                </button>
              )}
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Tanggal Pengajuan</th>
                  {!isHistoryPersetujuan && <th>Tujuan</th>}
                  {!isHistoryPersetujuan && <th>Perihal</th>}
                  {isHistoryPersetujuan && <th>Pemohon</th>}
                  {isHistoryPersetujuan && <th>Keperluan</th>}
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Alasan Penolakan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      Tidak ada permohonan surat ditemukan.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td>{item.date_requested}</td>
                      {!isHistoryPersetujuan && <td>{item.letter_type}</td>}
                      {!isHistoryPersetujuan && <td>{item.subject}</td>}
                      {isHistoryPersetujuan && <td>{item.pemohon}</td>}
                      {isHistoryPersetujuan && <td>{item.letter_type}</td>}
                      <td style={{ 
                         color: item.status !== 'Selesai' && isUrgent(item.deadline_date) ? 'var(--danger)' : 'inherit',
                         fontWeight: item.status !== 'Selesai' && isUrgent(item.deadline_date) ? 'bold' : 'normal'
                       }}>
                         {item.deadline_date || '-'}
                       </td>
                      <td><span className={`badge badge-${item.badge}`}>{item.status}</span></td>
                      <td>
                        {item.status.toLowerCase() === 'ditolak' && item.rejection_reason ? (
                          <span style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--danger)', 
                            fontStyle: 'italic',
                            whiteSpace: 'normal',
                            lineHeight: '1.2'
                          }}>
                            {item.rejection_reason}
                          </span>
                        ) : '-'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                            onClick={() => setSelectedDetail(item)}
                          >
                            Detail
                          </button>
                          {view === 'aktif' && (role === 'guru' || role === 'kepala_sekolah') && item.status.toLowerCase() === 'menunggu' && (
                            <button 
                              className="btn btn-outline" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} 
                              onClick={() => handleCancelRequest(item)}
                            >
                              <Trash2 size={12} style={{ marginRight: '4px' }} /> Batal
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
      )}
      {/* Modal Konfirmasi Pembatalan */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 130, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
            <div className="card-header flex justify-between items-center">
              <h3 className="card-title">Konfirmasi Pembatalan</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowCancelModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Trash2 size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
              <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Batalkan permohonan ini?</p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.5rem' }}>
                Permohonan "{selectedForCancel?.subject}" akan dipindahkan ke menu Backup & Restore.
              </p>
              <div className="flex gap-2 justify-center">
                <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>Tidak, Kembali</button>
                <button className="btn btn-danger" onClick={handleConfirmCancel}>Ya, Batalkan</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Final Letter Preview Modal */}
      {showFinalPreview && selectedFinalLetter && (
        <LetterPreview 
          letter={selectedFinalLetter} 
          onClose={() => setShowFinalPreview(false)} 
          showActions={false} 
        />
      )}
    </div>
  );
}

export default PermohonanSurat;
