# Website Thi Trắc Nghiệm Toán Trung Học Phổ Thông

Dự án này bao gồm website thi trắc nghiệm toán THPT với backend Node.js, frontend React.js và database PostgreSQL.

## Cấu trúc dự án

- `backend/` - Backend API sử dụng Node.js và Express
- `frontend/` - Frontend UI sử dụng React.js với Ant Design

## Thư viện sử dụng

### Frontend

- React.js
- Ant Design (antd) - UI components
- Axios - HTTP client
- SCSS - Styling
- KaTeX - Hiển thị công thức toán

### Backend

- Node.js
- Express.js
- PostgreSQL (pg)
- CORS
- dotenv

## API Endpoints

### Users

- `GET /api/users` - Lấy danh sách người dùng
- `POST /api/users` - Tạo người dùng mới

### Questions

- `GET /api/questions` - Lấy danh sách câu hỏi
- `POST /api/questions` - Tạo câu hỏi mới

### Exam Templates

- `GET /api/exam-templates` - Lấy danh sách mẫu đề thi
- `POST /api/exam-templates` - Tạo mẫu đề thi mới

### Exams

- `GET /api/exams` - Lấy danh sách đề thi
- `POST /api/exams` - Tạo đề thi mới

### Exam Sessions

- `GET /api/exam-sessions` - Lấy danh sách ca thi
- `POST /api/exam-sessions` - Tạo ca thi mới

### Exam Results

- `GET /api/exam-results` - Lấy danh sách kết quả thi
- `POST /api/exam-results` - Tạo kết quả thi mới

## Cài đặt và chạy

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Database

- Cài đặt PostgreSQL
- Tạo database `math_quiz_db` nếu chưa có
- Sử dụng file `backend/.env.example` để cấu hình kết nối PostgreSQL
- Backend sẽ tự động tạo các bảng khi khởi động

## Phát triển

- Backend chạy trên port 3001
- Frontend chạy trên port 3000
- Database PostgreSQL mặc định
