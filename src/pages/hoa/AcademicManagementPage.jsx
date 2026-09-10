import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BookOpen,
  BookMarked,
  Building2,
  FolderOpen,
  GraduationCap,
  Layers3,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import adminAPI from "../../api/admin.api";

const normalizeText = (value) => String(value || "").trim();

const getSectionKey = (section) => {
  const name = normalizeText(section?.name).toLowerCase();
  const code = normalizeText(section?.code).toLowerCase();

  if (code === "primary" || name.includes("primary")) {
    return "primary";
  }

  if (code === "jss" || name.includes("junior")) {
    return "jss";
  }

  if (code === "ss" || name.includes("senior")) {
    return "ss";
  }

  return name;
};

const getDepartmentKey = (department) => {
  const code = normalizeText(department?.code).toLowerCase();
  const name = normalizeText(department?.name).toLowerCase();

  if (
    code.includes("sci") ||
    code.includes("science") ||
    name.includes("science")
  ) {
    return "science";
  }

  if (code.includes("art") || name.includes("art")) {
    return "arts";
  }

  if (
    code.includes("com") ||
    code.includes("commercial") ||
    name.includes("commercial")
  ) {
    return "commercial";
  }

  return code || name;
};

function AcademicManagementPage() {
  const [sections, setSections] = useState([]);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sectionDepartments, setSectionDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingSubject, setEditingSubject] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);

  const [selectedSectionFilter, setSelectedSectionFilter] =
    useState("all");

  const [selectedDepartmentFilter, setSelectedDepartmentFilter] =
    useState("all");

  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    sectionId: "",
    departmentId: "",
    description: "",
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    sectionId: "",
    description: "",
  });

  /*
   * ==========================================
   * DERIVED DATA
   * ==========================================
   */

  const seniorSection = useMemo(() => {
    return sections.find(
      (section) => getSectionKey(section) === "ss"
    );
  }, [sections]);

  const sectionMap = useMemo(() => {
    return Object.fromEntries(
      sections.map((section) => [section._id, section])
    );
  }, [sections]);

  const groupedClasses = useMemo(() => {
    return sections.map((section) => ({
      ...section,
      items: classes.filter(
        (item) =>
          (item.section?._id || item.section) === section._id
      ),
    }));
  }, [classes, sections]);

  const filteredSubjects = useMemo(() => {
    let list = subjects;

    if (selectedSectionFilter !== "all") {
      list = list.filter(
        (subject) =>
          getSectionKey(subject.section) ===
          selectedSectionFilter
      );
    }

    if (selectedDepartmentFilter !== "all") {
      list = list.filter(
        (subject) =>
          getDepartmentKey(subject.department) ===
          selectedDepartmentFilter
      );
    }

    return list;
  }, [
    subjects,
    selectedSectionFilter,
    selectedDepartmentFilter,
  ]);

  const isSubjectSS = useMemo(() => {
    if (!subjectForm.sectionId) return false;

    const section = sectionMap[subjectForm.sectionId];

    return section && getSectionKey(section) === "ss";
  }, [subjectForm.sectionId, sectionMap]);

  /*
   * ==========================================
   * LOAD ALL ACADEMIC DATA
   * ==========================================
   */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        sectionsRes,
        classesRes,
        departmentsRes,
        subjectsRes,
      ] = await Promise.all([
        adminAPI.getSections(),
        adminAPI.getClasses(),
        adminAPI.getAllDepartments(),
        adminAPI.getAllSubjects(),
      ]);

      const nextSections =
        sectionsRes?.data?.sections || [];

      const nextClasses =
        classesRes?.data?.classes || [];

      const nextDepartments =
        departmentsRes?.data?.departments || [];

      const nextSubjects =
        subjectsRes?.data?.subjects || [];

      setSections(nextSections);
      setClasses(nextClasses);
      setDepartments(nextDepartments);
      setSubjects(nextSubjects);

      /*
       * Default department section to
       * Senior Secondary.
       */
      const ssSection = nextSections.find(
        (section) => getSectionKey(section) === "ss"
      );

      if (ssSection) {
        setDepartmentForm((current) => ({
          ...current,
          sectionId:
            current.sectionId || ssSection._id,
        }));
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to load academic data";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /*
   * ==========================================
   * LOAD SENIOR SECONDARY DEPARTMENTS
   * ==========================================
   */

  useEffect(() => {
    if (!seniorSection?._id) {
      setSectionDepartments([]);
      return;
    }

    const fetchSeniorDepartments = async () => {
      try {
        const { data } =
          await adminAPI.getDepartmentsBySection(
            seniorSection._id
          );

        setSectionDepartments(
          data?.departments || []
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          "Failed to load SS departments";

        toast.error(message);
      }
    };

    fetchSeniorDepartments();
  }, [seniorSection?._id]);

  /*
   * ==========================================
   * REFRESH DATA
   * ==========================================
   */

  const refreshAllData = async () => {
    await loadData();

    /*
     * Reload SS departments immediately.
     */
    const currentSeniorSection =
      sections.find(
        (section) => getSectionKey(section) === "ss"
      );

    if (currentSeniorSection?._id) {
      try {
        const { data } =
          await adminAPI.getDepartmentsBySection(
            currentSeniorSection._id
          );

        setSectionDepartments(
          data?.departments || []
        );
      } catch (err) {
        console.error(
          "Failed to refresh departments:",
          err
        );
      }
    }
  };

  /*
   * ==========================================
   * SUBJECT FORM
   * ==========================================
   */

  const handleSubjectFormChange = (
    field,
    value
  ) => {
    setSubjectForm((current) => {
      if (field === "sectionId") {
        const selectedSection =
          sectionMap[value];

        return {
          ...current,
          sectionId: value,
          departmentId:
            selectedSection &&
            getSectionKey(selectedSection) === "ss"
              ? current.departmentId
              : "",
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  };

  /*
   * ==========================================
   * SELECT SUBJECT SECTION
   * ==========================================
   */

  const handleSectionSelection = async (
    sectionId
  ) => {
    setSubjectForm((current) => ({
      ...current,
      sectionId,
      departmentId: "",
    }));

    const selectedSection = sections.find(
      (section) => section._id === sectionId
    );

    if (
      selectedSection &&
      getSectionKey(selectedSection) === "ss"
    ) {
      try {
        const { data } =
          await adminAPI.getDepartmentsBySection(
            sectionId
          );

        setSectionDepartments(
          data?.departments || []
        );
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          "Failed to load departments";

        toast.error(message);
      }
    } else {
      setSectionDepartments([]);
    }
  };

  /*
   * ==========================================
   * RESET SUBJECT FORM
   * ==========================================
   */

  const resetSubjectForm = () => {
    setEditingSubject(null);

    setSubjectForm({
      name: "",
      code: "",
      sectionId: seniorSection?._id || "",
      departmentId: "",
      description: "",
    });
  };

  /*
   * ==========================================
   * CREATE / UPDATE SUBJECT
   * ==========================================
   */

  const handleSubjectSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const selectedSection =
      sections.find(
        (section) =>
          section._id === subjectForm.sectionId
      );

    if (!selectedSection) {
      toast.error("Please select a section");
      return;
    }

    const payload = {
      name: normalizeText(subjectForm.name),
      code: normalizeText(
        subjectForm.code
      ).toUpperCase(),
      sectionId: subjectForm.sectionId,
      description: normalizeText(
        subjectForm.description
      ),
    };

    /*
     * Senior Secondary requires department.
     */
    if (
      getSectionKey(selectedSection) === "ss"
    ) {
      if (!subjectForm.departmentId) {
        toast.error(
          "Senior Secondary subjects require a department"
        );
        return;
      }

      payload.departmentId =
        subjectForm.departmentId;
    } else {
      /*
       * Primary and JSS do not use departments.
       */
      payload.departmentId = null;
    }

    if (!payload.name || !payload.code) {
      toast.error(
        "Subject name and code are required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingSubject) {
        await adminAPI.updateSubject(
          editingSubject._id,
          payload
        );

        toast.success(
          "Subject updated successfully"
        );
      } else {
        await adminAPI.createSubject(payload);

        toast.success(
          "Subject created successfully"
        );
      }

      resetSubjectForm();

      await refreshAllData();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Could not save subject";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================
   * EDIT SUBJECT
   * ==========================================
   */

  const handleEditSubject = async (
    subject
  ) => {
    setEditingSubject(subject);

    const sectionId =
      subject.section?._id ||
      subject.section ||
      "";

    const departmentId =
      subject.department?._id ||
      subject.department ||
      "";

    setSubjectForm({
      name: subject.name || "",
      code: subject.code || "",
      sectionId,
      departmentId,
      description:
        subject.description || "",
    });

    const matchingSection =
      sections.find(
        (section) => section._id === sectionId
      );

    if (
      matchingSection &&
      getSectionKey(matchingSection) === "ss"
    ) {
      try {
        const { data } =
          await adminAPI.getDepartmentsBySection(
            sectionId
          );

        setSectionDepartments(
          data?.departments || []
        );
      } catch (err) {
        console.error(
          "Failed to load departments:",
          err
        );

        setSectionDepartments([]);
      }
    } else {
      setSectionDepartments([]);
    }
  };

  /*
   * ==========================================
   * DELETE SUBJECT
   * ==========================================
   */

  const handleDeleteSubject = async (
    subjectId
  ) => {
    if (
      !window.confirm(
        "Deactivate this subject?"
      )
    ) {
      return;
    }

    try {
      await adminAPI.deleteSubject(
        subjectId
      );

      toast.success(
        "Subject deactivated"
      );

      await refreshAllData();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to deactivate subject";

      toast.error(message);
    }
  };

  /*
   * ==========================================
   * CREATE / UPDATE DEPARTMENT
   * ==========================================
   */

  const handleDepartmentSubmit = async (
    event
  ) => {
    event.preventDefault();
    event.stopPropagation();

    /*
     * Departments belong ONLY to SS.
     */
    if (!seniorSection?._id) {
      toast.error(
        "Senior Secondary section was not found"
      );
      return;
    }

    const payload = {
      name: normalizeText(
        departmentForm.name
      ),
      code: normalizeText(
        departmentForm.code
      ).toUpperCase(),
      description: normalizeText(
        departmentForm.description
      ),
      sectionId: seniorSection._id,
    };

    if (!payload.name || !payload.code) {
      toast.error(
        "Department name and code are required"
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingDepartment) {
        await adminAPI.updateDepartment(
          editingDepartment._id,
          payload
        );

        toast.success(
          "Department updated successfully"
        );
      } else {
        await adminAPI.createDepartment(
          payload
        );

        toast.success(
          "Department created successfully"
        );
      }

      setEditingDepartment(null);

      setDepartmentForm({
        name: "",
        code: "",
        sectionId:
          seniorSection._id,
        description: "",
      });

      await refreshAllData();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Could not save department";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================
   * EDIT DEPARTMENT
   * ==========================================
   */

  const handleEditDepartment = (
    department
  ) => {
    setEditingDepartment(department);

    setDepartmentForm({
      name: department.name || "",
      code: department.code || "",
      sectionId:
        seniorSection?._id || "",
      description:
        department.description || "",
    });
  };

  /*
   * ==========================================
   * DELETE DEPARTMENT
   * ==========================================
   */

  const handleDeleteDepartment = async (
    departmentId
  ) => {
    if (
      !window.confirm(
        "Deactivate this department?"
      )
    ) {
      return;
    }

    try {
      await adminAPI.deleteDepartment(
        departmentId
      );

      toast.success(
        "Department deactivated"
      );

      await refreshAllData();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to deactivate department";

      toast.error(message);
    }
  };

  /*
   * ==========================================
   * ASSIGN EXISTING CLASSES
   * ==========================================
   */

  const handleAssignExistingClasses =
    async () => {
      try {
        const response =
          await adminAPI.assignExistingClassesToSections();

        console.log(
          "ALL CLASSES:",
          response?.data?.classes
        );

        if (response?.data?.classes) {
          console.table(
            response.data.classes.map(
              (item) => ({
                name: item.name,

                section:
                  item.section?.name ||
                  "NOT ASSIGNED",

                sectionCode:
                  item.section?.code ||
                  "NOT ASSIGNED",

                department:
                  item.department?.name ||
                  "NONE",
              })
            )
          );
        }

        toast.success(
          response?.data?.message ||
            "Classes assigned successfully"
        );

        await refreshAllData();
      } catch (err) {
        console.error(
          "Assign existing classes error:",
          err
        );

        toast.error(
          err?.response?.data?.message ||
            "Failed to assign classes"
        );
      }
    };

  /*
   * ==========================================
   * LOADING
   * ==========================================
   */

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Loader2
            size={18}
            className="animate-spin"
          />

          Loading academic management...
        </div>
      </div>
    );
  }

  /*
   * ==========================================
   * UI
   * ==========================================
   */

  return (
    <div className="space-y-6">

      {/* =====================================
          TOP ACTION
      ===================================== */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={
            handleAssignExistingClasses
          }
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <Layers3 size={16} />

          Assign Existing Classes
        </button>
      </div>

      {/* =====================================
          HEADER
      ===================================== */}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Academic Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage sections, classes, departments
          and subjects
        </p>
      </div>

      {/* =====================================
          ERROR
      ===================================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================
          STATISTICS
      ===================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

        {/* Sections */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Sections
            </p>

            <BookMarked
              className="text-indigo-500"
              size={18}
            />
          </div>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {sections.length}
          </p>
        </div>

        {/* Classes */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Classes
            </p>

            <GraduationCap
              className="text-teal-500"
              size={18}
            />
          </div>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {classes.length}
          </p>
        </div>

        {/* Departments */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Departments
            </p>

            <Building2
              className="text-amber-500"
              size={18}
            />
          </div>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {departments.length}
          </p>
        </div>

        {/* Subjects */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Subjects
            </p>

            <BookOpen
              className="text-blue-500"
              size={18}
            />
          </div>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            {subjects.length}
          </p>
        </div>
      </div>

      {/* =====================================
          SECTIONS + CLASSES
      ===================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* SECTIONS */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Sections
            </h2>

            <Layers3
              size={18}
              className="text-gray-500"
            />
          </div>

          <div className="space-y-3">
            {sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm text-gray-500">
                  No sections found.
                </p>
              </div>
            ) : (
              sections.map((section) => (
                <div
                  key={section._id}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">

                    <div>
                      <p className="font-semibold text-gray-800">
                        {section.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        Code:{" "}
                        {section.code || "—"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                        getSectionKey(
                          section
                        ) === "ss"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {getSectionKey(
                        section
                      )}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CLASSES */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Classes by section
            </h2>

            <GraduationCap
              size={18}
              className="text-gray-500"
            />
          </div>

          <div className="space-y-4">
            {groupedClasses.map(
              (section) => (
                <div
                  key={section._id}
                  className="rounded-xl border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-gray-800">
                      {section.name}
                    </p>

                    <span className="text-xs text-gray-500">
                      {
                        section.items.length
                      }{" "}
                      classes
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {section.items.length ===
                    0 ? (
                      <span className="text-xs text-gray-400">
                        No classes in this
                        section yet.
                      </span>
                    ) : (
                      section.items.map(
                        (item) => (
                          <span
                            key={item._id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                          >
                            {item.name ||
                              item.className}
                          </span>
                        )
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* =====================================
          DEPARTMENTS + SUBJECTS
      ===================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* ===================================
            DEPARTMENTS
        =================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Departments
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Senior Secondary departments
              </p>
            </div>

            <Building2
              size={18}
              className="text-gray-500"
            />
          </div>

          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Departments are only available
            under Senior Secondary.
          </div>

          {/* DEPARTMENT FORM */}

          <form
            onSubmit={
              handleDepartmentSubmit
            }
            className="mb-5 space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              {/* NAME */}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Department name
                </label>

                <input
                  value={
                    departmentForm.name
                  }
                  onChange={(event) =>
                    setDepartmentForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="Science"
                />
              </div>

              {/* CODE */}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Code
                </label>

                <input
                  value={
                    departmentForm.code
                  }
                  onChange={(event) =>
                    setDepartmentForm(
                      (current) => ({
                        ...current,
                        code:
                          event.target.value.toUpperCase(),
                      })
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="SCI"
                />
              </div>
            </div>

            {/* SECTION */}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Section
              </label>

              <input
                value={
                  seniorSection
                    ? seniorSection.name
                    : "Senior Secondary"
                }
                disabled
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
              />
            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Description
              </label>

              <textarea
                value={
                  departmentForm.description
                }
                onChange={(event) =>
                  setDepartmentForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="Optional description"
              />
            </div>

            {/* BUTTONS */}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={
                  saving ||
                  !seniorSection
                }
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={15} />
                )}

                {editingDepartment
                  ? "Update department"
                  : "Create department"}
              </button>

              {editingDepartment && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDepartment(
                      null
                    );

                    setDepartmentForm({
                      name: "",
                      code: "",
                      sectionId:
                        seniorSection?._id ||
                        "",
                      description: "",
                    });
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <X size={15} />

                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* DEPARTMENT LIST */}

          <div className="space-y-3">
            {departments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <Building2
                  size={28}
                  className="mx-auto mb-2 text-gray-300"
                />

                <p className="text-sm text-gray-500">
                  No departments found.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Create Science, Arts and
                  Commercial.
                </p>
              </div>
            ) : (
              departments.map(
                (department) => (
                  <div
                    key={department._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <Building2
                          size={18}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800">
                          {department.name}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {department.code}
                          {" · "}
                          {department.section
                            ?.name ||
                            "Senior Secondary"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleEditDepartment(
                            department
                          )
                        }
                        className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50"
                        aria-label="Edit department"
                      >
                        <Pencil
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteDepartment(
                            department._id
                          )
                        }
                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        aria-label="Deactivate department"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>

        {/* ===================================
            SUBJECTS
        =================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Subjects
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Manage subjects by section and
                department
              </p>
            </div>

            <FolderOpen
              size={18}
              className="text-gray-500"
            />
          </div>

          {/* SUBJECT FORM */}

          <form
            onSubmit={handleSubjectSubmit}
            className="mb-5 space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              {/* NAME */}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Name
                </label>

                <input
                  value={
                    subjectForm.name
                  }
                  onChange={(event) =>
                    setSubjectForm(
                      (current) => ({
                        ...current,
                        name:
                          event.target.value,
                      })
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="Mathematics"
                />
              </div>

              {/* CODE */}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Code
                </label>

                <input
                  value={
                    subjectForm.code
                  }
                  onChange={(event) =>
                    setSubjectForm(
                      (current) => ({
                        ...current,
                        code:
                          event.target.value.toUpperCase(),
                      })
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm uppercase outline-none transition focus:ring-2 focus:ring-blue-200"
                  placeholder="MATH"
                />
              </div>
            </div>

            {/* SECTION */}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Section
              </label>

              <select
                value={
                  subjectForm.sectionId
                }
                onChange={(event) =>
                  handleSectionSelection(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
              >
                <option value="">
                  Select section
                </option>

                {sections.map(
                  (section) => (
                    <option
                      key={section._id}
                      value={section._id}
                    >
                      {section.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* DEPARTMENT */}

            {isSubjectSS && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Department
                </label>

                <select
                  value={
                    subjectForm.departmentId
                  }
                  onChange={(event) =>
                    handleSubjectFormChange(
                      "departmentId",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">
                    Select department
                  </option>

                  {sectionDepartments.map(
                    (department) => (
                      <option
                        key={
                          department._id
                        }
                        value={
                          department._id
                        }
                      >
                        {department.name}
                      </option>
                    )
                  )}
                </select>

                {sectionDepartments.length ===
                  0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Create a department first.
                  </p>
                )}
              </div>
            )}

            {/* DESCRIPTION */}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Description
              </label>

              <textarea
                value={
                  subjectForm.description
                }
                onChange={(event) =>
                  setSubjectForm(
                    (current) => ({
                      ...current,
                      description:
                        event.target.value,
                    })
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="Optional description"
              />
            </div>

            {/* BUTTONS */}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Plus size={15} />
                )}

                {editingSubject
                  ? "Update subject"
                  : "Create subject"}
              </button>

              {editingSubject && (
                <button
                  type="button"
                  onClick={
                    resetSubjectForm
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                >
                  <X size={15} />

                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* FILTERS */}

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">

            {/* SECTION FILTER */}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Filter by section
              </label>

              <select
                value={
                  selectedSectionFilter
                }
                onChange={(event) =>
                  setSelectedSectionFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">
                  All subjects
                </option>

                {sections.map(
                  (section) => (
                    <option
                      key={section._id}
                      value={getSectionKey(
                        section
                      )}
                    >
                      {section.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* DEPARTMENT FILTER */}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Department filter
              </label>

              <select
                value={
                  selectedDepartmentFilter
                }
                onChange={(event) =>
                  setSelectedDepartmentFilter(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">
                  All departments
                </option>

                {Array.from(
                  new Set(
                    departments.map(
                      (department) =>
                        getDepartmentKey(
                          department
                        )
                    )
                  )
                ).map(
                  (departmentKey) => (
                    <option
                      key={departmentKey}
                      value={departmentKey}
                    >
                      {departmentKey}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* SUBJECT LIST */}

          <div className="space-y-3">
            {filteredSubjects.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <BookOpen
                  size={28}
                  className="mx-auto mb-2 text-gray-300"
                />

                <p className="text-sm text-gray-500">
                  No subjects found.
                </p>
              </div>
            ) : (
              filteredSubjects.map(
                (subject) => (
                  <div
                    key={subject._id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800">
                        {subject.name}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {subject.code}
                        {" · "}
                        {subject.section
                          ?.name ||
                          "Section"}

                        {subject.department
                          ? ` · ${subject.department.name}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          handleEditSubject(
                            subject
                          )
                        }
                        className="rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-50"
                        aria-label="Edit subject"
                      >
                        <Pencil
                          size={15}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSubject(
                            subject._id
                          )
                        }
                        className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                        aria-label="Deactivate subject"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>

                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcademicManagementPage;