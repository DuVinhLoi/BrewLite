'use client';

import { useEffect, useState } from 'react';
import ProfileView from '@/components/ProfileView';
import { getProfile, type Profile } from '@/lib/api';
import { getToken } from '@/lib/auth';

// Hồ sơ khách (mở rộng ngoài đề): email, vai trò, tổng điểm tích lũy từ GET /users/me.
export default function ProfilePage() {
  // undefined = chưa đọc sessionStorage; null = đã đọc và chưa đăng nhập (getToken() trả null).
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setToken(getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    getProfile(token)
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi không xác định'));
  }, [token]);

  return <ProfileView token={token} profile={profile} error={error} />;
}
