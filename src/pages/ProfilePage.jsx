import { useEffect, useRef, useState } from 'react';
import { User, GraduationCap, BookOpen, Hash, Mail, Loader2, Phone, Camera, Pencil, Check } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import authAPI from '../api/auth.api';
import { useAuth } from '../context/AuthContext';

// Staff accounts may edit their own details; students only manage their photo.
const EDITABLE_ROLES = ['admin', 'principal', 'hoa', 'secretary', 'teacher'];
// Every role except the developer account may set a profile picture.
const IMAGE_ROLES = ['admin', 'principal', 'hoa', 'secretary', 'teacher', 'student'];

const Item = ({ icon: Icon, label, value }) => value ? (
  <div className="flex gap-3 rounded-xl border border-slate-200 p-4">
    <Icon size={18} className="mt-0.5 text-blue-600" />
    <div><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-900">{value}</p></div>
  </div>
) : null;

const Field = ({ label, ...props }) => (
  <label className="block">
    <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
    <input
      {...props}
      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </label>
);

export default function ProfilePage() {
  const { updateUser } = useAuth();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ fullname: '', email: '', phone: '', currentPassword: '', newPassword: '' });

  const role = (profile?.role || '').toLowerCase();
  const canEdit = EDITABLE_ROLES.includes(role);
  const canUpload = IMAGE_ROLES.includes(role);

  useEffect(() => {
    authAPI.getProfile()
      .then(({ data }) => {
        setProfile(data.profile);
        setForm((prev) => ({
          ...prev,
          fullname: data.profile.fullname || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
        }));
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load your profile.'));
  }, []);

  const initials = (profile?.fullname || 'U')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setNotice('');
    const body = new FormData();
    body.append('image', file);

    try {
      setUploading(true);
      const { data } = await authAPI.uploadProfileImage(body);
      setProfile((prev) => ({ ...prev, profileImage: data.profileImage }));
      updateUser({ profileImage: data.profileImage });
      setNotice('Profile image updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to upload image.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const payload = { fullname: form.fullname, email: form.email, phone: form.phone };
    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    try {
      setSaving(true);
      const { data } = await authAPI.updateProfile(payload);
      setProfile(data.profile);
      updateUser({ fullname: data.profile.fullname, email: data.profile.email, phone: data.profile.phone });
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      setNotice('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return <MainLayout><div className="mx-auto max-w-4xl space-y-6">
    <div><h1 className="text-2xl font-bold text-slate-900">My Profile</h1><p className="mt-1 text-sm text-slate-500">Your account and current academic information.</p></div>
    {!profile && !error && <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}
    {profile && <><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.fullname} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              {initials || <User size={30} />}
            </div>
          )}
          {canUpload && <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Change photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </>}
        </div>
        <div><h2 className="text-xl font-bold text-slate-900">{profile.fullname}</h2><p className="capitalize text-sm text-slate-500">{profile.role}</p></div>
      </div>
    </section>

    {canEdit && <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2"><Pencil size={16} className="text-blue-600" /><h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Edit account details</h3></div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" name="fullname" value={form.fullname} onChange={handleChange} placeholder="Your full name" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@school.ng" />
        <Field label="Phone number" name="phone" value={form.phone} onChange={handleChange} placeholder="08012345678" />
        <div className="hidden sm:block" />
        <Field label="Current password" name="currentPassword" type="password" value={form.currentPassword} onChange={handleChange} placeholder="Only needed to change password" autoComplete="current-password" />
        <Field label="New password" name="newPassword" type="password" value={form.newPassword} onChange={handleChange} placeholder="Leave blank to keep current" autoComplete="new-password" />
        <div className="flex justify-end sm:col-span-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save changes
          </button>
        </div>
      </form>
    </section>}

    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Item icon={Mail} label="Email" value={profile.email} /><Item icon={Phone} label="Phone number" value={profile.phone || profile.phoneNumber} /><Item icon={Hash} label="Username" value={profile.username} /><Item icon={Hash} label="Registration number" value={profile.registrationNumber} /><Item icon={GraduationCap} label="Current class" value={profile.class?.name} /><Item icon={BookOpen} label="Section" value={profile.class?.section?.name} /><Item icon={BookOpen} label="Department" value={profile.class?.department?.name} /><Item icon={User} label="Class teacher" value={profile.class?.classTeacher?.fullname} /><Item icon={GraduationCap} label="Assigned class" value={profile.assignedClass?.name} /></section></>}
  </div></MainLayout>;
}
