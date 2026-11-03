import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Award, 
  UploadCloud, 
  Clock, 
  UserCheck, 
  X,
  FileText
} from 'lucide-react';
import { eventService } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    event_date: '',
    description: '',
    issuing_authority: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getAll();
      if (res.success) {
        setEvents(res.events || []);
      }
    } catch (err) {
      addToast('Failed to load events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      event_date: new Date().toISOString().split('T')[0],
      description: '',
      issuing_authority: 'Prof. Dr. R. K. Sharma, Dean of Academic Affairs',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      event_date: event.event_date ? String(event.event_date).split('T')[0] : '',
      description: event.description || '',
      issuing_authority: event.issuing_authority,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.event_date || !formData.issuing_authority) {
      setFormError('Event name, date, and issuing authority are mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingEvent) {
        const res = await eventService.update(editingEvent.id, formData);
        if (res.success) {
          addToast(`Event '${formData.name}' updated!`, 'success');
          setIsFormOpen(false);
          loadEvents();
        }
      } else {
        const res = await eventService.create(formData);
        if (res.success) {
          addToast(`Event '${formData.name}' scheduled successfully!`, 'success');
          setIsFormOpen(false);
          loadEvents();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving event.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEvent) return;
    try {
      const res = await eventService.delete(deletingEvent.id);
      if (res.success) {
        addToast(`Event '${deletingEvent.name}' deleted.`, 'info');
        setDeletingEvent(null);
        loadEvents();
      }
    } catch (err) {
      addToast('Failed to delete event.', 'error');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">College Events</h1>
          <p className="page-desc">Create and oversee symposiums, workshops, seminars, and technical hackathons.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} />
          <span>Add New Event</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading college events..." />
      ) : events.length === 0 ? (
        <EmptyState
          title="No events found"
          description="Create your first event to start issuing participation and achievement certificates."
          actionLabel="Create Event"
          onAction={openAddModal}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {events.map((event) => (
            <div key={event.id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: 0 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {event.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button onClick={() => openEditModal(event)} className="btn btn-outline btn-sm" title="Edit Event">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeletingEvent(event)} className="btn btn-danger btn-sm" title="Delete Event">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.65rem' }}>
                  <Calendar size={14} />
                  <span>{String(event.event_date).split('T')[0]}</span>
                </div>

                {event.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1rem' }}>
                    {event.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-light)', background: 'var(--background)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <UserCheck size={14} color="var(--secondary)" />
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>Authority: {event.issuing_authority}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)', display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => navigate(`/generate?eventId=${event.id}`)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Award size={14} />
                  <span>Generate Single</span>
                </button>
                <button
                  onClick={() => navigate(`/bulk?eventId=${event.id}`)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <UploadCloud size={14} />
                  <span>Bulk Upload</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEvent ? 'Edit Event Details' : 'Schedule New Event'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} style={{ color: 'var(--text-light)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    backgroundColor: 'var(--danger-bg)',
                    color: 'var(--danger)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                  }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Event Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Annual Tech Symposium & Hackathon 2026"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Issuing Authority / Signatory *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.issuing_authority}
                      onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
                      placeholder="e.g. Dr. R. K. Sharma, Dean of Academic Affairs"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Event Description & Scope</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the event, workshop topics or hackathon problem statements..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Event Confirm Modal */}
      <ConfirmModal
        isOpen={!!deletingEvent}
        title="Delete Event"
        message={`Are you sure you want to delete the event '${deletingEvent?.name}'? Note that existing certificates issued for this event will remain in history.`}
        confirmText="Delete Event"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingEvent(null)}
      />
    </div>
  );
}
