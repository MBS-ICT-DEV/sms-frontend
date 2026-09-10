import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';

// Public pages
import { LoginPage } from '../pages/auth/LoginPage';

// Dashboards
import DeveloperDashboard from '../pages/developer/Dashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import PrincipalDashboard from '../pages/PrincipalDashboard';
import TeacherDashboard from '../pages/TeacherDashboard';
import StudentDashboard from '../pages/StudentDashboard';

// HOA pages
import HoaDashboard      from '../pages/hoa/HoaDashboard';
import HoaTeachersPage   from '../pages/hoa/HoaTeachersPage';
import HoaStudentsPage   from '../pages/hoa/HoaStudentsPage';
import HoaAttendancePage from '../pages/hoa/HoaAttendancePage';

// Secretary pages
import SecretaryDashboard from '../pages/secretary/SecretaryDashboard';
import SecretaryFeesPage  from '../pages/secretary/SecretaryFeesPage';

// Developer sub-pages
import { AnalyticsPage }    from '../pages/developer/AnalyticsPage';
import { ManageSchoolsPage } from '../pages/developer/ManageSchoolsPage';

// Fee pages
import FeeManagementPage  from '../pages/fees/FeeManagementPage';
import StudentFeesPage    from '../pages/student/StudentFeesPage';
import TeacherFeesPage    from '../pages/teacher/TeacherFeesPage';

// Admin + shared
import ClassManagementPage from '../pages/class/ClassManagementPage';
import StudentManagement from '../pages/StudentManagement';

// Teacher pages
import ResultsUpload     from '../pages/teacher/ResultsUpload';
import UploadAssignment  from '../pages/teacher/UploadAssignment';
import MarkAttendance    from '../pages/teacher/MarkAttendance';

// Student pages
import ViewAssignments   from '../pages/student/ViewAssignments';
import ViewAttendance    from '../pages/student/ViewAttendance';
import DownloadReportCard from '../pages/student/DownloadReportCard';
import { StudentResultsPage } from '../pages/result/StudentResultsPage';

// Principal pages
import PrincipalResultsApproval    from '../pages/PrincipalResultsApproval';
import PrincipalGenerateBroadsheet from '../pages/PrincipalGenerateBroadsheet';
import PrincipalGenerateCumulative from '../pages/PrincipalGenerateCumulative';

// Wrap a page component that doesn't include its own MainLayout
const WithLayout = ({ Page, role }) => (
  <MainLayout>
    <Page />
  </MainLayout>
);
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../layouts/MainLayout";

import AIAssistant from "../components/AIAssistant";
// Public pages
import { LoginPage } from "../pages/auth/LoginPage";

// Dashboards
import DeveloperDashboard from "../pages/developer/Dashboard";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import PrincipalDashboard from "../pages/PrincipalDashboard";
import TeacherDashboard from "../pages/TeacherDashboard";
import StudentDashboard from "../pages/StudentDashboard";

// HOA
import HoaDashboard from "../pages/hoa/HoaDashboard";
import HoaTeachersPage from "../pages/hoa/HoaTeachersPage";
import HoaStudentsPage from "../pages/hoa/HoaStudentsPage";
import HoaAttendancePage from "../pages/hoa/HoaAttendancePage";
import HoaAttendacHistory from "../pages/hoa/HoaAttendacHistory";
import AcademicManagementPage from "../pages/hoa/AcademicManagementPage";

// Secretary
import SecretaryDashboard from "../pages/secretary/SecretaryDashboard";
import SecretaryFeesPage from "../pages/secretary/SecretaryFeesPage";

// Developer
import { AnalyticsPage } from "../pages/developer/AnalyticsPage";
import { ManageSchoolsPage } from "../pages/developer/ManageSchoolsPage";

// Fees
import FeeManagementPage from "../pages/fees/FeeManagementPage";
import StudentFeesPage from "../pages/student/StudentFeesPage";
import TeacherFeesPage from "../pages/teacher/TeacherFeesPage";

// Admin/shared
import ClassManagementPage from "../pages/class/ClassManagementPage";
import StudentManagement from "../pages/StudentManagement";

// Teacher
import ResultsUpload from "../pages/teacher/ResultsUpload";
import UploadAssignment from "../pages/teacher/UploadAssignment";
import MarkAttendance from "../pages/teacher/MarkAttendance";

// Student
import ViewAssignments from "../pages/student/ViewAssignments";
import ViewAttendance from "../pages/student/ViewAttendance";
import DownloadReportCard from "../pages/student/DownloadReportCard";
import { StudentResultsPage } from "../pages/result/StudentResultsPage";

// Principal
import PrincipalResultsApproval from "../pages/PrincipalResultsApproval";
import PrincipalGenerateBroadsheet from "../pages/PrincipalGenerateBroadsheet";
import PrincipalGenerateCumulative from "../pages/PrincipalGenerateCumulative";


/* ============================================================
   AI GLOBAL WRAPPER

function GlobalAIAssistant() {
  const location = useLocation();

  const isLoginPage =
    location.pathname === "/login" ||
    location.pathname.startsWith("/login/");

  // Don't show AI on login
  if (isLoginPage) {
    return null;
  }

  return <AIAssistant />;
}


/* ============================================================
   ROUTES

export function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/"           element={isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} /> : <LoginPage />} />
      <Route path="/login/:role" element={isAuthenticated ? <Navigate to={`/${user?.role}/dashboard`} /> : <LoginPage />} />

      {/* ── Developer ── */}
      <Route path="/developer/dashboard" element={
        <ProtectedRoute requiredRole="developer"><DeveloperDashboard /></ProtectedRoute>
      } />
      <Route path="/developer/analytics" element={
        <ProtectedRoute requiredRole="developer">
          <MainLayout><AnalyticsPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/developer/schools" element={
        <ProtectedRoute requiredRole="developer">
          <MainLayout><ManageSchoolsPage /></MainLayout>
        </ProtectedRoute>
      } />

      {/* ── Admin ── */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/classes" element={
        <ProtectedRoute requiredRole="admin"><ClassManagementPage /></ProtectedRoute>
      } />
      <Route path="/admin/fees" element={
        <ProtectedRoute requiredRole="admin">
          <MainLayout><FeeManagementPage /></MainLayout>
        </ProtectedRoute>
      } />

      {/* ── Principal ── */}
      <Route path="/principal/dashboard" element={
        <ProtectedRoute requiredRole="principal"><PrincipalDashboard /></ProtectedRoute>
      } />
      <Route path="/principal/students" element={
        <ProtectedRoute requiredRole="principal"><StudentManagement /></ProtectedRoute>
      } />
      <Route path="/principal/fees" element={
        <ProtectedRoute requiredRole="principal">
          <MainLayout><FeeManagementPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/principal/results-approval" element={
        <ProtectedRoute requiredRole="principal"><PrincipalResultsApproval /></ProtectedRoute>
      } />
      <Route path="/principal/broadsheet" element={
        <ProtectedRoute requiredRole="principal"><PrincipalGenerateBroadsheet /></ProtectedRoute>
      } />
      <Route path="/principal/cumulative" element={
        <ProtectedRoute requiredRole="principal"><PrincipalGenerateCumulative /></ProtectedRoute>
      } />

      {/* ── Teacher ── */}
      <Route path="/teacher/dashboard" element={
        <ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>
      } />
      <Route path="/teacher/upload-results" element={
        <ProtectedRoute requiredRole="teacher"><ResultsUpload /></ProtectedRoute>
      } />
      <Route path="/teacher/assignments" element={
        <ProtectedRoute requiredRole="teacher"><UploadAssignment /></ProtectedRoute>
      } />
      <Route path="/teacher/attendance" element={
        <ProtectedRoute requiredRole="teacher"><MarkAttendance /></ProtectedRoute>
      } />
      <Route path="/teacher/fees" element={
        <ProtectedRoute requiredRole="teacher">
          <MainLayout><TeacherFeesPage /></MainLayout>
        </ProtectedRoute>
      } />

      {/* ── Student ── */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/student/results" element={
        <ProtectedRoute requiredRole="student"><StudentResultsPage /></ProtectedRoute>
      } />

      <Route path="/student/fees" element={
        <ProtectedRoute requiredRole="student">
          <MainLayout><StudentFeesPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/student/assignments" element={
        <ProtectedRoute requiredRole="student"><ViewAssignments /></ProtectedRoute>
      } />
      <Route path="/student/attendance" element={
        <ProtectedRoute requiredRole="student"><ViewAttendance /></ProtectedRoute>
      } />
      <Route path="/student/report-card" element={
        <ProtectedRoute requiredRole="student"><DownloadReportCard /></ProtectedRoute>
      } />

      {/* ── Secretary ── */}
      <Route path="/secretary/dashboard" element={
        <ProtectedRoute requiredRole="secretary">
          <MainLayout><SecretaryDashboard /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/secretary/fees" element={
        <ProtectedRoute requiredRole="secretary">
          <MainLayout><SecretaryFeesPage /></MainLayout>
        </ProtectedRoute>
      } />

      {/* ── HOA ── */}
      <Route path="/hoa/dashboard" element={
        <ProtectedRoute requiredRole="hoa">
          <MainLayout><HoaDashboard /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/hoa/classes" element={
        <ProtectedRoute requiredRole="hoa">
          <ClassManagementPage />
        </ProtectedRoute>
      } />
      <Route path="/hoa/teachers" element={
        <ProtectedRoute requiredRole="hoa">
          <MainLayout><HoaTeachersPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/hoa/students" element={
        <ProtectedRoute requiredRole="hoa">
          <MainLayout><HoaStudentsPage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/hoa/attendance" element={
        <ProtectedRoute requiredRole="hoa">
          <MainLayout><HoaAttendancePage /></MainLayout>
        </ProtectedRoute>
      } />
      <Route path="/hoa/fees" element={
        <ProtectedRoute requiredRole="hoa">
          <MainLayout><FeeManagementPage /></MainLayout>
        </ProtectedRoute>
      } />

      {/* ── Catch-all ── */}
      <Route path="*" element={<Navigate to="/" replace />} />

      {/* ================= PUBLIC ================= */}

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role}/dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role}/dashboard`} replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route
        path="/login/:role"
        element={
          isAuthenticated ? (
            <Navigate to={`/${user?.role}/dashboard`} replace />
          ) : (
            <LoginPage />
          )
        }
      />


      {/* ================= DEVELOPER ================= */}

      <Route
        path="/developer/dashboard"
        element={
          <ProtectedRoute requiredRole="developer">
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/developer/analytics"
        element={
          <ProtectedRoute requiredRole="developer">
            <MainLayout>
              <AnalyticsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/developer/schools"
        element={
          <ProtectedRoute requiredRole="developer">
            <MainLayout>
              <ManageSchoolsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />


      {/* ================= ADMIN ================= */}

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/classes"
        element={
          <ProtectedRoute requiredRole="admin">
            <ClassManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/fees"
        element={
          <ProtectedRoute requiredRole="admin">
            <MainLayout>
              <FeeManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />


      {/* ================= PRINCIPAL ================= */}

      <Route
        path="/principal/dashboard"
        element={
          <ProtectedRoute requiredRole="principal">
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal/students"
        element={
          <ProtectedRoute requiredRole="principal">
            <StudentManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal/fees"
        element={
          <ProtectedRoute requiredRole="principal">
            <MainLayout>
              <FeeManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal/results-approval"
        element={
          <ProtectedRoute requiredRole="principal">
            <PrincipalResultsApproval />
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal/broadsheet"
        element={
          <ProtectedRoute requiredRole="principal">
            <PrincipalGenerateBroadsheet />
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal/cumulative"
        element={
          <ProtectedRoute requiredRole="principal">
            <PrincipalGenerateCumulative />
          </ProtectedRoute>
        }
      />


      {/* ================= TEACHER ================= */}

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/upload-results"
        element={
          <ProtectedRoute requiredRole="teacher">
            <ResultsUpload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/assignments"
        element={
          <ProtectedRoute requiredRole="teacher">
            <UploadAssignment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/attendance"
        element={
          <ProtectedRoute requiredRole="teacher">
            <MarkAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/fees"
        element={
          <ProtectedRoute requiredRole="teacher">
            <MainLayout>
              <TeacherFeesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />


      {/* ================= STUDENT ================= */}

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/results"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentResultsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/fees"
        element={
          <ProtectedRoute requiredRole="student">
            <MainLayout>
              <StudentFeesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute requiredRole="student">
            <ViewAssignments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/attendance"
        element={
          <ProtectedRoute requiredRole="student">
            <ViewAttendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/report-card"
        element={
          <ProtectedRoute requiredRole="student">
            <DownloadReportCard />
          </ProtectedRoute>
        }
      />


      {/* ================= SECRETARY ================= */}

      <Route
        path="/secretary/dashboard"
        element={
          <ProtectedRoute requiredRole="secretary">
            <MainLayout>
              <SecretaryDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/secretary/fees"
        element={
          <ProtectedRoute requiredRole="secretary">
            <MainLayout>
              <SecretaryFeesPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />


      {/* ================= HOA ================= */}

      <Route
        path="/hoa/dashboard"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <HoaDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/academic-management"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <AcademicManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/dashboard/attendance-history"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <HoaAttendacHistory />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/classes"
        element={
          <ProtectedRoute requiredRole="hoa">
            <ClassManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/teachers"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <HoaTeachersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/students"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <HoaStudentsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/attendance"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <HoaAttendancePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/hoa/fees"
        element={
          <ProtectedRoute requiredRole="hoa">
            <MainLayout>
              <FeeManagementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />


      {/* ================= CATCH ALL ================= */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


/* ============================================================
   ROOT ROUTER

export default function Router() {
  return (
    <BrowserRouter>
      <AppRoutes />

      {/* ONE AI INSTANCE FOR THE ENTIRE PORTAL */}
      <GlobalAIAssistant />
    </BrowserRouter>
  );
}
