import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoDocumentOutline, IoTrashOutline, IoDownloadOutline } from 'react-icons/io5';
import api from '../config/api';
import './Documents.css';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [uploading, setUploading] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    category: 'Personal',
    tags: '',
    notes: '',
    file: null,
  });

  const categories = ['All', 'Identity', 'Education', 'Medical', 'Finance', 'Work', 'Personal'];

  useEffect(() => {
    loadDocuments();
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDocuments = async () => {
    try {
      const url = selectedCategory === 'All' 
        ? '/documents' 
        : `/documents?category=${selectedCategory}`;
      const response = await api.get(url);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDoc({ ...newDoc, file, title: newDoc.title || file.name });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newDoc.file || !newDoc.title) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', newDoc.file);
    formData.append('title', newDoc.title);
    formData.append('category', newDoc.category);
    formData.append('tags', newDoc.tags);
    formData.append('notes', newDoc.notes);

    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewDoc({ title: '', category: 'Personal', tags: '', notes: '', file: null });
      setShowUpload(false);
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    
    try {
      await api.delete(`/documents/${docId}`);
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openDocument = (url) => {
    window.open(url, '_blank');
  };

  return (
    <div className="page documents-page">
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <p className="page-subtitle">Your personal vault</p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="documents-grid">
        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3 className="empty-state-title">No documents yet</h3>
            <p className="empty-state-text">Upload your first document</p>
          </div>
        ) : (
          documents.map(doc => (
            <div key={doc._id} className="document-card">
              <div className="document-icon" onClick={() => openDocument(doc.fileUrl)}>
                <IoDocumentOutline />
                <span className="file-type">{doc.fileType.split('/')[1]?.toUpperCase()}</span>
              </div>
              <div className="document-info">
                <div className="document-title">{doc.title}</div>
                <div className="document-category">{doc.category}</div>
                {doc.notes && <div className="document-notes">{doc.notes}</div>}
              </div>
              <div className="document-actions">
                <button 
                  className="doc-action-btn"
                  onClick={() => openDocument(doc.fileUrl)}
                >
                  <IoDownloadOutline />
                </button>
                <button 
                  className="doc-action-btn delete"
                  onClick={() => deleteDocument(doc._id)}
                >
                  <IoTrashOutline />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!showUpload && (
        <button className="fab" onClick={() => setShowUpload(true)}>
          <IoAddOutline />
        </button>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Upload Document</h3>
            <form onSubmit={handleUpload}>
              <div className="input-group">
                <label className="input-label">Select File</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                {newDoc.file && (
                  <div className="file-preview">{newDoc.file.name}</div>
                )}
              </div>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Document title"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                />
              </div>
              <div className="input-group">
                <select
                  className="input"
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                >
                  <option value="Identity">Identity</option>
                  <option value="Education">Education</option>
                  <option value="Medical">Medical</option>
                  <option value="Finance">Finance</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div className="input-group">
                <textarea
                  className="input"
                  placeholder="Notes (optional)"
                  value={newDoc.notes}
                  onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowUpload(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={uploading || !newDoc.file}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;