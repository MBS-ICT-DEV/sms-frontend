import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

import {
  Upload,
  ClipboardList,
  CheckSquare,
  LayoutDashboard,
  ArrowRight,
  BookOpen,
  Users,
} from 'lucide-react';

import adminAPI from '../api/admin.api';
import teacherAPI from '../api/teacher.api';
import { toast } from 'react-toastify';

// =====================================================
// ACTION CARD
// =====================================================

const ActionCard = ({
  title,
  desc,
  Icon,
  color,
  bg,
  btnLabel,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="
      group
      w-full
      text-left
      bg-white
      rounded-2xl
      border
      border-gray-100
      shadow-sm
      p-5
      hover:shadow-md
      hover:border-gray-200
      transition-all
    "
  >
    <div
      className={`
        w-11
        h-11
        ${bg}
        rounded-xl
        flex
        items-center
        justify-center
        mb-4
      `}
    >
      <Icon size={20} className={color} />
    </div>

    <p className="font-bold text-gray-900 text-sm mb-1">
      {title}
    </p>

    <p className="text-gray-500 text-xs mb-4 leading-relaxed">
      {desc}
    </p>

    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        text-xs
        font-semibold
        ${color}
        group-hover:gap-2.5
        transition-all
      `}
    >
      {btnLabel}

      <ArrowRight size={13} />
    </span>
  </button>
);

// =====================================================
// TEACHER DASHBOARD
// =====================================================

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');

  // =====================================================
  // SELECTED CLASS NAME
  // =====================================================

  const selectedClass = assignedClasses.find(
    (cls) => cls._id === selectedClassId
  );

  const selectedClassName =
    selectedClass?.name ||
    selectedClass?.className ||
    'Selected class';

  // =====================================================
  // LOAD ASSIGNED CLASSES
  // =====================================================

  useEffect(() => {
    const fetchAssignedClasses = async () => {
      try {
        const { data } =
          await teacherAPI.getAssignedClasses();

        const classes =
          data?.classes ||
          data?.data ||
          data ||
          [];

        const safeClasses = Array.isArray(classes)
          ? classes
          : [];

        setAssignedClasses(safeClasses);

        if (safeClasses.length > 0) {
          setSelectedClassId(
            (current) =>
              current || safeClasses[0]?._id
          );
        }
      } catch (error) {
        console.error(
          'Failed to load assigned classes:',
          error
        );

        setAssignedClasses([]);

        toast.error(
          error?.response?.data?.message ||
            'Failed to load assigned classes'
        );
      }
    };

    fetchAssignedClasses();
  }, []);

  // =====================================================
  // LOAD TEACHER STATS
  // =====================================================

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedClassId) {
        setStats(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data } =
          await adminAPI.getStaffStats({
            classId: selectedClassId,
          });

        console.log(
          'Teacher dashboard stats:',
          data
        );

        setStats(data?.stats || {});
      } catch (error) {
        console.error(
          'Failed to load teacher stats:',
          error
        );

        setStats({});

        toast.error(
          error?.response?.data?.message ||
            'Failed to load stats'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedClassId]);

  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  const actions = [
    {
      title: 'Upload Results',

      desc:
        'Download the student template, fill in scores and upload for each class and term.',

      Icon: Upload,

      color: 'text-blue-600',

      bg: 'bg-blue-50',

      btnLabel: 'Go to upload',

      onClick: () =>
        navigate('/teacher/upload-results'),
    },

    {
      title: 'Assignments',

      desc:
        'Post new assignments, share files and track submissions from students.',

      Icon: ClipboardList,

      color: 'text-purple-600',

      bg: 'bg-purple-50',

      btnLabel: 'Manage assignments',

      onClick: () =>
        navigate('/teacher/assignments'),
    },

    {
      title: 'Mark Attendance',

      desc:
        'Record daily attendance for your class — mark present, absent or late.',

      Icon: CheckSquare,

      color: 'text-emerald-600',

      bg: 'bg-emerald-50',

      btnLabel: 'Mark attendance',

      onClick: () =>
        navigate('/teacher/attendance'),
    },
  ];

  // =====================================================
  // DASHBOARD STATS
  // =====================================================

  const dashboardStats = [
    {
      label: 'Student No',

      value: loading
        ? '...'
        : stats?.StudentCount ??
          stats?.studentCount ??
          stats?.totalStudents ??
          0,

      color: 'text-blue-600',

      bg: 'bg-blue-50',

      Icon: Users,

      sub: selectedClassName,
    },

    {
      label: 'Assignments',

      value:
        stats?.assignmentCount ??
        stats?.totalAssignments ??
        '—',

      color: 'text-purple-600',

      bg: 'bg-purple-50',

      Icon: ClipboardList,

      sub: 'class assignments',
    },

    {
      label: 'Pending Results',

      value:
        stats?.pendingResults ??
        stats?.pendingResultCount ??
        '—',

      color: 'text-orange-600',

      bg: 'bg-orange-50',

      Icon: Upload,

      sub: 'results pending',
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <MainLayout>
      <div className="space-y-6 max-w-5xl">

        {/* =================================================
            GREETING
        ================================================= */}

        <div className="flex items-start gap-4">
          <div
            className="
              w-12
              h-12
              bg-orange-100
              rounded-2xl
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <LayoutDashboard
              size={22}
              className="text-orange-600"
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome,{' '}
              {user?.fullname?.split(' ')[0] ||
                user?.firstName ||
                'Teacher'}
              !
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              Manage your classes, results and attendance
              below.
            </p>
          </div>
        </div>

        {/* =================================================
            CLASS SELECTOR
        ================================================= */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <label
            htmlFor="class-select"
            className="
              block
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-gray-500
              mb-2
            "
          >
            Select class
          </label>

          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) =>
              setSelectedClassId(e.target.value)
            }
            className="
              w-full
              md:w-72
              border
              border-gray-200
              rounded-xl
              px-3
              py-2
              text-sm
              text-gray-700
              bg-white
              focus:outline-none
              focus:ring-2
              focus:ring-blue-200
            "
          >
            {assignedClasses.length === 0 ? (
              <option value="">
                No classes assigned
              </option>
            ) : (
              assignedClasses.map((cls) => (
                <option
                  key={cls._id}
                  value={cls._id}
                >
                  {cls.name ||
                    cls.className ||
                    'Unnamed Class'}
                </option>
              ))
            )}
          </select>
        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {dashboardStats.map(
            ({
              label,
              value,
              color,
              bg,
              Icon,
              sub,
            }) => (
              <div
                key={label}
                className="
                  bg-white
                  rounded-2xl
                  border
                  border-gray-100
                  shadow-sm
                  p-5
                  flex
                  items-center
                  gap-4
                "
              >
                <div
                  className={`
                    w-11
                    h-11
                    ${bg}
                    rounded-xl
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                  `}
                >
                  <Icon
                    size={20}
                    className={color}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-500 font-medium">
                    {label}
                  </p>

                  <p
                    className={`
                      text-xl
                      font-bold
                      ${color}
                    `}
                  >
                    {value}
                  </p>

                  <p className="text-[11px] text-gray-500 mt-1 truncate">
                    {sub}
                  </p>
                </div>
              </div>
            )
          )}
        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <div>
          <h2
            className="
              text-sm
              font-semibold
              text-gray-500
              uppercase
              tracking-wide
              mb-3
            "
          >
            Quick Actions
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {actions.map((action) => (
              <ActionCard
                key={action.title}
                {...action}
              />
            ))}
          </div>
        </div>

        {/* =================================================
            TIP
        ================================================= */}

        <div
          className="
            bg-blue-50
            border
            border-blue-100
            rounded-2xl
            p-4
            flex
            gap-3
          "
        >
          <Upload
            size={18}
            className="
              text-blue-600
              flex-shrink-0
              mt-0.5
            "
          />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Uploading results?
            </p>

            <p className="text-sm text-blue-700 mt-0.5">
              Go to{' '}
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/teacher/upload-results'
                  )
                }
                className="
                  underline
                  font-semibold
                  hover:text-blue-900
                "
              >
                Upload Results
              </button>
              , select your class and term, then
              download the pre-filled template. Fill
              in scores and re-upload.
            </p>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}