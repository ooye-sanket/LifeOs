import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoMoonOutline,
  IoSunnyOutline,
  IoDownloadOutline,
  IoSearchOutline,
  IoEllipsisVertical,
  IoSyncOutline,
  IoTrashOutline,
  IoCloseOutline,
} from 'react-icons/io5';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import api from '../config/api';
import './TopHeader.css';

const TopHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [searchResults, setSearchResults] = useState({ tasks: [], notes: [], documents: [] });

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const menuRef = useRef(null);
  const navigate = useNavigate();

  // ✅ PWA install detection
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      console.log('📦 PWA install prompt received');
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search debounce
  useEffect(() => {
    const searchDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults({ tasks: [], notes: [], documents: [] });
      }
    }, 300);

    return () => clearTimeout(searchDebounce);
  }, [searchQuery, searchFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async () => {
    try {
      const response = await api.get(`/search?query=${searchQuery}&filter=${searchFilter}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // ✅ FINAL PWA INSTALL HANDLER
  const handleInstallPWA = async () => {
    if (isInstalled) {
      toast.error('App is already installed');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
    } else {
      toast('To install: Use browser menu → Add to Home Screen', {
        duration: 5000,
      });
    }
  };

  const handleSync = () => {
    setShowMenu(false);
    toast.loading('Syncing...', { id: 'sync' });
    setTimeout(() => {
      window.location.reload();
      toast.success('Synced successfully!', { id: 'sync' });
    }, 1000);
  };

  const handleBin = () => {
    setShowMenu(false);
    navigate('/bin');
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'checklist', label: 'Checklist' },
    { value: 'images', label: 'Images' },
    { value: 'links', label: 'Links' },
  ];

  return (
    <>
      <div className="top-header">
        <div className="top-header-left">
          <button className="icon-btn" onClick={toggleTheme}>
            {isDarkMode ? <IoSunnyOutline /> : <IoMoonOutline />}
          </button>

          {/* ✅ Always visible install button (hidden if installed) */}
          {!isInstalled && (
            <button className="icon-btn" onClick={handleInstallPWA} title="Install App">
              <IoDownloadOutline />
            </button>
          )}
        </div>

        <div className="top-header-right">
          <button className="icon-btn" onClick={() => setShowSearch(true)}>
            <IoSearchOutline />
          </button>

          <div className="menu-wrapper" ref={menuRef}>
            <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>
              <IoEllipsisVertical />
            </button>

            {showMenu && (
              <div className="dropdown-menu">
                <button className="menu-item" onClick={handleSync}>
                  <IoSyncOutline />
                  <span>Sync Now</span>
                </button>
                <button className="menu-item" onClick={handleBin}>
                  <IoTrashOutline />
                  <span>Bin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH OVERLAY */}
      {showSearch && (
        <div className="search-overlay">
          <div className="search-container">
            <div className="search-header">
              <input
                className="search-input"
                placeholder="Search tasks, notes, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="icon-btn" onClick={() => setShowSearch(false)}>
                <IoCloseOutline />
              </button>
            </div>

            <div className="search-filters">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  className={`filter-chip ${searchFilter === filter.value ? 'active' : ''}`}
                  onClick={() => setSearchFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="search-results">
              {['tasks', 'notes', 'documents'].map(
                (type) =>
                  searchResults[type].length > 0 && (
                    <div className="result-section" key={type}>
                      <h3>{type}</h3>
                      {searchResults[type].map((item) => (
                        <div
                          key={item._id}
                          className="result-item"
                          onClick={() => {
                            navigate(`/${type}`);
                            setShowSearch(false);
                          }}
                        >
                          <div className="result-title">{item.title}</div>
                          <div className="result-meta">{item.category}</div>
                        </div>
                      ))}
                    </div>
                  )
              )}

              {searchQuery &&
                searchResults.tasks.length === 0 &&
                searchResults.notes.length === 0 &&
                searchResults.documents.length === 0 && (
                  <div className="no-results">No results found</div>
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopHeader;