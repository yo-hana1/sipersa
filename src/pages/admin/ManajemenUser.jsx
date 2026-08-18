import { useState, useEffect } from 'react';
import Card from '../../components/Card';
import { UserPlus, Edit, Trash2, X, Save } from 'lucide-react';

function ManajemenUser() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    id: null,
    full_name: '',
    email: '',
    jabatan: '',
    role: 'guru',
    password: '',
    status: 'aktif'
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost/siarsad/api/users.php');
      const data = await response.json();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      full_name: '',
      email: '',
      jabatan: '',
      role: 'guru',
      password: '',
      status: 'aktif'
    });
    setIsEdit(false);
    setShowForm(false);
  };

  const handleEdit = (user) => {
    setFormData({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      jabatan: user.jabatan,
      role: user.role,
      password: '', // Leave empty unless changing
      status: user.status
    });
    setIsEdit(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      try {
        const admin = JSON.parse(localStorage.getItem('sipersa_user'));
        const response = await fetch(`http://localhost/siarsad/api/users.php?id=${id}&admin_id=${admin?.id}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          alert(result.message);
          fetchUsers();
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const admin = JSON.parse(localStorage.getItem('sipersa_user'));
      const response = await fetch('http://localhost/siarsad/api/users.php', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, admin_id: admin?.id })
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        resetForm();
        fetchUsers();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="badge badge-primary" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>Administrator</span>;
      case 'tata_usaha': return <span className="badge badge-info">Tata Usaha</span>;
      case 'kepala_sekolah': return <span className="badge badge-warning">Kepala Sekolah</span>;
      default: return <span className="badge badge-secondary">Guru / Staf</span>;
    }
  };

  const isFormValid = formData.full_name && formData.email && formData.jabatan && (isEdit || formData.password);

  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Manajemen User</h1>
          <div className="breadcrumb d-none d-md-flex">
            <span>Admin Control Panel</span>
            <span>/</span>
            <span className="active">Manajemen User</span>
          </div>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setIsEdit(false); }}>
            <UserPlus size={18} />
            Tambah User Baru
          </button>
        )}
      </div>

      {showForm && (
        <Card title={isEdit ? 'Edit Data User' : 'Tambah User Baru'}>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label">Nama Lengkap <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="full_name" 
                  type="text" 
                  className="form-control" 
                  placeholder="Masukkan nama lengkap" 
                  value={formData.full_name}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="jabatan" 
                  type="text" 
                  className="form-control" 
                  placeholder="Masukkan jabatan (Contoh: Guru Matematika)" 
                  value={formData.jabatan}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  name="email" 
                  type="email" 
                  className="form-control" 
                  placeholder="Masukkan alamat email" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Hak Akses <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select name="role" className="form-control" value={formData.role} onChange={handleChange} required>
                  <option value="guru">Guru / Staf</option>
                  <option value="tata_usaha">Tata Usaha</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status Akun <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange} required>
                  <option value="aktif">Aktif</option>
                  <option value="tidak aktif">Tidak Aktif</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Password {!isEdit && <span style={{ color: 'var(--danger)' }}>*</span>} {isEdit && '(Kosongkan jika tidak ingin mengubah)'}</label>
                <input 
                  name="password" 
                  type="password" 
                  className="form-control" 
                  placeholder="Masukkan password" 
                  value={formData.password}
                  onChange={handleChange}
                  required={!isEdit} 
                />
              </div>
            </div>
            
            <div className="flex justify-between mt-4 border-t pt-4">
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                <X size={18} />
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!isFormValid}
                style={{ opacity: isFormValid ? 1 : 0.6, cursor: isFormValid ? 'pointer' : 'not-allowed' }}
              >
                <Save size={18} />
                {isEdit ? 'Perbarui Data' : 'Simpan User'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && (
        <Card title="Daftar Pengguna Sistem">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama Lengkap</th>
                  <th>Email / Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Memuat data...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center' }}>Tidak ada data pengguna.</td></tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>{user.full_name}</td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <span className={`badge ${user.status === 'aktif' ? 'badge-success' : 'badge-danger'}`}>
                          {user.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-outline" title="Edit" onClick={() => handleEdit(user)}><Edit size={14} /></button>
                          <button className="btn btn-danger" title="Hapus" onClick={() => handleDelete(user.id)}><Trash2 size={14} /></button>
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
    </div>
  );
}

export default ManajemenUser;
