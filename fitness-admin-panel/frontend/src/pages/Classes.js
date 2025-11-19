import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', classType: '', instructorId: '',
    maxCapacity: '', durationMinutes: '', isActive: true
  });

  useEffect(() => {
    fetchClasses();
    fetchTrainers();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainers = async () => {
    try {
      const res = await api.get('/trainers');
      setTrainers(res.data);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, formData);
      } else {
        await api.post('/classes', formData);
      }
      setShowModal(false);
      fetchClasses();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving class');
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      description: cls.description || '',
      classType: cls.class_type || '',
      instructorId: cls.instructor_id || '',
      maxCapacity: cls.max_capacity,
      durationMinutes: cls.duration_minutes,
      isActive: cls.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await api.delete(`/classes/${id}`);
        fetchClasses();
      } catch (error) {
        alert('Error deleting class');
      }
    }
  };

  const resetForm = () => {
    setEditingClass(null);
    setFormData({
      name: '', description: '', classType: '', instructorId: '',
      maxCapacity: '', durationMinutes: '', isActive: true
    });
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fitness Classes</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          Add Class
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Instructor</th>
                <th>Capacity</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td style={{ fontWeight: 500 }}>{cls.name}</td>
                  <td><span className="badge badge-purple">{cls.class_type}</span></td>
                  <td>{cls.instructor_name || '-'}</td>
                  <td>{cls.max_capacity}</td>
                  <td>{cls.duration_minutes} min</td>
                  <td>
                    <span className={`badge ${cls.is_active ? 'badge-success' : 'badge-warning'}`}>
                      {cls.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(cls)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cls.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingClass ? 'Edit Class' : 'Add Class'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class Type</label>
                  <select
                    className="form-input"
                    value={formData.classType}
                    onChange={(e) => setFormData({ ...formData, classType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="yoga">Yoga</option>
                    <option value="pilates">Pilates</option>
                    <option value="hiit">HIIT</option>
                    <option value="strength">Strength</option>
                    <option value="dance">Dance</option>
                    <option value="cycling">Cycling</option>
                    <option value="boxing">Boxing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Instructor</label>
                  <select
                    className="form-input"
                    value={formData.instructorId}
                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  >
                    <option value="">Select Instructor</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.first_name} {trainer.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Max Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
