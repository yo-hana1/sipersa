import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import {
  Folder, FolderOpen, FileText, Eye, Download,
  ChevronRight, ChevronDown, Inbox, Send, Calendar,
  Search, X, Tag, Loader2, Plus, Upload
} from 'lucide-react';

const NAMA_BULAN = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function ArsipSurat() {
  const [structure, setStructure] = useState({ masuk: [], keluar: [] });
  const [loadingStructure, setLoadingStructure] = useState(true);

  // expanded state: { masuk: { 2026: true }, keluar: {} }
  const [expandedMasuk, setExpandedMasuk] = useState({});
  const [expandedKeluar, setExpandedKeluar] = useState({});
  const [expandRootMasuk, setExpandRootMasuk] = useState(true);
  const [expandRootKeluar, setExpandRootKeluar] = useState(false);

  // selected folder
  const [selectedFolder, setSelectedFolder] = useState(null);
  // { jenis: 'masuk'|'keluar', year: 2026, month: 5 }

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState(null);


  // ── Fetch structure ────────────────────────────────────────────────────────
  const fetchStructure = async () => {
    setLoadingStructure(true);
    try {
      const res = await fetch('http://localhost/siarsad/api/arsip_surat.php?type=structure');
      const json = await res.json();
      if (json.success) setStructure(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingStructure(false);
  };

  // ── Fetch documents for selected folder ───────────────────────────────────
  const fetchDocuments = async (folder) => {
    if (!folder) return;
    setLoadingDocs(true);
    setDocuments([]);
    try {
      const { jenis, year, month } = folder;
      const url = `http://localhost/siarsad/api/arsip_surat.php?type=${jenis}&year=${year}&month=${month}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setDocuments(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingDocs(false);
  };

  // ── Fetch all (default view) ───────────────────────────────────────────────
  const fetchAll = async () => {
    setLoadingDocs(true);
    setDocuments([]);
    try {
      const res = await fetch('http://localhost/siarsad/api/arsip_surat.php?type=all');
      const json = await res.json();
      if (json.success) setDocuments(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingDocs(false);
  };

  useEffect(() => {
    fetchStructure();
    fetchAll();
  }, []);

  const handleSelectFolder = (jenis, year, month) => {
    const folder = { jenis, year, month };
    setSelectedFolder(folder);
    setSearchQuery('');
    fetchDocuments(folder);
  };

  const handleClearFolder = () => {
    setSelectedFolder(null);
    setSearchQuery('');
    fetchAll();
  };


  const toggleYearMasuk = (year) => {
    setExpandedMasuk(prev => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleYearKeluar = (year) => {
    setExpandedKeluar(prev => ({ ...prev, [year]: !prev[year] }));
  };

  // ── Filter by search ──────────────────────────────────────────────────────
  const filteredDocs = documents.filter(doc => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.letter_number || '').toLowerCase().includes(q) ||
      (doc.subject || '').toLowerCase().includes(q) ||
      (doc.sender || '').toLowerCase().includes(q) ||
      (doc.recipient || '').toLowerCase().includes(q) ||
      (doc.nama_kategori || '').toLowerCase().includes(q)
    );
  });

  // ── Breadcrumb label ──────────────────────────────────────────────────────
  const getBreadcrumb = () => {
    if (!selectedFolder) return 'Semua Arsip Terbaru';
    const { jenis, year, month } = selectedFolder;
    const jenisLabel = jenis === 'masuk' ? 'Surat Masuk' : 'Surat Keluar';
    return `${jenisLabel} / ${year} / ${NAMA_BULAN[month]}`;
  };

  // ── Styles helpers ────────────────────────────────────────────────────────
  const isSelected = (jenis, year, month) =>
    selectedFolder?.jenis === jenis &&
    selectedFolder?.year === year &&
    selectedFolder?.month === month;

  const folderItemStyle = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.45rem 0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: active ? 600 : 400,
    backgroundColor: active ? 'var(--primary-light)' : 'transparent',
    color: active ? 'var(--primary-color)' : 'var(--text-primary)',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  });

  const rootFolderStyle = (expanded) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    backgroundColor: expanded ? '#f0fdf4' : 'transparent',
    color: expanded ? 'var(--primary-color)' : 'var(--text-primary)',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  });

  const countBadge = (count) => (
    <span style={{
      marginLeft: 'auto',
      backgroundColor: '#e8f5e9',
      color: '#2e7d32',
      fontSize: '0.7rem',
      fontWeight: 700,
      padding: '1px 7px',
      borderRadius: '999px',
      minWidth: '22px',
      textAlign: 'center',
    }}>{count}</span>
  );

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Arsip Surat Digital</h1>
        <div className="breadcrumb">
          <span>Arsip</span>
          <span>/</span>
          <span className="active">Penjelajah Arsip</span>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="flex gap-3 items-center">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Cari nomor surat, perihal, pengirim, penerima, kategori..."
              style={{ paddingLeft: '40px', height: '44px', borderRadius: '10px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {selectedFolder && (
            <button className="btn btn-outline" style={{ height: '44px', gap: '6px', whiteSpace: 'nowrap' }} onClick={handleClearFolder}>
              <X size={16} /> Tampilkan Semua
            </button>
          )}
        </div>
      </Card>

      {/* Main layout: folder tree left, documents right */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Panel Kiri: Struktur Folder ─────────────────────────────────────── */}
        <div>
          <Card title="Struktur Folder">
            {loadingStructure ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

                {/* ── Surat Masuk Root ── */}
                <div
                  style={rootFolderStyle(expandRootMasuk)}
                  onClick={() => setExpandRootMasuk(p => !p)}
                >
                  {expandRootMasuk ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {expandRootMasuk
                    ? <FolderOpen size={18} style={{ color: '#0288d1' }} />
                    : <Folder size={18} style={{ color: '#0288d1' }} />}
                  <span>Surat Masuk</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {structure.masuk.reduce((acc, t) => acc + t.bulan.reduce((a, b) => a + b.jumlah, 0), 0)}
                  </span>
                </div>

                {expandRootMasuk && (
                  <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {structure.masuk.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem 0.75rem' }}>Belum ada arsip</p>
                    )}
                    {structure.masuk.map(tahunObj => (
                      <div key={tahunObj.tahun}>
                        {/* Year folder */}
                        <div
                          style={folderItemStyle(false)}
                          onClick={() => toggleYearMasuk(tahunObj.tahun)}
                        >
                          {expandedMasuk[tahunObj.tahun] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <Folder size={15} style={{ color: '#f59e0b' }} />
                          <span>{tahunObj.tahun}</span>
                          {countBadge(tahunObj.bulan.reduce((a, b) => a + b.jumlah, 0))}
                        </div>

                        {/* Month folders */}
                        {expandedMasuk[tahunObj.tahun] && (
                          <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {tahunObj.bulan.map(bulanObj => (
                              <div
                                key={bulanObj.bulan}
                                style={folderItemStyle(isSelected('masuk', tahunObj.tahun, bulanObj.bulan))}
                                onClick={() => handleSelectFolder('masuk', tahunObj.tahun, bulanObj.bulan)}
                                onMouseEnter={e => {
                                  if (!isSelected('masuk', tahunObj.tahun, bulanObj.bulan))
                                    e.currentTarget.style.backgroundColor = '#f0f4f8';
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected('masuk', tahunObj.tahun, bulanObj.bulan))
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Calendar size={13} style={{ color: '#0288d1', flexShrink: 0 }} />
                                <span>{NAMA_BULAN[bulanObj.bulan]}</span>
                                {countBadge(bulanObj.jumlah)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.5rem 0' }} />

                {/* ── Surat Keluar Root ── */}
                <div
                  style={rootFolderStyle(expandRootKeluar)}
                  onClick={() => setExpandRootKeluar(p => !p)}
                >
                  {expandRootKeluar ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  {expandRootKeluar
                    ? <FolderOpen size={18} style={{ color: '#43a047' }} />
                    : <Folder size={18} style={{ color: '#43a047' }} />}
                  <span>Surat Keluar</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {structure.keluar.reduce((acc, t) => acc + t.bulan.reduce((a, b) => a + b.jumlah, 0), 0)}
                  </span>
                </div>

                {expandRootKeluar && (
                  <div style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {structure.keluar.length === 0 && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0.5rem 0.75rem' }}>Belum ada arsip</p>
                    )}
                    {structure.keluar.map(tahunObj => (
                      <div key={tahunObj.tahun}>
                        <div
                          style={folderItemStyle(false)}
                          onClick={() => toggleYearKeluar(tahunObj.tahun)}
                        >
                          {expandedKeluar[tahunObj.tahun] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <Folder size={15} style={{ color: '#f59e0b' }} />
                          <span>{tahunObj.tahun}</span>
                          {countBadge(tahunObj.bulan.reduce((a, b) => a + b.jumlah, 0))}
                        </div>

                        {expandedKeluar[tahunObj.tahun] && (
                          <div style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {tahunObj.bulan.map(bulanObj => (
                              <div
                                key={bulanObj.bulan}
                                style={folderItemStyle(isSelected('keluar', tahunObj.tahun, bulanObj.bulan))}
                                onClick={() => handleSelectFolder('keluar', tahunObj.tahun, bulanObj.bulan)}
                                onMouseEnter={e => {
                                  if (!isSelected('keluar', tahunObj.tahun, bulanObj.bulan))
                                    e.currentTarget.style.backgroundColor = '#f0f4f8';
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected('keluar', tahunObj.tahun, bulanObj.bulan))
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Calendar size={13} style={{ color: '#43a047', flexShrink: 0 }} />
                                <span>{NAMA_BULAN[bulanObj.bulan]}</span>
                                {countBadge(bulanObj.jumlah)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ── Panel Kanan: Daftar Dokumen ──────────────────────────────────────── */}
        <div>
          <Card>
            {/* Header panel kanan */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              {selectedFolder ? (
                selectedFolder.jenis === 'masuk'
                  ? <Inbox size={20} style={{ color: '#0288d1' }} />
                  : <Send size={20} style={{ color: '#43a047' }} />
              ) : (
                <FileText size={20} style={{ color: 'var(--primary-color)' }} />
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{getBreadcrumb()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {loadingDocs ? 'Memuat...' : `${filteredDocs.length} dokumen`}
                </div>
              </div>
            </div>

            {/* Table */}
            {loadingDocs ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                <p>Memuat arsip...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Folder size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                <p style={{ fontWeight: 600 }}>Folder ini masih kosong</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {selectedFolder
                    ? 'Belum ada dokumen yang diarsipkan pada periode ini.'
                    : 'Pilih folder di sebelah kiri untuk melihat dokumen.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Jenis</th>
                      <th>Nomor Surat</th>
                      <th>Perihal</th>
                      <th>Pengirim / Tujuan</th>
                      <th>Tgl Arsip</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc, idx) => (
                      <tr key={idx}>
                        <td>
                          <span className={`badge ${doc.jenis === 'masuk' ? 'badge-info' : 'badge-success'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                            {doc.jenis === 'masuk'
                              ? <><Inbox size={11} /> Masuk</>
                              : <><Send size={11} /> Keluar</>}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.letter_number || '-'}</td>
                        <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={doc.subject}>{doc.subject || '-'}</td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {doc.jenis === 'masuk' ? doc.sender : doc.recipient}
                        </td>
                        <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {doc.tanggal_arsip
                            ? new Date(doc.tanggal_arsip).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '-'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}
                              title="Lihat Detail"
                              onClick={() => setSelectedDetail(doc)}
                            >
                              <Eye size={13} /> Detail
                            </button>
                            {doc.file_path && doc.jenis !== 'masuk' && (
                              <a
                                href={`http://localhost/siarsad/api/${doc.file_path}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', gap: '4px' }}
                                title="Unduh Lampiran"
                              >
                                <Download size={13} />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Modal Detail Surat Masuk (identik dengan SuratMasuk.jsx) ─────────── */}
      {selectedDetail && selectedDetail.jenis === 'masuk' && (
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
              <button className="hamburger" onClick={() => setSelectedDetail(null)} style={{ color: 'white', opacity: 0.8 }}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: '#fff' }}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>

                {/* Nomor Surat */}
                <div className="col-span-2" style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #dcfce7', marginBottom: '0.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nomor Surat</label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={selectedDetail.letter_number}>
                    {selectedDetail.letter_number}
                  </div>
                </div>

                {/* Kategori */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Tag size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Kategori</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedDetail.nama_kategori || 'Tanpa Kategori'}</div>
                  </div>
                </div>

                {/* Tgl Masuk */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Plus size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tgl Masuk</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>
                      {selectedDetail.tanggal_arsip
                        ? new Date(selectedDetail.tanggal_arsip).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                    </div>
                  </div>
                </div>

                {/* Pengirim */}
                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Upload size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Pengirim</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedDetail.sender}</div>
                    </div>
                  </div>
                </div>

                {/* Perihal */}
                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Eye size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Perihal</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem', lineHeight: '1.3' }}>{selectedDetail.subject}</div>
                    </div>
                  </div>
                </div>

                {/* Lampiran */}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Detail Surat Keluar ─────────────────────────────────────────── */}
      {selectedDetail && selectedDetail.jenis === 'keluar' && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', marginBottom: 0, borderRadius: '16px', overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}>
            <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', color: 'white', padding: '1.25rem 1.5rem' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: '10px' }}>
                    <Send size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Detail Surat Keluar</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Informasi lengkap dokumen yang tercatat</div>
                  </div>
                </div>
                <button onClick={() => setSelectedDetail(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}>
                  <X size={20} />
                </button>
              </div>
            </div>
            <div style={{ padding: '1.25rem', backgroundColor: '#fff' }}>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>

                <div className="col-span-2" style={{ backgroundColor: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #dcfce7' }}>
                  <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Nomor Surat</label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#064e3b' }}>{selectedDetail.letter_number || '-'}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Tag size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Kategori</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedDetail.nama_kategori || 'Umum'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Plus size={16} /></div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tgl Kirim</label>
                    <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>
                      {selectedDetail.tanggal_arsip
                        ? new Date(selectedDetail.tanggal_arsip).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                    </div>
                  </div>
                </div>

                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Upload size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Tujuan</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedDetail.recipient || '-'}</div>
                    </div>
                  </div>
                </div>

                <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><Eye size={16} /></div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Perihal</label>
                      <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem', lineHeight: '1.3' }}>{selectedDetail.subject || '-'}</div>
                    </div>
                  </div>
                </div>

                {selectedDetail.template_name && (
                  <div className="col-span-2" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ color: '#059669', backgroundColor: '#ecfdf5', padding: '0.4rem', borderRadius: '8px', flexShrink: 0 }}><FileText size={16} /></div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.6rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>Template</label>
                        <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.95rem' }}>{selectedDetail.template_name}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ArsipSurat;