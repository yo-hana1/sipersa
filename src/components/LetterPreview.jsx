import { Printer, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const LetterPreview = ({ letter, onClose, showActions = true, onFinish = null }) => {
  if (!letter) return null;

  const getDraftData = (item) => {
    if (!item?.draft_data) return {};
    try {
      let parsed = typeof item.draft_data === 'string' ? JSON.parse(item.draft_data) : item.draft_data;
      if (typeof parsed === 'string') parsed = JSON.parse(parsed);
      return parsed || {};
    } catch { return {}; }
  };

  const draft = getDraftData(letter);
  const letterNum = letter.letter_number || letter.final_number;
  const subject = draft.subject || letter.subject || letter.permohonan_subject;
  const recipient = draft.recipient || letter.recipient || letter.letter_type;
  
  // Robust content extraction
  let finalContent = draft.content || draft.draft_content || draft.body;
  
  // Fallback to permohonan content ONLY if it's not a finalized letter
  if (!finalContent && !['Disetujui', 'Selesai'].includes(letter.status)) {
    finalContent = letter.content || letter.permohonan_content;
  }

  const content = finalContent || (['Disetujui', 'Selesai'].includes(letter.status) 
    ? '<div style="color:red; text-align:center; padding: 2rem; border: 1px dashed red;">[Error: Data isi surat resmi tidak ditemukan di database. Pastikan data tersimpan dengan benar.]</div>' 
    : '');
  const tplName = letter.template_name || draft.template_name || '';

  const handleDownloadPDF = () => {
    const input = document.getElementById('letter-print-area');
    if (!input) return;
    
    html2canvas(input, { scale: 3, useCORS: true, logging: false }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Surat_Resmi_${letterNum?.replace(/\//g, '_') || 'Final'}.pdf`);
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
      zIndex: 9999, overflow: 'hidden'
    }}>
      {/* Toolbar */}
      <div style={{
        background: 'white', padding: '1rem 2rem', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary-color)', color: 'white', padding: '0.6rem', borderRadius: '10px' }}>
            <Printer size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Pratinjau Surat Resmi</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: <span style={{ fontWeight: 600, color: 'var(--success)' }}>{letter.status}</span></p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {showActions && letter.status === 'Disetujui' && onFinish && (
            <button className="btn btn-success" onClick={() => onFinish(letter.id)}>
              Tandai Sebagai Selesai
            </button>
          )}
          <button className="btn btn-outline" onClick={handleDownloadPDF}>
            <Download size={18} /> Download PDF
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={18} /> Cetak
          </button>
          <button className="btn btn-outline" style={{ minWidth: 'auto', padding: '0.5rem' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '3rem 1rem', backgroundColor: '#525659', display: 'flex', justifyContent: 'center' }}>
        {/* Paper Container - A4 Standard */}
        <div id="letter-print-area" className="print-container" style={{
          width: '210mm', 
          minHeight: '297mm', 
          backgroundColor: 'white',
          padding: '20mm 25mm 30mm 25mm', 
          boxShadow: '0 0 40px rgba(0,0,0,0.6)',
          fontFamily: '"Times New Roman", Times, serif', 
          lineHeight: '1.6', 
          color: 'black',
          position: 'relative', 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header (KOP) */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: (tplName.includes('Narasumber') || tplName.includes('Peminjaman')) ? '4px double black' : '3px solid black', paddingBottom: '12px', marginBottom: '30px' }}>
            <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', height: '85px', marginRight: '20px' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{draft.kopHeader1 || 'KB-BA-TPA "RESTU 2"'}</h2>
              {draft.kopHeader2 && <h3 style={{ margin: '5px 0', fontSize: '13pt', fontWeight: 'bold' }}>{draft.kopHeader2}</h3>}
              <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic' }}>{draft.kopAddress || 'Jl. Pandeglang No.7 Malang telp. (0341) 587678'}</p>
            </div>
          </div>

          {/* Body Content */}
          <div 
            style={{ 
              textAlign: 'justify', 
              fontSize: '12pt', 
              flex: 1,
              marginBottom: '20px',
              wordWrap: 'break-word',
              lineHeight: '1.6'
            }} 
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </div>
      </div>
      
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything first visually but keep DOM for parent visibility */
          body { 
            visibility: hidden; 
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Show ONLY the letter area container and its children */
          #letter-print-area { 
            visibility: visible !important;
            display: block !important;
            position: fixed !important; 
            left: 0 !important; 
            top: 0 !important; 
            width: 210mm !important; 
            height: 297mm !important;
            padding: 20mm 25mm 30mm 25mm !important; 
            margin: 0 !important; 
            box-shadow: none !important;
            background: white !important;
            border: none !important;
            z-index: 10000000 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }

          #letter-print-area * {
            visibility: visible !important;
          }

          /* Ensure Kop and Content are visible and styled correctly */
          #letter-print-area div[style*="display: flex"] {
            display: flex !important;
          }

          /* Force A4 Size and remove browser-added headers/footers */
          @page { 
            size: A4; 
            margin: 0; 
          }
          
          html, body {
            height: 297mm !important;
            width: 210mm !important;
            overflow: hidden !important;
          }
        }
      `}} />
    </div>
  );
};

export default LetterPreview;
