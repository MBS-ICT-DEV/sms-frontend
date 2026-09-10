import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import adminAPI from '../../api/admin.api';
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

  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (status === 403) {
    return serverMessage || "You don't have permission to do this.";
  }

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

  const [sectionForm, setSectionForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  // =====================================================
  // LOAD CLASSES AND SECTIONS
  // =====================================================

  const fetchClasses = async () => {
    try {
      const [classesRes, sectionsRes] = await Promise.all([
        adminAPI.getClasses(),
        adminAPI.getSections(),
      ]);

      setClasses(classesRes?.data?.classes || []);
      setSections(sectionsRes?.data?.sections || []);
    } catch (error) {
      console.error(
        'Failed to load classes:',
        error?.response?.status,
        error?.response?.data || error
      );

      toast.error(
        describeError(error, 'Failed to load classes')
      );
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // =====================================================
  // SECTION MODAL
  // =====================================================

  const openSectionModal = () => {
    setSectionForm({
      name: '',
      code: '',
      description: '',
    });

    setShowSectionModal(true);
  };

  const closeSectionModal = () => {
    if (creatingSection) return;

    setShowSectionModal(false);

    setSectionForm({
      name: '',
      code: '',
      description: '',
    });
  };

  const handleSectionFormChange = (event) => {
    const { name, value } = event.target;

    setSectionForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CREATE SECTION
  // =====================================================

  const handleCreateSection = async () => {
    const name = sectionForm.name.trim();
    const code = sectionForm.code.trim().toUpperCase();
    const description = sectionForm.description.trim();

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
        description,
      });

      const createdSection = response?.data?.section;

      if (createdSection) {
        setSections((prev) =>
          [...prev, createdSection].sort((a, b) =>
            String(a?.name || '').localeCompare(
              String(b?.name || '')
            )
          )
        );
      } else {
        await fetchClasses();
      }

      setShowSectionModal(false);

      setSectionForm({
        name: '',
        code: '',
        description: '',
      });

      toast.success(
        response?.data?.message ||
          'Section created successfully'
      );
    } catch (error) {
      console.error('Failed to create section:', error);

      toast.error(
        describeError(
          error,
          'Failed to create section'
        )
      );
    } finally {
      setCreatingSection(false);
    }
  };

  // =====================================================
  // CLASS CHANGE
  // Load ONLY students for the selected class.
  // Attendance history is handled on the History page.
  // =====================================================

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
  // DATE CHANGE
  // =====================================================

  const handleDateChange = (event) => {
    setDate(event.target.value);

    // Date changes the attendance session,
    // so reset current unsaved marks.
    if (students.length > 0) {
      const resetAttendance = {};

      students.forEach((student) => {
        resetAttendance[student._id] = '';
      });

      setAttendance(resetAttendance);
    } else {
      setAttendance({});
    }
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
  // SUBMIT ATTENDANCE
  // =====================================================

  const submitAttendance = async () => {
    if (!classId) {
      toast.error('Please select a class');
      return;
    }

    if (!date) {
      toast.error('Please select a date');
      return;
    }

    if (!students.length) {
      toast.error('No students available');
      return;
    }

    const markedCount = students.filter(
      (student) => attendance[student._id]
    ).length;

    if (markedCount !== students.length) {
      toast.error(
        `Please mark all students before saving. ${markedCount} of ${students.length} marked.`
      );
      return;
    }

    const attendanceData = students.map((student) => ({
      studentId: student._id,
      status: attendance[student._id],
    }));

    try {
      setMarkingAttendance(true);

      const response =
        await adminAPI.markClassAttendance({
          classId,
          date,
          attendance: attendanceData,
        });

      toast.success(
        response?.data?.message ||
          'Attendance saved successfully'
      );

      // Reset marks after successful save.
      const resetAttendance = {};

      students.forEach((student) => {
        resetAttendance[student._id] = '';
      });

      setAttendance(resetAttendance);
    } catch (error) {
      console.error(
        'Failed to save attendance:',
        error
      );

      toast.error(
        describeError(
          error,
          'Failed to mark attendance'
        )
      );
    } finally {
      setMarkingAttendance(false);
    }
  };

  // =====================================================
  // GROUP CLASSES BY SECTION
  // =====================================================

  const groupedClasses = classes.reduce(
    (acc, classItem) => {
      const sectionName =
        classItem?.section?.name ||
        'Unassigned';

      if (!acc[sectionName]) {
        acc[sectionName] = [];
      }

      acc[sectionName].push(classItem);

      return acc;
    },
    {}
  );

  const uniqueSectionOrder = Object.keys(
    groupedClasses
  ).sort((a, b) => a.localeCompare(b));

  // =====================================================
  // CURRENT CLASS
  // =====================================================

  const selectedClass = classes.find(
    (item) => item._id === classId
  );

  // =====================================================
  // SUMMARY
  // =====================================================

  const markedCount = students.filter(
    (student) => attendance[student._id]
  ).length;

  const presentCount = students.filter(
    (student) =>
      attendance[student._id] === 'Present'
  ).length;

  const absentCount = students.filter(
    (student) =>
      attendance[student._id] === 'Absent'
  ).length;

  const attendanceRate =
    students.length > 0
      ? Math.round(
          (presentCount / students.length) * 100
        )
      : 0;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="space-y-5">
      {/* HEADER */}

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <CheckSquare
            size={22}
            className="text-teal-600"
          />

          Mark Attendance
        </h1>

        <p className="mt-0.5 text-sm text-gray-500">
          Select a class and date, then mark each
          student present or absent
        </p>
      </div>

      {/* FILTERS */}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} />

          Class & Date
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* CLASS */}

          <select
            value={classId}
            onChange={(event) =>
              handleClassChange(
                event.target.value
              )
            }
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">
              Select Class
            </option>

            {uniqueSectionOrder.map(
              (sectionName) => (
                <optgroup
                  key={sectionName}
                  label={sectionName}
                >
                  {groupedClasses[
                    sectionName
                  ].map((classItem) => (
                    <option
                      key={classItem._id}
                      value={classItem._id}
                    >
                      {classItem.name}
                    </option>
                  ))}
                </optgroup>
              )
            )}

            {!classes.length && (
              <option
                value=""
                disabled
              >
                No classes available
              </option>
            )}
          </select>

          {/* CREATE SECTION */}

          <button
            type="button"
            onClick={openSectionModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
          >
            <Plus size={16} />

            Create Section
          </button>

          {/* DATE */}

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
              <Users
                size={20}
                className="text-teal-600"
              />
            </div>

            <div>
              <p className="text-xs font-medium text-teal-600">
                SELECTED CLASS
              </p>

              <p className="font-semibold text-gray-900">
                {selectedClass?.name ||
                  'Selected Class'}
              </p>
            </div>

            {!loadingStudents && (
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-teal-700">
                  {students.length}
                </p>

                <p className="text-xs text-gray-500">
                  Students
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ATTENDANCE SUMMARY */}

      {classId && students.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* TOTAL */}

          <div className="rounded-xl border border-gray-100 bg-white p-4 text-center shadow-sm">
            <Users
              size={20}
              className="mx-auto mb-2 text-gray-400"
            />

            <p className="text-2xl font-bold text-gray-900">
              {students.length}
            </p>

            <p className="text-xs text-gray-500">
              Total Students
            </p>
          </div>

          {/* PRESENT */}

          <div className="rounded-xl border border-green-100 bg-white p-4 text-center shadow-sm">
            <CheckSquare
              size={20}
              className="mx-auto mb-2 text-green-500"
            />

            <p className="text-2xl font-bold text-green-600">
              {presentCount}
            </p>

            <p className="text-xs text-gray-500">
              Present
            </p>
          </div>

          {/* ABSENT */}

          <div className="rounded-xl border border-red-100 bg-white p-4 text-center shadow-sm">
            <Users
              size={20}
              className="mx-auto mb-2 text-red-400"
            />

            <p className="text-2xl font-bold text-red-500">
              {absentCount}
            </p>

            <p className="text-xs text-gray-500">
              Absent
            </p>
          </div>

          {/* RATE */}

          <div className="rounded-xl border border-teal-100 bg-white p-4 text-center shadow-sm">
            <CheckSquare
              size={20}
              className="mx-auto mb-2 text-teal-500"
            />

            <p className="text-2xl font-bold text-teal-600">
              {attendanceRate}%
            </p>

            <p className="text-xs text-gray-500">
              Current Rate
            </p>
          </div>
        </div>
      )}

      {/* STUDENTS */}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* STUDENT HEADER */}

        <div className="border-b border-gray-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Students
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {classId
                  ? 'Mark attendance for students in this class'
                  : 'Select a class to load students'}
              </p>
            </div>

            {classId &&
              students.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* MARK ALL PRESENT */}

                  <button
                    type="button"
                    onClick={() =>
                      markAllAttendance(
                        'Present'
                      )
                    }
                    disabled={
                      markingAttendance
                    }
                    className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ListCheck size={17} />

                    Mark All Present
                  </button>

                  {/* MARK ALL ABSENT */}

                  <button
                    type="button"
                    onClick={() =>
                      markAllAttendance(
                        'Absent'
                      )
                    }
                    disabled={
                      markingAttendance
                    }
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ListCheck size={17} />

                    Mark All Absent
                  </button>
                </div>
              )}
          </div>
        </div>

        {/* LOADING */}

        {loadingStudents && (
          <div className="flex flex-col items-center justify-center py-14">
            <RefreshCw
              size={25}
              className="mb-3 animate-spin text-teal-600"
            />

            <p className="text-sm font-medium text-gray-700">
              Loading students...
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Getting students from this class
            </p>
          </div>
        )}

        {/* STUDENT LIST */}

        {!loadingStudents &&
          students.length > 0 && (
            <div className="divide-y divide-gray-100">
              {students.map(
                (student, index) => {
                  const currentStatus =
                    attendance[
                      student._id
                    ];

                  return (
                    <div
                      key={student._id}
                      className="flex items-center gap-4 p-4 transition hover:bg-gray-50"
                    >
                      {/* NUMBER */}

                      <div className="w-8 text-center text-sm font-medium text-gray-400">
                        {index + 1}
                      </div>

                      {/* AVATAR */}

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 font-semibold text-teal-700">
                        {student.fullname
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          'S'}
                      </div>

                      {/* STUDENT INFO */}

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {student.fullname ||
                            'Unnamed Student'}
                        </p>

                        <p className="mt-0.5 text-sm text-gray-500">
                          {student.admissionNumber ||
                            student.registrationNumber ||
                            student.email ||
                            'No admission number'}
                        </p>
                      </div>

                      {/* STATUS */}

                      {currentStatus && (
                        <span
                          className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:block ${
                            currentStatus ===
                            'Present'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {currentStatus}
                        </span>
                      )}

                      {/* BUTTONS */}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            markAttendance(
                              student._id,
                              'Present'
                            )
                          }
                          disabled={
                            markingAttendance
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            currentStatus ===
                            'Present'
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Present
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            markAttendance(
                              student._id,
                              'Absent'
                            )
                          }
                          disabled={
                            markingAttendance
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                            currentStatus ===
                            'Absent'
                              ? 'border-red-500 bg-red-500 text-white'
                              : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

        {/* NO CLASS */}

        {!loadingStudents &&
          !classId && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Users
                  size={22}
                  className="text-gray-400"
                />
              </div>

              <p className="font-medium text-gray-700">
                Select a class
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Choose a class above to load
                its students.
              </p>
            </div>
          )}

        {/* NO STUDENTS */}

        {!loadingStudents &&
          classId &&
          students.length === 0 && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Users
                  size={22}
                  className="text-gray-400"
                />
              </div>

              <p className="font-medium text-gray-700">
                No students found
              </p>

              <p className="mt-1 text-sm text-gray-400">
                There are no students assigned
                to this class.
              </p>
            </div>
          )}
      </div>

      {/* SAVE ATTENDANCE */}

      {classId &&
        students.length > 0 && (
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-gray-900">
                {students.length} Students
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {markedCount} of{' '}
                {students.length} marked
              </p>
            </div>

            <button
              type="button"
              onClick={submitAttendance}
              disabled={
                markingAttendance ||
                markedCount !==
                  students.length
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAttendance ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

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

      {/* CREATE SECTION MODAL */}

      {showSectionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSectionModal();
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            {/* MODAL HEADER */}

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">
                  Create Section
                </p>

                <h3 className="mt-1 text-xl font-bold text-gray-900">
                  Add new academic section
                </h3>
              </div>

              <button
                type="button"
                onClick={closeSectionModal}
                disabled={creatingSection}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close section modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* FORM */}

            <div className="space-y-4">
              {/* NAME */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Section name
                </label>

                <input
                  type="text"
                  name="name"
                  value={sectionForm.name}
                  onChange={
                    handleSectionFormChange
                  }
                  placeholder="e.g. Primary"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* CODE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Section code
                </label>

                <input
                  type="text"
                  name="code"
                  value={sectionForm.code}
                  onChange={
                    handleSectionFormChange
                  }
                  placeholder="e.g. PRIMARY"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  name="description"
                  value={
                    sectionForm.description
                  }
                  onChange={
                    handleSectionFormChange
                  }
                  rows="3"
                  placeholder="Optional section description"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>

            {/* MODAL ACTIONS */}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeSectionModal}
                disabled={creatingSection}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateSection
                }
                disabled={creatingSection}
                className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingSection
                  ? 'Creating...'
                  : 'Create Section'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}