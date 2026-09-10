import { BarChart3, TrendingUp, Users, BookOpen, GraduationCap } from 'lucide-react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  GraduationCap,
  CreditCard,
  DollarSign,
  UserX,
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useEffect, useState } from 'react';
import adminAPI from '../../api/admin.api';


// =============================
// MONTHLY DATA
// =============================

const BAR_DATA = [
  { month: 'Jan', value: 60 },
  { month: 'Feb', value: 72 },
  { month: 'Mar', value: 80 },
  { month: 'Apr', value: 74 },
  { month: 'May', value: 90 },
  { month: 'Jun', value: 85 },
  { month: 'Jul', value: 78 },
  { month: 'Aug', value: 92 },
];

const max = Math.max(...BAR_DATA.map(d => d.value));

export const AnalyticsPage = () => {
  return (
    <div className="space-y-6 max-w-5xl">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">System-wide performance and usage metrics</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Users',    value: '1,245', Icon: Users,       color: 'text-blue-600',    bg: 'bg-blue-50' },
          { label: 'Active Schools', value: '5',     Icon: BookOpen,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Teachers',       value: '148',   Icon: GraduationCap,color:'text-purple-600',  bg: 'bg-purple-50' },
          { label: 'Avg Score',      value: '78%',   Icon: TrendingUp,  color: 'text-orange-600',  bg: 'bg-orange-50' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={18} className="text-blue-600" />
          <h2 className="font-bold text-gray-900">Monthly Student Enrollment</h2>
        </div>
        <div className="flex items-end gap-3 h-44">
          {BAR_DATA.map(({ month, value }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-xs font-bold text-gray-600">{value}</span>
              <div
                className="w-full bg-blue-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(value / max) * 140}px` }}
              />
              <span className="text-xs text-gray-400">{month}</span>
            </div>
          ))}
        </div>
      </div>
const max = Math.max(
  ...BAR_DATA.map((item) => item.value)
);


// =============================
// DONUT COMPONENT
// =============================

function DonutChart({
  value = 0,
  total = 0,
  label,
  color,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  const data = [
    {
      name: 'Completed',
      value: value,
    },
    {
      name: 'Remaining',
      value: Math.max(total - value, 0),
    },
  ];

  return (
    <div className="relative w-44 h-44">

      <PieChart
        width={176}
        height={176}
      >
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={76}
          paddingAngle={2}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill="#f3f4f6" />
        </Pie>
      </PieChart>


      {/* CENTER TEXT */}

      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <span className="text-2xl font-bold text-gray-900">
          {percentage}%
        </span>

        <span className="text-xs text-gray-400">
          {label}
        </span>

      </div>

    </div>
  );
}


// =============================
// ANALYTICS PAGE
// =============================

export const AnalyticsPage = () => {

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);


  // =============================
  // FETCH STATS
  // =============================

  useEffect(() => {

    const fetchStats = async () => {

      try {

        const { data } =
          await adminAPI.getHoaStats();

        console.log(
          'Analytics stats:',
          data.stats
        );

        setStats(data.stats);

      } catch (error) {

        console.error(
          'Failed to load analytics:',
          error
        );

      } finally {

        setLoading(false);

      }

    };

    fetchStats();

  }, []);


  // =============================
  // STAT CARDS
  // =============================

  const cards = [

    {
      label: 'Total Students',
      value: stats?.totalStudents,
      Icon: Users,
      color: '#2A7C13',
      bg: 'bg-blue-50',
      sub: 'enrolled students',
    },

    {
      label: 'Total Teachers',
      value: stats?.totalTeachers,
      Icon: GraduationCap,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: 'registered teachers',
    },

    {
      label: 'Total Classes',
      value: stats?.totalClasses,
      Icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'active classes',
    },

    {
      label: 'Students Paid',
      value: stats?.totalPaid,
      Icon: CreditCard,
      color: 'text-green-600',
      bg: 'bg-green-50',
      sub: 'fee payments',
    },

    {
      label: 'Total Revenue',

      value:
        stats?.totalRevenue != null
          ? `₦${Number(
              stats.totalRevenue
            ).toLocaleString()}`
          : '₦0',

      Icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'total collected',
    },

    {
      label: 'Suspended Teachers',
      value: stats?.suspendedTeachers,
      Icon: UserX,
      color: 'text-red-600',
      bg: 'bg-red-50',
      sub: 'currently suspended',
    },

  ];


  // =============================
  // RENDER
  // =============================

  return (

    <div className="space-y-6 max-w-6xl">

      {/* ==========================
          HEADER

      <div>

        <h1 className="text-2xl font-bold text-gray-900">
          Analytics
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          System-wide performance and usage metrics
        </p>

      </div>


      {/* ==========================
          STATS

      {loading ? (

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          {[...Array(6)].map((_, index) => (

            <div
              key={index}
              className="
                bg-white
                rounded-2xl
                p-5
                border
                border-gray-100
                shadow-sm
                animate-pulse
                h-32
              "
            />

          ))}

        </div>

      ) : (

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          {cards.map(
            ({
              label,
              value,
              Icon,
              color,
              bg,
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
                "
              >

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-2xl font-bold text-gray-900">
                      {value ?? 0}
                    </p>

                    <p className="text-sm font-medium text-gray-500 mt-1">
                      {label}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {sub}
                    </p>

                  </div>


                  <div
                    className={`
                      w-11
                      h-11
                      ${bg}
                      rounded-xl
                      flex
                      items-center
                      justify-center
                    `}
                  >

                    <Icon
                      size={20}
                      className={color}
                    />

                  </div>

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* ==========================
          DONUT ANALYTICS

      {!loading && (

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          {/* ======================
                PAYMENT OVERVIEW

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-6
            "
          >

            <div className="mb-4">

              <h2 className="font-bold text-gray-900">
                Payment Overview
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Students who have completed their fee payment
              </p>

            </div>

  
            <div className="flex items-center gap-8">

              <DonutChart
                value={stats?.totalPaid ?? 0}
                total={stats?.totalStudents ?? 0}
                label="Paid"
                color="#10b981"
              />


              <div className="space-y-4">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-emerald-500" />

                    <span className="text-sm text-gray-500">
                      Paid
                    </span>

                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {stats?.totalPaid ?? 0}
                  </p>

                </div>


                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-gray-200" />

                    <span className="text-sm text-gray-500">
                      Remaining
                    </span>

                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {Math.max(
                      (stats?.totalStudents ?? 0) -
                        (stats?.totalPaid ?? 0),
                      0
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

          
              {/* STUDENT OVERVIEW */}
               <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-6
            "
          >

            <div className="mb-4">

              <h2 className="font-bold text-gray-900">
                Student Overview
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Students who are active versus suspended
              </p>

            </div>


            <div className="flex items-center gap-8">

              <DonutChart
                value={
                  Math.max(
                    (stats?.totalStudents ?? 0) -
                      (stats?.suspendedStudents ?? 0),
                    0
                  )
                }

                total={
                  stats?.totalStudents ?? 0
                }

                label="Active"
                color="#2A7C13"
              />


              <div className="space-y-4">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-green-500" />

                    <span className="text-sm text-gray-500">
                      Active Students
                    </span>

                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {Math.max(
                      (stats?.totalStudents ?? 0) -
                        (stats?.suspendedStudents ?? 0),
                      0
                    )}
                  </p>

                </div>


                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-gray-200" />

                    <span className="text-sm text-gray-500">
                      Suspended Students
                    </span>

                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {stats?.suspendedStudents ?? 0}
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* ======================
              TEACHER OVERVIEW

          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-6
            "
          >

            <div className="mb-4">

              <h2 className="font-bold text-gray-900">
                Teacher Overview
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Active versus suspended teachers
              </p>

            </div>


            <div className="flex items-center gap-8">

              <DonutChart
                value={
                  Math.max(
                    (stats?.totalTeachers ?? 0) -
                      (stats?.suspendedTeachers ?? 0),
                    0
                  )
                }

                total={
                  stats?.totalTeachers ?? 0
                }

                label="Active"
                color="#8b5cf6"
              />


              <div className="space-y-4">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-purple-500" />

                    <span className="text-sm text-gray-500">
                      Active Teachers
                    </span>

                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {Math.max(
                      (stats?.totalTeachers ?? 0) -
                        (stats?.suspendedTeachers ?? 0),
                      0
                    )}
                  </p>

                </div>


                <div>

                  <div className="flex items-center gap-2">

                    <span className="w-3 h-3 rounded-full bg-gray-200" />

                    <span className="text-sm text-gray-500">
                      Suspended
                    </span>

                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {stats?.suspendedTeachers ?? 0}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}



     


      {/* ==========================
          REVENUE SUMMARY

      {!loading && (

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-5
            "
          >

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">

                <DollarSign
                  size={20}
                  className="text-emerald-600"
                />

              </div>


              <div>

                <p className="text-xs text-gray-400">
                  Total Revenue
                </p>

                <p className="text-xl font-bold text-gray-900">

                  {stats?.totalRevenue != null
                    ? `₦${Number(
                        stats.totalRevenue
                      ).toLocaleString()}`
                    : '₦0'}

                </p>

              </div>

            </div>

          </div>


          <div
            className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              p-5
            "
          >

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">

                <CreditCard
                  size={20}
                  className="text-green-600"
                />

              </div>


              <div>

                <p className="text-xs text-gray-400">
                  Students Paid
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {stats?.totalPaid ?? 0}
                </p>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};


export default AnalyticsPage;
