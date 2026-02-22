import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoTrashOutline, IoCheckmarkOutline, IoCloseOutline, IoListOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import './Checklist.css';

// Stored in localStorage since this is a lightweight feature
const STORAGE_KEY = 'app_checklists';

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const saveToStorage = (lists) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
};

const genId = () => Math.random().toString(36).slice(2, 9);

const Checklist = () => {
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    const stored = loadFromStorage();
    setLists(stored);
    if (stored.length > 0) setActiveList(stored[0].id);
  }, []);

  const persist = (updated) => {
    setLists(updated);
    saveToStorage(updated);
  };

  const createList = () => {
    if (!newListName.trim()) return;
    const newList = { id: genId(), name: newListName.trim(), items: [], createdAt: Date.now() };
    const updated = [newList, ...lists];
    persist(updated);
    setActiveList(newList.id);
    setNewListName('');
    setShowNewList(false);
    toast.success('Checklist created!');
  };

  const deleteList = (listId) => {
    if (!window.confirm('Delete this checklist?')) return;
    const updated = lists.filter(l => l.id !== listId);
    persist(updated);
    setActiveList(updated.length > 0 ? updated[0].id : null);
    toast.success('Deleted');
  };

  const addItem = (listId) => {
    if (!newItemText.trim()) return;
    const updated = lists.map(l => l.id === listId
      ? { ...l, items: [...l.items, { id: genId(), text: newItemText.trim(), checked: false }] }
      : l
    );
    persist(updated);
    setNewItemText('');
  };

  const toggleItem = (listId, itemId) => {
    const updated = lists.map(l => l.id === listId
      ? { ...l, items: l.items.map(it => it.id === itemId ? { ...it, checked: !it.checked } : it) }
      : l
    );
    persist(updated);
  };

  const deleteItem = (listId, itemId) => {
    const updated = lists.map(l => l.id === listId
      ? { ...l, items: l.items.filter(it => it.id !== itemId) }
      : l
    );
    persist(updated);
  };

  const clearChecked = (listId) => {
    const updated = lists.map(l => l.id === listId
      ? { ...l, items: l.items.filter(it => !it.checked) }
      : l
    );
    persist(updated);
    toast.success('Cleared checked items');
  };

  const current = lists.find(l => l.id === activeList);
  const checkedCount = current ? current.items.filter(i => i.checked).length : 0;

  return (
    <div className="page checklist-page">
      <div className="page-header">
        <h1 className="page-title">Checklists</h1>
        <p className="page-subtitle">Groceries, packing, to-buy & more</p>
      </div>

      {/* List tabs */}
      <div className="cl-tabs">
        {lists.map(l => (
          <button key={l.id} className={`cl-tab ${l.id === activeList ? 'active' : ''}`} onClick={() => setActiveList(l.id)}>
            {l.name}
            <span className="cl-tab-count">{l.items.filter(i => !i.checked).length}</span>
          </button>
        ))}
        <button className="cl-tab cl-tab-new" onClick={() => setShowNewList(true)}>
          <IoAddOutline /> New
        </button>
      </div>

      {/* New list form */}
      {showNewList && (
        <div className="cl-new-list-form">
          <input
            autoFocus
            className="input"
            placeholder="e.g. Grocery list, Packing list..."
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createList(); if (e.key === 'Escape') setShowNewList(false); }}
          />
          <div className="cl-new-list-actions">
            <button className="btn btn-ghost" onClick={() => setShowNewList(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={createList}>Create</button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {lists.length === 0 && !showNewList && (
        <div className="empty-state">
          <IoListOutline className="empty-state-icon" style={{ fontSize: 56, color: 'var(--gray-600)' }} />
          <h3 className="empty-state-title">No checklists yet</h3>
          <p className="empty-state-text">Create one for groceries, packing, shopping and more</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowNewList(true)}>
            Create Checklist
          </button>
        </div>
      )}

      {/* Active list */}
      {current && (
        <div className="cl-list-body">
          <div className="cl-list-header">
            <span className="cl-list-title">{current.name}</span>
            <div className="cl-list-actions">
              {checkedCount > 0 && (
                <button className="cl-action-btn" onClick={() => clearChecked(current.id)}>
                  Clear done ({checkedCount})
                </button>
              )}
              <button className="cl-action-btn danger" onClick={() => deleteList(current.id)}>
                <IoTrashOutline />
              </button>
            </div>
          </div>

          {/* Add item input */}
          <div className="cl-add-item">
            <input
              className="input"
              placeholder="Add item..."
              value={newItemText}
              onChange={e => setNewItemText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addItem(current.id); }}
            />
            <button className="cl-add-btn" onClick={() => addItem(current.id)}>
              <IoAddOutline />
            </button>
          </div>

          {/* Items */}
          <div className="cl-items">
            {current.items.length === 0 && (
              <p className="cl-empty-msg">No items yet. Type above to add one.</p>
            )}
            {current.items.filter(i => !i.checked).map(item => (
              <div key={item.id} className="cl-item">
                <button className="cl-check" onClick={() => toggleItem(current.id, item.id)}>
                  <div className="cl-checkbox" />
                </button>
                <span className="cl-item-text">{item.text}</span>
                <button className="cl-delete" onClick={() => deleteItem(current.id, item.id)}>
                  <IoCloseOutline />
                </button>
              </div>
            ))}

            {/* Checked items at bottom */}
            {current.items.filter(i => i.checked).map(item => (
              <div key={item.id} className="cl-item checked">
                <button className="cl-check" onClick={() => toggleItem(current.id, item.id)}>
                  <div className="cl-checkbox checked"><IoCheckmarkOutline /></div>
                </button>
                <span className="cl-item-text">{item.text}</span>
                <button className="cl-delete" onClick={() => deleteItem(current.id, item.id)}>
                  <IoCloseOutline />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklist;