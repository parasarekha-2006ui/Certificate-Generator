import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Award, 
  Filter, 
  X,
  Mail,
  Phone,
  Building2,
  BookOpen
} from 'lucide-react';
import { studentService } from '../services/api';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    college: '',
    department: '',
    year: '',
    email: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedDept, selectedYear]);

  const loadFilterOptions = async () => {
    try {
      const [deptRes, yearRes] = await Promise.all([
        studentService.getDepartments(),
        studentService.getYears(),
      ]);
      if (deptRes.success) setDepartments(deptRes.departments || []);
      if (yearRes.success) setYears(yearRes.years || []);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAll({
        search: searchTerm,
        department: selectedDept,
        year: selectedYear,
      });
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      addToast('Failed to load students list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      student_id: `STU${new Date().getFullYear()}${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      college: 'Apex Institute of Technology',
      department: 'Computer Science and Engineering',
      year: '3rd Year',
      email: '',
      phone: '',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      college: student.college,
      department: student.department,
      year: student.year,
      email: student.email,
      phone: student.phone,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!/^\+?[0-9]{7,15}$/.test(cleanPhone)) {
      setFormError('Please enter a valid phone number (7-15 digits).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        const res = await studentService.update(editingStudent.id, formData);
        if (res.success) {
          addToast(`Student '${formData.name}' updated successfully!`, 'success');
          setIsFormOpen(false);
          loadStudents();
          loadFilterOptions();
        }
      } else {
        const res = await studentService.create(formData);
        if (res.success) {
          addToast(`Student '${formData.name}' registered successfully!`, 'success');
          setIsFormOpen(false);
          loadStudents();
          loadFilterOptions();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving student. Please check student ID uniqueness.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      const res = await studentService.delete(deletingStudent.id);
      if (res.success) {
        addToast(`Student '${deletingStudent.name}' deleted.`, 'info');
        setDeletingStudent(null);
        loadStudents();
      }
    } catch (err) {
      addToast('Failed to delete student.', 'error');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Directory</h1>
          <p className="page-desc">Manage enrolled students, academic departments, and contact credentials.</p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={16} />
          <span>Add New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by student ID, name, email or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="filter-select"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select 
          className="filter-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {(searchTerm || selectedDept || selectedYear) && (
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchTerm('');
              setSelectedDept('');
              setSelectedYear('');
            }}
          >
            <X size={14} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Students Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <LoadingSpinner text="Retrieving student records..." />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students match criteria"
            description="Try modifying search keywords or add a new student record to get started."
            actionLabel="Add Student"
            onAction={openAddModal}
          />
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>College & Department</th>
                  <th>Year</th>
                  <th>Contact Details</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <span className="badge badge-info" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {student.student_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student.name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{student.college}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.department}</div>
                    </td>
                    <td>
                      <span className="badge badge-purple">{student.year}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <Mail size={12} />
                        <span>{student.email}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                        <Phone size={12} />
                        <span>{student.phone}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => navigate(`/generate?studentId=${student.id}`)}
                          className="btn btn-outline btn-sm"
                          title="Generate Certificate for Student"
                          style={{ color: 'var(--primary)', borderColor: 'rgba(30, 58, 138, 0.2)' }}
                        >
                          <Award size={14} />
                          <span>Certify</span>
                        </button>
                        <button
                          onClick={() => openEditModal(student)}
                          className="btn btn-outline btn-sm"
                          title="Edit Student"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          className="btn btn-danger btn-sm"
                          title="Delete Student"
                        >
                          <Trash2 size={14} />
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

      {/* Add / Edit Student Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingStudent ? 'Edit Student Details' : 'Register New Student'}
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
                    border: '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {formError}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Student ID (Unique) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      placeholder="e.g. STU2026042"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sneha Sharma"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">College / Institution *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    placeholder="e.g. Apex Institute of Technology"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g. Computer Science and Engineering"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year of Study *</label>
                    <select
                      className="form-control"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="PG 1st Year">PG 1st Year</option>
                      <option value="PG 2nd Year">PG 2nd Year</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="sneha@example.com"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="9876543210"
                      required
                    />
                  </div>
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
                  {isSubmitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingStudent}
        title="Delete Student Record"
        message={`Are you sure you want to delete ${deletingStudent?.name} (${deletingStudent?.student_id})? This will permanently remove the student from the directory.`}
        confirmText="Delete Student"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudent(null)}
      />
    </div>
  );
}
