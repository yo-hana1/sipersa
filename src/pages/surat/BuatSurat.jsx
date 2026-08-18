import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { Save, Send, ArrowLeft, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Editor } from '@tinymce/tinymce-react';

// Helper for contentEditable to update local state without jumpy cursor
const EditableSpan = ({ value, onChange, placeholder, style, bold, italic, underline }) => {
  return (
    <span
      contentEditable
      suppressContentEditableWarning={true}
      onBlur={(e) => onChange(e.currentTarget.textContent)}
      style={{
        borderBottom: placeholder && !value ? '1px dotted #000' : 'none',
        minWidth: placeholder ? '100px' : 'auto',
        display: 'inline-block',
        outline: 'none',
        fontWeight: bold ? 'bold' : 'normal',
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: underline ? 'underline' : 'none',
        ...style
      }}
      data-placeholder={placeholder}
    >
      {value}
    </span>
  );
};

function BuatSurat() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state; // Contains permohonan and template

  const [outgoingId, setOutgoingId] = useState(null);
  const [letterNumber, setLetterNumber] = useState('Memuat...');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [recipient, setRecipient] = useState('');
  const [kopHeader1, setKopHeader1] = useState('KB-BA-TPA Restu 2');
  const [kopHeader2, setKopHeader2] = useState('');
  const [kopAddress, setKopAddress] = useState('Jl. Pandeglang No.7, Penanggungan, Kec. Klojen, Kota Malang, Jawa Timur 65113 | Telp: (0341) 587678');
  const [signatureName, setSignatureName] = useState('Maslichah Hartatik, S.S');
  const [signatureTitle, setSignatureTitle] = useState('Kepala PAUD Terpadu Restu 2');
  const [showExitModal, setShowExitModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Refs for auto-save
  const stateRef = useRef({ content, subject, recipient, letterNumber, outgoingId, kopHeader1, kopHeader2, kopAddress, signatureName, signatureTitle });

  useEffect(() => {
    stateRef.current = { content, subject, recipient, letterNumber, outgoingId, kopHeader1, kopHeader2, kopAddress, signatureName, signatureTitle };
  }, [content, subject, recipient, letterNumber, outgoingId, kopHeader1, kopHeader2, kopAddress, signatureName, signatureTitle]);

  useEffect(() => {
    if (data?.outgoing_id) {
      setOutgoingId(data.outgoing_id);
      
      if (data.draft_data) {
        // Load existing draft
        const draft = typeof data.draft_data === 'string' ? JSON.parse(data.draft_data) : data.draft_data;
        setContent(draft.content || '');
        setSubject(draft.subject || '');
        setRecipient(draft.recipient || '');
        setLetterNumber(data.letter_number || '');
        if (draft.kopHeader1) setKopHeader1(draft.kopHeader1);
        if (draft.kopHeader2) setKopHeader2(draft.kopHeader2);
        if (draft.kopAddress) setKopAddress(draft.kopAddress);
        if (draft.signatureName) setSignatureName(draft.signatureName);
        if (draft.signatureTitle) setSignatureTitle(draft.signatureTitle);
      } else if (data.template) {
        // New draft - Autofill from permohonan
        setLetterNumber(data.letter_number || '');
        setSubject(data.permohonan?.subject || '');
        setRecipient(data.permohonan?.letter_type || '');
        
        const currentDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const lNum = data.letter_number || '...';
        const subj = data.permohonan?.subject || '...';
        const rcpt = data.permohonan?.letter_type || '...';

        // 1. Build Header Section
        let headerHtml = '';
        if (data.template.name.toLowerCase().includes('keterangan') || data.template.name.toLowerCase().includes('tugas')) {
          headerHtml = `
            <div style="text-align: center; margin-bottom: 30px;">
              <h3 style="margin: 0; font-size: 14pt; text-decoration: underline; text-transform: uppercase; font-family: 'Times New Roman', serif;">${data.template.name}</h3>
              <p style="margin: 0; font-family: 'Times New Roman', serif;">Nomor: ${lNum}</p>
            </div>
          `;
        } else {
          headerHtml = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 25px; font-family: 'Times New Roman', serif;">
              <div style="flex: 1;">
                <table style="border-collapse: collapse; border: none;">
                  <tr><td style="width: 80px; border: none;">Nomor</td><td style="border: none;">: ${lNum}</td></tr>
                  <tr><td style="border: none;">Hal</td><td style="border: none;">: <strong>${subj}</strong></td></tr>
                </table>
              </div>
              <div style="text-align: right; border: none;">
                Malang, ${currentDate}
              </div>
            </div>
            <div style="margin-bottom: 25px; font-family: 'Times New Roman', serif;">
              <p style="margin: 0;">Kepada Yth:</p>
              <p style="margin: 0;"><strong>${rcpt}</strong></p>
              <p style="margin: 0;">Di tempat</p>
            </div>
          `;
        }

        // 2. Build Greetings Section
        let greetingsHtml = '';
        if ((data.template.name.includes('Narasumber') || data.template.name.includes('Peminjaman') || data.template.name.includes('Perminjaman') || data.template.name.includes('Undangan') || data.template.name.includes('Kegiatan')) && !data.template.name.includes('Zakat') && !data.template.name.includes('ZIS')) {
          greetingsHtml = `
            <p style="text-align: center; font-style: italic; font-weight: bold; margin: 5px 0; text-decoration: underline; font-family: 'Times New Roman', serif;">Bismillahirrahmanirrahim</p>
            <p style="text-align: center; font-style: italic; font-weight: bold; margin: 5px 0; font-family: 'Times New Roman', serif;">Assalamu'alaikum Wr. Wb.</p>
            <p style="text-align: center; margin-bottom: 20px; font-family: 'Times New Roman', serif;">Semoga Allah senantiasa memberikan kesuksesan kepada kita semua amin.</p>
          `;
        } else if (!data.template.name.toLowerCase().includes('keterangan') && !data.template.name.toLowerCase().includes('tugas')) {
          greetingsHtml = `<p style="font-family: 'Times New Roman', serif;">Dengan hormat,</p>`;
        }

        // 3. Build Template Content
        let bodyHtml = data.template.content ? data.template.content.replace(/\[NOMOR\]/g, lNum) : '';
        if (data.permohonan?.content) {
          bodyHtml += `
            <p style="font-family: 'Times New Roman', serif;">Berikut adalah detail informasi yang disampaikan dalam permohonan:</p>
            <div style="margin: 15px 0; padding: 10px; border-left: 3px solid #eee; font-family: 'Times New Roman', serif;">
              ${data.permohonan.content.replace(/\n/g, '<br/>')}
            </div>
          `;
        }

        // 4. Build Closing Section
        let closingHtml = '';
        if ((data.template.name.includes('Narasumber') || data.template.name.includes('Peminjaman') || data.template.name.includes('Perminjaman') || data.template.name.includes('Undangan') || data.template.name.includes('Kegiatan')) && !data.template.name.includes('Zakat') && !data.template.name.includes('ZIS')) {
          closingHtml = `<p style="text-align: center; font-style: italic; font-weight: bold; margin-top: 30px; font-family: 'Times New Roman', serif;">Wassalamu'alaikum Wr. Wb.</p>`;
        }

        // 5. Build Signature Section
        const sigTitle = data.template.name.includes('Narasumber') || data.template.name.includes('Peminjaman') || data.template.name.includes('Perminjaman') || data.template.name.includes('Keterangan') || data.template.name.includes('Undangan') || data.template.name.includes('Kegiatan') || data.template.name.includes('Zakat') || data.template.name.includes('ZIS')
                         ? 'Kepala KB/BA" RESTU 2 "' : 'Kepala PAUD Terpadu Restu 2';
        const sigName = 'Maslichah Hartatik, S.S';
        const sigGreeting = data.template.name.includes('Narasumber') || data.template.name.includes('Peminjaman') || data.template.name.includes('Perminjaman') || data.template.name.includes('Kegiatan') ? 'Mengetahui' : (data.template.name.toLowerCase().includes('keterangan') || data.template.name.toLowerCase().includes('tugas') ? '' : 'Hormat kami,');
        
        let signatureHtml = `
          <div style="margin-top: 40px; display: flex; justify-content: flex-end; font-family: 'Times New Roman', serif;">
            <div style="text-align: center; width: 280px;">
              ${data.template.name.toLowerCase().includes('keterangan') || data.template.name.toLowerCase().includes('tugas') ? `<p style="margin: 0;">Malang, ${currentDate}</p>` : ''}
              <p style="margin: 0;">${sigGreeting}</p>
              <p style="margin: 0;">${sigTitle}</p>
              <br><br><br><br>
              <p style="margin: 0;"><strong><u>${sigName}</u></strong></p>
            </div>
          </div>
        `;

        // If it's a Zakat/ZIS template, the signature is already in the content (double signature + slip)
        if (data.template.name.includes('Zakat') || data.template.name.includes('ZIS')) {
          signatureHtml = '';
        }

        // 6. Assemble everything
        setContent(headerHtml + greetingsHtml + bodyHtml + closingHtml + signatureHtml);

        // Set default headers for Kop (will stay in parent state)
        if (data.template.name.includes('Narasumber') || data.template.name.includes('Peminjaman') || data.template.name.includes('Perminjaman') || data.template.name.includes('Undangan') || data.template.name.includes('Keterangan') || data.template.name.includes('Kegiatan') || data.template.name.includes('Zakat') || data.template.name.includes('ZIS')) {
          setKopHeader1('KB-BA-TPA "RESTU 2"');
          setKopHeader2('DHARMA WANITA PERSATUAN MAN 2 MALANG');
          setKopAddress('Jl. Pandeglang No.7 Malang telp. (0341) 587678');
          setSignatureTitle(sigTitle);
        }
      }
    }
  }, [data]);

  const saveDraft = async () => {
    const s = stateRef.current;
    if (!s.outgoingId) return;

    try {
      await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: s.outgoingId,
          draft_data: JSON.stringify({ 
            content: s.content, 
            subject: s.subject, 
            recipient: s.recipient,
            kopHeader1: s.kopHeader1,
            kopHeader2: s.kopHeader2,
            kopAddress: s.kopAddress,
            signatureName: s.signatureName,
            signatureTitle: s.signatureTitle
          }),
          letter_number: s.letterNumber,
          recipient: s.recipient,
          subject: s.subject
        })
      });
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  // Debounced Auto-save
  useEffect(() => {
    if (!outgoingId) return;
    
    const timer = setTimeout(() => {
      saveDraft();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [content, subject, recipient, kopHeader1, kopHeader2, kopAddress, signatureName, signatureTitle]);

  const handleSubmitForApproval = async () => {
    setIsSaved(true);
    try {
      // 1. First ensure we have the absolute latest data from state
      const currentDraftData = { 
        content: content, 
        subject: subject, 
        recipient: recipient,
        kopHeader1: kopHeader1,
        kopHeader2: kopHeader2,
        kopAddress: kopAddress,
        signatureName: signatureName,
        signatureTitle: signatureTitle
      };

      // 2. Send status update AND all data in ONE call to be 100% sure nothing is lost
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outgoingId,
          status: 'Menunggu Persetujuan',
          draft_data: JSON.stringify(currentDraftData),
          recipient: recipient,
          subject: subject,
          letter_number: letterNumber
        })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Surat telah diajukan untuk approval ke Kepala Sekolah.');
        navigate('/surat-keluar');
      } else {
        alert('Gagal mengirim approval: ' + result.message);
      }
    } catch (error) {
      console.error('Submit for approval error:', error);
      alert('Terjadi kesalahan saat mengirim approval.');
    }
  };

  useEffect(() => {
    // Auto-save disabled as per user request to ensure consistency on 'Kembali'
    // return () => saveDraft();
  }, []);

  const handleDownloadPDF = () => {
    const input = document.getElementById('letter-preview');
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Surat_Resmi_${letterNumber.replace(/\//g, '_')}.pdf`);
    });
  };

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h3>Data surat tidak ditemukan</h3>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/surat-keluar')}>
          Ke Halaman Surat Keluar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Proses Surat Resmi</h1>
          <div className="breadcrumb">
            <span>Surat</span>
            <span>/</span>
            <span>Surat Keluar</span>
            <span>/</span>
            <span className="active">Proses Resmi</span>
          </div>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={async () => {
            await saveDraft();
            navigate(-1);
          }}
        >
          <ArrowLeft size={18} /> Kembali
        </button>
      </div>


      <div className="grid grid-cols-3">
        {/* Left Side: Detail Permohonan & Settings */}
        <div style={{ gridColumn: 'span 1' }}>
          <Card title="Detail Permohonan - Referensi">
            <div className="form-group">
              <label className="form-label">Nomor Surat (Auto)</label>
              <input
                type="text"
                className="form-control"
                value={letterNumber}
                readOnly
                style={{ backgroundColor: 'var(--bg-light)', fontWeight: 'bold', color: 'var(--primary-color)' }}
              />
              <small className="text-secondary">Format: {data.template?.number_format || '-'}</small>
            </div>

            <div className="form-group">
              <label className="form-label">Perihal Resmi</label>
              <input
                type="text"
                className="form-control"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Masukkan perihal resmi..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kepada (Yth.)</label>
              <input
                type="text"
                className="form-control"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Masukkan penerima resmi..."
              />
            </div>

            <div className="border-t my-4"></div>

            <div className="mb-4">
              <label className="text-xs font-bold text-secondary uppercase">Pemohon</label>
              <div className="p-2 bg-light rounded mt-1" style={{ fontSize: '0.85rem' }}>
                {data.permohonan?.pemohon || 'Staff TU'}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-bold text-secondary uppercase">Isi Permohonan Guru</label>
              <div 
                className="p-2 bg-light rounded mt-1 overflow-auto" 
                style={{ fontSize: '0.85rem', minHeight: '80px' }}
                dangerouslySetInnerHTML={{ __html: data.permohonan?.content || '-' }}
              />
            </div>

            <div className="border-t mt-6 pt-4">
              <div className="flex flex-col gap-2">
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%' }} 
                  onClick={async () => {
                    await saveDraft();
                    setIsSaved(true);
                    alert('Draft berhasil disimpan!');
                    navigate(-1);
                  }}
                >
                  <Save size={18} /> Simpan Draft
                </button>
                <button 
                  className="btn btn-success" 
                  style={{ width: '100%' }} 
                  onClick={handleSubmitForApproval}
                >
                  <Send size={18} /> Ajukan Approval
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Live Preview Side (A4 Style) with Sticky Toolbar */}
        <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
          {/* Sticky Toolbar Container */}
          <div style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 100, 
            backgroundColor: 'white', 
            padding: '10px 1.5rem', 
            borderBottom: '1px solid var(--border-color)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
          }}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-4">
                 <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tampilan Surat Resmi</h3>
                 <div className="flex gap-2 bg-light px-3 py-1 rounded-full border">
                    <span className="text-xs font-bold text-info uppercase">Template: {data.template?.name || '-'}</span>
                 </div>
              </div>
              <button className="btn btn-success" onClick={handleDownloadPDF}>
                <Download size={18} /> Download PDF
              </button>
            </div>
            {/* The actual TinyMCE toolbar will be rendered here */}
            <div id="editor-toolbar" style={{ minHeight: '40px', border: '1px solid #eee', borderRadius: '4px', background: '#fdfdfd' }}></div>
          </div>

          <div style={{ 
            backgroundColor: '#525659', 
            padding: '3rem 2rem', 
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
          }}>
            {/* The Paper */}
            <div id="letter-preview" className="print-container" style={{
              width: '210mm',
              minHeight: '297mm',
              backgroundColor: 'white',
              padding: '20mm 25mm 30mm 25mm',
              boxShadow: '0 0 20px rgba(0,0,0,0.3)',
              fontFamily: '"Times New Roman", serif',
              lineHeight: '1.5',
              color: 'black',
              position: 'relative'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                {/* Persistent Header on Every Page */}
                <thead>
                  <tr>
                    <td>
                      <div className="page-header-space" style={{ height: 'auto', marginBottom: '20px' }}>
                        {data.template?.name?.includes('Narasumber') || data.template?.name?.includes('Peminjaman') ? (
                          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '4px double black', paddingBottom: '10px' }}>
                            <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', height: '85px', marginRight: '20px' }} />
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <h2 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>
                                <EditableSpan value={kopHeader1} onChange={setKopHeader1} />
                              </h2>
                              <h3 style={{ margin: '5px 0', fontSize: '12pt', fontWeight: 'bold' }}>
                                <EditableSpan value={kopHeader2} onChange={setKopHeader2} />
                              </h3>
                              <p style={{ margin: 0, fontSize: '10pt' }}>
                                <EditableSpan value={kopAddress} onChange={setKopAddress} />
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px' }}>
                            <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '80px', marginRight: '20px' }} />
                            <div style={{ textAlign: 'center', flex: 1 }}>
                              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                                <EditableSpan value={kopHeader1} onChange={setKopHeader1} />
                              </h2>
                              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                <EditableSpan value={kopAddress} onChange={setKopAddress} />
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </thead>

                {/* Main Content */}
                <tbody>
                  <tr>
                    <td>
                      <div className="page-content" style={{ minHeight: '180mm', textAlign: 'justify' }}>
                        <Editor
                          apiKey="nh44to6bwzt0o2tfojx566lbso5zaa43c817zljd7up7rzur"
                          value={content}
                          init={{
                            height: 800,
                            menubar: true,
                            inline: true,
                            fixed_toolbar_container: '#editor-toolbar',
                            plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
                            toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image table | removeformat | help',
                            content_style: 'body { font-family:"Times New Roman",serif; font-size:12pt; line-height: 1.5; padding: 0; margin: 0; }'
                          }}
                          onEditorChange={(newContent) => setContent(newContent)}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>

                {/* Optional Footer Space to ensure bottom margin */}
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
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #letter-preview, #letter-preview * {
            visibility: visible;
          }
          #letter-preview {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 0;
            margin: 0;
            box-shadow: none;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
          }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          .signature-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
        
        .bg-light table {
          border-collapse: collapse;
          width: 100%;
          margin: 5px 0;
        }
        .bg-light table td, .bg-light table th {
          border: 1px solid #ddd;
          padding: 4px 8px;
        }
        .bg-light ul, .bg-light ol {
          padding-left: 20px;
          margin: 5px 0;
        }
        .bg-light img {
          max-width: 100%;
          height: auto;
        }
      `}} />
    </div>
  );
}

export default BuatSurat;
