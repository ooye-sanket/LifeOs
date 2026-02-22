import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoTrashOutline, IoSearchOutline } from 'react-icons/io5';
import api from '../config/api';
import './Notes.css';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [showAddNote, setShowAddNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const response = await api.get('/notes');
      setNotes(response.data);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.content.trim()) return;

    try {
      await api.post('/notes', newNote);
      setNewNote({ title: '', content: '' });
      setShowAddNote(false);
      loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    
    try {
      await api.delete(`/notes/${noteId}`);
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page notes-page">
      <div className="page-header">
        <h1 className="page-title">Notes</h1>
        <p className="page-subtitle">Your thoughts & ideas</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <IoSearchOutline className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Notes List */}
      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <h3 className="empty-state-title">No notes yet</h3>
            <p className="empty-state-text">Start capturing your thoughts</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note._id} className="note-card">
              {note.title && <div className="note-title">{note.title}</div>}
              <div className="note-content">{note.content}</div>
              <div className="note-footer">
                <div className="note-date">
                  {new Date(note.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <button 
                  className="note-delete"
                  onClick={() => deleteNote(note._id)}
                >
                  <IoTrashOutline />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!showAddNote && (
        <button className="fab" onClick={() => setShowAddNote(true)}>
          <IoAddOutline />
        </button>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="modal-overlay" onClick={() => setShowAddNote(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">New Note</h3>
            <form onSubmit={handleAddNote}>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  placeholder="Title (optional)"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                />
              </div>
              <div className="input-group">
                <textarea
                  className="input"
                  placeholder="Write your note..."
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows="8"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowAddNote(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;