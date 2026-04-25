import { useEffect, useState } from 'react';
import api from '../services/api';

// Biến cục bộ nằm ngoài function để làm cache (tồn tại suốt vòng đời app)
let usersCache = null;
let pendingRequest = null;

export default function useTeacherFullName(teacherId) {
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) {
      setFullName('');
      return;
    }

    const getTeacherName = async () => {
      setLoading(true);
      try {
        // 1. Nếu đã có cache, lấy luôn từ cache
        if (usersCache) {
          const user = usersCache.find((u) => String(u.id) === String(teacherId));
          setFullName(user ? user.full_name : String(teacherId));
        }
        // 2. Nếu chưa có cache và chưa có request nào đang chạy, thì gọi API
        else {
          if (!pendingRequest) {
            pendingRequest = api.getAllUsers().then((res) => {
              usersCache = res.data || [];
              return usersCache;
            });
          }

          const users = await pendingRequest;
          const user = users.find((u) => String(u.id) === String(teacherId));
          setFullName(user ? user.full_name : String(teacherId));
        }
      } catch (error) {
        setFullName(String(teacherId));
      } finally {
        setLoading(false);
      }
    };

    getTeacherName();
  }, [teacherId]);

  return { fullName, loading };
}
