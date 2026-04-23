import { useEffect, useState } from 'react';
import api from '../services/api';

// Hook: useTeacherFullName
// Trả về full_name của giáo viên theo id, và loading state
export default function useTeacherFullName(teacherId) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) {
      setFullName('');
      return;
    }
    setLoading(true);
    api
      .getAllUsers()
      .then((res) => {
        const teacherIdStr = String(teacherId);
        const user = (res.data || []).find((u) => String(u.id) === teacherIdStr);
        setFullName(user ? user.full_name : teacherIdStr);
      })
      .catch(() => setFullName(String(teacherId)))
      .finally(() => setLoading(false));
  }, [teacherId]);

  return { fullName, loading };
}
