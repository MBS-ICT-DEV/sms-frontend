import React, { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Lock,
  Play,
  RefreshCw,
  XCircle,
  Plus,
  GraduationCap,
} from "lucide-react";
import { TermApi } from "../../api/term.api";
import { toast } from "react-toastify";

const ActiveTerms = () => {
  // =====================================
  // STATE
  // =====================================

  const [terms, setTerms] = useState([]);
  const [activeTerm, setActiveTerm] = useState(null);

  const [selectedTermId, setSelectedTermId] = useState("");

  // Create session
  const [session, setSession] = useState("");
  const [creatingSession, setCreatingSession] =
    useState(false);

  // Loading
  const [loadingTerms, setLoadingTerms] =
    useState(false);

  const [activating, setActivating] =
    useState(false);

  const [closing, setClosing] =
    useState(false);

  // =====================================
  // LOAD TERMS
  // =====================================

  const loadTerms = async () => {
    try {
      setLoadingTerms(true);

      const results = await Promise.allSettled([
        TermApi.getAllTerms(),
        TermApi.getCurrentTerm(),
      ]);

      // terms result
      const termsResult = results[0];
      if (termsResult.status === "fulfilled") {
        const allTerms = termsResult.value?.data?.terms || [];
        setTerms(allTerms);
      } else {
        // If fetching all terms failed, surface an error and stop
        throw termsResult.reason || new Error("Failed to fetch terms");
      }

      // current term result (may 404 when no active term)
      const currentResult = results[1];
      if (currentResult.status === "fulfilled") {
        const currentTerm = currentResult.value?.data?.term;
        setActiveTerm(currentTerm || null);
        setSelectedTermId(currentTerm?._id || "");
      } else {
        const err = currentResult.reason;
        if (err?.response?.status === 404) {
          // No active term - expected sometimes
          setActiveTerm(null);
          setSelectedTermId("");
        } else {
          // Unexpected error
          throw err;
        }
      }
    } catch (error) {
      console.error(
        "Failed to load terms:",
        error
      );

      if (
        error?.response?.status === 404
      ) {
        setActiveTerm(null);
        setSelectedTermId("");
      } else {
        toast.error(
          error?.response?.data?.message ||
            "Failed to load academic terms"
        );
      }
    } finally {
      setLoadingTerms(false);
    }
  };

  // =====================================
  // LOAD ON PAGE OPEN
  // =====================================

  useEffect(() => {
    loadTerms();
  }, []);

  // =====================================
  // CREATE ACADEMIC SESSION
  // =====================================

  const handleCreateSession = async () => {
    const cleanSession = session.trim();

    if (!cleanSession) {
      toast.error(
        "Please enter an academic session"
      );
      return;
    }

    try {
      setCreatingSession(true);

      const termsToCreate = [
        "First Term",
        "Second Term",
        "Third Term",
      ];

      let createdCount = 0;
      let existingCount = 0;

      for (const termName of termsToCreate) {
        try {
          const response =
            await TermApi.createTerm({
              session: cleanSession,
              term: termName,
            });

          if (response?.data?.success) {
            createdCount++;
          }
        } catch (error) {
          // 409 means the term already exists
          if (
            error?.response?.status === 409
          ) {
            existingCount++;
          } else {
            throw error;
          }
        }
      }

      if (createdCount > 0) {
        toast.success(
          `${createdCount} academic term${
            createdCount > 1 ? "s" : ""
          } created for ${cleanSession}`
        );
      }

      if (
        existingCount === 3 &&
        createdCount === 0
      ) {
        toast.info(
          `All three terms already exist for ${cleanSession}`
        );
      }

      setSession("");

      await loadTerms();
    } catch (error) {
      console.error(
        "Create academic session error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to create academic session"
      );
    } finally {
      setCreatingSession(false);
    }
  };

  // =====================================
  // ACTIVATE TERM
  // =====================================

  const handleActivateTerm = async () => {
    if (!selectedTermId) {
      toast.error(
        "Please select a term"
      );
      return;
    }

    try {
      setActivating(true);

      const response =
        await TermApi.TermActivation(
          selectedTermId
        );

      if (response?.data?.success) {
        toast.success(
          response.data.message ||
            "Term activated successfully"
        );

        await loadTerms();
      }
    } catch (error) {
      console.error(
        "Activate term error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to activate term"
      );
    } finally {
      setActivating(false);
    }
  };

  // =====================================
  // CLOSE TERM
  // =====================================

  const handleCloseTerm = async () => {
    if (!activeTerm?._id) {
      toast.error(
        "There is no active term"
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to close ${activeTerm.term} (${activeTerm.session})?`
      );

    if (!confirmed) return;

    try {
      setClosing(true);

      const response =
        await TermApi.closeTerm(
          activeTerm._id
        );

      if (response?.data?.success) {
        toast.success(
          response.data.message ||
            "Term closed successfully"
        );

        await loadTerms();
      }
    } catch (error) {
      console.error(
        "Close term error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to close term"
      );
    } finally {
      setClosing(false);
    }
  };

  // =====================================
  // FORMAT DATE
  // =====================================

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(
      date
    ).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =====================================
  // JSX
  // =====================================

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* =================================
            PAGE HEADER
        ================================= */}

        <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-6 sm:p-10 rounded-xl shadow-sm border border-gray-100">

          <div>
            <h1 className="font-medium text-2xl">
              Academic Terms & Session
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Create academic terms and manage
              the active school term.
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-green-600" />
          </div>

        </div>

        {/* =================================
            CREATE ACADEMIC SESSION
        ================================= */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          <div className="flex items-start gap-3 mb-5">

            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
              <GraduationCap
                size={20}
                className="text-green-600"
              />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Create Academic Session
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Enter the academic session and the
                system will create First, Second and
                Third Term automatically.
              </p>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            <input
              type="text"
              value={session}
              onChange={(e) =>
                setSession(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateSession();
                }
              }}
              placeholder="e.g. 2026/2027"
              disabled={creatingSession}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            />

            <button
              type="button"
              onClick={
                handleCreateSession
              }
              disabled={
                !session.trim() ||
                creatingSession
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >

              {creatingSession ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />

                  Create Academic Session
                </>
              )}

            </button>

          </div>

          <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500">
            Example: entering{" "}
            <strong>2026/2027</strong> creates
            First Term, Second Term and Third Term
            as upcoming terms.
          </div>

        </div>

        {/* =================================
            CURRENT ACTIVE TERM
        ================================= */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          <div className="flex items-center justify-between gap-4">

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Current Active Term
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                The term currently available
                for result submission.
              </p>
            </div>

            <button
              type="button"
              onClick={loadTerms}
              disabled={loadingTerms}
              className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
            >
              <RefreshCw
                className={
                  loadingTerms
                    ? "w-4 h-4 animate-spin"
                    : "w-4 h-4"
                }
              />
            </button>

          </div>

          {activeTerm ? (

            <div className="mt-6 rounded-xl bg-green-50 border border-green-100 p-5">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">

                    <span className="w-2 h-2 rounded-full bg-green-500" />

                    ACTIVE

                  </span>

                  <h3 className="mt-3 text-xl font-bold text-gray-900">
                    {activeTerm.term}
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    Session:{" "}
                    <span className="font-semibold">
                      {activeTerm.session}
                    </span>
                  </p>

                </div>

                <CheckCircle2 className="text-green-600 w-7 h-7" />

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

                <div className="bg-white rounded-lg p-4 border border-green-100">

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock3 size={15} />
                    Started
                  </div>

                  <p className="mt-1 font-semibold text-gray-900 text-sm">
                    {formatDate(
                      activeTerm.startDate
                    )}
                  </p>

                </div>

                <div className="bg-white rounded-lg p-4 border border-green-100">

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Lock size={15} />
                    End Date
                  </div>

                  <p className="mt-1 font-semibold text-gray-900 text-sm">
                    {activeTerm.endDate
                      ? formatDate(
                          activeTerm.endDate
                        )
                      : "Not ended"}
                  </p>

                </div>

              </div>

              <div className="flex justify-end mt-5">

                <button
                  type="button"
                  onClick={
                    handleCloseTerm
                  }
                  disabled={closing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >

                  {closing ? (
                    <>
                      <RefreshCw
                        size={16}
                        className="animate-spin"
                      />

                      Closing...
                    </>
                  ) : (
                    <>
                      <Lock size={16} />

                      Close Term
                    </>
                  )}

                </button>

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">

              <XCircle
                className="mx-auto text-gray-400"
                size={36}
              />

              <h3 className="mt-3 font-semibold text-gray-800">
                No Active Term
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Create an academic session and
                activate one of its terms below.
              </p>

            </div>

          )}

        </div>

        {/* =================================
            SET ACTIVE TERM
        ================================= */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-gray-900">
              Set Active Term
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Select an existing term to make
              it active. The start date will
              automatically be recorded.
            </p>

          </div>

          <div className="flex flex-col sm:flex-row gap-3">

            <select
              value={selectedTermId}
              onChange={(e) =>
                setSelectedTermId(
                  e.target.value
                )
              }
              disabled={
                loadingTerms ||
                activating
              }
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >

              <option value="">
                Select academic term
              </option>

              {terms.map((term) => (

                <option
                  key={term._id}
                  value={term._id}
                >
                  {term.term} -{" "}
                  {term.session}
                  {term.status ===
                  "ACTIVE"
                    ? " (ACTIVE)"
                    : ""}
                </option>

              ))}

            </select>

            <button
              type="button"
              onClick={
                handleActivateTerm
              }
              disabled={
                !selectedTermId ||
                activating
              }
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >

              {activating ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

                  Activating...
                </>
              ) : (
                <>
                  <Play size={17} />

                  Set Active Term
                </>
              )}

            </button>

          </div>

        </div>

        {/* =================================
            ALL TERMS
        ================================= */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">

          <div className="mb-5">

            <h2 className="text-lg font-semibold text-gray-900">
              Academic Terms
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              All academic terms created in
              the system.
            </p>

          </div>

          {loadingTerms ? (

            <div className="flex items-center justify-center py-10">

              <RefreshCw
                className="animate-spin text-green-600"
                size={24}
              />

            </div>

          ) : terms.length === 0 ? (

            <div className="text-center py-10 text-sm text-gray-500">
              No academic terms found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead>

                  <tr className="border-b border-gray-200 text-left">

                    <th className="py-3 px-3 font-semibold">
                      Session
                    </th>

                    <th className="py-3 px-3 font-semibold">
                      Term
                    </th>

                    <th className="py-3 px-3 font-semibold">
                      Status
                    </th>

                    <th className="py-3 px-3 font-semibold">
                      Start Date
                    </th>

                    <th className="py-3 px-3 font-semibold">
                      End Date
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {terms.map((term) => (

                    <tr
                      key={term._id}
                      className="border-b border-gray-100 last:border-0"
                    >

                      <td className="py-4 px-3">
                        {term.session}
                      </td>

                      <td className="py-4 px-3 font-medium">
                        {term.term}
                      </td>

                      <td className="py-4 px-3">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            term.status ===
                            "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : term.status ===
                                "CLOSED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {term.status}
                        </span>

                      </td>

                      <td className="py-4 px-3 text-gray-600">
                        {term.startDate
                          ? formatDate(
                              term.startDate
                            )
                          : "—"}
                      </td>

                      <td className="py-4 px-3 text-gray-600">
                        {term.endDate
                          ? formatDate(
                              term.endDate
                            )
                          : "—"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>
    </MainLayout>
  );
};

export default ActiveTerms;