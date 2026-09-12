const DIVISIONS = [
  { id: "all", label: "All School" },
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
];

export default function DivisionSwitcher({
  value = "all",
  onChange,
  hideAll = false,
  className = "",
}) {
  const options = hideAll ? DIVISIONS.filter((item) => item.id !== "all") : DIVISIONS;

  return (
    <div className={`flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit ${className}`}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange?.(option.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            value === option.id
              ? option.id === "primary"
                ? "bg-amber-500 text-white shadow-sm"
                : option.id === "secondary"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
