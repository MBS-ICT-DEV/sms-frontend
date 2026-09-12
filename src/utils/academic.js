export const getSectionCode = (sectionOrClass) => {
  if (!sectionOrClass) return "";
  if (typeof sectionOrClass === "string") return sectionOrClass.toUpperCase();
  return String(
    sectionOrClass.code ||
      sectionOrClass.section?.code ||
      sectionOrClass.name ||
      ""
  ).toUpperCase();
};

export const getDivision = (sectionOrClass) => {
  const code = getSectionCode(sectionOrClass);
  if (code === "PRIMARY" || code.includes("PRIMARY")) return "primary";
  if (code === "JSS" || code === "SS" || code.includes("JUNIOR") || code.includes("SENIOR")) {
    return "secondary";
  }
  return "other";
};

export const isSeniorSecondaryClass = (schoolClass) => {
  if (!schoolClass) return false;
  const sectionCode = getSectionCode(schoolClass.section || schoolClass);
  if (sectionCode === "SS") return true;
  return /^(SS|SSS)\s*[1-3]\b/i.test(String(schoolClass.name || "").trim());
};

export const departmentIdOf = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value._id || value.id || null;
  return value;
};

export const subjectAppliesToStudent = (subject, student, classDoc) => {
  const subjectDept = departmentIdOf(subject?.department || subject?.departmentId);
  if (!subjectDept) return true;
  const studentDept =
    departmentIdOf(student?.department) || departmentIdOf(classDoc?.department);
  return studentDept && String(studentDept) === String(subjectDept);
};

export const filterByDivision = (items, division, getItem = (item) => item) => {
  if (!division || division === "all") return items;
  return items.filter((item) => getDivision(getItem(item)) === division);
};
