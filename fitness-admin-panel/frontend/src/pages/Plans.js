import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', durationMonths: '', features: '', isActive: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, formData);
      } else {
        await api.post('/plans', formData);
      }
      setShowModal(false);
      fetchPlans();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      durationMonths: plan.duration_months,
      features: plan.features || '',
      isActive: plan.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this membership plan?')) {
      try {
        await api.delete(`/plans/${id}`);
        fetchPlans();
      } catch (error) {
        alert('Error deleting plan');
      }
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      name: '', description: '', price: '', durationMonths: '', features: '', isActive: true
    });
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Membership Plans</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          Add Plan
        </button>
      </div>

      <div className="stats-grid">
        {plans.map(plan => (
          <div key={plan.id} className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{plan.name}</h3>
                <span className={`badge ${plan.is_active ? 'badge-success' : 'badge-warning'}`}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#6366f1' }}>${plan.price}</div>
                <div className="text-muted">/{plan.duration_months === 1 ? 'month' : `${plan.duration_months} months`}</div>
              </div>
            </div>

            <p className="text-muted mb-4" style={{ fontSize: 14 }}>{plan.description}</p>

            {plan.features && (
              <div className="mb-4">
                <h4 style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', color: '#64748b' }}>
                  Features
                </h4>
                <ul style={{ listStyle: 'none', fontSize: 14 }}>
                  {plan.features.split(',').map((feature, i) => (
                    <li key={i} style={{ padding: '4px 0' }}>
                      <span style={{ color: '#16a34a', marginRight: 8 }}>&#10003;</span>
                      {feature.trim()}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="action-btns" style={{ marginTop: 'auto' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(plan)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingPlan ? 'Edit Plan' : 'Add Plan'}</h3>
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
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (months)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.durationMonths}
                    onChange={(e) => setFormData({ ...formData, durationMonths: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Features (comma-separated)</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Gym access, All classes, Personal trainer..."
                />
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

export default Plans;
