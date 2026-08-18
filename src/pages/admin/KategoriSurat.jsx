import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { Plus, Edit, Trash2, X, Save, Tag } from 'lucide-react';

function KategoriSurat({ role }) {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    id_kategori: null,
    nama_kategori: '',
    deskripsi: ''
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/kategori_surat.php');
      const data = await response.json();
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      id_kategori: null,
      nama_kategori: '',
      deskripsi: ''
    });
    setIsEdit(false);
    setShowForm(false);
  };

  const handleEdit = (cat) => {
    if (role !== 'admin' && role !== 'tata_usaha') return;
    setFormData({
      id_kategori: cat.id_kategori,
      nama_kategori: cat.nama_kategori,
      deskripsi: cat.deskripsi
    });
    setIsEdit(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (cat) => {
    if (role !== 'admin' && role !== 'tata_usaha') return;
    setCategoryToDelete(cat);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      const user = JSON.parse(localStorage.getItem('sipersa_user'));
      const response = await fetch(`http://localhost/siarsad/api/kategori_surat.php?id=${categoryToDelete.id_kategori}&user_id=${user?.id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        setShowDeleteModal(false);
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== 'admin' && role !== 'tata_usaha') return;
    
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const user = JSON.parse(localStorage.getItem('sipersa_user'));
      const response = await fetch('http://localhost/siarsad/api/kategori_surat.php', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user?.id })
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        resetForm();
        fetchCategories();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const canManage = role === 'admin' || role === 'tata_usaha';

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Master Data Kategori Surat</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span className="active">Kategori Surat</span>
          </div>
        </div>
        {!showForm && canManage && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setIsEdit(false); }}>
            <Plus size={18} />
            Tambah Kategori
          </button>
        )}
      </div>

      {showForm && (
        <Card title={isEdit ? 'Edit Kategori Surat' : 'Tambah Kategori Surat'}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Kategori <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input 
                name="nama_kategori" 
                type="text" 
                className="form-control" 
                placeholder="Contoh: Undangan, Keputusan, dsb." 
                value={formData.nama_kategori}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea 
                name="deskripsi" 
                className="form-control" 
                rows="3" 
                placeholder="Berikan deskripsi singkat tentang kategori ini..." 
                value={formData.deskripsi}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="flex justify-between mt-4 border-t pt-4">
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                <X size={18} />
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!formData.nama_kategori}
                style={{ opacity: formData.nama_kategori ? 1 : 0.6, cursor: formData.nama_kategori ? 'pointer' : 'not-allowed' }}
              >
                <Save size={18} />
                {isEdit ? 'Perbarui Kategori' : 'Simpan Kategori'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && (
        <Card title="Daftar Kategori Surat">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>No</th>
                  <th style={{ width: '200px' }}>Nama Kategori</th>
                  <th>Deskripsi</th>
                  {canManage && <th style={{ width: '120px' }}>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={canManage ? "4" : "3"} style={{ textAlign: 'center' }}>Memuat data...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={canManage ? "4" : "3"} style={{ textAlign: 'center' }}>Tidak ada data kategori.</td></tr>
                ) : (
                  categories.map((cat, index) => (
                    <tr key={cat.id_kategori}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Tag size={16} color="var(--primary-color)" />
                          <span style={{ fontWeight: 600 }}>{cat.nama_kategori}</span>
                        </div>
                      </td>
                      <td>{cat.deskripsi || '-'}</td>
                      {canManage && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-outline" title="Edit" onClick={() => handleEdit(cat)}><Edit size={14} /></button>
                            <button className="btn btn-danger" title="Hapus" onClick={() => handleDeleteClick(cat)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {/* Modal Konfirmasi Hapus */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', marginBottom: 0 }}>
            <div className="card-header">
              <h3 className="card-title">Konfirmasi Hapus</h3>
              <button className="hamburger" onClick={() => setShowDeleteModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p>Apakah Anda yakin ingin menghapus kategori <strong>{categoryToDelete?.nama_kategori}</strong>?</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Kategori ini akan dipindahkan ke halaman <strong>Backup & Restore</strong>.
              </p>
              <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>Batal</button>
                <button className="btn btn-danger" onClick={confirmDelete}>Ya, Hapus</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KategoriSurat;
