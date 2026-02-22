
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { IoAddOutline, IoLocationOutline, IoCloseOutline, IoTrashOutline, IoMapOutline, IoCheckmarkOutline } from 'react-icons/io5';
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
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
};

const COLORS = ['#b00eb9', '#f50092', '#ff4f6b', '#ff8e4f', '#ffc64c', '#4fc3f7'];

const Places = () => {
  const [places, setPlaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '', address: '', notes: '', color: '#b00eb9',
  });

  useEffect(() => { loadPlaces(); }, []);

  const loadPlaces = async () => {
    try {
      const res = await api.get('/places');
      setPlaces(res.data);
    } catch { toast.error('Failed to load places'); }
  };

  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng);
    setFormData(prev => ({ ...prev, address: `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}` }));
    setShowMap(false);
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

  const closeModal = () => {
    setShowModal(false);
    setShowMap(false);
    setSelectedLocation(null);
    setFormData({ name: '', address: '', notes: '', color: '#b00eb9' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this place?')) return;
    try { await api.delete(`/places/${id}`); toast.success('Deleted'); loadPlaces(); }
    catch { toast.error('Failed to delete'); }
  };

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
                <button className="delete-btn" onClick={() => handleDelete(place._id)}>
                  <IoTrashOutline />
                </button>
              </div>
              {place.address && <p className="place-address">{place.address}</p>}
              {place.notes && <p className="place-notes">{place.notes}</p>}
              {place.latitude && place.longitude && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}&zoom=15`}
                  target="_blank" rel="noopener noreferrer" className="view-map-btn"
                >
                  <IoMapOutline /> View on Map
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setShowModal(true)}>
        <IoAddOutline />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="place-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="place-modal-header">
              <h2 className="place-modal-title">Add Place</h2>
              <button className="place-modal-close" onClick={closeModal}>
                <IoCloseOutline />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* Name */}
              <div className="place-field">
                <label className="place-label">Name</label>
                <input
                  className="place-input"
                  placeholder="e.g. My Home, Office..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              {/* Color */}
              <div className="place-field">
                <label className="place-label">Color</label>
                <div className="color-row">
                  {COLORS.map(c => (
                    <button
                      key={c} type="button"
                      className={`color-dot ${formData.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setFormData({ ...formData, color: c })}
                    >
                      {formData.color === c && <IoCheckmarkOutline />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="place-field">
                <label className="place-label">Location</label>
                {selectedLocation ? (
                  <div className="location-selected">
                    <IoLocationOutline style={{ color: formData.color }} />
                    <span>{formData.address}</span>
                    <button type="button" className="change-loc-btn" onClick={() => setShowMap(true)}>Change</button>
                  </div>
                ) : (
                  <button type="button" className="select-map-btn" onClick={() => setShowMap(!showMap)}>
                    <IoMapOutline /> {showMap ? 'Hide Map' : 'Select on Map'}
                  </button>
                )}

                {showMap && (
                  <div className="map-wrapper">
                    <p className="map-hint">Tap on the map to pin your location</p>
                    <MapContainer center={[19.076, 72.8777]} zoom={13} style={{ height: 220, borderRadius: 12 }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker onLocationSelect={handleLocationSelect} />
                    </MapContainer>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="place-field">
                <label className="place-label">Notes <span className="optional">(optional)</span></label>
                <textarea
                  className="place-input place-textarea"
                  placeholder="Any extra details..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="place-modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Place</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Places;