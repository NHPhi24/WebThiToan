import axiosClient from './axiosClient';

const participantApi = {
  register: ({ session_id, user_id }) =>
    axiosClient.post('/session-participants/register', {
      session_id,
      user_id,
    }),
  // Giáo viên duyệt hoặc từ chối đăng ký ca thi
  updateRegisterStatus: ({ session_id, user_id, register_status }) =>
    axiosClient.patch(`/session-participants/${session_id}/${user_id}/register-status`, { register_status }),
};

export default participantApi;
