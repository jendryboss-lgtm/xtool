import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '', slug: '', content: '', excerpt: '',
    category: '', imageUrl: '', isPublished: false
  });

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await api.get('/articles');
      setArticles(res.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await api.put(`/articles/${editingArticle.id}`, formData);
      } else {
        await api.post('/articles', formData);
      }
      setShowModal(false);
      fetchArticles();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving article');
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      category: article.category || '',
      imageUrl: article.image_url || '',
      isPublished: article.is_published === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await api.delete(`/articles/${id}`);
        fetchArticles();
      } catch (error) {
        alert('Error deleting article');
      }
    }
  };

  const resetForm = () => {
    setEditingArticle(null);
    setFormData({
      title: '', slug: '', content: '', excerpt: '',
      category: '', imageUrl: '', isPublished: false
    });
  };

  const generateSlug = (title) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  if (loading) return <div className="empty-state">Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Articles & Blog Posts</h1>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          Add Article
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Author</th>
                <th>Views</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id}>
                  <td style={{ fontWeight: 500 }}>{article.title}</td>
                  <td><span className="badge badge-info">{article.category}</span></td>
                  <td>{article.author_name}</td>
                  <td>{article.views}</td>
                  <td>
                    <span className={`badge ${article.is_published ? 'badge-success' : 'badge-warning'}`}>
                      {article.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>{format(new Date(article.created_at), 'MMM d, yyyy')}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(article)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(article.id)}>Delete</button>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingArticle ? 'Edit Article' : 'Add Article'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value)
                  })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    <option value="fitness">Fitness</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="wellness">Wellness</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="tips">Tips</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Excerpt</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the article..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-input"
                  rows="8"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Article content..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
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

export default Articles;
