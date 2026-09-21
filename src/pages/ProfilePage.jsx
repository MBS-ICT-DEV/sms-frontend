import { useEffect, useState } from 'react';
import { User, GraduationCap, BookOpen, Hash, Mail, Loader2, Phone } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import authAPI from '../api/auth.api';

const Item = ({ icon: Icon, label, value }) => value ? (
  <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
    <Icon size={18} className="mt-0.5 text-blue-600" />
    <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>
  </div>
) : null;

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    authAPI.getProfile().then(({ data }) => setProfile(data.profile)).catch((err) => setError(err.response?.data?.message || 'Unable to load your profile.'));
  }, []);
  return <MainLayout><div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1><p className="mt-1 text-sm text-slate-500">Your account and current academic information.</p></div>
    {!profile && !error && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {profile && <><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700"><User size={30} /></div><div><h2 className="text-xl font-bold text-slate-900">{profile.fullname}</h2><p className="capitalize text-sm text-slate-500">{profile.role}</p></div></div></section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Item icon={Mail} label="Email" value={profile.email} /><Item icon={Phone} label="Phone number" value={profile.phone || profile.phoneNumber} /><Item icon={Hash} label="Username" value={profile.username} /><Item icon={Hash} label="Registration number" value={profile.registrationNumber} /><Item icon={GraduationCap} label="Current class" value={profile.class?.name} /><Item icon={BookOpen} label="Section" value={profile.class?.section?.name} /><Item icon={BookOpen} label="Department" value={profile.class?.department?.name} /><Item icon={User} label="Class teacher" value={profile.class?.classTeacher?.fullname} /><Item icon={GraduationCap} label="Assigned class" value={profile.assignedClass?.name} /></section></>}
  </div></MainLayout>;
}
