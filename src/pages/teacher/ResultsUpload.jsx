import {
  useState,
  useRef,
  useEffect,
  useMemo,
  Fragment,
} from 'react';

import * as XLSX from 'xlsx';

import MainLayout from '../../layouts/MainLayout';
import { teacherAPI } from '../../api/teacher.api';
import { adminAPI } from '../../api/admin.api';

import { toast } from 'react-toastify';

import {
  Upload,
  CheckCircle2,
  FileSpreadsheet,
  X,
  Download,
  Link,
  Eye,
  RefreshCw,
  Table2,
  Save,
} from 'lucide-react';

/* =========================================================
   MODES
========================================================= */

const MODES = [
  {
    id: 'file',
    label: 'Excel File',
    Icon: FileSpreadsheet,
  },
  {
    id: 'sheets',
    label: 'Google Sheets',
    Icon: Link,
  },
  {
    id: 'manual',
    label: 'Input Online - Excel',
    Icon: Table2,
  },
];

/* =========================================================
   COMPONENT
========================================================= */

export default function ResultsUpload() {
  /* =======================================================
     SHARED STATE
  ======================================================= */

  const [mode, setMode] = useState('file');

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('');
  const [session, setSession] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [templateLoading, setTemplateLoading] = useState(false);

  /* =======================================================
     FILE MODE
  ======================================================= */

  const [file, setFile] = useState(null);

  const fileInputRef = useRef(null);

  /* =======================================================
     GOOGLE SHEETS MODE
  ======================================================= */

  const [sheetsUrl, setSheetsUrl] = useState('');
  const [fetchingSheet, setFetchingSheet] = useState(false);

  const [sheetPreview, setSheetPreview] = useState(null);
  const [sheetFile, setSheetFile] = useState(null);

  /* =======================================================
     MANUAL MODE
  ======================================================= */

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [manualResults, setManualResults] = useState({});

  /* =======================================================
     LOAD ASSIGNED CLASSES
  ======================================================= */

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response =
          await teacherAPI.getAssignedClasses();

        setClasses(
          response?.data?.classes || []
        );
      } catch (error) {
        console.error(
          'Failed to load classes:',
          error
        );

        toast.error(
          error?.response?.data?.message ||
            'Failed to load classes'
        );
      }
    };

    loadClasses();
  }, []);

  /* =======================================================
     SELECTED CLASS OBJECT
  ======================================================= */

  const selectedClassObject = useMemo(() => {
    return classes.find(
      (classItem) =>
        classItem._id === selectedClass
    );
  }, [classes, selectedClass]);

  /* =======================================================
     SELECTED SECTION ID
  ======================================================= */

  const selectedSectionId = useMemo(() => {
    if (!selectedClassObject) {
      return '';
    }

    return (
      selectedClassObject.section?._id ||
      selectedClassObject.sectionId ||
      selectedClassObject.section?.id ||
      ''
    );
  }, [selectedClassObject]);

  /* =======================================================
     LOAD SUBJECTS FOR SELECTED SECTION
  ======================================================= */

  useEffect(() => {
    const loadSubjects = async () => {
      if (!selectedSectionId) {
        setSubjects([]);
        return;
      }

      try {
        setSubjectsLoading(true);

        const response =
          await adminAPI.getSubjectsBySection(
            selectedSectionId
          );

        console.log(
          'SUBJECTS BY SECTION:',
          response?.data
        );

        const subjectList =
          response?.data?.subjects ||
          response?.data?.data ||
          response?.data ||
          [];

        const normalizedSubjects =
          Array.isArray(subjectList)
            ? subjectList
                .map((subject) => {
                  if (!subject) {
                    return null;
                  }

                  if (
                    typeof subject === 'string'
                  ) {
                    return {
                      _id: subject,
                      name: subject,
                      subjectName: subject,
                    };
                  }

                  return {
                    _id:
                      subject._id ||
                      subject.id ||
                      '',

                    name:
                      subject.name ||
                      subject.subjectName ||
                      subject.title ||
                      'Subject',

                    subjectName:
                      subject.subjectName ||
                      subject.name ||
                      subject.title ||
                      'Subject',
                  };
                })
                .filter(
                  (subject) =>
                    subject?._id
                )
            : [];

        setSubjects(
          normalizedSubjects
        );
      } catch (error) {
        console.error(
          'Failed to load subjects:',
          error
        );

        setSubjects([]);

        toast.error(
          error?.response?.data?.message ||
            'Failed to load subjects for this section'
        );
      } finally {
        setSubjectsLoading(false);
      }
    };

    loadSubjects();
  }, [selectedSectionId]);

  /* =======================================================
     LOAD STUDENTS
  ======================================================= */

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setManualResults({});
      return;
    }

    const loadStudents = async () => {
      try {
        setStudentsLoading(true);

        const response =
          await teacherAPI.getClassStudents(
            selectedClass
          );

        const classStudents =
          response?.data?.students || [];

        setStudents(classStudents);
      } catch (error) {
        console.error(
          'Failed to load students:',
          error
        );

        setStudents([]);

        toast.error(
          error?.response?.data?.message ||
            'Failed to load students'
        );
      } finally {
        setStudentsLoading(false);
      }
    };

    loadStudents();
  }, [selectedClass]);

  /* =======================================================
     INITIALIZE MANUAL RESULT CELLS
  ======================================================= */

  useEffect(() => {
    if (
      !students.length ||
      !subjects.length
    ) {
      setManualResults({});
      return;
    }

    const initialData = {};

    students.forEach((student) => {
      initialData[student._id] = {};

      subjects.forEach((subject) => {
        initialData[student._id][
          subject._id
        ] = {
          firstCA: '',
          secondCA: '',
          examScore: '',
        };
      });
    });

    setManualResults(initialData);
  }, [students, subjects]);

  /* =======================================================
     DOWNLOAD EXCEL TEMPLATE
  ======================================================= */

  const handleDownloadTemplate =
    async () => {
      if (!selectedClass) {
        toast.error(
          'Select a class first'
        );
        return;
      }

      if (!term) {
        toast.error(
          'Select a term first'
        );
        return;
      }

      if (!subjects.length) {
        toast.error(
          'No subjects found for this class section'
        );
        return;
      }

      setTemplateLoading(true);

      try {
        const classObj =
          classes.find(
            (classItem) =>
              classItem._id ===
              selectedClass
          );

        const className =
          classObj?.name || 'Class';

        const response =
          await teacherAPI.getClassStudents(
            selectedClass
          );

        const classStudents =
          response?.data?.students || [];

        if (!classStudents.length) {
          toast.error(
            'No students found in this class'
          );
          return;
        }

        const subjectColumns =
          subjects.map(
            (subject) =>
              subject.name ||
              subject.subjectName
          );

        const headers = [
          'Reg No',
          'Term',
          'Class',
          ...subjectColumns,
        ];

        const dataRows =
          classStudents.map(
            (student) => {
              const row = {
                'Reg No':
                  student.registrationNumber ||
                  '',

                Term: term,

                Class: className,
              };

              subjectColumns.forEach(
                (subject) => {
                  row[subject] = '';
                }
              );

              return row;
            }
          );

        const worksheet =
          XLSX.utils.json_to_sheet(
            dataRows,
            {
              header: headers,
            }
          );

        worksheet['!cols'] =
          headers.map(
            (header) => ({
              wch: Math.max(
                String(header).length +
                  4,
                14
              ),
            })
          );

        const workbook =
          XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          'Results'
        );

        const safeClassName =
          className.replace(
            /\s/g,
            '_'
          );

        const safeTerm =
          term.replace(
            /\s/g,
            '_'
          );

        XLSX.writeFile(
          workbook,
          `Result_Template_${safeClassName}_${safeTerm}.xlsx`
        );

        toast.success(
          `Template downloaded — ${classStudents.length} student(s), ${subjects.length} subject(s)`
        );
      } catch (error) {
        console.error(
          'Template error:',
          error
        );

        toast.error(
          error?.response?.data?.message ||
            'Failed to generate template'
        );
      } finally {
        setTemplateLoading(false);
      }
    };

  /* =======================================================
     FILE SELECT
  ======================================================= */

  const handleFileSelect = (event) => {
    const selected =
      event.target.files?.[0];

    if (!selected) {
      return;
    }

    if (
      !selected.name.match(
        /\.(xlsx|xls)$/i
      )
    ) {
      toast.error(
        'Only .xlsx / .xls files allowed'
      );

      return;
    }

    if (
      selected.size >
      10 * 1024 * 1024
    ) {
      toast.error(
        'File must be under 10 MB'
      );

      return;
    }

    setFile(selected);
  };

  /* =======================================================
     FETCH GOOGLE SHEET
  ======================================================= */

  const handleFetchSheet =
    async () => {
      if (!sheetsUrl.trim()) {
        toast.error(
          'Paste a Google Sheets link first'
        );

        return;
      }

      if (
        !sheetsUrl.includes(
          'docs.google.com/spreadsheets'
        )
      ) {
        toast.error(
          'That does not look like a Google Sheets URL'
        );

        return;
      }

      setFetchingSheet(true);
      setSheetPreview(null);
      setSheetFile(null);

      try {
        const response =
          await teacherAPI.fetchSheetPreview(
            sheetsUrl.trim()
          );

        const {
          rows,
          base64,
          sheetName,
        } = response.data;

        if (!rows?.length) {
          toast.error(
            'Sheet appears to be empty'
          );

          return;
        }

        const headers =
          Object.keys(rows[0]);

        setSheetPreview({
          rows,
          headers,
          sheetName,
        });

        /* Convert base64 to File */

        const byteArray =
          Uint8Array.from(
            atob(base64),
            (character) =>
              character.charCodeAt(0)
          );

        const blob = new Blob(
          [byteArray],
          {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }
        );

        const convertedFile =
          new File(
            [blob],
            'google_sheet_results.xlsx',
            {
              type: blob.type,
            }
          );

        setSheetFile(
          convertedFile
        );

        toast.success(
          `Sheet loaded — ${rows.length} row(s) from "${sheetName}"`
        );
      } catch (error) {
        console.error(
          'Google Sheet error:',
          error
        );

        toast.error(
          error?.response?.data?.message ||
            'Failed to fetch sheet. Make sure it is set to "Anyone with the link can view".'
        );
      } finally {
        setFetchingSheet(false);
      }
    };

  /* =======================================================
     CLEAR GOOGLE SHEET
  ======================================================= */

  const clearSheet = () => {
    setSheetPreview(null);
    setSheetFile(null);
    setSheetsUrl('');
  };

  /* =======================================================
     EXCEL / GOOGLE SHEETS UPLOAD
  ======================================================= */

  const handleUpload =
    async () => {
      const uploadFile =
        mode === 'file'
          ? file
          : sheetFile;

      if (!uploadFile) {
        toast.error(
          'No file ready to upload'
        );

        return;
      }

      if (!selectedClass) {
        toast.error(
          'Select a class'
        );

        return;
      }

      if (!term) {
        toast.error(
          'Select a term'
        );

        return;
      }

      setLoading(true);
      setUploadProgress(0);

      let interval;

      try {
        const formData =
          new FormData();

        formData.append(
          'file',
          uploadFile
        );

        formData.append(
          'classId',
          selectedClass
        );

        formData.append(
          'term',
          term
        );

        if (session) {
          formData.append(
            'session',
            session
          );
        }

        interval = setInterval(
          () => {
            setUploadProgress(
              (progress) =>
                progress >= 90
                  ? progress
                  : progress + 10
            );
          },
          250
        );

        const response =
          await teacherAPI.uploadResults(
            formData
          );

        clearInterval(interval);

        setUploadProgress(100);

        toast.success(
          response?.data?.message ||
            'Results uploaded successfully'
        );

        if (
          response?.data?.notFound
            ?.length
        ) {
          toast.warn(
            `${response.data.notFound.length} reg number(s) not matched: ${response.data.notFound.join(', ')}`
          );
        }

        setTimeout(() => {
          setFile(null);
          setSheetPreview(null);
          setSheetFile(null);
          setSheetsUrl('');
          setSelectedClass('');
          setTerm('');
          setSession('');
          setUploadProgress(0);

          if (
            fileInputRef.current
          ) {
            fileInputRef.current.value =
              '';
          }
        }, 1500);
      } catch (error) {
        if (interval) {
          clearInterval(interval);
        }

        console.error(
          'Upload error:',
          error
        );

        toast.error(
          error?.response?.data?.message ||
            'Upload failed'
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     GET CELL VALUE
  ======================================================= */

  const getCellValue = (
    studentId,
    subjectId,
    field
  ) => {
    return (
      manualResults?.[studentId]?.[
        subjectId
      ]?.[field] ?? ''
    );
  };

  /* =======================================================
     CHANGE SCORE
  ======================================================= */

  const handleScoreChange = (
    studentId,
    subjectId,
    field,
    value
  ) => {
    if (
      value !== '' &&
      !/^\d*\.?\d*$/.test(value)
    ) {
      return;
    }

    let max = 100;

    if (
      field === 'firstCA' ||
      field === 'secondCA'
    ) {
      max = 20;
    }

    if (field === 'examScore') {
      max = 60;
    }

    if (Number(value) > max) {
      const fieldName =
        field === 'examScore'
          ? 'Exam'
          : field === 'firstCA'
            ? '1st CA'
            : '2nd CA';

      toast.warning(
        `${fieldName} cannot be more than ${max}`
      );

      value = String(max);
    }

    setManualResults(
      (previous) => ({
        ...previous,

        [studentId]: {
          ...(previous[
            studentId
          ] || {}),

          [subjectId]: {
            ...(previous[
              studentId
            ]?.[subjectId] || {}),

            [field]: value,
          },
        },
      })
    );
  };

  /* =======================================================
     SUBJECT TOTAL
  ======================================================= */

  const getSubjectTotal = (
    studentId,
    subjectId
  ) => {
    const firstCA =
      Number(
        getCellValue(
          studentId,
          subjectId,
          'firstCA'
        )
      ) || 0;

    const secondCA =
      Number(
        getCellValue(
          studentId,
          subjectId,
          'secondCA'
        )
      ) || 0;

    const exam =
      Number(
        getCellValue(
          studentId,
          subjectId,
          'examScore'
        )
      ) || 0;

    return (
      firstCA +
      secondCA +
      exam
    );
  };

  /* =======================================================
     GRADE
  ======================================================= */

  const getGrade = (total) => {
    if (total >= 70) {
      return 'A';
    }

    if (total >= 60) {
      return 'B';
    }

    if (total >= 50) {
      return 'C';
    }

    if (total >= 45) {
      return 'D';
    }

    return 'F';
  };

  /* =======================================================
     GRADE STYLE
  ======================================================= */

  const getGradeStyle = (
    grade
  ) => {
    switch (grade) {
      case 'A':
        return 'bg-green-100 text-green-700';

      case 'B':
        return 'bg-blue-100 text-blue-700';

      case 'C':
        return 'bg-yellow-100 text-yellow-700';

      case 'D':
        return 'bg-orange-100 text-orange-700';

      default:
        return 'bg-red-100 text-red-700';
    }
  };

  /* =======================================================
     SUBMIT MANUAL RESULTS
  ======================================================= */

  const handleManualSubmit =
    async () => {
      if (!selectedClass) {
        toast.error(
          'Select a class first'
        );

        return;
      }

      if (!term) {
        toast.error(
          'Select a term first'
        );

        return;
      }

      if (!session) {
        toast.error(
          'Enter the academic session'
        );

        return;
      }

      if (!students.length) {
        toast.error(
          'No students found'
        );

        return;
      }

      if (!subjects.length) {
        toast.error(
          'No subjects found for this class section'
        );

        return;
      }

      const invalidSubject =
        subjects.find(
          (subject) =>
            !subject._id
        );

      if (invalidSubject) {
        toast.error(
          'One or more subjects do not have a valid ID'
        );

        return;
      }

      setLoading(true);

      try {
        const formattedResults =
          students.map(
            (student) => ({
              studentUid:
                student.registrationNumber,

              subjects:
                subjects.map(
                  (subject) => ({
                    subjectId:
                      subject._id,

                    subjectName:
                      subject.name ||
                      subject.subjectName,

                    firstCA:
                      Number(
                        getCellValue(
                          student._id,
                          subject._id,
                          'firstCA'
                        )
                      ) || 0,

                    secondCA:
                      Number(
                        getCellValue(
                          student._id,
                          subject._id,
                          'secondCA'
                        )
                      ) || 0,

                    examScore:
                      Number(
                        getCellValue(
                          student._id,
                          subject._id,
                          'examScore'
                        )
                      ) || 0,
                  })
                ),
            })
          );

        const payload = {
          classId:
            selectedClass,

          term,

          session,

          results:
            formattedResults,
        };

        console.log(
          'MANUAL RESULT PAYLOAD:',
          payload
        );

        const response =
          await teacherAPI.inputResult(
            payload
          );

        toast.success(
          response?.data?.message ||
            'Results submitted successfully'
        );

        if (
          response?.data?.notFound
            ?.length
        ) {
          toast.warn(
            `${response.data.notFound.length} student(s) could not be found: ${response.data.notFound.join(', ')}`
          );
        }

        /* Clear cells */

        const cleared = {};

        students.forEach(
          (student) => {
            cleared[
              student._id
            ] = {};

            subjects.forEach(
              (subject) => {
                cleared[
                  student._id
                ][
                  subject._id
                ] = {
                  firstCA: '',
                  secondCA: '',
                  examScore: '',
                };
              }
            );
          }
        );

        setManualResults(
          cleared
        );
      } catch (error) {
        console.error(
          'MANUAL RESULT ERROR:',
          error
        );

        toast.error(
          error?.response?.data?.message ||
            'Failed to submit results'
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     READY STATES
  ======================================================= */

  const readyToUpload =
    (mode === 'file'
      ? !!file
      : !!sheetFile) &&
    !!selectedClass &&
    !!term;

  const readyForManual =
    !!selectedClass &&
    !!term &&
    !!session &&
    students.length > 0 &&
    subjects.length > 0;

  /* =======================================================
     CHANGE MODE
  ======================================================= */

  const handleModeChange = (
    newMode
  ) => {
    setMode(newMode);

    setFile(null);
    setSheetPreview(null);
    setSheetFile(null);
    setSheetsUrl('');

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  /* =======================================================
     CHANGE CLASS
  ======================================================= */

  const handleClassChange = (
    event
  ) => {
    const classId =
      event.target.value;

    setSelectedClass(classId);

    setSubjects([]);
    setStudents([]);
    setManualResults({});

    setFile(null);
    setSheetPreview(null);
    setSheetFile(null);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        '';
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <MainLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Upload Results
          </h1>

          <p className="text-gray-500 mt-1">
            Upload via Excel, Google Sheets,
            or enter results directly in the
            spreadsheet.
          </p>
        </div>

        {/* =================================================
            MODE TABS
        ================================================= */}

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {MODES.map(
            ({
              id,
              label,
              Icon,
            }) => (
              <button
                key={id}
                type="button"
                onClick={() =>
                  handleModeChange(
                    id
                  )
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={15} />

                {label}
              </button>
            )
          )}
        </div>

        {/* =================================================
            COMMON FORM
        ================================================= */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* CLASS */}

            <div>
              <label className="block text-sm font-semibold mb-1">
                Class *
              </label>

              <select
                value={
                  selectedClass
                }
                onChange={
                  handleClassChange
                }
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">
                  Select class
                </option>

                {classes.map(
                  (classItem) => (
                    <option
                      key={
                        classItem._id
                      }
                      value={
                        classItem._id
                      }
                    >
                      {
                        classItem.name
                      }
                    </option>
                  )
                )}
              </select>

              {selectedClassObject && (
                <p className="text-xs text-gray-400 mt-1">
                  Section:{' '}
                  {selectedClassObject
                    .section
                    ?.name ||
                    selectedClassObject
                      .sectionName ||
                    'Assigned section'}
                </p>
              )}
            </div>

            {/* TERM */}

            <div>
              <label className="block text-sm font-semibold mb-1">
                Term *
              </label>

              <select
                value={term}
                onChange={(event) =>
                  setTerm(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">
                  Select term
                </option>

                <option value="First Term">
                  First Term
                </option>

                <option value="Second Term">
                  Second Term
                </option>

                <option value="Third Term">
                  Third Term
                </option>
              </select>
            </div>

            {/* SESSION */}

            <div>
              <label className="block text-sm font-semibold mb-1">
                Academic Session{' '}
                <span className="font-normal text-gray-400">
                  (required for online input)
                </span>
              </label>

              <input
                type="text"
                value={session}
                onChange={(event) =>
                  setSession(
                    event.target.value
                  )
                }
                placeholder="e.g. 2026/2027"
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            SUBJECT LOADING
        ================================================= */}

        {selectedClass &&
          subjectsLoading && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm">
              <RefreshCw
                size={16}
                className="animate-spin"
              />

              Loading subjects for this
              section...
            </div>
          )}

        {/* =================================================
            NO SUBJECTS
        ================================================= */}

        {selectedClass &&
          !subjectsLoading &&
          subjects.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
              No subjects have been
              assigned to this class
              section yet.
            </div>
          )}

        {/* =================================================
            FILE MODE
        ================================================= */}

        {mode === 'file' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

            {/* DOWNLOAD TEMPLATE */}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Step 1 — Download template
              </p>

              <p className="text-xs text-blue-600 mb-3">
                Select class and term above,
                then download the Excel
                template using the subjects
                assigned to that section.
              </p>

              <button
                type="button"
                onClick={
                  handleDownloadTemplate
                }
                disabled={
                  templateLoading ||
                  !selectedClass ||
                  !term ||
                  !subjects.length
                }
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <Download size={15} />

                {templateLoading
                  ? 'Generating…'
                  : 'Download Template'}
              </button>
            </div>

            {/* FILE UPLOAD */}

            <div>
              <label className="block text-sm font-semibold mb-1">
                Step 2 — Upload filled
                Excel *
              </label>

              <div
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="border-2 border-dashed border-green-300 bg-green-50 hover:bg-green-100 rounded-2xl p-10 text-center cursor-pointer transition"
              >
                <input
                  type="file"
                  hidden
                  ref={
                    fileInputRef
                  }
                  accept=".xlsx,.xls"
                  onChange={
                    handleFileSelect
                  }
                />

                {file ? (
                  <div className="space-y-2">
                    <CheckCircle2
                      className="mx-auto text-green-500"
                      size={48}
                    />

                    <p className="font-bold text-gray-800">
                      {file.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {(
                        file.size /
                        1024
                      ).toFixed(1)}{' '}
                      KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload
                      className="mx-auto text-green-400"
                      size={44}
                    />

                    <p className="font-semibold text-gray-700">
                      Click to choose the
                      filled Excel file
                    </p>

                    <p className="text-sm text-gray-400">
                      .xlsx or .xls —
                      max 10 MB
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <div className="mt-2 flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet
                      className="text-green-600"
                      size={22}
                    />

                    <span className="text-sm font-medium text-gray-800">
                      {file.name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(
                        null
                      );

                      if (
                        fileInputRef.current
                      ) {
                        fileInputRef.current.value =
                          '';
                      }
                    }}
                    className="p-1 hover:bg-red-100 rounded-lg transition"
                  >
                    <X
                      className="text-red-500"
                      size={17}
                    />
                  </button>
                </div>
              )}
            </div>

            {/* PROGRESS */}

            {loading && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 font-medium">
                    Uploading...
                  </span>

                  <span className="text-blue-600 font-bold">
                    {uploadProgress}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={
                handleUpload
              }
              disabled={
                loading ||
                !readyToUpload
              }
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? `Uploading ${uploadProgress}%…`
                : 'Upload Results'}
            </button>
          </div>
        )}

        {/* =================================================
            GOOGLE SHEETS MODE
        ================================================= */}

        {mode === 'sheets' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* SHEET FORM */}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Make sure the sheet
                  is set to{' '}
                  <strong>
                    "Anyone with the link can view"
                  </strong>{' '}
                  before fetching.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Google Sheets URL *
                </label>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={
                      sheetsUrl
                    }
                    onChange={(
                      event
                    ) =>
                      setSheetsUrl(
                        event.target
                          .value
                      )
                    }
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="flex-1 border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  <button
                    type="button"
                    onClick={
                      handleFetchSheet
                    }
                    disabled={
                      fetchingSheet ||
                      !sheetsUrl.trim()
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition flex-shrink-0"
                  >
                    {fetchingSheet ? (
                      <>
                        <RefreshCw
                          size={15}
                          className="animate-spin"
                        />

                        Fetching…
                      </>
                    ) : (
                      <>
                        <Eye size={15} />

                        Fetch &
                        Preview
                      </>
                    )}
                  </button>
                </div>
              </div>

              {sheetFile && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className="text-green-600"
                      size={20}
                    />

                    <span className="text-sm font-medium text-gray-800">
                      Sheet loaded —
                      ready to
                      upload
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={
                      clearSheet
                    }
                    className="p-1 hover:bg-red-100 rounded-lg transition"
                  >
                    <X
                      className="text-red-500"
                      size={17}
                    />
                  </button>
                </div>
              )}

              {/* PROGRESS */}

              {loading && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">
                      Uploading...
                    </span>

                    <span className="text-blue-600 font-bold">
                      {uploadProgress}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={
                  handleUpload
                }
                disabled={
                  loading ||
                  !readyToUpload
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? `Uploading ${uploadProgress}%…`
                  : 'Upload Results'}
              </button>
            </div>

            {/* SHEET PREVIEW */}

            {sheetPreview && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">

                <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <Table2
                    size={16}
                    className="text-blue-600"
                  />

                  <p className="text-sm font-semibold text-gray-700">
                    Preview —{' '}
                    {
                      sheetPreview.sheetName
                    }{' '}
                    (
                    {
                      sheetPreview
                        .rows
                        .length
                    }{' '}
                    rows)
                  </p>
                </div>

                <div className="overflow-auto max-h-[520px]">
                  <table className="w-full text-xs border-collapse">

                    <thead className="sticky top-0 bg-gray-800 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                          #
                        </th>

                        {sheetPreview.headers.map(
                          (
                            header
                          ) => (
                            <th
                              key={
                                header
                              }
                              className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                            >
                              {
                                header
                              }
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {sheetPreview.rows.map(
                        (
                          row,
                          index
                        ) => (
                          <tr
                            key={
                              index
                            }
                            className={
                              index %
                                2 ===
                              0
                                ? 'bg-white'
                                : 'bg-gray-50'
                            }
                          >
                            <td className="px-3 py-2 text-gray-400 font-mono">
                              {index +
                                1}
                            </td>

                            {sheetPreview.headers.map(
                              (
                                header
                              ) => (
                                <td
                                  key={
                                    header
                                  }
                                  className="px-3 py-2 text-gray-700 whitespace-nowrap"
                                >
                                  {row[
                                    header
                                  ] !==
                                    undefined &&
                                  row[
                                    header
                                  ] !==
                                    '' ? (
                                    String(
                                      row[
                                        header
                                      ]
                                    )
                                  ) : (
                                    <span className="text-gray-300">
                                      —
                                    </span>
                                  )}
                                </td>
                              )
                            )}
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            MANUAL EXCEL MODE
        ================================================= */}

        {mode === 'manual' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* TABLE HEADER */}

            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">

              <div>
                <div className="flex items-center gap-2">
                  <Table2
                    size={19}
                    className="text-green-600"
                  />

                  <h2 className="font-bold text-gray-800">
                    Result Spreadsheet
                  </h2>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Subjects are
                  automatically
                  loaded from the
                  selected class
                  section.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleManualSubmit
                }
                disabled={
                  loading ||
                  !readyForManual
                }
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
              >
                <Save size={16} />

                {loading
                  ? 'Submitting...'
                  : 'Submit Results'}
              </button>
            </div>

            {/* SUBJECT LOADING */}

            {subjectsLoading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw
                  size={24}
                  className="text-blue-600 animate-spin"
                />

                <span className="ml-3 text-sm text-gray-500">
                  Loading subjects...
                </span>
              </div>
            )}

            {/* STUDENT LOADING */}

            {studentsLoading &&
              !subjectsLoading && (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw
                    size={24}
                    className="text-blue-600 animate-spin"
                  />

                  <span className="ml-3 text-sm text-gray-500">
                    Loading students...
                  </span>
                </div>
              )}

            {/* NO CLASS */}

            {!studentsLoading &&
              !subjectsLoading &&
              !selectedClass && (
                <div className="py-16 text-center">
                  <Table2
                    size={42}
                    className="mx-auto text-gray-300"
                  />

                  <p className="font-semibold text-gray-600 mt-3">
                    Select a class
                    to begin
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    Students and
                    subjects will
                    automatically
                    appear.
                  </p>
                </div>
              )}

            {/* NO SUBJECTS */}

            {!subjectsLoading &&
              selectedClass &&
              !subjects.length && (
                <div className="py-16 text-center">
                  <Table2
                    size={42}
                    className="mx-auto text-gray-300"
                  />

                  <p className="font-semibold text-gray-600 mt-3">
                    No subjects
                    assigned
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    Create or assign
                    subjects to this
                    class section
                    first.
                  </p>
                </div>
              )}

            {/* NO STUDENTS */}

            {!studentsLoading &&
              !subjectsLoading &&
              selectedClass &&
              subjects.length >
                0 &&
              !students.length && (
                <div className="py-16 text-center">
                  <p className="font-semibold text-gray-600">
                    No students
                    found
                  </p>

                  <p className="text-sm text-gray-400 mt-1">
                    There are no
                    students assigned
                    to this class.
                  </p>
                </div>
              )}

            {/* =================================================
                EXCEL TABLE
            ================================================= */}

            {!studentsLoading &&
              !subjectsLoading &&
              students.length >
                0 &&
              subjects.length >
                0 && (
                <div className="overflow-auto max-h-[650px]">

                  <table className="border-collapse min-w-max w-full text-xs">

                    <thead className="sticky top-0 z-20">

                      {/* SUBJECT HEADER */}

                      <tr className="bg-gray-800 text-white">

                        <th
                          rowSpan="2"
                          className="sticky left-0 z-30 bg-gray-800 border border-gray-600 px-4 py-3 text-left min-w-[120px]"
                        >
                          Student UID
                        </th>

                        <th
                          rowSpan="2"
                          className="sticky left-[120px] z-30 bg-gray-800 border border-gray-600 px-4 py-3 text-left min-w-[190px]"
                        >
                          Student Name
                        </th>

                        {subjects.map(
                          (
                            subject
                          ) => (
                            <th
                              key={
                                subject._id
                              }
                              colSpan="4"
                              className="border border-gray-600 px-4 py-2 text-center bg-green-700 min-w-[280px]"
                            >
                              {
                                subject.name
                              }
                            </th>
                          )
                        )}
                      </tr>

                      {/* SCORE HEADER */}

                      <tr className="bg-gray-100 text-gray-700">

                        {subjects.map(
                          (
                            subject
                          ) => (
                            <Fragment
                              key={
                                subject._id
                              }
                            >
                              <th className="border border-gray-300 px-3 py-2 min-w-[70px]">
                                1st CA
                              </th>

                              <th className="border border-gray-300 px-3 py-2 min-w-[70px]">
                                2nd CA
                              </th>

                              <th className="border border-gray-300 px-3 py-2 min-w-[70px]">
                                Exam
                              </th>

                              <th className="border border-gray-300 px-3 py-2 min-w-[70px]">
                                Total
                              </th>
                            </Fragment>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>

                      {students.map(
                        (
                          student,
                          studentIndex
                        ) => (
                          <tr
                            key={
                              student._id
                            }
                            className={
                              studentIndex %
                                2 ===
                              0
                                ? 'bg-white'
                                : 'bg-gray-50'
                            }
                          >

                            {/* UID */}

                            <td className="sticky left-0 z-10 bg-inherit border border-gray-300 px-4 py-3 font-semibold text-green-700">
                              {student.registrationNumber ||
                                'N/A'}
                            </td>

                            {/* NAME */}

                            <td className="sticky left-[120px] z-10 bg-inherit border border-gray-300 px-4 py-3 font-medium text-gray-800">
                              {student.firstName ||
                                ''}{' '}
                              {student.middleName ||
                                ''}{' '}
                              {student.lastName ||
                                ''}
                            </td>

                            {/* SUBJECTS */}

                            {subjects.map(
                              (
                                subject
                              ) => {
                                const total =
                                  getSubjectTotal(
                                    student._id,
                                    subject._id
                                  );

                                const grade =
                                  getGrade(
                                    total
                                  );

                                return (
                                  <Fragment
                                    key={
                                      subject._id
                                    }
                                  >

                                    {/* 1ST CA */}

                                    <td className="border border-gray-300 p-0">
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={getCellValue(
                                          student._id,
                                          subject._id,
                                          'firstCA'
                                        )}
                                        onChange={(
                                          event
                                        ) =>
                                          handleScoreChange(
                                            student._id,
                                            subject._id,
                                            'firstCA',
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        className="w-[70px] h-10 px-2 text-center outline-none bg-transparent focus:bg-green-50 focus:ring-2 focus:ring-inset focus:ring-green-500"
                                      />
                                    </td>

                                    {/* 2ND CA */}

                                    <td className="border border-gray-300 p-0">
                                      <input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={getCellValue(
                                          student._id,
                                          subject._id,
                                          'secondCA'
                                        )}
                                        onChange={(
                                          event
                                        ) =>
                                          handleScoreChange(
                                            student._id,
                                            subject._id,
                                            'secondCA',
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        className="w-[70px] h-10 px-2 text-center outline-none bg-transparent focus:bg-green-50 focus:ring-2 focus:ring-inset focus:ring-green-500"
                                      />
                                    </td>

                                    {/* EXAM */}

                                    <td className="border border-gray-300 p-0">
                                      <input
                                        type="number"
                                        min="0"
                                        max="60"
                                        value={getCellValue(
                                          student._id,
                                          subject._id,
                                          'examScore'
                                        )}
                                        onChange={(
                                          event
                                        ) =>
                                          handleScoreChange(
                                            student._id,
                                            subject._id,
                                            'examScore',
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        className="w-[70px] h-10 px-2 text-center outline-none bg-transparent focus:bg-green-50 focus:ring-2 focus:ring-inset focus:ring-green-500"
                                      />
                                    </td>

                                    {/* TOTAL */}

                                    <td className="border border-gray-300 px-2 text-center">
                                      <div className="flex flex-col items-center justify-center gap-1">

                                        <span className="font-bold text-gray-800">
                                          {total}
                                        </span>

                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getGradeStyle(
                                            grade
                                          )}`}
                                        >
                                          {
                                            grade
                                          }
                                        </span>

                                      </div>
                                    </td>
                                  </Fragment>
                                );
                              }
                            )}
                          </tr>
                        )
                      )}

                    </tbody>
                  </table>
                </div>
              )}

            {/* =================================================
                BOTTOM ACTION
            ================================================= */}

            {students.length >
              0 &&
              subjects.length >
                0 && (
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">

                  <div className="text-xs text-gray-500">
                    <strong>
                      {
                        students.length
                      }
                    </strong>{' '}
                    students ·{' '}
                    <strong>
                      {
                        subjects.length
                      }
                    </strong>{' '}
                    subjects
                  </div>

                  <button
                    type="button"
                    onClick={
                      handleManualSubmit
                    }
                    disabled={
                      loading ||
                      !readyForManual
                    }
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    <Save size={16} />

                    {loading
                      ? 'Submitting...'
                      : 'Submit Results'}
                  </button>
                </div>
              )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
