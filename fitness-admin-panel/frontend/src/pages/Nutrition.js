import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Nutrition = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', caloriesTarget: '', proteinTarget: '',
    carbsTarget: '', fatTarget: '', mealCount: '', dietType: '', isPublished: false
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/nutrition');
      setPlans(res.data);
    } catch (error) {
      console.error('Error fetching nutrition plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/nutrition/${editingPlan.id}`, formData);
      } else {
        await api.post('/nutrition', formData);
      }
      setShowModal(false);
      fetchPlans();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving nutrition plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || '',
      caloriesTarget: plan.calories_target,
      proteinTarget: plan.protein_target,
      carbsTarget: plan.carbs_target,
      fatTarget: plan.fat_target,
      mealCount: plan.meal_count,
      dietType: plan.diet_type || '',
      isPublished: plan.is_published === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this nutrition plan?')) {
      try {
        await api.delete(`/nutrition/${id}`);
        fetchPlans();
      } catch (error) {
        alert('Error deleting nutrition plan');
      }
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      title: '', description: '', caloriesTarget: '', proteinTarget: '',
      carbsTarget: '', fatTarget: '', mealCount: '', dietType: '', isPublished: false
    });
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Nutrition Plans</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          Add Plan
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Diet Type</th>
                <th>Calories</th>
                <th>Macros (P/C/F)</th>
                <th>Meals</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{plan.title}</div>
                    <div className="text-muted">{plan.description?.substring(0, 50)}...</div>
                  </td>
                  <td><span className="badge badge-purple">{plan.diet_type}</span></td>
                  <td>{plan.calories_target} kcal</td>
                  <td>{plan.protein_target}g / {plan.carbs_target}g / {plan.fat_target}g</td>
                  <td>{plan.meal_count}</td>
                  <td>
                    <span className={`badge ${plan.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {plan.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(plan)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(plan.id)}>Delete</button>
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
              <h3 className="modal-title">{editingPlan ? 'Edit Nutrition Plan' : 'Add Nutrition Plan'}</h3>
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
                  <label className="form-label">Calories Target</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.caloriesTarget}
                    onChange={(e) => setFormData({ ...formData, caloriesTarget: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Meals per Day</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.mealCount}
                    onChange={(e) => setFormData({ ...formData, mealCount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Protein (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.proteinTarget}
                    onChange={(e) => setFormData({ ...formData, proteinTarget: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Carbs (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.carbsTarget}
                    onChange={(e) => setFormData({ ...formData, carbsTarget: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fat (g)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.fatTarget}
                    onChange={(e) => setFormData({ ...formData, fatTarget: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Diet Type</label>
                  <select
                    className="form-input"
                    value={formData.dietType}
                    onChange={(e) => setFormData({ ...formData, dietType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="balanced">Balanced</option>
                    <option value="high-protein">High Protein</option>
                    <option value="low-carb">Low Carb</option>
                    <option value="keto">Keto</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="vegan">Vegan</option>
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

export default Nutrition;
