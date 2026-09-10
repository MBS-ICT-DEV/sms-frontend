import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import { Upload, ClipboardList, CheckSquare, LayoutDashboard, ArrowRight, BookOpen } from 'lucide-react';

import adminAPI from '../api/admin.api';
import teacherAPI from '../api/teacher.api';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
const ActionCard = ({ title, desc, Icon, color, bg, btnLabel, onClick }) => (
  <button
    onClick={onClick}
    className="group w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all"
  >
    <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
      <Icon size={20} className={color} />
    </div>
    <p className="font-bold text-gray-900 text-sm mb-1">{title}</p>
    <p className="text-gray-500 text-xs mb-4 leading-relaxed">{desc}</p>
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${color} group-hover:gap-2.5 transition-all`}>
      {btnLabel} <ArrowRight size={13} />
    </span>
  </button>
);

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const selectedClassName = assignedClasses.find((cls) => cls._id === selectedClassId)?.name || assignedClasses.find((cls) => cls._id === selectedClassId)?.className || 'Selected class';

  useEffect(() => {
    const fetchAssignedClasses = async () => {
      try {
        const { data } = await teacherAPI.getAssignedClasses();
        const classes = data?.classes || data || [];
        setAssignedClasses(classes);

        if (classes.length > 0) {
          setSelectedClassId((current) => current || classes[0]._id);
        }
      } catch (error) {
        console.error('Failed to load assigned classes', error);
      }
    };

    fetchAssignedClasses();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClassId) return;

      try {
        const { data } = await adminAPI.getStaffStats({ classId: selectedClassId });
        setStats(data?.stats || {});
      } catch (error) {
        console.error('Failed to load stats', error);

        toast.error(
          error?.response?.data?.message || 'Failed to load stats'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClassId]);

  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    {
      title: 'Upload Results',
      desc: 'Download the student template, fill in scores and upload for each class and term.',
      Icon: Upload,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      btnLabel: 'Go to upload',
      onClick: () => navigate('/teacher/upload-results'),
    },
    {
      title: 'Assignments',
      desc: 'Post new assignments, share files and track submissions from students.',
      Icon: ClipboardList,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      btnLabel: 'Manage assignments',
      onClick: () => navigate('/teacher/assignments'),
    },
    {
      title: 'Mark Attendance',
      desc: 'Record daily attendance for your class — mark present, absent or late.',
      Icon: CheckSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      btnLabel: 'Mark attendance',
      onClick: () => navigate('/teacher/attendance'),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">

        {/* Greeting */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <LayoutDashboard size={22} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.fullname?.split(' ')[0] || 'Teacher'}!
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your classes, results and attendance below.</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'My Classes',   value: '—', color: 'text-blue-600',   bg: 'bg-blue-50',   Icon: BookOpen },
            { label: 'Assignments',  value: '—', color: 'text-purple-600', bg: 'bg-purple-50', Icon: ClipboardList },
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label htmlFor="class-select" className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Select class
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full md:w-72 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {assignedClasses.length === 0 ? (
              <option value="">No classes assigned</option>
            ) : (
              assignedClasses.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name || cls.className}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Student No', value: loading ? '...' : stats?.StudentCount ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', Icon: BookOpen },
            { label: 'Assignments', value: '—', color: 'text-purple-600', bg: 'bg-purple-50', Icon: ClipboardList },
            { label: 'Pending Results', value: '—', color: 'text-orange-600', bg: 'bg-orange-50', Icon: Upload },
          ].map(({ label, value, color, bg, Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                {label === 'Student No' && (
                  <p className="text-[11px] text-gray-500 mt-1">{selectedClassName}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action cards */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {actions.map(a => <ActionCard key={a.title} {...a} />)}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
          <Upload size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Uploading results?</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Go to <button onClick={() => navigate('/teacher/upload-results')} className="underline font-semibold">Upload Results</button>, select your class and term, then download the pre-filled template. Fill in scores and re-upload.
            </p>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
