import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { groupAPI } from '../../api/group.api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
  UsersRound, Loader2, ChevronRight, CheckCircle, Calendar, BookOpen,
} from 'lucide-react';

export default function MyGroups() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups]   = useState([]);

  useEffect(() => {
    groupAPI.my()
      .then(({ data }) => setGroups(data.groups || []))
      .catch(() => toast.error('Failed to load your groups'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-500 text-sm mt-1">Work together with your teammates on group assignments</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <UsersRound size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No groups yet</p>
            <p className="text-gray-400 text-sm">You are not part of any group assignment yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => {
              const assignment = g.assignment || {};
              const deadline = assignment.deadline;
              const submitted = !!g.submission;
              return (
                <Link
                  key={g._id}
                  to={`/group/${g._id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <UsersRound size={18} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 truncate">{g.name}</h3>
                        {submitted ? (
                          <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            <CheckCircle size={11} /> Submitted
                          </span>
                        ) : (
                          <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>

                      {assignment.title && (
                        <p className="flex items-center gap-1.5 text-sm text-gray-500 mb-2 truncate">
                          <BookOpen size={13} className="flex-shrink-0" /> {assignment.title}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <UsersRound size={11} /> {g.memberCount ?? (g.members || []).length} member
                          {(g.memberCount ?? (g.members || []).length) === 1 ? '' : 's'}
                        </span>
                        {deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} /> Due {format(new Date(deadline), 'MMM d, yyyy HH:mm')}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
