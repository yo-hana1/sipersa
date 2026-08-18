import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Plus, Printer, Eye, Edit, X, FileText, Tag, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function SuratKeluar() {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedLetterForCancel, setSelectedLetterForCancel] = useState(null);
  const [selectedLetterDetail, setSelectedLetterDetail] = useState(null);
  const [selectedLetterForPrint, setSelectedLetterForPrint] = useState(null);
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();

  const fetchLetters = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php');
      const data = await response.json();
      const filtered = data.filter(item => 
        item.status === 'Draft' || 
        item.status === 'Menunggu Persetujuan' || 
        item.status === 'Ditolak'
      );
      setLetters(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
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

  useEffect(() => {
    fetchLetters();
  }, []);

  const handleCancelClick = (letter) => {
    setSelectedLetterForCancel(letter);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('sipersa_user'));
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedLetterForCancel.id,
          is_deleted: 1,
          user_id: user?.id
        })
      });
      const result = await response.json();
      if (result.success) {
        setShowCancelModal(false);
        setSelectedLetterForCancel(null);
        fetchLetters();
      } else {
        alert('Gagal membatalkan surat: ' + result.message);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Terjadi kesalahan saat membatalkan surat.');
    }
  };

  const handleEditDraft = (letter) => {
    const navigationState = {
      outgoing_id: letter.id,
      letter_number: letter.letter_number,
      draft_data: letter.draft_data,
      template: { name: letter.template_name },
      permohonan: {
        pemohon: letter.requester_name,
        subject: letter.permohonan_subject,
        content: letter.permohonan_content
      }
    };
    navigate('/buat-surat', { state: navigationState });
  };

  const handleViewDetail = (letter) => {
    setSelectedLetterForPrint(letter);
    setShowPrintModal(true);
  };

  const handlePrintClick = (letter) => {
    setSelectedLetterForPrint(letter);
    setShowPrintModal(true);
  };

  const handleCreateNewLetter = async (template) => {
    try {
      const responseNum = await fetch(`http://localhost/siarsad/api/generate_number.php?template_id=${template.id}`);
      const resultNum = await responseNum.json();
      const nextNumber = resultNum.next_number;

      const user = JSON.parse(localStorage.getItem('sipersa_user'));
      const responseDraft = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          letter_number: nextNumber,
          status: 'Draft',
          template_id: template.id,
          id_kategori: template.id_kategori,
          sender: 'PAUD Terpadu Restu 2',
          recipient: '',
          subject: '',
          user_id: user?.id
        })
      });
      const resultDraft = await responseDraft.json();
      
      if (!resultDraft.success) {
        alert('Gagal membuat draft: ' + resultDraft.message);
        return;
      }

      const navigationState = { 
        template: template,
        outgoing_id: resultDraft.id,
        letter_number: nextNumber
      };
      navigate('/buat-surat', { state: navigationState });
    } catch (error) {
      console.error('Create letter error:', error);
      alert('Terjadi kesalahan saat membuat surat baru.');
    }
  };

  const getDraftData = (item) => {
    if (!item?.draft_data) return {};
    try {
      let parsed = typeof item.draft_data === 'string' ? JSON.parse(item.draft_data) : item.draft_data;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed || {};
    } catch { return {}; }
  };;

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Surat Keluar</h1>
          <div className="breadcrumb">
            <span>Surat</span>
            <span>/</span>
            <span className="active">Surat Keluar</span>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => {
            fetchTemplates();
            setShowTemplateModal(true);
          }}
        >
          <Plus size={18} />
          Buat Surat Baru
        </button>
      </div>

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
                <th>Alasan Penolakan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
              ) : letters.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Belum ada surat keluar.</td></tr>
              ) : (
                letters.map((item) => (
                  <tr key={item.id}>
                    <td>{item.letter_number || '(Draft)'}</td>
                    <td>{item.date_sent || '-'}</td>
                    <td>{item.recipient}</td>
                    <td>{item.subject}</td>
                    <td>
                      <span className={`badge badge-${
                        item.status === 'Draft' ? 'warning' : 
                        item.status === 'Menunggu Persetujuan' ? 'info' : 
                        item.status === 'Ditolak' ? 'danger' : 
                        'success'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === 'Ditolak' && item.rejection_reason ? (
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
                        {item.status === 'Draft' || item.status === 'Ditolak' ? (
                          <>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleEditDraft(item)}
                            >
                              <Edit size={14} /> {item.status === 'Ditolak' ? 'Revisi' : 'Edit'}
                            </button>
                            <button 
                              className="btn btn-danger" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleCancelClick(item)}
                            >
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="btn btn-outline" title="Lihat" onClick={() => handleViewDetail(item)}><Eye size={14} /></button>
                            <button className="btn btn-outline" title="Cetak" onClick={() => handlePrintClick(item)}><Printer size={14} /></button>
                          </>
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

      {/* Modal Pilih Template */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', marginBottom: 0, position: 'relative' }}>
            <div className="card-header">
              <h3 className="card-title">Pilih Template Surat Resmi</h3>
              <button className="hamburger" onClick={() => setShowTemplateModal(false)}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {templates.map(t => (
                <button 
                  key={t.id} 
                  className="btn btn-outline" 
                  style={{ justifyContent: 'flex-start', padding: '1rem', height: 'auto', textAlign: 'left' }}
                  onClick={() => handleCreateNewLetter(t)}
                >
                  <FileText size={24} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      Format: {t.number_format}
                    </div>
                    {t.nama_kategori && (
                      <div className="badge badge-info" style={{ marginTop: '0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                        <Tag size={10} />
                        {t.nama_kategori}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Batal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">Konfirmasi Pembatalan</h3>
              <button className="hamburger" onClick={() => setShowCancelModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p>Apakah Anda yakin ingin membatalkan draf surat ini?</p>
              <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowCancelModal(false)}>Tidak</button>
                <button className="btn btn-danger" onClick={handleConfirmCancel}>Ya, Batalkan</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Preview Cetak (A4 Style) */}
      {showPrintModal && selectedLetterForPrint && (() => {
        const draft = getDraftData(selectedLetterForPrint);
        const letterNum = selectedLetterForPrint.letter_number;
        const subject = draft.subject || selectedLetterForPrint.subject;
        const recipient = draft.recipient || selectedLetterForPrint.recipient;
        const content = draft.content || '';
        const tplName = selectedLetterForPrint.template_name || '';

        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', flexDirection: 'column',
            zIndex: 2000, overflow: 'hidden'
          }}>
            {/* Toolbar */}
            <div style={{
              background: 'white', padding: '1rem 2rem', display: 'flex',
              justifyContent: 'space-between', alignItems: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                  <Printer size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Detail Surat Resmi</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nomor: {letterNum}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-outline" onClick={() => setShowPrintModal(false)}>
                  <X size={18} /> Tutup
                </button>
                <button className="btn btn-primary" onClick={() => window.print()}>
                  <Printer size={18} /> Cetak Sekarang
                </button>
              </div>
            </div>

            {/* Scroll Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 2rem', backgroundColor: '#525659', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {selectedLetterForPrint.status === 'Ditolak' && selectedLetterForPrint.rejection_reason && (
                <div style={{ width: '210mm', padding: '1rem', background: '#fff5f5', borderRadius: '8px', borderLeft: '4px solid var(--danger)', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 700, display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Alasan Penolakan / Revisi:</label>
                  <p style={{ fontSize: '0.95rem', color: '#666', fontStyle: 'italic', margin: 0 }}>
                    "{selectedLetterForPrint.rejection_reason}"
                  </p>
                </div>
              )}

              {/* Paper */}
              <div id="letter-preview" className="print-container" style={{
                width: '210mm', minHeight: '297mm', backgroundColor: 'white',
                padding: '15mm 25mm', boxShadow: '0 0 20px rgba(0,0,0,0.3)',
                fontFamily: '"Times New Roman", serif', lineHeight: '1.6', color: 'black'
              }}>
                {/* Header (KOP) */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: tplName.includes('Narasumber') ? '4px double black' : '3px solid black', paddingBottom: '10px', marginBottom: '30px' }}>
                  <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '80px', marginRight: '20px' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>{draft.kopHeader1 || 'KB-BA-TPA Restu 2'}</h2>
                    {draft.kopHeader2 && <h3 style={{ margin: '5px 0', fontSize: '12pt', fontWeight: 'bold' }}>{draft.kopHeader2}</h3>}
                    <p style={{ margin: 0, fontSize: '10pt' }}>{draft.kopAddress || 'Jl. Pandeglang No.7 Malang'}</p>
                  </div>
                </div>

                {/* Content */}
                <div style={{ textAlign: 'justify', minHeight: '150mm', marginBottom: '40px' }} dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * { visibility: hidden; }
                #letter-preview, #letter-preview * { visibility: visible; }
                #letter-preview { position: absolute; left: 0; top: 0; width: 210mm; padding: 0; margin: 0; box-shadow: none; }
                @page { size: A4; margin: 0; }
              }
            `}} />
          </div>
        );
      })()}
    </div>
  );
}

export default SuratKeluar;
