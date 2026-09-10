import { useEffect, useState } from 'react';
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
import { PieChart, Pie, Cell } from 'recharts';
import adminAPI from '../../api/admin.api';

// =============================
// DONUT CHART
// =============================

function DonutChart({
  value = 0,
  total = 0,
  label,
  color,
}) {
  const percentage =
    total > 0 ? Math.round((value / total) * 100) : 0;

  const data = [
    {
      name: 'Completed',
      value,
    },
    {
      name: 'Remaining',
      value: Math.max(total - value, 0),
    },
  ];

  return (
    <div className="relative w-44 h-44 flex-shrink-0">
      <PieChart width={176} height={176}>
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

const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // =============================
  // FETCH ANALYTICS
  // =============================

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await adminAPI.getHoaStats();

        console.log('Analytics stats:', data);

        setStats(data?.stats ?? {});
      } catch (error) {
        console.error(
          'Failed to load analytics:',
          error
        );

        setStats({});
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
      value: stats?.totalStudents ?? 0,
      Icon: Users,
      iconColor: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: 'enrolled students',
    },

    {
      label: 'Total Teachers',
      value: stats?.totalTeachers ?? 0,
      Icon: GraduationCap,
      iconColor: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: 'registered teachers',
    },

    {
      label: 'Total Classes',
      value: stats?.totalClasses ?? 0,
      Icon: BookOpen,
      iconColor: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'active classes',
    },

    {
      label: 'Students Paid',
      value: stats?.totalPaid ?? 0,
      Icon: CreditCard,
      iconColor: 'text-green-600',
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
      iconColor: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'total collected',
    },

    {
      label: 'Suspended Teachers',
      value: stats?.suspendedTeachers ?? 0,
      Icon: UserX,
      iconColor: 'text-red-600',
      bg: 'bg-red-50',
      sub: 'currently suspended',
    },
  ];

  // =============================
  // DERIVED VALUES
  // =============================

  const totalStudents = stats?.totalStudents ?? 0;

  const suspendedStudents =
    stats?.suspendedStudents ?? 0;

  const activeStudents = Math.max(
    totalStudents - suspendedStudents,
    0
  );

  const totalTeachers = stats?.totalTeachers ?? 0;

  const suspendedTeachers =
    stats?.suspendedTeachers ?? 0;

  const activeTeachers = Math.max(
    totalTeachers - suspendedTeachers,
    0
  );

  const totalPaid = stats?.totalPaid ?? 0;

  const unpaidStudents = Math.max(
    totalStudents - totalPaid,
    0
  );

  // =============================
  // RENDER
  // =============================

  return (
    <div className="space-y-6 max-w-6xl">

      {/* PAGE HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          System-wide performance and usage metrics
        </p>
      </div>

      {/* STAT CARDS */}

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
              iconColor,
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {value}
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
                      flex-shrink-0
                    `}
                  >
                    <Icon
                      size={20}
                      className={iconColor}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* DONUT ANALYTICS */}

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* PAYMENT OVERVIEW */}

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
            <div className="mb-5">
              <h2 className="font-bold text-gray-900">
                Payment Overview
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Students who have completed their fee payment
              </p>
            </div>

            <div className="flex items-center gap-6">
              <DonutChart
                value={totalPaid}
                total={totalStudents}
                label="Paid"
                color="#10b981"
              />

              <div className="space-y-5">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />

                    <span className="text-sm text-gray-500">
                      Paid
                    </span>
                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {totalPaid}
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
                    {unpaidStudents}
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
            <div className="mb-5">
              <h2 className="font-bold text-gray-900">
                Student Overview
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Students who are active versus suspended
              </p>
            </div>

            <div className="flex items-center gap-6">
              <DonutChart
                value={activeStudents}
                total={totalStudents}
                label="Active"
                color="#2A7C13"
              />

              <div className="space-y-5">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500" />

                    <span className="text-sm text-gray-500">
                      Active Students
                    </span>
                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {activeStudents}
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
                    {suspendedStudents}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* TEACHER OVERVIEW */}

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
            <div className="mb-5">
              <h2 className="font-bold text-gray-900">
                Teacher Overview
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Active versus suspended teachers
              </p>
            </div>

            <div className="flex items-center gap-6">
              <DonutChart
                value={activeTeachers}
                total={totalTeachers}
                label="Active"
                color="#8b5cf6"
              />

              <div className="space-y-5">

                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-500" />

                    <span className="text-sm text-gray-500">
                      Active Teachers
                    </span>
                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {activeTeachers}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-200" />

                    <span className="text-sm text-gray-500">
                      Suspended Teachers
                    </span>
                  </div>

                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {suspendedTeachers}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* REVENUE SUMMARY */}

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
            <div className="mb-5">
              <h2 className="font-bold text-gray-900">
                Revenue Summary
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Overview of school fee collections
              </p>
            </div>

            <div className="space-y-5">

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
                    {totalPaid}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* INFORMATION */}

      {!loading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp
                size={19}
                className="text-blue-600"
              />
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                Analytics Summary
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Current system statistics are being calculated
                from the school management database.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalyticsPage;