import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { Button, Modal, PageHeader, LoadingSpinner, EmptyState, Card } from './../components/common/UIComponents';
import MainLayout from './../layouts/MainLayout';
import principalAPI from './../api/principal.api';
import { Edit2, Trash2, Plus, Search, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import feeAPI from '../api/fee.api';

export default function StudentManagement() {
  const { isPrincipal } = useAuth();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState('all');
  const [departmentId, setDepartmentId] = useState('');
  const [paymentSummary, setPaymentSummary] = useState(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    classId: '',
    serialNumber: '',
    registrationNumber: '',
    departmentId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsRes, classesRes] = await Promise.all([
        principalAPI.getStudents(),
        principalAPI.getClasses(),
      ]);
      setStudents(studentsRes.data.students || []);
      setClasses(classesRes.data.classes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate serial number
  const generateSerialNumber = () => {
    const year = new Date().getFullYear();
    const sequenceNum = String(students.length + 1).padStart(5, '0');
    return `STU${year}${sequenceNum}`;
  };

  // Auto-generate registration number
  const generateRegistrationNumber = () => {
    const year = new Date().getFullYear();
    const sequenceNum = String(students.length + 1).padStart(5, '0');
    return `REG${year}${sequenceNum}`;
  };

  const openCreateModal = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      classId: '',
      serialNumber: generateSerialNumber(),
      registrationNumber: generateRegistrationNumber(),
    });
    setSelectedStudent(null);
    setModalType('create');
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setForm({
      name: student.fullname || student.name || '',
      email: student.email || '',
      phone: student.phone || '',
      password: '',
      classId: student.class?._id || student.classId || '',
      serialNumber: student.serialNumber,
      registrationNumber: student.registrationNumber,
    });
    setModalType('edit');
  };

  const openAssignModal = (student) => {
    setSelectedStudent(student);
    setSelectedClass('');
    setModalType('assign');
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'classId') {
      const cls = classes.find(c => c._id === value);
      if (cls && cls.department && cls.department._id) {
        setDepartmentId(cls.department._id);
        setForm(prev => ({ ...prev, departmentId: cls.department._id }));
      } else {
        setDepartmentId('');
        setForm(prev => ({ ...prev, departmentId: '' }));
      }
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error('Student name is required');
      return false;
    }
    if (!form.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Invalid email format');
      return false;
    }
    if (modalType === 'create' && !form.classId) {
      toast.error('Please assign the student to a class');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await principalAPI.createStudent({
        fullname: form.name,
        email: form.email,
        password: form.password || undefined,
        classId: form.classId,
        phone: form.phone,
        serialNumber: form.serialNumber,
        registrationNumber: form.registrationNumber,
        departmentId: form.departmentId,
      });
      toast.success(response.data.message || 'Student created successfully');
      setStudents([...students, response.data.student]);
      setModalType(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        serialNumber: '',
        registrationNumber: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await principalAPI.updateStudent(selectedStudent._id, {
        fullname: form.name,
        email: form.email,
        phone: form.phone,
      });
      toast.success(response.data.message || 'Student updated successfully');
      const updatedStudents = students.map(s =>
        s._id === selectedStudent._id ? { ...s, ...response.data.student } : s
      );
      setStudents(updatedStudents);
      setModalType(null);
      setSelectedStudent(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    try {
      setSubmitting(true);
      const response = await principalAPI.assignStudentToClass({
        studentId: selectedStudent._id,
        classId: selectedClass,
      });
      toast.success(response.data.message || 'Student assigned to class successfully');
      const updatedStudents = students.map(s =>
        s._id === selectedStudent._id ? { ...s, classId: selectedClass } : s
      );
      setStudents(updatedStudents);
      setModalType(null);
      setSelectedStudent(null);
      setSelectedClass('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;

    try {
      await principalAPI.deleteStudent?.(studentId);
      toast.success('Student deleted successfully');
      setStudents(students.filter(s => s._id !== studentId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete student');
    }
  };

  const filteredStudents = students.filter(student => {
    const query = search.toLowerCase();
    return (
      (student.fullname || student.name || '').toLowerCase().includes(query) ||
      (student.serialNumber || '').toLowerCase().includes(query) ||
      (student.registrationNumber || '').toLowerCase().includes(query)
    );
  });

  const getClassStudents = () => {
    if (!selectedClass) return [];
    return students.filter(s => s.classId === selectedClass);
  };

  const displayStudents = viewMode === 'class' ? getClassStudents() : filteredStudents;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader
          title="Student Management"
          subtitle="Create, manage, and assign students to classes"
          action={
            <Button variant="primary" onClick={openCreateModal}>
              <Plus className="inline mr-2" />
              Create Student
            </Button>
          }
        />

        {paymentSummary && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <CreditCard className="text-amber-600" size={24} />
              <div>
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Total Balance</p>
                <p className="text-xl font-bold text-amber-900">₦{paymentSummary.totalPaid.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-amber-200" />
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Paid</p>
              <p className="text-xl font-bold text-emerald-700">{paymentSummary.paidCount} students</p>
            </div>
            <div className="h-10 w-px bg-amber-200" />
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Unpaid</p>
              <p className="text-xl font-bold text-red-700">{paymentSummary.unpaidCount} students</p>
            </div>
            <div className="h-10 w-px bg-amber-200" />
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Total Students</p>
              <p className="text-xl font-bold text-slate-800">{paymentSummary.totalStudents}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, serial or registration number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Students
              </button>
              <button
                onClick={() => setViewMode('class')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'class'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Class
              </button>
            </div>
          </div>

          {viewMode === 'class' && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a class...</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Student List */}
        {displayStudents.length === 0 ? (
          <EmptyState icon="👥" text="No students found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Serial Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Registration Number</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Class</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.map((student, index) => {
                  const studentClass = classes.find(c => c._id === student.classId);
                  return (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.serialNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.registrationNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{student.fullname || student.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {studentClass?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded transition"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => openAssignModal(student)}
                            className="p-2 hover:bg-green-100 text-green-600 rounded transition"
                            title="Assign to Class"
                          >
                            📚
                          </button>
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Student Modal */}
        <Modal
          isOpen={modalType === 'create' || modalType === 'edit'}
          onClose={() => setModalType(null)}
          title={modalType === 'create' ? 'Create New Student' : 'Edit Student'}
          size="lg"
        >
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={form.serialNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={form.registrationNumber}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Enter student name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select name="classId" value={form.classId} onChange={handleFormChange} disabled={modalType === 'edit'} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a class</option>
                {classes.map((schoolClass) => <option key={schoolClass._id} value={schoolClass._id}>{schoolClass.name}</option>)}
              </select>
            </div>

            {modalType === 'create' && <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password</label>
              <input type="password" name="password" value={form.password} onChange={handleFormChange} placeholder="Issue this securely to the student" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="mt-1 text-xs text-gray-500">A username is generated automatically from the student's surname.</p>
            </div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleFormChange}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setModalType(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={modalType === 'create' ? handleCreate : handleUpdate}
                disabled={submitting}
              >
                {submitting ? <LoadingSpinner size="sm" /> : (modalType === 'create' ? 'Create' : 'Update')}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Assign to Class Modal */}
        <Modal
          isOpen={modalType === 'assign'}
          onClose={() => setModalType(null)}
          title="Assign to Class"
        >
          <form className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Assigning <span className="font-semibold">{selectedStudent?.name}</span> to a class
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">-- Choose a class --</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setModalType(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAssign}
                disabled={submitting}
              >
                {submitting ? <LoadingSpinner size="sm" /> : 'Assign'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
}
