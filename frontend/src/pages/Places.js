import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { IoAddOutline, IoLocationOutline, IoCloseOutline, IoTrashOutline, IoMapOutline, IoCheckmarkOutline, IoPencilOutline } from 'react-icons/io5';
import L from 'leaflet';
import api from '../config/api';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import './Places.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);
  useMapEvents({ click(e) { setPosition(e.latlng); onLocationSelect(e.latlng); } });
  return position ? <Marker position={position} /> : null;
};

const COLORS = ['#b00eb9', '#f50092', '#ff4f6b', '#ff8e4f', '#ffc64c', '#4fc3f7'];
const EMPTY_FORM = { name: '', address: '', notes: '', color: '#b00eb9' };

const Places = () => {
  const [places, setPlaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  // Edit state
  const [editingPlace, setEditingPlace] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [showEditMap, setShowEditMap] = useState(false);
  const [editLocation, setEditLocation] = useState(null);

  useEffect(() => { loadPlaces(); }, []);

  const loadPlaces = async () => {
    try { const res = await api.get('/places'); setPlaces(res.data); }
    catch { toast.error('Failed to load places'); }
  };

  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng);
    setFormData(prev => ({ ...prev, address: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` }));
    setShowMap(false);
  };

  const handleEditLocationSelect = (latlng) => {
    setEditLocation(latlng);
    setEditForm(prev => ({ ...prev, address: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` }));
    setShowEditMap(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) { toast.error('Please select a location on the map'); return; }
    try {
      await api.post('/places', { ...formData, latitude: selectedLocation.lat, longitude: selectedLocation.lng });
      toast.success('Place added!');
      closeModal();
      loadPlaces();
    } catch { toast.error('Failed to add place'); }
  };

  const openEdit = (place) => {
    setEditingPlace(place);
    setEditForm({ name: place.name, address: place.address || '', notes: place.notes || '', color: place.color || '#b00eb9' });
    setEditLocation(place.latitude && place.longitude ? { lat: place.latitude, lng: place.longitude } : null);
    setShowEditMap(false);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      const loc = editLocation || { lat: editingPlace.latitude, lng: editingPlace.longitude };
      await api.put(`/places/${editingPlace._id}`, { ...editForm, latitude: loc.lat, longitude: loc.lng });
      toast.success('Place updated!');
      setEditingPlace(null);
      loadPlaces();
    } catch { toast.error('Failed to update place'); }
  };

  const closeModal = () => {
    setShowModal(false); setShowMap(false);
    setSelectedLocation(null); setFormData(EMPTY_FORM);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this place?')) return;
    try { await api.delete(`/places/${id}`); toast.success('Deleted'); loadPlaces(); }
    catch { toast.error('Failed to delete'); }
  };

  const PlaceForm = ({ value, onChange, onSubmit, onCancel, title, submitLabel, showMapState, setShowMapState, locationState, onLocationPick, existingCoords }) => (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="place-modal" onClick={e => e.stopPropagation()}>
        <div className="place-modal-header">
          <h2 className="place-modal-title">{title}</h2>
          <button className="place-modal-close" onClick={onCancel}><IoCloseOutline /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="place-field">
            <label className="place-label">Name</label>
            <input className="place-input" placeholder="e.g. My Home, Office..." value={value.name}
              onChange={e => onChange({...value, name: e.target.value})} required autoFocus />
          </div>
          <div className="place-field">
            <label className="place-label">Color</label>
            <div className="color-row">
              {COLORS.map(c => (
                <button key={c} type="button" className={`color-dot ${value.color===c?'active':''}`}
                  style={{ background: c }} onClick={() => onChange({...value, color: c})}>
                  {value.color===c && <IoCheckmarkOutline />}
                </button>
              ))}
            </div>
          </div>
          <div className="place-field">
            <label className="place-label">Location</label>
            {(locationState || existingCoords) ? (
              <div className="location-selected">
                <IoLocationOutline style={{ color: value.color }} />
                <span>{value.address}</span>
                <button type="button" className="change-loc-btn" onClick={() => setShowMapState(true)}>Change</button>
              </div>
            ) : (
              <button type="button" className="select-map-btn" onClick={() => setShowMapState(!showMapState)}>
                <IoMapOutline /> {showMapState ? 'Hide Map' : 'Select on Map'}
              </button>
            )}
            {showMapState && (
              <div className="map-wrapper">
                <p className="map-hint">Tap on the map to pin your location</p>
                <MapContainer center={existingCoords ? [existingCoords.lat, existingCoords.lng] : [19.076, 72.8777]} zoom={13} style={{ height: 220, borderRadius: 12 }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker onLocationSelect={onLocationPick} />
                </MapContainer>
              </div>
            )}
          </div>
          <div className="place-field">
            <label className="place-label">Notes <span className="optional">(optional)</span></label>
            <textarea className="place-input place-textarea" placeholder="Any extra details..." value={value.notes}
              onChange={e => onChange({...value, notes: e.target.value})} rows={2} />
          </div>
          <div className="place-modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="page places-page">
      <div className="page-header">
        <h1 className="page-title">Places</h1>
        <p className="page-subtitle">Your saved locations</p>
      </div>

      {places.length === 0 ? (
        <div className="empty-state">
          <IoLocationOutline style={{ fontSize: 56, color: 'var(--gray-600)' }} />
          <h3 className="empty-state-title">No places saved</h3>
          <p className="empty-state-text">Tap + to add your first place</p>
        </div>
      ) : (
        <div className="places-grid">
          {places.map(place => (
            <div key={place._id} className="place-card" style={{ borderLeftColor: place.color }}>
              <div className="place-card-top">
                <IoLocationOutline style={{ color: place.color, fontSize: 24 }} />
                <div className="place-info">
                  <h3 className="place-name">{place.name}</h3>
                </div>
                <button className="edit-btn-sm" onClick={() => openEdit(place)} title="Edit">
                  <IoPencilOutline />
                </button>
                <button className="delete-btn" onClick={() => handleDelete(place._id)}>
                  <IoTrashOutline />
                </button>
              </div>
              {place.address && <p className="place-address">{place.address}</p>}
              {place.notes && <p className="place-notes">{place.notes}</p>}
              {place.latitude && place.longitude && (
                <a href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}&zoom=15`}
                  target="_blank" rel="noopener noreferrer" className="view-map-btn">
                  <IoMapOutline /> View on Map
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowModal(true)}><IoAddOutline /></button>

      {showModal && (
        <PlaceForm value={formData} onChange={setFormData} onSubmit={handleSubmit} onCancel={closeModal}
          title="Add Place" submitLabel="Add Place"
          showMapState={showMap} setShowMapState={setShowMap}
          locationState={selectedLocation} onLocationPick={handleLocationSelect} />
      )}

      {editingPlace && (
        <PlaceForm value={editForm} onChange={setEditForm} onSubmit={handleEditSave}
          onCancel={() => { setEditingPlace(null); setShowEditMap(false); }}
          title="Edit Place" submitLabel="Save Changes"
          showMapState={showEditMap} setShowMapState={setShowEditMap}
          locationState={editLocation}
          existingCoords={editingPlace.latitude ? { lat: editingPlace.latitude, lng: editingPlace.longitude } : null}
          onLocationPick={handleEditLocationSelect} />
      )}
    </div>
  );
};

export default Places;