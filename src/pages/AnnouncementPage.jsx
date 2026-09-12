import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Megaphone, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../layouts/MainLayout';
import adminAPI from '../api/admin.api';

export default function AnnouncementPage() {
  return (
    <MainLayout>
      <div>Hello</div>
    </MainLayout>
  )
}
