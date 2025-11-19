import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { format, addDays, startOfWeek } from 'date-fns';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date()));
  const [formData, setFormData] = useState({
    classId: '', instructorId: '', startTime: '', endTime: '',
    location: '', spotsAvailable: '', status: 'scheduled'
  });

  useEffect(() => {
    fetchSchedule();
    fetchClasses();
    fetchTrainers();
  }, [currentWeek]);

  const fetchSchedule = async () => {
    try {
      const start = format(currentWeek, 'yyyy-MM-dd');
      const end = format(addDays(currentWeek, 7), 'yyyy-MM-dd');
      const res = await api.get('/schedule', { params: { start, end } });
      setSchedule(res.data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
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
      if (editingSchedule) {
        await api.put(`/schedule/${editingSchedule.id}`, formData);
      } else {
        await api.post('/schedule', formData);
      }
      setShowModal(false);
      fetchSchedule();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving schedule');
    }
  };

  const handleEdit = (item) => {
    setEditingSchedule(item);
    setFormData({
      classId: item.class_id,
      instructorId: item.instructor_id,
      startTime: item.start_time.slice(0, 16),
      endTime: item.end_time.slice(0, 16),
      location: item.location || '',
      spotsAvailable: item.spots_available,
      status: item.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scheduled class?')) {
      try {
        await api.delete(`/schedule/${id}`);
        fetchSchedule();
      } catch (error) {
        alert('Error deleting schedule');
      }
    }
  };

  const resetForm = () => {
    setEditingSchedule(null);
    setFormData({
      classId: '', instructorId: '', startTime: '', endTime: '',
      location: '', spotsAvailable: '', status: 'scheduled'
    });
  };

  const getStatusBadge = (status) => {
    const classes = { scheduled: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };
    return <span className={`badge ${classes[status]}`}>{status}</span>;
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Class Schedule</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setCurrentWeek(addDays(currentWeek, -7))}>
            Previous
          </button>
          <span style={{ fontWeight: 500 }}>
            {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
          </span>
          <button className="btn btn-secondary" onClick={() => setCurrentWeek(addDays(currentWeek, 7))}>
            Next
          </button>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            Add Schedule
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Class</th>
                <th>Instructor</th>
                <th>Location</th>
                <th>Spots</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{format(new Date(item.start_time), 'EEE, MMM d')}</div>
                    <div className="text-muted">
                      {format(new Date(item.start_time), 'h:mm a')} - {format(new Date(item.end_time), 'h:mm a')}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{item.class_name}</div>
                    <span className="badge badge-purple">{item.class_type}</span>
                  </td>
                  <td>{item.instructor_name}</td>
                  <td>{item.location}</td>
                  <td>{item.spots_available}</td>
                  <td>{getStatusBadge(item.status)}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(item)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-state">No classes scheduled for this week</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select
                    className="form-input"
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    required
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Instructor</label>
                  <select
                    className="form-input"
                    value={formData.instructorId}
                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                    required
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
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Studio A"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Spots</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.spotsAvailable}
                    onChange={(e) => setFormData({ ...formData, spotsAvailable: e.target.value })}
                    required
                  />
                </div>
              </div>

              {editingSchedule && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

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

export default Schedule;
