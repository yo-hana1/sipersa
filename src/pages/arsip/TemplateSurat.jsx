import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../components/Card';
import { FileText, Plus, Edit, Trash2, ArrowLeft, Save, Printer, Download, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
      className={!value ? 'editable-placeholder' : ''}
    >
      {value}
    </span>
  );
};

function TemplateSurat({ role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditingUndangan, setIsEditingUndangan] = useState(false);
  const [isEditingNarasumber, setIsEditingNarasumber] = useState(false);
  const [isEditingPeminjaman, setIsEditingPeminjaman] = useState(false);
  const [letterNumber, setLetterNumber] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [lineHeight, setLineHeight] = useState(1.2);
  const [outgoingId, setOutgoingId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isEditingTemplateSource, setIsEditingTemplateSource] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedHtml, setProcessedHtml] = useState('');
  const [currentTemplateType, setCurrentTemplateType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const getIndonesianDate = () => {
    const now = new Date();
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'umum',
    id_kategori: '',
    content: `<p style="text-align: right;">Malang, ${getIndonesianDate()}</p><p>&nbsp;</p><p>Tulis isi surat di sini...</p>`,
    number_format: '[SEQ]/PAUD-R2/[MONTH]/[YEAR]',
    description: ''
  });
  const printRef = useRef(null);

  // Use refs to keep track of current state for auto-save
  const formDataRef = useRef(null);
  const formDataNarasumberRef = useRef(null);
  const formDataPeminjamanRef = useRef(null);
  const currentViewRef = useRef(null);
  const letterNumberRef = useRef('');
  const outgoingIdRef = useRef(null);

  // Form State - Now includes almost everything as editable
  const [formData, setFormData] = useState({
    header1: 'KB/BA/TPA "RESTU 2"',
    header2: 'Dharma Wanita Persatuan MAN3',
    address: 'Jl. Pandeglang No 7. Fax/Tlp (0341) 587678. Malang',
    perihal: '',
    tujuan: '',
    isiSehubungan: '',
    hariTanggal: '',
    pukul: '',
    tempat: '',
    acara: '',
    mohonKesediaan: '',
    kepalaNama: 'Maslichah Hartatik, S.S',
  });

  const [formDataNarasumber, setFormDataNarasumber] = useState({
    header1: 'KB-BA-TPA "RESTU 2"',
    header2: 'DHARMA WANITA PERSATUAN MAN 2 MALANG',
    address: 'Jl. Pandeglang No.7 Malang telp. (0341) 587678',
    perihal: '',
    kepada: '',
    di: '',
    rangka: '',
    kesediaan: '',
    hari: '',
    tanggal: '',
    waktu: '',
    tempat: '',
    kepalaNama: 'Maslichah Hartatik, S.S',
  });

  const [formDataPeminjaman, setFormDataPeminjaman] = useState({
    header1: 'KB/BA/TPA "RESTU 2"',
    header2: 'Dharma Wanita Persatuan MAN 2 Kota Malang',
    address: 'Jl. Pandeglang No. 7 Malang Fax/Telp. (0341) 587678',
    perihal: 'Peminjaman Fasilitas',
    kepada: '',
    di: '',
    rangka: '',
    meminjam: '',
    hari: '',
    tanggal: '',
    kegiatan: '',
    pukul: '',
    kepalaNama: 'Maslichah Hartatik, S.S',
  });

  const generateLetterNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    const lastUpdate = localStorage.getItem('last_undangan_update'); // YYYY-MM
    let sequence = parseInt(localStorage.getItem('undangan_sequence') || '1000');
    
    const currentKey = `${year}-${month}`;
    
    if (lastUpdate !== currentKey) {
      sequence = 1001;
    } else {
      sequence += 1;
    }
    
    return `UND/RESTU 2/${year}/${month}/${sequence}`;
  };

  const generateNarasumberNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const lastUpdate = localStorage.getItem('last_pmn_update'); // YYYY-MM
    let sequence = parseInt(localStorage.getItem('pmn_sequence') || '1000');
    
    const currentKey = `${year}-${month}`;
    
    if (lastUpdate !== currentKey) {
      sequence = 1001;
    } else {
      sequence += 1;
    }
    
    return `PMN/Restu 2/${year}/${month}/${sequence}`;
  };

  const generatePeminjamanNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const lastUpdate = localStorage.getItem('last_pnj_update'); // YYYY-MM
    let sequence = parseInt(localStorage.getItem('pnj_sequence') || '1000');
    
    const currentKey = `${year}-${month}`;
    
    if (lastUpdate !== currentKey) {
      sequence = 1001;
    } else {
      sequence += 1;
    }
    
    return `PNJ/RESTU 2/${year}/${month}/${sequence}`;
  };

  useEffect(() => {
    // Check if coming from PermohonanSurat or Edit Draft
    if (location.state?.outgoing_id) {
      const { outgoing_id, permohonan, template, draft_data, letter_number } = location.state;
      setOutgoingId(outgoing_id);
      outgoingIdRef.current = outgoing_id;

      if (letter_number) {
        setLetterNumber(letter_number);
        letterNumberRef.current = letter_number;
      }

      const initProcessing = (type, html) => {
        setCurrentTemplateType(type);
        setProcessedHtml(html);
        setIsProcessing(true);
        // Hide previous rigid editors
        setIsEditingUndangan(false);
        setIsEditingNarasumber(false);
        setIsEditingPeminjaman(false);
      };

      if (draft_data) {
        const data = typeof draft_data === 'string' ? JSON.parse(draft_data) : draft_data;
        if (data.html) {
          initProcessing(data.type, data.html);
        } else {
          // Legacy format conversion
          const legacyHtml = generateLegacyHtml(data.type, data.values, letter_number || letterNumber);
          initProcessing(data.type, legacyHtml);
        }
      } else if (permohonan && template) {
        const initialHtml = generateInitialProcessingHtml(template, permohonan, letter_number || letterNumber);
        initProcessing(template.type, initialHtml);
      }
    }
  }, [location]);

  const generateLegacyHtml = (type, values, lNum) => {
    // Basic conversion logic for legacy drafts
    const date = getIndonesianDate();
    let content = "";
    if (type === 'undangan') {
      content = `
        <div class="print-area" style="padding: 25mm 20mm; font-family: 'Times New Roman', serif; line-height: 1.5; font-size: 12pt;">
          <div style="display: flex; align-items: center; border-bottom: 4px double #000; padding-bottom: 0.5rem; marginBottom: 1.5rem">
            <img src="/img/logo-dwp.png" style="width: 90px; height: 90px; margin-right: 1rem" />
            <div style="text-align: center; flex: 1">
              <h1 style="font-size: 18pt; font-weight: bold; margin: 0; text-transform: uppercase">${values.header1 || 'KB/BA/TPA "RESTU 2"'}</h1>
              <h2 style="font-size: 16pt; font-weight: bold; margin: 0.1rem 0">${values.header2 || 'Dharma Wanita Persatuan MAN3'}</h2>
              <p style="font-size: 11pt; margin: 0">${values.address || 'Jl. Pandeglang No 7. Fax/Tlp (0341) 587678. Malang'}</p>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem">
            <div>No: ${lNum}<br>Hal: Undangan ${values.perihal || '...'}</div>
            <div style="text-align: right">Malang, ${date}</div>
          </div>
          <div style="margin-top: 1.5rem"><strong>Kepada Yth:</strong><br>${values.tujuan || '...'}<br><strong>Di Tempat</strong></div>
          <div style="text-align: center; margin-top: 1.5rem">
            <p style="font-style: italic; font-weight: bold; text-decoration: underline">Bismillahirrahrahmanirrahim</p>
            <p style="font-style: italic; font-weight: bold">Assalamu'alaikum Wr. Wb</p>
          </div>
          <div style="margin-top: 1.5rem">
            <p>Dengan Hormat,</p>
            <p style="text-indent: 2rem">Semoga Allah senantiasa memberikan kesuksesan kepada kita semua. Aamiin. Sehubungan dengan akan diadakannya ${values.isiSehubungan || '...'} yang Insyaallah akan diadakan besok pada:</p>
            <div style="margin-left: 2rem; margin-top: 1rem">
              Hari/Tanggal: ${values.hariTanggal || '...'}<br>
              Pukul: ${values.pukul || '...'}<br>
              Tempat: ${values.tempat || '...'}<br>
              Acara: ${values.acara || '...'}
            </div>
            <p style="margin-top: 1.5rem">Sehubungan dengan kegiatan diatas maka kami mohon kesediaan ${values.mohonKesediaan || '...'} untuk hadir pada acara tersebut.</p>
            <p style="text-indent: 2rem">Demikian undangan kami, terima kasih atas perhatian dan kerjasamanya.</p>
          </div>
          <div style="text-align: center; margin-top: 1.5rem">
            <p style="font-style: italic; font-weight: bold">Jazakumullahu khoiron katsiroo</p>
            <p style="font-style: italic; font-weight: bold">Wassalamu'alaikum Wr. Wb</p>
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 2rem">
            <div style="text-align: center; min-width: 250px">
              Mengetahui<br>Kepala KB/BA "RESTU 2"<br><br><br><br><strong><u>${values.kepalaNama || 'Maslichah Hartatik, S.S'}</u></strong>
            </div>
          </div>
        </div>
      `;
    } else {
      // Generic fallback
      content = `<div class="print-area" style="padding: 25mm 20mm;"><h1>Draft Surat</h1><p>${JSON.stringify(values)}</p></div>`;
    }
    return content;
  };

  const generateInitialProcessingHtml = (template, permohonan, lNum) => {
    const date = getIndonesianDate();
    // Start with a clean A4 sheet structure
    return `
      <div class="print-area" style="padding: 25mm 20mm; font-family: 'Times New Roman', serif; line-height: 1.5; font-size: 12pt;">
        <div style="display: flex; align-items: center; border-bottom: 4px double #000; padding-bottom: 0.5rem; margin-bottom: 1.5rem">
          <img src="/img/logo-dwp.png" style="width: 90px; height: 90px; margin-right: 1rem" />
          <div style="text-align: center; flex: 1">
            <h1 style="font-size: 18pt; font-weight: bold; margin: 0; text-transform: uppercase">KB/BA/TPA "RESTU 2"</h1>
            <h2 style="font-size: 16pt; font-weight: bold; margin: 0.1rem 0">Dharma Wanita Persatuan MAN 2 Malang</h2>
            <p style="font-size: 11pt; margin: 0">Jl. Pandeglang No 7. Fax/Tlp (0341) 587678. Malang</p>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem">
          <div>No: ${lNum}<br>Hal: ${permohonan?.subject || '...'}</div>
          <div style="text-align: right">Malang, ${date}</div>
        </div>
        <div style="margin-bottom: 1.5rem">
          <strong>Kepada Yth:</strong><br>
          ${permohonan?.letter_type || '...'}<br>
          <strong>Di Tempat</strong>
        </div>
        <div style="text-align: center; margin-bottom: 1.5rem">
          <p style="font-style: italic; font-weight: bold; text-decoration: underline">Bismillahirrahrahmanirrahim</p>
          <p style="font-style: italic; font-weight: bold">Assalamu'alaikum Wr. Wb</p>
        </div>
        <div class="letter-body">
          ${template.content || '<p>Tulis isi surat di sini...</p>'}
        </div>
        <div style="text-align: center; margin-top: 1.5rem">
          <p style="font-style: italic; font-weight: bold">Wassalamu'alaikum Wr. Wb</p>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 2.5rem">
          <div style="text-align: center; min-width: 280px">
            Mengetahui<br>Kepala KB/BA "RESTU 2"<br><br><br><br><strong><u>Maslichah Hartatik, S.S</u></strong>
          </div>
        </div>
      </div>
    `;
  };

  // Update refs whenever state changes
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { formDataNarasumberRef.current = formDataNarasumber; }, [formDataNarasumber]);
  useEffect(() => { formDataPeminjamanRef.current = formDataPeminjaman; }, [formDataPeminjaman]);
  useEffect(() => { 
    if (isEditingUndangan) currentViewRef.current = 'undangan';
    else if (isEditingNarasumber) currentViewRef.current = 'narasumber';
    else if (isEditingPeminjaman) currentViewRef.current = 'peminjaman';
    else currentViewRef.current = null;
  }, [isEditingUndangan, isEditingNarasumber, isEditingPeminjaman]);
  useEffect(() => { letterNumberRef.current = letterNumber; }, [letterNumber]);
  
  // Update processedHtml when rigid forms change
  useEffect(() => {
    if (isEditingUndangan) {
      setProcessedHtml(generateLegacyHtml('undangan', formData, letterNumber));
    }
  }, [formData, letterNumber, isEditingUndangan]);

  useEffect(() => {
    if (isEditingNarasumber) {
      setProcessedHtml(generateLegacyHtml('narasumber', formDataNarasumber, letterNumber));
    }
  }, [formDataNarasumber, letterNumber, isEditingNarasumber]);

  useEffect(() => {
    if (isEditingPeminjaman) {
      setProcessedHtml(generateLegacyHtml('peminjaman', formDataPeminjaman, letterNumber));
    }
  }, [formDataPeminjaman, letterNumber, isEditingPeminjaman]);

  // Auto-save function
  const saveDraft = async () => {
    if (!outgoingIdRef.current || !currentViewRef.current) return;

    let activeData = null;
    if (currentViewRef.current === 'undangan') activeData = formDataRef.current;
    else if (currentViewRef.current === 'narasumber') activeData = formDataNarasumberRef.current;
    else if (currentViewRef.current === 'peminjaman') activeData = formDataPeminjamanRef.current;

    const draftData = {
      type: currentTemplateType,
      html: processedHtml
    };

    try {
      await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outgoingIdRef.current,
          draft_data: JSON.stringify(draftData),
          letter_number: letterNumberRef.current,
          recipient: activeData.kepada || activeData.tujuan || '',
          subject: activeData.perihal || activeData.rangka || ''
        })
      });
      console.log('Draft auto-saved');
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  // Trigger auto-save on unmount
  useEffect(() => {
    return () => {
      saveDraft();
    };
  }, []);

  // Also auto-save on visibility change (optional but good for logout/tab close)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveDraft();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isEditingUndangan && !letterNumber) {
      setLetterNumber(generateLetterNumber());
      const now = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      setCurrentDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    }
    if (isEditingNarasumber && !letterNumber) {
      setLetterNumber(generateNarasumberNumber());
      const now = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      setCurrentDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    }
    if (isEditingPeminjaman && !letterNumber) {
      setLetterNumber(generatePeminjamanNumber());
      const now = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      setCurrentDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
    }
  }, [isEditingUndangan, isEditingNarasumber, isEditingPeminjaman, letterNumber]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/templates.php');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Fetch templates error:', error);
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
    fetchTemplates();
    fetchCategories();
  }, []);

  const handleSaveNewTemplate = async () => {
    if (!newTemplate.name || !newTemplate.id_kategori || !newTemplate.number_format) {
      alert('Gagal menyimpan: Mohon lengkapi semua data yang wajib diisi (Nama, Kategori, dan Format Penomoran)');
      return;
    }

    try {
      const url = 'http://localhost/siarsad/api/templates.php';
      const method = isEditingTemplateSource ? 'PUT' : 'POST';
      const body = isEditingTemplateSource ? { ...newTemplate, id: editingTemplateId } : newTemplate;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await response.json();
      if (result.success) {
        alert(isEditingTemplateSource ? 'Template berhasil diperbarui' : 'Template berhasil ditambahkan');
        setIsAddingTemplate(false);
        setIsEditingTemplateSource(false);
        setEditingTemplateId(null);
        setNewTemplate({
          name: '',
          type: 'umum',
          id_kategori: '',
          content: `<p style="text-align: right;">Malang, ${getIndonesianDate()}</p><p>&nbsp;</p><p>Tulis isi surat di sini...</p>`,
          number_format: '[SEQ]/PAUD-R2/[MONTH]/[YEAR]',
          description: ''
        });
        fetchTemplates();
      } else {
        alert('Gagal menyimpan template: ' + result.message);
      }
    } catch (error) {
      console.error('Save template error:', error);
      alert('Terjadi kesalahan saat menyimpan template');
    }
  };

  const handleEditTemplateSource = (template) => {
    setEditingTemplateId(template.id);
    setNewTemplate({
      name: template.name,
      type: template.type,
      id_kategori: template.id_kategori || '',
      content: template.content,
      number_format: template.number_format,
      description: template.description || ''
    });
    setIsEditingTemplateSource(true);
    setIsAddingTemplate(true); // Reuse the same form view
  };

  const handleGenerateAI = async () => {
    if (!newTemplate.name || !newTemplate.id_kategori) {
      alert('Nama Template dan Kategori wajib diisi untuk generate AI');
      return;
    }

    setIsGenerating(true);
    try {
      const selectedCategory = categories.find(c => c.id_kategori === newTemplate.id_kategori)?.nama_kategori || 'Umum';
      const response = await fetch('http://localhost/siarsad/api/generate_letter_template.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTemplate.name,
          category: selectedCategory,
          description: newTemplate.description
        })
      });
      const result = await response.json();
      if (result.success) {
        setNewTemplate({ ...newTemplate, content: result.content });
      } else {
        alert('Gagal men-generate template: ' + result.message);
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Terjadi kesalahan koneksi ke layanan AI');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Yakin ingin menghapus template ini?')) return;

    try {
      const response = await fetch(`http://localhost/siarsad/api/templates.php?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('Template berhasil dihapus');
        fetchTemplates();
      } else {
        alert('Gagal menghapus template: ' + result.message);
      }
    } catch (error) {
      console.error('Delete template error:', error);
      alert('Terjadi kesalahan saat menghapus template');
    }
  };

  const handleEditUndangan = () => {
    setLetterNumber('');
    setIsEditingUndangan(true);
    setIsEditingNarasumber(false);
    setIsEditingPeminjaman(false);
  };

  const handleEditNarasumber = () => {
    setLetterNumber('');
    setIsEditingNarasumber(true);
    setIsEditingUndangan(false);
    setIsEditingPeminjaman(false);
  };

  const handleEditPeminjaman = () => {
    setLetterNumber('');
    setIsEditingPeminjaman(true);
    setIsEditingUndangan(false);
    setIsEditingNarasumber(false);
  };

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Check if we have multiple pages (children with .print-area)
    const pages = element.querySelectorAll('.print-area');
    
    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const ratio = pdfWidth / imgProps.width;
        const imgHeight = imgProps.height * ratio;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      }
    } else {
      // Fallback for single page elements
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = pdfWidth / imgProps.width;
      const imgHeight = imgProps.height * ratio;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    }
    
    pdf.save(`Surat_${newTemplate.name || letterNumber || 'Template'}.pdf`);
  };

  const handleSaveAndDownload = async () => {
    await handleDownloadPDF();
    
    // Update status ke 'Selesai' di database
    try {
      await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outgoingId,
          status: 'Selesai',
          date_sent: new Date().toISOString().split('T')[0]
        })
      });
    } catch (error) {
      console.error('Finalize error:', error);
    }

    alert('Surat berhasil disimpan (nomor urut diperbarui) dan PDF telah diunduh.');
    setIsEditingUndangan(false);
    setIsEditingNarasumber(false);
  };

  const handleSaveAndDownloadNarasumber = async () => {
    await handleDownloadPDF();
    
    // Update status ke 'Selesai' di database
    try {
      await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outgoingId,
          status: 'Selesai',
          date_sent: new Date().toISOString().split('T')[0]
        })
      });
    } catch (error) {
      console.error('Finalize error:', error);
    }

    alert('Surat Permohonan Narasumber berhasil disimpan dan PDF telah diunduh.');
    setIsEditingNarasumber(false);
  };

  const handleSubmitForApproval = async () => {
    await saveDraft();
    try {
      const response = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outgoingId,
          status: 'Menunggu Persetujuan'
        })
      });
      const result = await response.json();
      if (result.success) {
        alert('Surat telah diajukan untuk approval ke Kepala Sekolah.');
        setIsEditingUndangan(false);
        setIsEditingNarasumber(false);
        setIsEditingPeminjaman(false);
        navigate('/surat-keluar');
      } else {
        alert('Gagal mengajukan approval: ' + result.message);
      }
    } catch (error) {
      console.error('Submit for approval error:', error);
      alert('Terjadi kesalahan saat mengajukan approval.');
    }
  };

  const handleSaveAndDownloadPeminjaman = async () => {
    await handleDownloadPDF();
    
    // Update status ke 'Selesai' di database
    try {
      await fetch('http://localhost/siarsad/api/surat_keluar.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: outgoingId,
          status: 'Selesai',
          date_sent: new Date().toISOString().split('T')[0]
        })
      });
    } catch (error) {
      console.error('Finalize error:', error);
    }

    alert('Surat Peminjaman Fasilitas berhasil disimpan dan PDF telah diunduh.');
    setIsEditingPeminjaman(false);
  };


  if (isEditingUndangan) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="btn btn-outline" onClick={() => setIsEditingUndangan(false)}>
              <ArrowLeft size={18} />
              Kembali
            </button>
            <h1 className="page-title">Edit Surat Undangan</h1>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-outline" onClick={handleDownloadPDF}>
              <Printer size={18} />
              Preview PDF
            </button>
            <button className="btn btn-primary" onClick={handleSubmitForApproval}>
              <Send size={18} />
              Ajukan Approval
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="card-title mb-6">Data Undangan</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Nomor Surat</label>
                  <input type="text" className="form-control" value={letterNumber} onChange={(e) => setLetterNumber(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Surat</label>
                  <input type="text" className="form-control" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Perihal</label>
                <input type="text" className="form-control" value={formData.perihal} onChange={(e) => setFormData({...formData, perihal: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Kepada Yth.</label>
                <input type="text" className="form-control" value={formData.tujuan} onChange={(e) => setFormData({...formData, tujuan: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Sehubungan Dengan</label>
                <textarea className="form-control" rows="2" value={formData.isiSehubungan} onChange={(e) => setFormData({...formData, isiSehubungan: e.target.value})}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Hari/Tanggal Acara</label>
                  <input type="text" className="form-control" value={formData.hariTanggal} onChange={(e) => setFormData({...formData, hariTanggal: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pukul</label>
                  <input type="text" className="form-control" value={formData.pukul} onChange={(e) => setFormData({...formData, pukul: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tempat</label>
                <input type="text" className="form-control" value={formData.tempat} onChange={(e) => setFormData({...formData, tempat: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Acara</label>
                <input type="text" className="form-control" value={formData.acara} onChange={(e) => setFormData({...formData, acara: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Mohon Kesediaan</label>
                <input type="text" className="form-control" value={formData.mohonKesediaan} onChange={(e) => setFormData({...formData, mohonKesediaan: e.target.value})} />
              </div>
            </div>
          </Card>

          <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
            <div ref={printRef} className="print-area shadow-lg" style={{ 
              width: '210mm', minHeight: '297mm', padding: '25mm 20mm', backgroundColor: '#fff',
              fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: 1.5, color: '#000'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', marginRight: '20px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>KB-BA-TPA "RESTU 2"</h2>
                  <h3 style={{ margin: '4px 0', fontSize: '13pt', fontWeight: 'bold' }}>DHARMA WANITA PERSATUAN MAN 2 MALANG</h3>
                  <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic' }}>Jl. Pandeglang No.7 Malang telp. (0341) 587678</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifycontent: 'space-between', marginTop: '1.5rem' }}>
                <div>No: {letterNumber}<br />Hal: Undangan {formData.perihal}</div>
                <div style={{ textAlign: 'right' }}>Malang, {currentDate}</div>
              </div>
              <div style={{ marginTop: '1.5rem' }}><strong>Kepada Yth:</strong><br />{formData.tujuan}<br /><strong>Di Tempat</strong></div>
              <div style={{ textalign: 'center', marginTop: '1.5rem' }}>
                <p style={{ fontStyle: 'italic', fontWeight: 'bold', textDecoration: 'underline' }}>Bismillahirrahrahmanirrahim</p>
                <p style={{ fontStyle: 'italic', fontWeight: 'bold' }}>Assalamu'alaikum Wr. Wb</p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <p>Dengan Hormat,</p>
                <p style={{ textIndent: '2rem' }}>Semoga Allah senantiasa memberikan kesuksesan kepada kita semua. Aamiin. Sehubungan dengan akan diadakannya {formData.isiSehubungan} yang Insyaallah akan diadakan besok pada:</p>
                <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
                  Hari/Tanggal: {formData.hariTanggal}<br />
                  Pukul: {formData.pukul}<br />
                  Tempat: {formData.tempat}<br />
                  Acara: {formData.acara}
                </div>
                <p style={{ marginTop: '1.5rem' }}>Sehubungan dengan kegiatan diatas maka kami mohon kesediaan {formData.mohonKesediaan} untuk hadir pada acara tersebut.</p>
                <p style={{ textIndent: '2rem' }}>Demikian undangan kami, terima kasih atas perhatian dan kerjasamanya.</p>
              </div>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <p style={{ fontStyle: 'italic', fontWeight: 'bold' }}>Jazakumullahu khoiron katsiroo</p>
                <p style={{ fontStyle: 'italic', fontWeight: 'bold' }}>Wassalamu'alaikum Wr. Wb</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                <div style={{ textAlign: 'center', minWidth: '280px' }}>
                  <p style={{ margin: 0, fontSize: '12pt', textDecoration: 'underline', fontStyle: 'italic', fontWeight: 'bold' }}>Wassalamu'alaikum Wr. Wb.</p>
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ margin: 0 }}>Mengetahui</p>
                    <p style={{ margin: 0 }}>Kepala KB/BA "RESTU 2"</p>
                    <div style={{ height: '90px' }}></div>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, fontSize: '12pt' }}>
                      {formData.kepalaNama}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditingNarasumber) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="btn btn-outline" onClick={() => setIsEditingNarasumber(false)}>
              <ArrowLeft size={18} />
              Kembali
            </button>
            <h1 className="page-title">Edit Permohonan Narasumber</h1>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-outline" onClick={handleDownloadPDF}>
              <Printer size={18} />
              Preview PDF
            </button>
            <button className="btn btn-primary" onClick={handleSubmitForApproval}>
              <Send size={18} />
              Ajukan Approval
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="card-title mb-6">Data Narasumber</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nomor Surat</label>
                <input type="text" className="form-control" value={letterNumber} onChange={(e) => setLetterNumber(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Kepada Yth.</label>
                <input type="text" className="form-control" value={formDataNarasumber.kepada} onChange={(e) => setFormDataNarasumber({...formDataNarasumber, kepada: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Dalam Rangka</label>
                <textarea className="form-control" rows="2" value={formDataNarasumber.rangka} onChange={(e) => setFormDataNarasumber({...formDataNarasumber, rangka: e.target.value})}></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Hari</label>
                  <input type="text" className="form-control" value={formDataNarasumber.hari} onChange={(e) => setFormDataNarasumber({...formDataNarasumber, hari: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input type="text" className="form-control" value={formDataNarasumber.tanggal} onChange={(e) => setFormDataNarasumber({...formDataNarasumber, tanggal: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Waktu</label>
                <input type="text" className="form-control" value={formDataNarasumber.waktu} onChange={(e) => setFormDataNarasumber({...formDataNarasumber, waktu: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Tempat</label>
                <input type="text" className="form-control" value={formDataNarasumber.tempat} onChange={(e) => setFormDataNarasumber({...formDataNarasumber, tempat: e.target.value})} />
              </div>
            </div>
          </Card>

          <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
            <div ref={printRef} className="print-area shadow-lg" style={{ 
              width: '210mm', minHeight: '297mm', padding: '25mm 20mm', backgroundColor: '#fff',
              fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: 1.5, color: '#000'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', marginRight: '20px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>KB-BA-TPA "RESTU 2"</h2>
                  <h3 style={{ margin: '4px 0', fontSize: '13pt', fontWeight: 'bold' }}>DHARMA WANITA PERSATUAN MAN 2 MALANG</h3>
                  <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic' }}>Jl. Pandeglang No.7 Malang telp. (0341) 587678</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <div>No: {letterNumber}<br />Hal: Permohonan Narasumber</div>
                <div style={{ textAlign: 'right' }}>Malang, {currentDate}</div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>Kepada Yth:<br />{formDataNarasumber.kepada}<br />Di Tempat</div>
              <div style={{ marginTop: '1.5rem' }}>
                <p>Assalamu'alaikum Wr. Wb</p>
                <p style={{ textIndent: '2rem' }}>Puji syukur kita panjatkan kehadirat Allah SWT, shalawat dan salam semoga tercurah kepada Nabi Muhammad SAW. Sehubungan dengan kegiatan {formDataNarasumber.rangka}, maka kami bermaksud memohon kesediaan Bapak/Ibu untuk menjadi Narasumber pada:</p>
                <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
                  Hari: {formDataNarasumber.hari}<br />
                  Tanggal: {formDataNarasumber.tanggal}<br />
                  Waktu: {formDataNarasumber.waktu}<br />
                  Tempat: {formDataNarasumber.tempat}
                </div>
                <p style={{ marginTop: '1.5rem' }}>Demikian permohonan ini kami sampaikan, atas perhatian dan kesediaannya kami ucapkan terima kasih.</p>
                <p>Wassalamu'alaikum Wr. Wb</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                <div style={{ textAlign: 'center', minWidth: '280px' }}>
                  <p style={{ margin: 0, fontSize: '12pt', textDecoration: 'underline', fontStyle: 'italic', fontWeight: 'bold' }}>Wassalamu'alaikum Wr. Wb.</p>
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ margin: 0 }}>Hormat Kami,</p>
                    <p style={{ margin: 0 }}>Kepala KB/BA "RESTU 2"</p>
                    <div style={{ height: '90px' }}></div>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, fontSize: '12pt' }}>
                      {formDataNarasumber.kepalaNama}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isEditingPeminjaman) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="btn btn-outline" onClick={() => setIsEditingPeminjaman(false)}>
              <ArrowLeft size={18} />
              Kembali
            </button>
            <h1 className="page-title">Edit Peminjaman Fasilitas</h1>
          </div>
          <div className="flex gap-4">
            <button className="btn btn-outline" onClick={handleDownloadPDF}>
              <Printer size={18} />
              Preview PDF
            </button>
            <button className="btn btn-primary" onClick={handleSubmitForApproval}>
              <Send size={18} />
              Ajukan Approval
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <h3 className="card-title mb-6">Data Peminjaman</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Nomor Surat</label>
                <input type="text" className="form-control" value={letterNumber} onChange={(e) => setLetterNumber(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Kepada Yth.</label>
                <input type="text" className="form-control" value={formDataPeminjaman.kepada} onChange={(e) => setFormDataPeminjaman({...formDataPeminjaman, kepada: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Meminjam (Fasilitas)</label>
                <input type="text" className="form-control" value={formDataPeminjaman.meminjam} onChange={(e) => setFormDataPeminjaman({...formDataPeminjaman, meminjam: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Untuk Kegiatan</label>
                <input type="text" className="form-control" value={formDataPeminjaman.kegiatan} onChange={(e) => setFormDataPeminjaman({...formDataPeminjaman, kegiatan: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Hari</label>
                  <input type="text" className="form-control" value={formDataPeminjaman.hari} onChange={(e) => setFormDataPeminjaman({...formDataPeminjaman, hari: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal</label>
                  <input type="text" className="form-control" value={formDataPeminjaman.tanggal} onChange={(e) => setFormDataPeminjaman({...formDataPeminjaman, tanggal: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Pukul</label>
                <input type="text" className="form-control" value={formDataPeminjaman.pukul} onChange={(e) => setFormDataPeminjaman({...formDataPeminjaman, pukul: e.target.value})} />
              </div>
            </div>
          </Card>

          <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
            <div ref={printRef} className="print-area shadow-lg" style={{ 
              width: '210mm', minHeight: '297mm', padding: '25mm 20mm', backgroundColor: '#fff',
              fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', lineHeight: 1.5, color: '#000'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', marginRight: '20px' }} />
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>KB-BA-TPA "RESTU 2"</h2>
                  <h3 style={{ margin: '4px 0', fontSize: '13pt', fontWeight: 'bold' }}>DHARMA WANITA PERSATUAN MAN 2 MALANG</h3>
                  <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic' }}>Jl. Pandeglang No.7 Malang telp. (0341) 587678</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <div>No: {letterNumber}<br />Hal: Peminjaman Fasilitas</div>
                <div style={{ textAlign: 'right' }}>Malang, {currentDate}</div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>Kepada Yth:<br />{formDataPeminjaman.kepada}<br />Di Tempat</div>
              <div style={{ marginTop: '1.5rem' }}>
                <p>Assalamu'alaikum Wr. Wb</p>
                <p style={{ textIndent: '2rem' }}>Puji syukur kita panjatkan kehadirat Allah SWT. Sehubungan dengan kegiatan {formDataPeminjaman.kegiatan} yang akan dilaksanakan pada:</p>
                <div style={{ marginLeft: '2rem', marginTop: '1rem' }}>
                  Hari: {formDataPeminjaman.hari}<br />
                  Tanggal: {formDataPeminjaman.tanggal}<br />
                  Waktu: {formDataPeminjaman.pukul}<br />
                  Fasilitas: {formDataPeminjaman.meminjam}
                </div>
                <p style={{ marginTop: '1.5rem' }}>Demikian permohonan ini kami sampaikan, atas izin dan kerjasamanya kami ucapkan terima kasih.</p>
                <p>Wassalamu'alaikum Wr. Wb</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                <div style={{ textAlign: 'center', minWidth: '280px' }}>
                  <p style={{ margin: 0, fontSize: '12pt', textDecoration: 'underline', fontStyle: 'italic', fontWeight: 'bold' }}>Wassalamu'alaikum Wr. Wb.</p>
                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ margin: 0 }}>Hormat Kami,</p>
                    <p style={{ margin: 0 }}>Kepala KB/BA "RESTU 2"</p>
                    <div style={{ height: '90px' }}></div>
                    <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, fontSize: '12pt' }}>
                      {formDataPeminjaman.kepalaNama}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="animate-fade-in">
        <div className="page-header flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button className="btn btn-outline" onClick={() => setIsProcessing(false)}>
              <ArrowLeft size={18} />
              Kembali
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <button className="btn btn-primary" onClick={async () => {
              await handleDownloadPDF();
              // Update status to finished
              try {
                await fetch('http://localhost/siarsad/api/surat_keluar.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: outgoingId,
                    status: 'Selesai',
                    date_sent: new Date().toISOString().split('T')[0]
                  })
                });
              } catch (e) {}
              setIsProcessing(false);
            }}>
              <Download size={18} />
              Simpan & Download PDF
            </button>
            <button className="btn btn-success" onClick={async () => {
              await saveDraft();
              try {
                const response = await fetch('http://localhost/siarsad/api/surat_keluar.php', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: outgoingId, status: 'Menunggu Persetujuan' })
                });
                const res = await response.json();
                if (res.success) {
                  alert('Surat telah diajukan untuk approval.');
                  setIsProcessing(false);
                  navigate('/surat-keluar');
                }
              } catch (e) {}
            }}>
              <Send size={18} />
              Ajukan Approval
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', backgroundColor: '#f4f4f4' }}>
          <div 
            ref={printRef}
            className="editor-document-wrapper"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              backgroundColor: '#fff'
            }}
          >
            <Editor
              apiKey="nh44to6bwzt0o2tfojx566lbso5zaa43c817zljd7up7rzur"
              value={processedHtml}
              onEditorChange={(newHtml) => setProcessedHtml(newHtml)}
              init={{
                inline: true,
                menubar: false,
                plugins: [
                  'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist | removeformat',
                content_style: `
                  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; }
                  .print-area { padding: 0 !important; }
                `
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Template Surat</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Arsip</span>
            <span>/</span>
            <span className="active">Template Surat</span>
          </div>
        </div>
        {!isAddingTemplate && (
          <button className="btn btn-primary" onClick={() => setIsAddingTemplate(true)}>
            <Plus size={18} />
            Tambah Template
          </button>
        )}
      </div>

      {isAddingTemplate && (
        <div className="animate-fade-in mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div>
                <label className="text-xs font-semibold block mb-1">
                  Nama Template <span className="text-danger">*</span>
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Contoh: Surat Undangan Rapat"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Kategori <span className="text-danger">*</span></label>
                <select 
                  className="form-control"
                  value={newTemplate.id_kategori}
                  onChange={(e) => setNewTemplate({...newTemplate, id_kategori: e.target.value})}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map(cat => (
                    <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Format Penomoran <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="[SEQ]/RESTU 2/[YEAR]/[MM]"
                  value={newTemplate.number_format}
                  onChange={(e) => setNewTemplate({...newTemplate, number_format: e.target.value})}
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold block mb-1">Deskripsi (Opsional)</label>
              <textarea 
                className="form-control" 
                placeholder="Contoh: Template ini digunakan untuk mengundang wali murid dalam rapat rutin bulanan."
                rows="2"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                style={{ resize: 'none' }}
              ></textarea>
            </div>

            <div className="flex justify-between items-center pt-4 border-t" style={{ borderTop: '1px solid #f0f0f0' }}>
              <div className="flex gap-2">
                <button className="btn btn-outline" onClick={() => {
                  setIsAddingTemplate(false);
                  setIsEditingTemplateSource(false);
                  setEditingTemplateId(null);
                  setNewTemplate({
                    name: '',
                    type: 'umum',
                    id_kategori: '',
                  content: `<p style="text-align: right;">Malang, ${getIndonesianDate()}</p><p>&nbsp;</p><p>Tulis isi surat di sini...</p>`,
                    number_format: '[SEQ]/PAUD-R2/[MONTH]/[YEAR]',
                    description: ''
                  });
                }}>Batal</button>
                <button 
                  className="btn btn-outline" 
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Template (AI)'}
                </button>
              </div>
              <button className="btn btn-primary" onClick={handleSaveNewTemplate}>
                <Save size={18} />
                {isEditingTemplateSource ? 'Update Template' : 'Simpan Template'}
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '2.5rem' }}></div> {/* Spacing between form and editor */}

            <div className="text-center mt-8">
              <h3 className="text-lg font-bold mb-4">Edit & Preview Template Surat</h3>
              <p className="text-xs text-secondary mb-2 italic">* Anda dapat mengedit isi surat langsung pada tampilan A4 di bawah ini</p>
            </div>

            {/* Interactive A4 Editor Section */}
            <div ref={printRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                className="print-area shadow-lg mb-8"
                style={{ 
                  width: '210mm', 
                  minHeight: '297mm',
                  padding: '25mm 20mm 30mm 20mm', 
                  backgroundColor: '#ffffff',
                  fontFamily: '"Times New Roman", Times, serif',
                  color: '#000',
                  lineHeight: lineHeight,
                  fontSize: '12pt',
                  position: 'relative'
                }}
              >
                {/* Fixed Kop Surat (Visible on all pages in preview) */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                  <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', marginRight: '20px' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>KB-BA-TPA "RESTU 2"</h2>
                    <h3 style={{ margin: '4px 0', fontSize: '13pt', fontWeight: 'bold' }}>DHARMA WANITA PERSATUAN MAN 2 MALANG</h3>
                    <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic' }}>Jl. Pandeglang No.7 Malang telp. (0341) 587678</p>
                  </div>
                </div>

                {/* Inline TinyMCE Editor - Handles content + pagination */}
                <div className="letter-editor-container" style={{ minHeight: '180mm' }}>
                  <Editor
                    apiKey="nh44to6bwzt0o2tfojx566lbso5zaa43c817zljd7up7rzur"
                    value={newTemplate.content}
                    onEditorChange={(newContent) => setNewTemplate({...newTemplate, content: newContent})}
                    init={{
                      inline: true,
                      menubar: true,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'pagebreak'
                      ],
                      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table image pagebreak | removeformat | help',
                      content_style: `
                        body { 
                          font-family: "Times New Roman", serif; 
                          font-size: 12pt; 
                          line-height: 1.5; 
                          color: #000;
                          margin: 0;
                          padding: 0;
                        }
                        p { margin-top: 0; margin-bottom: 1rem; }
                        table { border-collapse: collapse; width: 100%; }
                        table, th, td { border: 1px solid #ccc; padding: 8px; }
                        ul, ol { margin-left: 2rem; }
                        .mce-pagebreak {
                          border: 1px dashed #ccc;
                          margin: 20px 0;
                          page-break-after: always;
                        }
                      `
                    }}
                  />
                </div>

                {/* Fixed Signature Section */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
                  <div style={{ textAlign: 'center', minWidth: '280px' }}>
                    <p style={{ margin: 0, fontSize: '12pt', textDecoration: 'underline', fontStyle: 'italic', fontWeight: 'bold' }}>Wassalamu'alaikum Wr. Wb.</p>
                    <div style={{ marginTop: '1.5rem' }}>
                      <p style={{ margin: 0 }}>Mengetahui</p>
                      <p style={{ margin: 0 }}>Kepala KB/BA "RESTU 2"</p>
                      <div style={{ height: '90px' }}></div>
                      <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, fontSize: '12pt' }}>
                        {formData.kepalaNama}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden Real Print View (Used for PDF generation to handle multi-page logic) */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={printRef}>
                  {newTemplate.content.split('<img class="mce-pagebreak" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-mce-resize="false" data-mce-placeholder="1" />').map((p, idx, arr) => (
                      <div 
                        key={idx}
                        className="print-area"
                        style={{ 
                          width: '210mm', 
                          height: '297mm', 
                          padding: '25mm 20mm 30mm 20mm', 
                          backgroundColor: '#fff',
                          fontFamily: '"Times New Roman", serif',
                          fontSize: '12pt',
                          position: 'relative',
                          marginBottom: '0',
                          pageBreakAfter: idx < arr.length - 1 ? 'always' : 'auto'
                        }}
                      >
                      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '1.5rem' }}>
                        <img src="/img/logo-dwp.png" alt="Logo" style={{ width: '85px', marginRight: '20px' }} />
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold', textTransform: 'uppercase' }}>KB-BA-TPA "RESTU 2"</h2>
                          <h3 style={{ margin: '4px 0', fontSize: '13pt', fontWeight: 'bold' }}>DHARMA WANITA PERSATUAN MAN 2 MALANG</h3>
                          <p style={{ margin: 0, fontSize: '10.5pt', fontStyle: 'italic' }}>Jl. Pandeglang No.7 Malang telp. (0341) 587678</p>
                        </div>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: p }} />
                      {idx === arr.length - 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem', position: 'absolute', bottom: '35mm', right: '20mm' }}>
                          <div style={{ textAlign: 'center', minWidth: '280px' }}>
                            <p style={{ margin: 0, fontSize: '12pt', textDecoration: 'underline', fontStyle: 'italic', fontWeight: 'bold' }}>Wassalamu'alaikum Wr. Wb.</p>
                            <div style={{ marginTop: '1.5rem' }}>
                              <p style={{ margin: 0 }}>Mengetahui</p>
                              <p style={{ margin: 0 }}>Kepala KB/BA "RESTU 2"</p>
                              <div style={{ height: '90px' }}></div>
                              <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: 0, fontSize: '12pt' }}>
                                {formData.kepalaNama}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      )}

      {!isAddingTemplate && (
        <div 
          className="grid gap-6" 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: templates.length > 0 ? 'repeat(4, 1fr)' : 'none' 
          }}
        >
          {templates.map((template) => {
            const colors = (() => {
              const n = template.name.toLowerCase();
              if (n.includes('undangan')) return { bg: '#E0F2FE', icon: '#0EA5E9', border: '#7DD3FC', text: '#0369A1' }; 
              if (n.includes('keterangan') || n.includes('aktif')) return { bg: '#DCFCE7', icon: '#22C55E', border: '#86EFAC', text: '#15803D' };
              if (n.includes('kegiatan') || n.includes('outing')) return { bg: '#FEF9C3', icon: '#EAB308', border: '#FDE047', text: '#A16207' };
              if (n.includes('peminjaman') || n.includes('perminjaman') || n.includes('narasumber')) return { bg: '#F3E8FF', icon: '#A855F7', border: '#D8B4FE', text: '#7E22CE' };
              if (n.includes('zakat') || n.includes('zis')) return { bg: '#FFEDD5', icon: '#F97316', border: '#FDBA74', text: '#C2410C' };
              return { bg: '#F1F5F9', icon: '#64748B', border: '#CBD5E1', text: '#334155' };
            })();

            return (
              <div 
                key={template.id} 
                className="rounded-[24px] border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                style={{ 
                  borderColor: colors.border, 
                  backgroundColor: colors.bg,
                  minHeight: '180px',
                  padding: '1.25rem 1rem',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                {/* 1. Title (Compact) */}
                <h4 style={{ 
                  fontSize: '1rem', 
                  fontWeight: '800', 
                  marginBottom: '0.4rem',
                  color: colors.text,
                  display: 'block',
                  width: '100%',
                  lineHeight: '1.2'
                }}>
                  {template.name}
                </h4>

                {/* 2. Description (Compact) */}
                <p style={{ 
                  fontSize: '0.75rem', 
                  color: '#475569', 
                  marginBottom: '1.25rem',
                  fontWeight: '600',
                  lineHeight: '1.3',
                  display: 'block',
                  width: '100%',
                  opacity: 0.9,
                  height: '2rem',
                  overflow: 'hidden'
                }}>
                  {template.description || "Template surat resmi sekolah."}
                </p>
                
                {/* 3. Action Buttons (Compact but Vibrant) */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', width: '100%' }}>
                  <button 
                    className="flex items-center justify-center rounded-2xl bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-md border-2"
                    style={{ borderColor: colors.border, width: '48px', height: '48px', cursor: 'pointer' }}
                    title="Edit Template"
                    onClick={() => handleEditTemplateSource(template)}
                  >
                    <Edit size={22} />
                  </button>
                  
                  {role === 'admin' && (
                    <button 
                      className="flex items-center justify-center rounded-2xl bg-white hover:bg-red-50 text-red-600 transition-all shadow-md border-2"
                      style={{ borderColor: '#FECACA', width: '48px', height: '48px', cursor: 'pointer' }}
                      title="Hapus"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TemplateSurat;
