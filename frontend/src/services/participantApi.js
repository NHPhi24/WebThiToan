import axiosClient from './axiosClient';

const participantApi = {
  register: ({ session_id, user_id }) =>
    axiosClient.post('/session-participants/register', {
      session_id,
      user_id,
    }),
  // Học sinh tự hủy đăng ký ca thi
  cancelRegister: ({ session_id, user_id }) => axiosClient.post('/session-participants/cancel-register', { session_id, user_id }),
  // Giáo viên duyệt hoặc từ chối đăng ký ca thi
  updateRegisterStatus: ({ session_id, user_id, register_status }) =>
    axiosClient.patch(`/session-participants/${session_id}/${user_id}/register-status`, { register_status }),
  // Giáo viên xóa học sinh khỏi ca thi
  remove: ({ session_id, user_id }) => axiosClient.delete(`/session-participants/${session_id}/${user_id}`),
  // Học sinh bắt đầu vào phòng thi: cập nhật has_joined
  markJoined: ({ session_id, user_id }) => axiosClient.post('/session-participants/mark-joined', { session_id, user_id }),
};

export default participantApi;
