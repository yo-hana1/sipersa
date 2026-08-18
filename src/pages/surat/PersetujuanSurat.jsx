import { useState, useEffect, useRef } from 'react';
import Card from '../../components/Card';
import { Download, CheckSquare, XSquare, FileText, Edit, Save, ArrowLeft, AlertCircle, Printer, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Editor } from '@tinymce/tinymce-react';
import LetterPreview from '../../components/LetterPreview';

const SimpleEditor = ({ value, onChange }) => {
  return (
    <Editor
      apiKey="nh44to6bwzt0o2tfojx566lbso5zaa43c817zljd7up7rzur"
      value={value}
      init={{
        height: 400,
        menubar: false,
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'removeformat | help',
        content_style: 'body { font-family:Times New Roman,Times,serif; font-size:12pt; color:black; background:white; }'
      }}
      onEditorChange={(newContent) => onChange(newContent)}
    />
  );
};

function PersetujuanSurat() {
  const [drafts, setDrafts] = useState([]);
  const [approvedDrafts, setApprovedDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [viewingApproved, setViewingApproved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');

  const isUrgent = (deadline) => {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php?t=' + Date.now());
      const data = await response.json();
      
      const waitingApproval = data.filter(item => item.status === 'Menunggu Persetujuan');
      const approved = data.filter(item => item.status === 'Disetujui' || item.status === 'Selesai');

      // Sort by deadline (most urgent first)
      waitingApproval.sort((a, b) => {
        const dateA = new Date(a.deadline_date || a.created_at).getTime();
        const dateB = new Date(b.deadline_date || b.created_at).getTime();
        return dateA - dateB;
      });

      // Sort approved by date (newest first)
      approved.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));

      setDrafts(waitingApproval);
      setApprovedDrafts(approved);
    } catch (error) {
      console.error('Fetch drafts error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleSelectDraft = (draft) => {
    setSelectedDraft(draft);
    setRejectionNotes('');
    
    if (draft.draft_data) {
      try {
        let parsed = typeof draft.draft_data === 'string' ? JSON.parse(draft.draft_data) : draft.draft_data;
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        setContent(parsed.content || '');
      } catch (e) {
        setContent('');
      }
    } else {
      setContent('');
    }
  };

  const handleDownloadPDF = () => {
    const input = document.getElementById('letter-preview');
    if(!input) return;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Draft_Surat_${selectedDraft.letter_number?.replace(/\//g, '_') || 'Resmi'}.pdf`);
    });
  };

  const handleAction = async (status, rejectionReason = null) => {
    // Only use standard confirm if it's not a rejection (rejection has its own modal)
    if (!rejectionReason && !window.confirm(`Apakah Anda yakin ingin ${status === 'Disetujui' ? 'menyetujui' : 'menolak'} surat ini?`)) return;

    try {
      // Parse current draft data
      let currentDraftData = {};
      try {
        currentDraftData = typeof selectedDraft.draft_data === 'string' ? JSON.parse(selectedDraft.draft_data) : selectedDraft.draft_data;
        if (typeof currentDraftData === 'string') currentDraftData = JSON.parse(currentDraftData);
      } catch (e) {}

      // Add edits - Only if content is not empty (prevent accidental blanking)
      if (content && content.trim() !== '') {
        currentDraftData.content = content;
      } else if (currentDraftData.content) {
        // Fallback to existing content if current state is mysteriously empty
        console.warn('Content state was empty, using existing draft content');
      }

      // 1. Update surat_keluar
      const user = JSON.parse(localStorage.getItem('sipersa_user'));
      const responseOutgoing = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDraft.id,
          status: status,
          draft_data: JSON.stringify(currentDraftData),
          subject: selectedDraft.subject,
          rejection_reason: rejectionReason,
          user_id: user?.id
        })
      });
      const resultOutgoing = await responseOutgoing.json();

      if (!resultOutgoing.success) {
        alert('Gagal update draft surat keluar: ' + resultOutgoing.message);
        return;
      }

      // 2. Update letter_requests (permohonan awal)
      if (selectedDraft.request_id) {
        await fetch('http://localhost/siarsad/api/permohonan.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedDraft.request_id,
            status: status,
            rejection_reason: rejectionReason,
            user_id: user?.id
          })
        });
      }

      alert(`Surat berhasil ${status.toLowerCase()}!`);
      setSelectedDraft(null);
      setShowRejectionModal(false);
      setRejectionNotes('');
      fetchDrafts(); // Refresh list

    } catch (error) {
      console.error('Approval error:', error);
      alert('Terjadi kesalahan sistem.');
    }
  };

  const handleRejectClick = () => {
    setRejectionNotes('');
    setShowRejectionModal(true);
  };

  // Custom WYSIWYG modules removed as we use SimpleEditor now

  if (selectedDraft) {
    let draftContent = {};
    try {
      draftContent = typeof selectedDraft.draft_data === 'string' ? JSON.parse(selectedDraft.draft_data || '{}') : (selectedDraft.draft_data || {});
      if (typeof draftContent === 'string') draftContent = JSON.parse(draftContent);
    } catch (e) {}

    const recipient = draftContent.recipient || selectedDraft.recipient || '';
    const subject = draftContent.subject || selectedDraft.subject || '';

    return (
      <div>
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title">Preview Persetujuan</h1>
            <div className="breadcrumb">
              <span>Kepala Sekolah</span>
              <span>/</span>
              <span>Persetujuan</span>
              <span>/</span>
              <span className="active">Preview</span>
            </div>
          </div>
          <button className="btn btn-outline" onClick={() => setSelectedDraft(null)}>
            <ArrowLeft size={18} /> Kembali
          </button>
        </div>

        <div className="grid grid-cols-3">
          <div style={{ gridColumn: 'span 2' }}>
            <Card title={`Preview: ${selectedDraft.subject}`}>
              
              <div className="flex justify-between items-center mb-4">
                <div id="editor-toolbar" style={{ flex: 1, minHeight: '40px', border: '1px solid #eee', borderRadius: '4px', background: '#fdfdfd', marginRight: '1rem' }}></div>
                <button className="btn btn-success" onClick={handleDownloadPDF} style={{ whiteSpace: 'nowrap' }}>
                  <Download size={18} /> Download PDF
                </button>
              </div>

              <div style={{
                  backgroundColor: '#525659',
                  padding: '2rem',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  justifyContent: 'center',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                  marginBottom: '2rem'
                }}>
                  {/* The Paper */}
                  <div id="letter-preview" className="print-container" style={{
                    width: '210mm',
                    minHeight: '297mm',
                    backgroundColor: 'white',
                    padding: '10mm 25mm',
                    boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                    fontFamily: '"Times New Roman", serif',
                    lineHeight: '1.5',
                    color: 'black',
                    position: 'relative'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      {/* Persistent Header */}
                      <thead>
                        <tr>
                          <td>
                            <div className="page-header-space" style={{ height: 'auto', marginBottom: '20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', borderBottom: (selectedDraft?.template_name?.includes('Narasumber') || selectedDraft?.template_name?.includes('Peminjaman')) ? '4px double black' : '3px solid black', paddingBottom: '10px' }}>
                                <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', marginRight: '20px' }} />
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                  <h2 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>{draftContent.kopHeader1 || 'KB-BA-TPA Restu 2'}</h2>
                                  {draftContent.kopHeader2 && <h3 style={{ margin: '5px 0', fontSize: '12pt', fontWeight: 'bold' }}>{draftContent.kopHeader2}</h3>}
                                  <p style={{ margin: 0, fontSize: '10pt' }}>{draftContent.kopAddress || 'Jl. Pandeglang No.7 Malang'}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </thead>

                      {/* Main Content */}
                      <tbody>
                        <tr>
                          <td>
                            <div className="page-content" style={{ minHeight: '150mm' }}>
                              <Editor
                                key={selectedDraft.id}
                                apiKey="nh44to6bwzt0o2tfojx566lbso5zaa43c817zljd7up7rzur"
                                initialValue={draftContent?.content || content || ''}
                                init={{
                                  height: 800,
                                  menubar: true,
                                  inline: true,
                                  fixed_toolbar_container: '#editor-toolbar',
                                  plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
                                  toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image table | removeformat | help',
                                  content_style: 'body { font-family:"Times New Roman",serif; font-size:12pt; line-height: 1.5; padding: 0; margin: 0; }'
                                }}
                                onEditorChange={setContent}
                              />
                            </div>

                          </td>
                        </tr>
                      </tbody>

                      {/* Footer Space */}
                      <tfoot>
                        <tr>
                          <td>
                            <div className="page-footer-space" style={{ height: '30mm' }}></div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
            </Card>
          </div>

          <div style={{ gridColumn: 'span 1' }}>
            <Card title="Aksi Persetujuan">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Pembuat Draft:</span>
                  <span style={{ fontWeight: 600 }}>Staff Tata Usaha</span>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Pembuat Permohonan:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDraft.requester_name || '-'}</span>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Kategori Surat:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDraft.nama_kategori || 'Umum'}</span>
                </div>
                <div style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Template Surat:</span>
                  <span style={{ fontWeight: 600 }}>{selectedDraft.template_name || 'Surat Bebas'}</span>
                </div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: isUrgent(selectedDraft.deadline_date) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.03)', borderRadius: 'var(--radius-md)', border: isUrgent(selectedDraft.deadline_date) ? '1px solid var(--danger)' : '1px solid var(--border-color)' }}>
                  <span style={{ color: isUrgent(selectedDraft.deadline_date) ? 'var(--danger)' : 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontWeight: isUrgent(selectedDraft.deadline_date) ? 'bold' : 'normal' }}>
                    Batas Waktu (Deadline):
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: isUrgent(selectedDraft.deadline_date) ? 'var(--danger)' : 'inherit' }}>
                    {selectedDraft.deadline_date || '-'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <button 
                  className="btn btn-success flex items-center justify-center gap-2" 
                  style={{ padding: '0.75rem', width: '100%' }}
                  onClick={() => handleAction('Disetujui')}
                >
                  <CheckSquare size={18} /> Setujui Surat
                </button>
                <button 
                  className="btn btn-danger flex items-center justify-center gap-2" 
                  style={{ padding: '0.75rem', width: '100%' }}
                  onClick={handleRejectClick}
                >
                  <XSquare size={18} /> Tolak / Revisi
                </button>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal Alasan Penolakan */}
        {showRejectionModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '1rem'
          }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
              <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>Alasan Penolakan</h3>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowRejectionModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ padding: '1.5rem 0' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Masukkan Alasan / Komentar:</label>
                  <textarea 
                    className="form-control" 
                    rows="4" 
                    placeholder="Contoh: Format surat kurang tepat, mohon perbaiki nomor surat..."
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    style={{ resize: 'none' }}
                    autoFocus
                  ></textarea>
                  <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                    Komentar ini akan langsung terkirim ke Tata Usaha.
                  </small>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button className="btn btn-outline" onClick={() => setShowRejectionModal(false)}>Batal</button>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleAction('Ditolak', rejectionNotes)}
                  disabled={!rejectionNotes.trim()}
                  style={{ opacity: rejectionNotes.trim() ? 1 : 0.6 }}
                >
                  Konfirmasi Tolak
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
      <div className="page-header">
        <h1 className="page-title">Persetujuan Surat</h1>
        <div className="breadcrumb">
          <span>Kepala Sekolah</span>
          <span>/</span>
          <span className="active">Persetujuan</span>
        </div>
      </div>

      <Card title="Menunggu Persetujuan">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Memuat data...</p>
        ) : drafts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <CheckSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>Tidak ada surat yang menunggu persetujuan saat ini.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Pemohon</th>
                  <th>Perihal</th>
                  <th>Deadline</th>
                  <th>Tanggal</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map(draft => (
                  <tr key={draft.id}>
                    <td style={{ fontWeight: 600 }}>{draft.template_name || 'Surat Resmi'}</td>
                    <td>{draft.requester_name || 'Staff TU'}</td>
                    <td>{draft.subject || 'Tanpa Perihal'}</td>
                    <td style={{ 
                      color: isUrgent(draft.deadline_date) ? 'var(--danger)' : 'inherit',
                      fontWeight: isUrgent(draft.deadline_date) ? 'bold' : 'normal'
                    }}>
                      {draft.deadline_date || '-'}
                    </td>
                    <td>{draft.created_at?.split(' ')[0]}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-primary btn-sm" 
                        onClick={() => handleSelectDraft(draft)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto' }}
                      >
                        <FileText size={14} /> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ marginTop: '2rem' }}>
        <Card title="Riwayat Persetujuan (Baru Saja Disetujui)">
          {approvedDrafts.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Belum ada surat yang disetujui hari ini.</p>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Judul / Template</th>
                    <th>Pemohon</th>
                    <th>Perihal</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedDrafts.slice(0, 10).map(draft => (
                    <tr key={draft.id}>
                      <td style={{ fontWeight: 600 }}>{draft.template_name || 'Surat Resmi'}</td>
                      <td>{draft.requester_name || 'Staff TU'}</td>
                      <td>{draft.subject || 'Tanpa Perihal'}</td>
                      <td>
                        <span className="badge badge-success">Disetujui</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => setViewingApproved(draft)}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0 auto' }}
                        >
                          <Printer size={14} /> Lihat & Cetak
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal View Approved Letter */}
      {viewingApproved && (
        <LetterPreview 
          letter={viewingApproved} 
          onClose={() => setViewingApproved(null)} 
          showActions={false} 
        />
      )}

      {/* Modal Alasan Penolakan */}
      {showRejectionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
            <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>Alasan Penolakan</h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setShowRejectionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem 0' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Masukkan Alasan / Komentar:</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  placeholder="Contoh: Format surat kurang tepat, mohon perbaiki nomor surat..."
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  style={{ resize: 'none' }}
                  autoFocus
                ></textarea>
                <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                  Komentar ini akan langsung terkirim ke Tata Usaha.
                </small>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn btn-outline" onClick={() => setShowRejectionModal(false)}>Batal</button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleAction('Ditolak', rejectionNotes)}
                disabled={!rejectionNotes.trim()}
                style={{ opacity: rejectionNotes.trim() ? 1 : 0.6 }}
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PersetujuanSurat;
