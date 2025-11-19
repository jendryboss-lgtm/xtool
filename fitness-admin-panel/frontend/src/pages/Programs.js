import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', difficulty: 'beginner',
    durationWeeks: '', category: '', trainerId: '', isPublished: false
  });

  useEffect(() => {
    fetchPrograms();
    fetchTrainers();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await api.get('/programs');
      setPrograms(res.data);
    } catch (error) {
      console.error('Error fetching programs:', error);
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
      if (editingProgram) {
        await api.put(`/programs/${editingProgram.id}`, formData);
      } else {
        await api.post('/programs', formData);
      }
      setShowModal(false);
      fetchPrograms();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving program');
    }
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setFormData({
      title: program.title,
      description: program.description || '',
      difficulty: program.difficulty,
      durationWeeks: program.duration_weeks,
      category: program.category || '',
      trainerId: program.trainer_id || '',
      isPublished: program.is_published === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await api.delete(`/programs/${id}`);
        fetchPrograms();
      } catch (error) {
        alert('Error deleting program');
      }
    }
  };

  const resetForm = () => {
    setEditingProgram(null);
    setFormData({
      title: '', description: '', difficulty: 'beginner',
      durationWeeks: '', category: '', trainerId: '', isPublished: false
    });
  };

  const getDifficultyBadge = (difficulty) => {
    const classes = { beginner: 'badge-success', intermediate: 'badge-warning', advanced: 'badge-danger' };
    return <span className={`badge ${classes[difficulty]}`}>{difficulty}</span>;
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workout Programs</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          Add Program
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Duration</th>
                <th>Category</th>
                <th>Trainer</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map(program => (
                <tr key={program.id}>
                  <td style={{ fontWeight: 500 }}>{program.title}</td>
                  <td>{getDifficultyBadge(program.difficulty)}</td>
                  <td>{program.duration_weeks} weeks</td>
                  <td>{program.category}</td>
                  <td>{program.trainer_name || '-'}</td>
                  <td>
                    <span className={`badge ${program.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {program.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(program)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(program.id)}>Delete</button>
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
              <h3 className="modal-title">{editingProgram ? 'Edit Program' : 'Add Program'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-input"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (weeks)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.durationWeeks}
                    onChange={(e) => setFormData({ ...formData, durationWeeks: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., strength, cardio, flexibility"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trainer</label>
                  <select
                    className="form-input"
                    value={formData.trainerId}
                    onChange={(e) => setFormData({ ...formData, trainerId: e.target.value })}
                  >
                    <option value="">Select Trainer</option>
                    {trainers.map(trainer => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.first_name} {trainer.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  />
                  Published
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

export default Programs;
