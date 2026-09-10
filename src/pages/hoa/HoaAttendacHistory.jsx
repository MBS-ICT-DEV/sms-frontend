import React, { useEffect, useState } from "react";
import adminAPI from "../../api/admin.api";
import {
  CheckSquare,
  Filter,
  RefreshCw,
  RotateCcwIcon,
  Users,
  X,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

const HoaAttendacHistory = () => {
  // =========================================================
  // TODAY
  // =========================================================

  const today = () => {
    const d = new Date();

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =========================================================
  // STATE
  // =========================================================

  const [classId, setClassId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [classes, setClasses] = useState([]);

  const [date, setDate] = useState(today());

  // Modal
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search inside modal
  const [searchTerm, setSearchTerm] = useState("");

  // =========================================================
  // LOAD CLASSES
  // =========================================================

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const { data } = await adminAPI.getClasses();

        setClasses(data?.classes || []);
      } catch (error) {
        console.error("Failed to load classes:", error);

        toast.error(
          error?.response?.data?.message ||
            "Failed to load classes"
        );
      }
    };

    fetchClasses();
  }, []);

  // =========================================================
  // FETCH ATTENDANCE HISTORY
  // =========================================================

  const fetchData = async (
    selectedClassId = classId,
    selectedDate = date
  ) => {
    if (!selectedClassId) {
      toast.warning("Please select a class");
      return;
    }

    try {
      setIsLoading(true);

      const { data } =
        await adminAPI.getAttendanceHistoryByClass({
          classId: selectedClassId,
          date: selectedDate,
        });

      console.log("Attendance response:", data);

      // Backend returns records inside data.data
      const records = Array.isArray(data?.data)
        ? data.data
        : [];

      console.log("Attendance records:", records);

      if (records.length > 0) {
        const historyItem = {
          date: selectedDate,

          total:
            data?.summary?.total ??
            records.length,

          present:
            data?.summary?.present ?? 0,

          absent:
            data?.summary?.absent ?? 0,

          leave:
            data?.summary?.leave ?? 0,

          percentage:
            data?.summary?.percentage ?? 0,

          records,
        };

        setAttendanceHistory([
          historyItem,
        ]);
      } else {
        setAttendanceHistory([]);
      }
    } catch (error) {
      console.error(
        "Error fetching attendance:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to load attendance"
      );

      setAttendanceHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================
  // CLASS CHANGE
  // =========================================================

  const handleClassChange = (
    selectedClassId
  ) => {
    setClassId(selectedClassId);
    setAttendanceHistory([]);

    // Close modal
    setIsModalOpen(false);
    setSelectedDay(null);
    setSearchTerm("");

    if (!selectedClassId) {
      return;
    }

    fetchData(
      selectedClassId,
      date
    );
  };

  // =========================================================
  // DATE CHANGE
  // =========================================================

  const handleDateChange = (event) => {
    const selectedDate =
      event.target.value;

    setDate(selectedDate);
    setAttendanceHistory([]);

    setIsModalOpen(false);
    setSelectedDay(null);
    setSearchTerm("");

    if (!classId || !selectedDate) {
      return;
    }

    fetchData(
      classId,
      selectedDate
    );
  };

  // =========================================================
  // OPEN ATTENDANCE MODAL
  // =========================================================

  const openAttendanceModal = (day) => {
    setSelectedDay(day);
    setSearchTerm("");
    setIsModalOpen(true);
  };

  // =========================================================
  // CLOSE ATTENDANCE MODAL
  // =========================================================

  const closeAttendanceModal = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setSearchTerm("");
  };

  // =========================================================
  // GET STUDENT NAME
  // =========================================================

  const getStudentName = (student) => {
    if (!student) {
      return "Unknown Student";
    }

    if (typeof student === "string") {
      return student;
    }

    const fullName =
      `${student.firstName || ""} ${
        student.lastName || ""
      }`.trim();

    return (
      student.fullname ||
      student.fullName ||
      student.name ||
      fullName ||
      "Unknown Student"
    );
  };

  // =========================================================
  // GET ADMISSION NUMBER
  // =========================================================

  const getAdmissionNumber = (
    student
  ) => {
    if (
      !student ||
      typeof student === "string"
    ) {
      return "-";
    }

    return (
      student.admissionNumber ||
      student.registrationNumber ||
      student.regNumber ||
      "-"
    );
  };

  // =========================================================
  // GET STATUS
  // =========================================================

  const getStatus = (record) => {
    return record?.status || "Unknown";
  };

  // =========================================================
  // FILTER STUDENTS INSIDE MODAL
  // =========================================================

  const filteredRecords =
    selectedDay?.records?.filter(
      (record) => {
        const studentName =
          getStudentName(
            record?.student
          ).toLowerCase();

        const admissionNumber =
          String(
            getAdmissionNumber(
              record?.student
            )
          ).toLowerCase();

        const status =
          getStatus(
            record
          ).toLowerCase();

        const search =
          searchTerm
            .trim()
            .toLowerCase();

        return (
          studentName.includes(
            search
          ) ||
          admissionNumber.includes(
            search
          ) ||
          status.includes(search)
        );
      }
    ) || [];

  // =========================================================
  // EXPORT EXCEL
  // =========================================================

  const downloadExcel = (day) => {
    if (!day?.records?.length) {
      toast.warning(
        "There are no attendance records to export."
      );

      return;
    }

    try {
      const selectedClass =
        classes.find(
          (item) =>
            item._id === classId
        );

      const className =
        selectedClass?.name ||
        "Class";

      const excelData =
        day.records.map(
          (record, index) => {
            const student =
              record?.student;

            return {
              "S/N": index + 1,

              "Student Name":
                getStudentName(
                  student
                ),

              "Admission Number":
                getAdmissionNumber(
                  student
                ),

              Status:
                getStatus(record),

              Date: day.date,

              Class: className,
            };
          }
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          excelData
        );

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 30 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Attendance"
      );

      const safeClassName =
        className
          .replace(
            /[^a-z0-9]/gi,
            "_"
          )
          .toLowerCase();

      const fileName =
        `Attendance_${safeClassName}_${day.date}.xlsx`;

      XLSX.writeFile(
        workbook,
        fileName
      );

      toast.success(
        "Attendance Excel file downloaded successfully."
      );
    } catch (error) {
      console.error(
        "Excel export error:",
        error
      );

      toast.error(
        "Failed to download attendance."
      );
    }
  };

  // =========================================================
  // STATUS UI
  // =========================================================

  const getStatusStyle = (
    status
  ) => {
    switch (
      status?.toLowerCase()
    ) {
      case "present":
        return {
          wrapper:
            "bg-green-50 text-green-700 border-green-100",
          icon: (
            <CheckCircle2
              size={15}
              className="text-green-600"
            />
          ),
        };

      case "absent":
        return {
          wrapper:
            "bg-red-50 text-red-700 border-red-100",
          icon: (
            <XCircle
              size={15}
              className="text-red-600"
            />
          ),
        };

      case "leave":
        return {
          wrapper:
            "bg-yellow-50 text-yellow-700 border-yellow-100",
          icon: (
            <Clock3
              size={15}
              className="text-yellow-600"
            />
          ),
        };

      default:
        return {
          wrapper:
            "bg-gray-50 text-gray-600 border-gray-100",
          icon: null,
        };
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-5">

      {/* PAGE HEADER */}

      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <RotateCcwIcon
            size={22}
            className="text-teal-600"
          />

          Attendance History
        </h1>

        <p className="mt-0.5 text-sm text-gray-500">
          Track attendance, view student
          records, or download attendance
          as Excel.
        </p>
      </div>

      {/* FILTER */}

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} />

          Filter Records
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">

          {/* CLASS */}

          <select
            value={classId}
            onChange={(e) =>
              handleClassChange(
                e.target.value
              )
            }
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          >
            <option value="">
              Select Class
            </option>

            {classes.map(
              (classItem) => (
                <option
                  key={classItem._id}
                  value={classItem._id}
                >
                  {classItem.name}
                </option>
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

          {/* DATE */}

          <input
            type="date"
            value={date}
            onChange={
              handleDateChange
            }
            max={today()}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
          />

          {/* APPLY */}

          <button
            type="button"
            onClick={() =>
              fetchData(
                classId,
                date
              )
            }
            disabled={
              isLoading ||
              !classId
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                isLoading
                  ? "animate-spin"
                  : ""
              }
            />

            {isLoading
              ? "Loading..."
              : "Apply"}
          </button>
        </div>
      </div>

      {/* ATTENDANCE RECORDS */}

      {classId && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CheckSquare
              size={16}
              className="text-teal-600"
            />

            Attendance Records
          </div>

          {/* LOADING */}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-14">
              <RefreshCw
                size={25}
                className="mb-3 animate-spin text-teal-600"
              />

              <p className="text-sm font-medium text-gray-700">
                Loading attendance...
              </p>
            </div>
          )}

          {/* EMPTY */}

          {!isLoading &&
            attendanceHistory.length ===
              0 && (
              <div className="flex flex-col items-center justify-center py-14 text-center">

                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <Users
                    size={22}
                    className="text-gray-400"
                  />
                </div>

                <p className="font-medium text-gray-700">
                  No records found
                </p>

                <p className="mt-1 text-sm text-gray-400">
                  No attendance has been
                  marked for this class
                  on this date.
                </p>

              </div>
            )}

          {/* RECORDS */}

          {!isLoading &&
            attendanceHistory.length >
              0 && (
              <div className="divide-y divide-gray-100">

                {attendanceHistory.map(
                  (day) => (
                    <button
                      type="button"
                      key={day.date}
                      onClick={() =>
                        openAttendanceModal(
                          day
                        )
                      }
                      className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-gray-50"
                    >

                      {/* DATE */}

                      <div className="min-w-0 flex-1">

                        <p className="font-semibold text-gray-900 group-hover:text-teal-700">
                          {day.date}
                        </p>

                        <p className="mt-0.5 text-sm text-gray-500">
                          {day.total} students
                          {" · "}
                          <span className="text-green-600">
                            {day.present} present
                          </span>
                          {" · "}
                          <span className="text-red-600">
                            {day.absent} absent
                          </span>

                          {day.leave >
                            0 && (
                            <>
                              {" · "}

                              <span className="text-yellow-600">
                                {day.leave} leave
                              </span>
                            </>
                          )}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Click to view
                          student records
                        </p>

                      </div>

                      {/* PERCENTAGE */}

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          day.percentage >=
                          75
                            ? "bg-green-100 text-green-700"
                            : day.percentage >=
                              50
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {day.percentage}%
                      </span>

                    </button>
                  )
                )}

              </div>
            )}
        </div>
      )}

      {/* ATTENDANCE MODAL */}

      {isModalOpen &&
        selectedDay && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={
              closeAttendanceModal
            }
          >

            <div
              className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Attendance Details
                  </h2>

                  <p className="mt-0.5 text-sm text-gray-500">
                    {selectedDay.date}
                  </p>
                </div>

                <div className="flex items-center gap-2">

                  {/* DOWNLOAD */}

                  <button
                    type="button"
                    onClick={() =>
                      downloadExcel(
                        selectedDay
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    <Download
                      size={16}
                    />

                    <span className="hidden sm:inline">
                      Download Excel
                    </span>
                  </button>

                  {/* CLOSE */}

                  <button
                    type="button"
                    onClick={
                      closeAttendanceModal
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                    aria-label="Close attendance details"
                  >
                    <X size={19} />
                  </button>

                </div>

              </div>

              {/* SUMMARY */}

              <div className="grid grid-cols-2 gap-3 border-b border-gray-100 bg-gray-50 p-4 sm:grid-cols-4">

                {/* TOTAL */}

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-medium text-gray-500">
                    Total Students
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {selectedDay.total}
                  </p>
                </div>

                {/* PRESENT */}

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-medium text-gray-500">
                    Present
                  </p>

                  <p className="mt-1 text-xl font-bold text-green-600">
                    {selectedDay.present}
                  </p>
                </div>

                {/* ABSENT */}

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-medium text-gray-500">
                    Absent
                  </p>

                  <p className="mt-1 text-xl font-bold text-red-600">
                    {selectedDay.absent}
                  </p>
                </div>

                {/* PERCENTAGE */}

                <div className="rounded-xl bg-white p-3">
                  <p className="text-xs font-medium text-gray-500">
                    Attendance
                  </p>

                  <p className="mt-1 text-xl font-bold text-teal-600">
                    {selectedDay.percentage}%
                  </p>
                </div>

              </div>

              {/* SEARCH */}

              <div className="border-b border-gray-100 p-4">

                <div className="relative">

                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(
                        e.target.value
                      )
                    }
                    placeholder="Search student name, admission number or status..."
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />

                </div>

              </div>

              {/* TABLE */}

              <div className="flex-1 overflow-auto">

                {filteredRecords.length ===
                0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">

                    <Users
                      size={30}
                      className="mb-3 text-gray-300"
                    />

                    <p className="font-medium text-gray-700">
                      No students found
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Try another search.
                    </p>

                  </div>
                ) : (
                  <table className="w-full min-w-[650px] text-left">

                    <thead className="sticky top-0 z-10 bg-gray-50">

                      <tr className="border-b border-gray-200">

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          #
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Student
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Admission No.
                        </th>

                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-gray-100">

                      {filteredRecords.map(
                        (
                          record,
                          index
                        ) => {
                          const status =
                            getStatus(
                              record
                            );

                          const statusStyle =
                            getStatusStyle(
                              status
                            );

                          return (
                            <tr
                              key={
                                record._id ||
                                record.id ||
                                index
                              }
                              className="transition hover:bg-gray-50"
                            >

                              <td className="px-5 py-3 text-sm text-gray-400">
                                {index + 1}
                              </td>

                              <td className="px-5 py-3">

                                <p className="text-sm font-semibold text-gray-900">
                                  {getStudentName(
                                    record?.student
                                  )}
                                </p>

                              </td>

                              <td className="px-5 py-3 text-sm text-gray-500">
                                {getAdmissionNumber(
                                  record?.student
                                )}
                              </td>

                              <td className="px-5 py-3">

                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.wrapper}`}
                                >
                                  {
                                    statusStyle.icon
                                  }

                                  {status}
                                </span>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>
                )}

              </div>

              {/* MODAL FOOTER */}

              <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">

                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {
                      filteredRecords.length
                    }
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {
                      selectedDay
                        .records?.length ||
                      0
                    }
                  </span>{" "}
                  students
                </p>

                <button
                  type="button"
                  onClick={
                    closeAttendanceModal
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}
    </div>
  );
};

export default HoaAttendacHistory;