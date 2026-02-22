import React, { useState, useEffect } from 'react';
import { IoTrashOutline, IoRefreshOutline, IoTrashBinOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import './Bin.css';

const Bin = () => {
  const [deletedItems, setDeletedItems] = useState([]);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  const loadDeletedItems = () => {
    // Load deleted items from localStorage
    const items = JSON.parse(localStorage.getItem('deletedItems') || '[]');
    setDeletedItems(items);
  };

  const restoreItem = (index) => {
    const items = [...deletedItems];
    const restored = items.splice(index, 1)[0];
    setDeletedItems(items);
    localStorage.setItem('deletedItems', JSON.stringify(items));
    toast.success(`${restored.type} restored`);
  };

  const permanentlyDelete = (index) => {
    if (window.confirm('Permanently delete this item? This cannot be undone.')) {
      const items = [...deletedItems];
      items.splice(index, 1);
      setDeletedItems(items);
      localStorage.setItem('deletedItems', JSON.stringify(items));
      toast.success('Item permanently deleted');
    }
  };

  const emptyBin = () => {
    if (window.confirm('Empty entire bin? This cannot be undone.')) {
      setDeletedItems([]);
      localStorage.setItem('deletedItems', JSON.stringify([]));
      toast.success('Bin emptied');
    }
  };

  return (
    <div className="page bin-page">
      <div className="page-header">
        <h1 className="page-title">Bin</h1>
        <p className="page-subtitle">{deletedItems.length} items in bin</p>
      </div>

      {deletedItems.length > 0 && (
        <button className="empty-bin-btn" onClick={emptyBin}>
          <IoTrashBinOutline />
          <span>Empty Bin</span>
        </button>
      )}

      {deletedItems.length === 0 ? (
        <div className="empty-state">
          <IoTrashOutline className="empty-state-icon" />
          <h3 className="empty-state-title">Bin is empty</h3>
          <p className="empty-state-text">Deleted items will appear here</p>
        </div>
      ) : (
        <div className="bin-items">
          {deletedItems.map((item, index) => (
            <div key={index} className="bin-item">
              <div className="bin-item-info">
                <div className="bin-item-type">{item.type}</div>
                <div className="bin-item-title">{item.title}</div>
                <div className="bin-item-date">
                  Deleted {new Date(item.deletedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="bin-item-actions">
                <button
                  className="bin-action-btn restore-btn"
                  onClick={() => restoreItem(index)}
                  title="Restore"
                >
                  <IoRefreshOutline />
                </button>
                <button
                  className="bin-action-btn delete-btn"
                  onClick={() => permanentlyDelete(index)}
                  title="Delete permanently"
                >
                  <IoTrashOutline />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bin-note">
        <p>Items in the bin are stored locally and will be permanently deleted after 30 days.</p>
      </div>
    </div>
  );
};

export default Bin;