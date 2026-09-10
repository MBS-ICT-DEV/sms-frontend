import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminAPI from '../../api/admin.api';
import { CheckSquare, Filter, Users, UserCheck, UserX, RefreshCw } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

export default function HoaAttendancePage() {
  const [records, setRecords]     = useState([]);
  const [classes, setClasses]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [classId, setClassId]     = useState('');
  const [date, setDate]           = useState(today());

  useEffect(() => {
    adminAPI.getClasses()
      .then(({ data }) => setClasses(data.classes || []))
      .catch(() => {});
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (classId) params.classId = classId;
      if (date)    params.date    = date;
      const { data } = await adminAPI.getAttendanceView(params);
      setRecords(data.records || []);
    } catch {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendance(); }, []);

  const present = records.filter(r => r.status === 'Present').length;
  const absent  = records.filter(r => r.status === 'Absent').length;
  const total   = records.length;
  const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CheckSquare size={22} className="text-teal-600" /> Attendance
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">View daily attendance records across all classes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-700">
          <Filter size={16} /> Filter Records
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={classId} onChange={e => setClassId(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
          >
            <option value="">All Classes</option>
            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            value={date} onChange={e => setDate(e.target.value)}
            max={today()}
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <Users size={20} className="text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-gray-500">Total Records</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <UserCheck size={20} className="text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{present}</p>
            <p className="text-xs text-gray-500">Present</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <UserX size={20} className="text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-500">{absent}</p>
            <p className="text-xs text-gray-500">Absent</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
            <CheckSquare size={20} className="text-teal-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-teal-600">{rate}%</p>
            <p className="text-xs text-gray-500">Attendance Rate</p>

import {
  CheckSquare,
  Filter,
  Users,
  RefreshCw,
  ListCheck,
  Plus,
  X,
} from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const describeError = (error, fallback) => {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.message;

  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return serverMessage || "You don't have permission to do this.";
  return serverMessage || fallback;
};

export default function HoaAttendancePage() {
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);

  const [loadingStudents, setLoadingStudents] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [creatingSection, setCreatingSection] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today());
  const [attendance, setAttendance] = useState({});
  const [sectionForm, setSectionForm] = useState({ name: '', code: '', description: '' });

  // =====================================================
  // LOAD CLASSES AND SECTIONS
  // =====================================================
  const fetchClasses = async () => {
    try {
      const [classesRes, sectionsRes] = await Promise.all([
        adminAPI.getClasses(),
        adminAPI.getSections(),
      ]);

      setClasses(classesRes.data.classes || []);
      setSections(sectionsRes.data.sections || []);
    } catch (error) {
      console.error('Failed to load classes:', error?.response?.status, error?.response?.data || error);
      toast.error(describeError(error, 'Failed to load classes'));
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const openSectionModal = () => {
    setSectionForm({ name: '', code: '', description: '' });
    setShowSectionModal(true);
  };

  const handleSectionFormChange = (event) => {
    const { name, value } = event.target;
    setSectionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSection = async () => {
    const name = sectionForm.name.trim();
    const code = sectionForm.code.trim();

    if (!name) {
      toast.error('Section name is required');
      return;
    }

    if (!code) {
      toast.error('Section code is required');
      return;
    }

    try {
      setCreatingSection(true);
      const response = await adminAPI.createSection({
        name,
        code,
        description: sectionForm.description.trim(),
      });

      const createdSection = response.data.section;
      setSections((prev) => [...prev, createdSection].sort((a, b) => a.name.localeCompare(b.name)));
      setShowSectionModal(false);
      setSectionForm({ name: '', code: '', description: '' });
      toast.success(response.data.message || 'Section created successfully');
    } catch (error) {
      toast.error(describeError(error, 'Failed to create section'));
    } finally {
      setCreatingSection(false);
    }
  };

  // CLASS CHANGE — fetch the student roster ONLY.
  // No attendance lookup here; this page marks fresh, it doesn't view history.
  const handleClassChange = async (selectedClassId) => {
    setClassId(selectedClassId);
    setStudents([]);
    setAttendance({});

    if (!selectedClassId) {
      return;
    }

    try {
      setLoadingStudents(true);

      const { data } =
        await adminAPI.getClassStudentsForAttendance({
          classId: selectedClassId,
        });

      const loadedStudents = data?.students || [];

      setStudents(loadedStudents);

      const initialAttendance = {};

      loadedStudents.forEach((student) => {
        initialAttendance[student._id] = '';
      });

      setAttendance(initialAttendance);
    } catch (error) {
      console.error(
        'Failed to load class students:',
        error
      );

      toast.error(
        describeError(
          error,
          'Failed to load class students'
        )
      );

      setStudents([]);
      setAttendance({});
    } finally {
      setLoadingStudents(false);
    }
  };
  // =====================================================
  // DATE CHANGE — just resets marks; date only matters when we submit.
  // =====================================================
  const handleDateChange = (e) => {
    setDate(e.target.value);
    setAttendance({});
  };

  // =====================================================
  // INDIVIDUAL ATTENDANCE
  // =====================================================
  const markAttendance = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // =====================================================
  // MARK ALL ATTENDANCE
  // =====================================================
  const markAllAttendance = (status) => {
    if (!students.length) {
      toast.error('No students available');
      return;
    }

    const newAttendance = {};
    students.forEach((student) => {
      newAttendance[student._id] = status;
    });

    setAttendance(newAttendance);
  };

  // =====================================================
  // SUBMIT ATTENDANCE — push to DB. Viewing happens on the History page.
  // =====================================================
  const submitAttendance = async () => {
  const attendanceData = students.map((student) => ({
    studentId: student._id,
    status: attendance[student._id],
  }));

  try {
    setMarkingAttendance(true);
    const response = await adminAPI.markClassAttendance({ classId, date, attendance: attendanceData });
    toast.success(response?.data?.message || 'Attendance saved successfully');
    setAttendance({});
  } catch (error) {
    toast.error(describeError(error, 'Failed to mark attendance'));
  } finally {
    setMarkingAttendance(false);
  }
};
  const groupedClasses = classes.reduce((acc, classItem) => {
    const sectionName = classItem?.section?.name || 'Unassigned';
    if (!acc[sectionName]) acc[sectionName] = [];
    acc[sectionName].push(classItem);
    return acc;
  }, {});

  const uniqueSectionOrder = Object.keys(groupedClasses).sort((a, b) => a.localeCompare(b));

  // SUMMARY (based on what's currently marked, not on saved history)
  const markedCount = students.filter((s) => attendance[s._id]).length;

  // RENDER
  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CheckSquare size={22} className="text-teal-600" />
          Mark Attendance
        </h1>

        <p className="mt-0.5 text-sm text-gray-500">
          Select a class and date, then mark each student present or absent
        </p>
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} />
          Class & Date
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={classId}
            onChange={(e) => handleClassChange(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">Select Class</option>
            {uniqueSectionOrder.map((sectionName) => (
              <optgroup key={sectionName} label={sectionName}>
                {groupedClasses[sectionName].map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name}
                  </option>
                ))}
              </optgroup>
            ))}
            {!classes.length && <option value="" disabled>No classes available</option>}
          </select>

          <button
            type="button"
            onClick={openSectionModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
          >
            <Plus size={16} />
            Create Section
          </button>

          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            max={today()}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* SELECTED CLASS */}
      {classId && (
        <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
              <Users size={20} className="text-teal-600" />
            </div>

            <div>
              <p className="text-xs font-medium text-teal-600">SELECTED CLASS</p>
              <p className="font-semibold text-gray-900">
                {classes.find((item) => item._id === classId)?.name || 'Selected Class'}
              </p>
            </div>

            {!loadingStudents && (
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-teal-700">{students.length}</p>
                <p className="text-xs text-gray-500">Students</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Records table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-14 border border-gray-100" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <CheckSquare size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No attendance records found</p>
          <p className="text-gray-400 text-sm mt-1">Try selecting a different class or date</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Reg. Number</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Class</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden lg:table-cell">Marked By</th>
                  <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${r.status === 'Present' ? 'bg-green-500' : 'bg-red-400'}`}>
                          {r.student?.fullname?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-gray-900 truncate">{r.student?.fullname ?? 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs hidden sm:table-cell">{r.student?.registrationNumber ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 hidden md:table-cell">{r.class?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600 hidden lg:table-cell">{r.markedBy?.fullname ?? '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${r.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs hidden xl:table-cell">
                      {new Date(r.date).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            {records.length} record{records.length !== 1 ? 's' : ''} shown
      {/* STUDENTS */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Students</h2>
              <p className="mt-1 text-sm text-gray-500">
                {classId ? 'Mark attendance for students in this class' : 'Select a class to load students'}
              </p>
            </div>

            {classId && students.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => markAllAttendance('Present')}
                  disabled={markingAttendance}
                  className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListCheck size={17} />
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() => markAllAttendance('Absent')}
                  disabled={markingAttendance}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ListCheck size={17} />
                  Mark All Absent
                </button>
              </div>
            )}
          </div>
        </div>

        {loadingStudents && (
          <div className="flex flex-col items-center justify-center py-14">
            <RefreshCw size={25} className="mb-3 animate-spin text-teal-600" />
            <p className="text-sm font-medium text-gray-700">Loading students...</p>
            <p className="mt-1 text-xs text-gray-400">Getting students from this class</p>
          </div>
        )}

        {!loadingStudents && students.length > 0 && (
          <div className="divide-y divide-gray-100">
            {students.map((student, index) => {
              const currentStatus = attendance[student._id];

              return (
                <div key={student._id} className="flex items-center gap-4 p-4 transition hover:bg-gray-50">
                  <div className="w-8 text-center text-sm font-medium text-gray-400">{index + 1}</div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">
                    {student.fullname?.charAt(0)?.toUpperCase() || 'S'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{student.fullname}</p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {student.admissionNumber || student.email || 'No admission number'}
                    </p>
                  </div>

                  {currentStatus && (
                    <span
                      className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:block ${
                        currentStatus === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {currentStatus}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => markAttendance(student._id, 'Present')}
                      disabled={markingAttendance}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        currentStatus === 'Present'
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => markAttendance(student._id, 'Absent')}
                      disabled={markingAttendance}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        currentStatus === 'Absent'
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loadingStudents && !classId && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Users size={22} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">Select a class</p>
            <p className="mt-1 text-sm text-gray-400">Choose a class above to load its students.</p>
          </div>
        )}

        {!loadingStudents && classId && students.length === 0 && (
          <div className="py-14 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Users size={22} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-700">No students found</p>
            <p className="mt-1 text-sm text-gray-400">There are no students assigned to this class.</p>
          </div>
        )}
      </div>

      {/* SAVE ATTENDANCE */}
      {classId && students.length > 0 && (
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-gray-900">{students.length} Students</p>
            <p className="mt-1 text-sm text-gray-500">
              {markedCount} of {students.length} marked
            </p>
          </div>

          <button
            type="button"
            onClick={submitAttendance}
            disabled={markingAttendance || markedCount !== students.length}
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markingAttendance ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                Saving Attendance...
              </>
            ) : (
              <>
                <CheckSquare size={17} />
                Save Attendance
              </>
            )}
          </button>
        </div>
      )}

      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Create Section</p>
                <h3 className="mt-1 text-xl font-bold text-gray-900">Add new academic section</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close section modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Section name</label>
                <input
                  type="text"
                  name="name"
                  value={sectionForm.name}
                  onChange={handleSectionFormChange}
                  placeholder="e.g. Primary"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Section code</label>
                <input
                  type="text"
                  name="code"
                  value={sectionForm.code}
                  onChange={handleSectionFormChange}
                  placeholder="e.g. PRIMARY"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={sectionForm.description}
                  onChange={handleSectionFormChange}
                  rows="3"
                  placeholder="Optional section description"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleCreateSection}
                disabled={creatingSection}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingSection ? 'Creating...' : 'Create Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
}
