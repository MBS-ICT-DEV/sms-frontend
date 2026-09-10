import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { teacherAPI } from '../../api/teacher.api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarkAttendance() {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (selectedClass) fetchStudents();
  }, [selectedClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getStudentsInClass(selectedClass);
      const studentsList = response.data || [];
      setStudents(studentsList);

      const initialAttendance = {};
      studentsList.forEach((s) => {
        initialAttendance[s.id] = 'present';
      });

      setAttendance(initialAttendance);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const updateAttendance = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass) return toast.error('Please select a class');

    setSubmitLoading(true);
    try {
      await teacherAPI.markAttendance({
        date: selectedDate,
        classId: selectedClass,
        attendance,
      });

      toast.success('Attendance marked successfully');
      setShowConfirm(false);

      setSelectedClass('');
      setStudents([]);
      setAttendance({});
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSubmitLoading(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendance).filter((s) => s === 'absent').length;
  const leaveCount = Object.values(attendance).filter((s) => s === 'leave').length;
  // Attendance marking is restricted to HOA. Teachers cannot mark attendance.
  // This page is intentionally disabled. Use the HOA Attendance dashboard instead.

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-600 mt-2">
            Record student attendance for the day
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md p-8 animate-fadeIn">
          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a class...</option>
                <option value="form-1a">Form 1A</option>
                <option value="form-2a">Form 2A</option>
                <option value="form-3a">Form 3A</option>
                <option value="form-4b">Form 4B</option>
                <option value="form-5a">Form 5A</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          {students.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p>Present</p>
                <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p>Absent</p>
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <p>Leave</p>
                <p className="text-2xl font-bold text-yellow-600">{leaveCount}</p>
              </div>
            </div>
          )}

          {/* Students */}
          {loading ? (
            <p className="text-center">Loading...</p>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto w-10 h-10 text-gray-400" />
              <p>Select a class to begin</p>
            </div>
          ) : (
            <div className="space-y-2 mb-8">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-gray-500">{student.regNo}</p>
                  </div>

                  <div className="flex gap-2">
                    {['present', 'absent', 'leave'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateAttendance(student.id, status)}
                        className={`px-3 py-1 rounded ${
                          attendance[student.id] === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {students.length > 0 && (
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setSelectedClass('');
                  setStudents([]);
                  setAttendance({});
                }}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                <Check className="inline mr-1" />
                Submit
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <motion.div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirm Attendance</h2>

              <p>Date: {format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
              <p>Present: {presentCount}</p>
              <p>Absent: {absentCount}</p>
              <p>Leave: {leaveCount}</p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 border py-2 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded"
                >
                  {submitLoading ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance (Disabled)</h1>
          <p className="text-gray-600 mt-2">
            Attendance marking is restricted to Head of Activities (HOA). Please use the HOA
            Attendance dashboard to view or modify attendance records.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}