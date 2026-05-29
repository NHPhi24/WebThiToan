import { useEffect } from 'react';
import { message } from 'antd';

// Component này sẽ cảnh báo khi chuyển tab/cửa sổ
const VoHieu = ({ onViPham }) => {
  useEffect(() => {
    const handleBlur = () => {
      message.warning('Bạn không được phép chuyển tab hoặc cửa sổ trong khi làm bài!');
      if (typeof onViPham === 'function') onViPham();
    };
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') {
        // message.warning('Bạn không được phép chuyển tab hoặc cửa sổ trong khi làm bài!');
        if (typeof onViPham === 'function') onViPham();
      }
    };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [onViPham]);
  return null;
};

export default VoHieu;
