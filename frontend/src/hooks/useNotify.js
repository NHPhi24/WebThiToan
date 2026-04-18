import { message } from 'antd';

/**
 * Custom hook for showing success notifications.
 * Usage: const notify = useNotify(); notify.success('Thông báo thành công');
 */
export default function notify() {
  return {
    success: (msg) => message.success(msg),
    error: (msg) => message.error(msg),
    info: (msg) => message.info(msg),
    warning: (msg) => message.warning(msg),
  };
}
