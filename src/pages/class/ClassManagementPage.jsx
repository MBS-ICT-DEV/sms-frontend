import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Button,
  Modal,
  PageHeader,
  LoadingSpinner,
  EmptyState,
  Card,
} from '../../components/common/UIComponents';

import {
  Search,
  Plus,
  Users,
  UserCheck,
  Pencil,
  Trash2,
  BookOpen,
  GraduationCap,
  School,
  X,
  UserPlus,
  Layers3,
} from 'lucide-react';

import MainLayout from '../../layouts/MainLayout';
import adminAPI from '../../api/admin.api';

export const ClassManagementPage = () => {
  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const [form, setForm] = useState({
    name: '',
    capacity: 30,
    sectionId: '',
    section: '',
    subjects: '',
  });

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [classesRes, sectionsRes, teachersRes] =
        await Promise.all([
          adminAPI.getClasses(),
          adminAPI.getSections(),
          adminAPI.getAllTeachers(),
        ]);

      setClasses(classesRes?.data?.classes || []);
      setSections(sectionsRes?.data?.sections || []);
      setTeachers(teachersRes?.data?.teachers || []);
    } catch (error) {
      console.error('Failed to load class management data:', error);

      toast.error(
        error.response?.data?.message ||
          'Failed to load classes'
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetForm = () => {
    setForm({
      name: '',
      capacity: 30,
      sectionId: '',
      section: '',
      subjects: '',
    });
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const closeModal = () => {
    setModal(null);
    setSelectedClass(null);
    setSelectedTeacher('');
    resetForm();
  };

  // --------------------------------------------------
  // OPEN CREATE MODAL
  // --------------------------------------------------

  const openCreateModal = () => {
    resetForm();
    setSelectedClass(null);
    setSelectedTeacher('');
    setModal('create');
  };

  // --------------------------------------------------
  // CREATE CLASS
  // --------------------------------------------------

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error('Class name is required');
      return;
    }

    if (!form.sectionId) {
      toast.error('Please select a section');
      return;
    }

    if (!form.capacity || Number(form.capacity) < 1) {
      toast.error('Please enter a valid student capacity');
      return;
    }

    try {
      setSubmitting(true);

      const subjects = form.subjects
        ? form.subjects
            .split(',')
            .map((subject) => subject.trim())
            .filter(Boolean)
        : [];

      const payload = {
        name: form.name.trim(),
        capacity: Number(form.capacity),
        sectionId: form.sectionId,
        section: form.sectionId,
        subjects,
      };

      const response = await adminAPI.createClass(payload);

      const createdClass = response?.data?.class;

      if (createdClass) {
        setClasses((prev) => [...prev, createdClass]);
      } else {
        // Reload if backend does not return the created class
        await loadData();
      }

      toast.success(
        response?.data?.message ||
          'Class created successfully'
      );

      closeModal();
    } catch (error) {
      console.error('Create class error:', error);

      toast.error(
        error.response?.data?.message ||
          'Failed to create class'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // OPEN EDIT MODAL
  // --------------------------------------------------

  const openEditModal = (cls) => {
    setSelectedClass(cls);

    const sectionId =
      cls.section?._id ||
      cls.sectionId ||
      (typeof cls.section === 'string'
        ? cls.section
        : '');

    const subjects = Array.isArray(cls.subjects)
      ? cls.subjects
          .map((subject) => {
            if (typeof subject === 'string') {
              return subject;
            }

            return (
              subject?.name ||
              subject?.subjectName ||
              subject?.title ||
              ''
            );
          })
          .filter(Boolean)
          .join(', ')
      : '';

    setForm({
      name: cls.name || cls.className || '',
      capacity: cls.capacity || 30,
      sectionId,
      section: sectionId,
      subjects,
    });

    setModal('edit');
  };

  // --------------------------------------------------
  // UPDATE CLASS
  // --------------------------------------------------

  const handleUpdate = async () => {
    if (!selectedClass?._id) {
      toast.error('No class selected');
      return;
    }

    if (!form.name.trim()) {
      toast.error('Class name is required');
      return;
    }

    if (!form.sectionId) {
      toast.error('Please select a section');
      return;
    }

    if (!form.capacity || Number(form.capacity) < 1) {
      toast.error('Please enter a valid student capacity');
      return;
    }

    try {
      setSubmitting(true);

      const subjects = form.subjects
        ? form.subjects
            .split(',')
            .map((subject) => subject.trim())
            .filter(Boolean)
        : [];

      const updatedData = {
        name: form.name.trim(),
        capacity: Number(form.capacity),
        sectionId: form.sectionId,
        section: form.sectionId,
        subjects,
      };

      const response = await adminAPI.updateClass(
        selectedClass._id,
        updatedData
      );

      const updatedClass = response?.data?.class;

      setClasses((prev) =>
        prev.map((cls) =>
          cls._id === selectedClass._id
            ? {
                ...cls,
                ...updatedData,
                ...(updatedClass || {}),
              }
            : cls
        )
      );

      toast.success(
        response?.data?.message ||
          'Class updated successfully'
      );

      closeModal();
    } catch (error) {
      console.error('Update class error:', error);

      toast.error(
        error.response?.data?.message ||
          'Failed to update class'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // DELETE CLASS
  // --------------------------------------------------

  const handleDelete = async (classId) => {
    if (!classId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this class?'
    );

    if (!confirmed) return;

    try {
      await adminAPI.deleteClass(classId);

      setClasses((prev) =>
        prev.filter((cls) => cls._id !== classId)
      );

      toast.success(
        'Class deleted successfully'
      );
    } catch (error) {
      console.error('Delete class error:', error);

      toast.error(
        error.response?.data?.message ||
          'Failed to delete class'
      );
    }
  };

  // --------------------------------------------------
  // OPEN ASSIGN TEACHER MODAL
  // --------------------------------------------------

  const openAssignTeacherModal = (cls) => {
    setSelectedClass(cls);

    setSelectedTeacher(
      cls.classTeacher?._id ||
        cls.classTeacher?.id ||
        ''
    );

    setModal('assign-teacher');
  };

  // --------------------------------------------------
  // ASSIGN TEACHER
  // --------------------------------------------------

  const handleAssignTeacher = async () => {
    if (!selectedClass?._id) {
      toast.error('No class selected');
      return;
    }

    if (!selectedTeacher) {
      toast.error('Please select a teacher');
      return;
    }

    try {
      setSubmitting(true);

      const response =
        await adminAPI.assignTeacherToClass({
          classId: selectedClass._id,
          teacherId: selectedTeacher,
        });

      const teacher = teachers.find(
        (item) => item._id === selectedTeacher
      );

      const assignedTeacher =
        response?.data?.classTeacher ||
        response?.data?.teacher ||
        teacher;

      setClasses((prev) =>
        prev.map((cls) =>
          cls._id === selectedClass._id
            ? {
                ...cls,
                classTeacher: assignedTeacher,
              }
            : cls
        )
      );

      toast.success(
        response?.data?.message ||
          'Teacher assigned successfully'
      );

      closeModal();
    } catch (error) {
      console.error(
        'Assign teacher error:',
        error
      );

      toast.error(
        error.response?.data?.message ||
          'Failed to assign teacher'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // SEARCH / FILTER
  // --------------------------------------------------

  const filtered = classes.filter((cls) => {
    const name = (
      cls.name ||
      cls.className ||
      ''
    ).toLowerCase();

    const section = (
      cls.section?.name ||
      cls.section?.code ||
      cls.section ||
      ''
    ).toLowerCase();

    const teacher = (
      cls.classTeacher?.fullname ||
      cls.classTeacher?.name ||
      ''
    ).toLowerCase();

    const query = search
      .toLowerCase()
      .trim();

    return (
      name.includes(query) ||
      section.includes(query) ||
      teacher.includes(query)
    );
  });

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-full flex items-center justify-center">
          <LoadingSpinner
            size="lg"
            dark
          />
        </div>
      </MainLayout>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* ------------------------------------------
            PAGE HEADER
        ------------------------------------------ */}

        <PageHeader
          title="Academic Classes"
          subtitle="Create, organize and manage your school's classes."
          action={
            <Button onClick={openCreateModal}>
              <span className="flex items-center gap-2">
                <Plus size={17} />
                Create Class
              </span>
            </Button>
          }
        />

        {/* ------------------------------------------
            SUMMARY CARDS
        ------------------------------------------ */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* TOTAL CLASSES */}

          <div className="
            bg-white
            border border-slate-200
            rounded-2xl
            p-5
            shadow-sm
          ">
            <div className="flex items-center justify-between">

              <div>
                <p className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                ">
                  Total Classes
                </p>

                <h3 className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                ">
                  {classes.length}
                </h3>

                <p className="
                  text-xs
                  text-slate-400
                  mt-1
                ">
                  Academic classes
                </p>
              </div>

              <div className="
                w-11 h-11
                rounded-xl
                bg-blue-50
                text-blue-600
                flex items-center
                justify-center
              ">
                <School size={21} />
              </div>

            </div>
          </div>

          {/* ASSIGNED TEACHERS */}

          <div className="
            bg-white
            border border-slate-200
            rounded-2xl
            p-5
            shadow-sm
          ">
            <div className="flex items-center justify-between">

              <div>
                <p className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                ">
                  Assigned Teachers
                </p>

                <h3 className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                ">
                  {
                    classes.filter(
                      (cls) =>
                        cls.classTeacher
                    ).length
                  }
                </h3>

                <p className="
                  text-xs
                  text-slate-400
                  mt-1
                ">
                  Classes with teachers
                </p>
              </div>

              <div className="
                w-11 h-11
                rounded-xl
                bg-emerald-50
                text-emerald-600
                flex items-center
                justify-center
              ">
                <UserCheck size={21} />
              </div>

            </div>
          </div>

          {/* AVAILABLE TEACHERS */}

          <div className="
            bg-white
            border border-slate-200
            rounded-2xl
            p-5
            shadow-sm
          ">
            <div className="flex items-center justify-between">

              <div>
                <p className="
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-wider
                  text-slate-400
                ">
                  Available Teachers
                </p>

                <h3 className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                ">
                  {teachers.length}
                </h3>

                <p className="
                  text-xs
                  text-slate-400
                  mt-1
                ">
                  Faculty members
                </p>
              </div>

              <div className="
                w-11 h-11
                rounded-xl
                bg-violet-50
                text-violet-600
                flex items-center
                justify-center
              ">
                <GraduationCap size={21} />
              </div>

            </div>
          </div>

        </div>

        {/* ------------------------------------------
            SEARCH
        ------------------------------------------ */}

        <div className="
          bg-white
          border border-slate-200
          rounded-2xl
          p-4
          shadow-sm
        ">

          <div className="relative max-w-xl">

            <Search
              size={18}
              className="
                absolute
                left-3.5
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              placeholder="Search by class, section or teacher..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-full
                h-11
                pl-10
                pr-10
                rounded-xl
                border border-slate-200
                bg-slate-50
                text-sm
                text-slate-700
                placeholder:text-slate-400
                outline-none
                transition
                focus:bg-white
                focus:border-blue-400
                focus:ring-4
                focus:ring-blue-50
              "
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  w-6 h-6
                  rounded-md
                  flex items-center
                  justify-center
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-700
                  transition
                "
              >
                <X size={15} />
              </button>
            )}

          </div>

        </div>

        {/* ------------------------------------------
            CLASSES
        ------------------------------------------ */}

        {filtered.length === 0 ? (

          <Card>
            <div className="py-12">

              <EmptyState
                icon="📚"
                text={
                  search
                    ? 'No classes match your search'
                    : 'No classes found'
                }
              />

              {!search && (
                <div className="flex justify-center mt-5">
                  <Button
                    onClick={openCreateModal}
                  >
                    <span className="flex items-center gap-2">
                      <Plus size={16} />
                      Create your first class
                    </span>
                  </Button>
                </div>
              )}

            </div>
          </Card>

        ) : (

          <div className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-5
          ">

            {filtered.map((cls) => {

              const className =
                cls.name ||
                cls.className ||
                'Unnamed Class';

              const subjects =
                Array.isArray(cls.subjects)
                  ? cls.subjects
                  : [];

              const capacity =
                Number(cls.capacity) || 30;

              const sectionName =
                cls.section?.name ||
                cls.section?.code ||
                (
                  typeof cls.section === 'string'
                    ? cls.section
                    : ''
                );

              return (
                <div
                  key={cls._id}
                  className="
                    group
                    bg-white
                    border border-slate-200
                    rounded-2xl
                    overflow-hidden
                    shadow-sm
                    hover:shadow-md
                    hover:border-blue-200
                    transition-all
                    duration-200
                  "
                >

                  {/* CARD CONTENT */}

                  <div className="p-5">

                    {/* TITLE */}

                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    ">

                      <div className="
                        flex
                        items-center
                        gap-3
                        min-w-0
                      ">

                        <div className="
                          w-11 h-11
                          rounded-xl
                          bg-blue-50
                          text-blue-600
                          flex items-center
                          justify-center
                          flex-shrink-0
                        ">
                          <BookOpen size={21} />
                        </div>

                        <div className="min-w-0">

                          <h2 className="
                            text-base
                            font-bold
                            text-slate-900
                            truncate
                          ">
                            {className}
                          </h2>

                          <p className="
                            text-xs
                            text-slate-400
                            mt-0.5
                          ">
                            {sectionName
                              ? `Section ${sectionName}`
                              : 'General section'}
                          </p>

                        </div>

                      </div>

                      <span className="
                        flex-shrink-0
                        px-2.5 py-1
                        rounded-lg
                        bg-slate-100
                        text-[10px]
                        font-bold
                        text-slate-500
                      ">
                        CLASS
                      </span>

                    </div>

                    {/* TEACHER */}

                    <div className="
                      mt-5
                      flex
                      items-center
                      gap-3
                      p-3
                      rounded-xl
                      bg-slate-50
                      border border-slate-100
                    ">

                      <div className="
                        w-9 h-9
                        rounded-full
                        bg-emerald-100
                        text-emerald-700
                        flex items-center
                        justify-center
                        flex-shrink-0
                      ">
                        <UserCheck size={16} />
                      </div>

                      <div className="min-w-0">

                        <p className="
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-slate-400
                        ">
                          Class Teacher
                        </p>

                        <p className="
                          text-sm
                          font-semibold
                          text-slate-700
                          truncate
                          mt-0.5
                        ">
                          {cls.classTeacher?.fullname ||
                            cls.classTeacher?.name ||
                            'Not assigned'}
                        </p>

                      </div>

                    </div>

                    {/* INFO */}

                    <div className="
                      grid
                      grid-cols-2
                      gap-3
                      mt-4
                    ">

                      {/* CAPACITY */}

                      <div className="
                        p-3
                        rounded-xl
                        border border-slate-100
                        bg-white
                      ">

                        <div className="
                          flex
                          items-center
                          gap-2
                        ">
                          <Users
                            size={15}
                            className="text-blue-500"
                          />

                          <span className="
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-slate-400
                          ">
                            Capacity
                          </span>
                        </div>

                        <p className="
                          mt-2
                          text-sm
                          font-bold
                          text-slate-800
                        ">
                          {capacity} Students
                        </p>

                      </div>

                      {/* SUBJECTS */}

                      <div className="
                        p-3
                        rounded-xl
                        border border-slate-100
                        bg-white
                      ">

                        <div className="
                          flex
                          items-center
                          gap-2
                        ">
                          <Layers3
                            size={15}
                            className="text-violet-500"
                          />

                          <span className="
                            text-[10px]
                            font-semibold
                            uppercase
                            tracking-wide
                            text-slate-400
                          ">
                            Subjects
                          </span>
                        </div>

                        <p className="
                          mt-2
                          text-sm
                          font-bold
                          text-slate-800
                        ">
                          {subjects.length}
                        </p>

                      </div>

                    </div>

                    {/* SUBJECT LIST */}

                    {subjects.length > 0 && (
                      <div className="mt-4">

                        <p className="
                          text-[10px]
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-400
                          mb-2
                        ">
                          Subjects
                        </p>

                        <div className="
                          flex
                          flex-wrap
                          gap-1.5
                        ">

                          {subjects
                            .slice(0, 4)
                            .map(
                              (subject, index) => {

                                const subjectName =
                                  typeof subject === 'string'
                                    ? subject
                                    : subject?.name ||
                                      subject?.subjectName ||
                                      subject?.title ||
                                      'Subject';

                                return (
                                  <span
                                    key={`${subjectName}-${index}`}
                                    className="
                                      px-2.5 py-1
                                      rounded-lg
                                      bg-blue-50
                                      text-blue-700
                                      text-[10px]
                                      font-semibold
                                    "
                                  >
                                    {subjectName}
                                  </span>
                                );
                              }
                            )}

                          {subjects.length > 4 && (
                            <span className="
                              px-2.5 py-1
                              rounded-lg
                              bg-slate-100
                              text-slate-500
                              text-[10px]
                              font-semibold
                            ">
                              +{subjects.length - 4}
                            </span>
                          )}

                        </div>

                      </div>
                    )}

                  </div>

                  {/* ACTIONS */}

                  <div className="
                    px-5
                    py-3
                    border-t
                    border-slate-100
                    bg-slate-50/70
                    flex
                    items-center
                    gap-2
                  ">

                    {/* ASSIGN */}

                    <button
                      type="button"
                      onClick={() =>
                        openAssignTeacherModal(cls)
                      }
                      className="
                        flex-1
                        h-9
                        rounded-lg
                        bg-blue-600
                        text-white
                        text-xs
                        font-semibold
                        flex
                        items-center
                        justify-center
                        gap-1.5
                        hover:bg-blue-700
                        transition
                      "
                    >
                      <UserPlus size={14} />
                      Assign
                    </button>

                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(cls)
                      }
                      className="
                        w-9 h-9
                        rounded-lg
                        bg-white
                        border
                        border-slate-200
                        text-slate-500
                        flex
                        items-center
                        justify-center
                        hover:border-blue-200
                        hover:text-blue-600
                        hover:bg-blue-50
                        transition
                      "
                      title="Edit class"
                    >
                      <Pencil size={15} />
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(cls._id)
                      }
                      className="
                        w-9 h-9
                        rounded-lg
                        bg-white
                        border
                        border-slate-200
                        text-slate-400
                        flex
                        items-center
                        justify-center
                        hover:border-red-200
                        hover:text-red-600
                        hover:bg-red-50
                        transition
                      "
                      title="Delete class"
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* ==================================================
          CREATE / EDIT MODAL
      ================================================== */}

      <Modal
        isOpen={
          modal === 'create' ||
          modal === 'edit'
        }
        onClose={closeModal}
        title={
          modal === 'create'
            ? 'Create Academic Class'
            : 'Edit Academic Class'
        }
      >
        <div className="space-y-5">

          {/* INTRO */}

          <div className="
            flex
            items-center
            gap-3
            p-4
            rounded-xl
            bg-blue-50
            border
            border-blue-100
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-white
              text-blue-600
              flex
              items-center
              justify-center
            ">
              {modal === 'create' ? (
                <Plus size={19} />
              ) : (
                <Pencil size={18} />
              )}
            </div>

            <div>
              <p className="
                text-sm
                font-bold
                text-blue-900
              ">
                {modal === 'create'
                  ? 'Add a new class'
                  : 'Update class information'}
              </p>

              <p className="
                text-xs
                text-blue-600
                mt-0.5
              ">
                Enter the academic class details below.
              </p>
            </div>

          </div>

          {/* CLASS NAME */}

          <div>
            <label className="
              block
              text-xs
              font-semibold
              text-slate-600
              mb-1.5
            ">
              Class Name
            </label>

            <input
              autoFocus
              type="text"
              placeholder="e.g. JSS 1"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="
                w-full
                h-11
                px-3.5
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                text-sm
                text-slate-700
                placeholder:text-slate-400
                outline-none
                transition
                focus:bg-white
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-50
              "
            />
          </div>

          {/* SECTION */}

          <div>
            <label className="
              block
              text-xs
              font-semibold
              text-slate-600
              mb-1.5
            ">
              Section
            </label>

            <select
              value={form.sectionId}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sectionId: e.target.value,
                  section: e.target.value,
                }))
              }
              className="
                w-full
                h-11
                px-3.5
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                text-sm
                text-slate-700
                outline-none
                transition
                focus:bg-white
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-50
              "
            >
              <option value="">
                Select a section
              </option>

              {sections.map((section) => (
                <option
                  key={section._id}
                  value={section._id}
                >
                  {section.name}
                  {section.code
                    ? ` (${section.code})`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          {/* CAPACITY */}

          <div>
            <label className="
              block
              text-xs
              font-semibold
              text-slate-600
              mb-1.5
            ">
              Student Capacity
            </label>

            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  capacity: e.target.value,
                }))
              }
              className="
                w-full
                h-11
                px-3.5
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                text-sm
                text-slate-700
                outline-none
                transition
                focus:bg-white
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-50
              "
            />
          </div>

          {/* SUBJECTS */}

          <div>
            <label className="
              block
              text-xs
              font-semibold
              text-slate-600
              mb-1.5
            ">
              Subjects
            </label>

            <input
              type="text"
              placeholder="Mathematics, English, Biology"
              value={form.subjects}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  subjects: e.target.value,
                }))
              }
              className="
                w-full
                h-11
                px-3.5
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                text-sm
                text-slate-700
                placeholder:text-slate-400
                outline-none
                transition
                focus:bg-white
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-50
              "
            />

            <p className="
              mt-1.5
              text-[10px]
              text-slate-400
            ">
              Separate subjects with commas.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="
            flex
            gap-3
            pt-2
          ">

            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="
                flex-1
                h-11
                rounded-xl
                border
                border-slate-200
                bg-white
                text-sm
                font-semibold
                text-slate-600
                hover:bg-slate-50
                transition
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <Button
              className="flex-1"
              disabled={submitting}
              onClick={
                modal === 'create'
                  ? handleCreate
                  : handleUpdate
              }
            >
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className="
                  flex
                  items-center
                  justify-center
                  gap-2
                ">
                  {modal === 'create' ? (
                    <Plus size={16} />
                  ) : (
                    <Pencil size={16} />
                  )}

                  {modal === 'create'
                    ? 'Create Class'
                    : 'Save Changes'}
                </span>
              )}
            </Button>

          </div>

        </div>
      </Modal>

      {/* ==================================================
          ASSIGN TEACHER MODAL
      ================================================== */}

      <Modal
        isOpen={modal === 'assign-teacher'}
        onClose={closeModal}
        title="Assign Class Teacher"
      >
        <div className="space-y-5">

          {/* CLASS INFO */}

          <div className="
            flex
            items-center
            gap-3
            p-4
            rounded-xl
            bg-blue-50
            border
            border-blue-100
          ">

            <div className="
              w-10
              h-10
              rounded-xl
              bg-white
              text-blue-600
              flex
              items-center
              justify-center
            ">
              <BookOpen size={18} />
            </div>

            <div>

              <p className="
                text-[10px]
                font-bold
                uppercase
                tracking-wide
                text-blue-500
              ">
                Class
              </p>

              <p className="
                text-sm
                font-bold
                text-blue-900
              ">
                {selectedClass?.name ||
                  selectedClass?.className ||
                  'Selected Class'}
              </p>

            </div>

          </div>

          {/* TEACHER SELECT */}

          <div>

            <label className="
              block
              text-xs
              font-semibold
              text-slate-600
              mb-1.5
            ">
              Select Class Teacher
            </label>

            <select
              value={selectedTeacher}
              onChange={(e) =>
                setSelectedTeacher(
                  e.target.value
                )
              }
              className="
                w-full
                h-11
                px-3.5
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                text-sm
                text-slate-700
                outline-none
                transition
                focus:bg-white
                focus:border-blue-500
                focus:ring-4
                focus:ring-blue-50
              "
            >

              <option value="">
                Select a teacher
              </option>

              {teachers.map((teacher) => (
                <option
                  key={teacher._id}
                  value={teacher._id}
                >
                  {teacher.fullname ||
                    teacher.name ||
                    `${teacher.firstName || ''} ${
                      teacher.lastName || ''
                    }`.trim() ||
                    'Unnamed Teacher'}

                  {teacher.subject
                    ? ` (${teacher.subject})`
                    : ''}
                </option>
              ))}

            </select>

          </div>

          {/* ACTIONS */}

          <div className="
            flex
            gap-3
            pt-2
          ">

            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="
                flex-1
                h-11
                rounded-xl
                border
                border-slate-200
                bg-white
                text-sm
                font-semibold
                text-slate-600
                hover:bg-slate-50
                transition
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <Button
              className="flex-1"
              disabled={submitting}
              onClick={handleAssignTeacher}
            >
              {submitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <span className="
                  flex
                  items-center
                  justify-center
                  gap-2
                ">
                  <UserCheck size={16} />
                  Assign Teacher
                </span>
              )}
            </Button>

          </div>

        </div>
      </Modal>

    </MainLayout>
  );
};

export default ClassManagementPage;