import React, { useState, useEffect } from 'react';
import { getModels, getProviderModels, createModel, updateModel, deleteModel } from '../services/api';

function ModelManager() {
  const [models, setModels] = useState([]);
  const [providerModels, setProviderModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    customName: '',
    providerName: '',
    brandName: 'Sahyog',
    permissions: '',
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [modelsRes, providersRes] = await Promise.all([
        getModels(),
        getProviderModels(),
      ]);
      setModels(modelsRes.data.models || []);
      setProviderModels(providersRes.data.models || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createModel(formData);
      setFormData({ customName: '', providerName: '', brandName: 'Sahyog', permissions: '', isActive: true });
      setShowCreate(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create model');
    }
  };

  const handleEdit = (model) => {
    setEditingId(model.id);
    setFormData({
      customName: model.customName,
      providerName: model.providerName,
      brandName: model.brandName || 'Sahyog',
      permissions: model.permissions || '',
      isActive: model.isActive,
    });
    setShowCreate(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateModel(editingId, formData);
      setFormData({ customName: '', providerName: '', brandName: 'Sahyog', permissions: '', isActive: true });
      setShowCreate(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update model');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this model?')) return;
    try {
      await deleteModel(id);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete model');
    }
  };

  const handleCancel = () => {
    setShowCreate(false);
    setEditingId(null);
    setFormData({ customName: '', providerName: '', brandName: 'Sahyog', isActive: true });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Model Management</h1>
        {!showCreate && (
          <button
            onClick={() => {
              setShowCreate(true);
              setEditingId(null);
              setFormData({ customName: '', providerName: '', brandName: 'Sahyog', permissions: '', isActive: true });
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Create Model
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee', color: '#c00', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '2rem',
          }}
        >
          <h2>{editingId ? 'Edit Model' : 'Create New Model'}</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Custom Name (what users will see) *
            </label>
            <input
              type="text"
              value={formData.customName}
              onChange={(e) => setFormData({ ...formData, customName: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="e.g., Sahyog v2"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Provider Model (from kyvex.ai) *
            </label>
            <select
              value={formData.providerName}
              onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">Select a provider model...</option>
              {providerModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </option>
              ))}
            </select>
            {providerModels.length === 0 && (
              <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                No provider models available. Make sure you have at least one active API key.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Brand Name
            </label>
            <input
              type="text"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="Sahyog"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Permissions (one per line or comma-separated)
            </label>
            <textarea
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px', fontFamily: 'inherit' }}
              placeholder="e.g., Image upload supported&#10;Video generation supported&#10;Document upload supported"
            />
            <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Describe what this model supports (e.g., "Image upload", "Video generation", "Document processing")
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Active (visible to users)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {models.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', background: 'white', borderRadius: '8px' }}>
          <p>No models yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Custom Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Provider Model</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Brand Name</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Permissions</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem' }}>{model.customName}</td>
                  <td style={{ padding: '1rem' }}>{model.providerName}</td>
                  <td style={{ padding: '1rem' }}>{model.brandName}</td>
                  <td style={{ padding: '1rem', maxWidth: '200px', fontSize: '0.9rem' }}>
                    {model.permissions ? (
                      <div style={{ whiteSpace: 'pre-wrap', color: '#666' }}>
                        {model.permissions.split(/[\n,]/).map((p, i) => (
                          <div key={i} style={{ marginBottom: '0.25rem' }}>{p.trim()}</div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>No permissions set</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: model.isActive ? '#d4edda' : '#f8d7da',
                        color: model.isActive ? '#155724' : '#721c24',
                      }}
                    >
                      {model.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(model)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(model.id)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ModelManager;


