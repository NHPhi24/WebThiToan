import React, { useState } from 'react';
import { Row, Col } from 'antd';
import CommonSelectFilter from './CommonSelectFilter';

// Cấu hình các filter động
const FILTER_CONFIG = {
  role: {
    label: 'Vai trò',
    options: [
      { value: 'ALL', label: 'Tất cả vai trò' },
      { value: 'TEACHER', label: 'Giáo viên' },
      { value: 'STUDENT', label: 'Học sinh' },
      { value: 'ADMIN', label: 'Quản trị viên' },
    ],
  },
  status: {
    label: 'Trạng thái',
    options: [
      { value: 'ALL', label: 'Tất cả trạng thái' },
      { value: 'ACTIVE', label: 'Đang hoạt động' },
      { value: 'INACTIVE', label: 'Ngừng hoạt động' },
    ],
  },
  grade: {
    label: 'Lớp',
    options: [
      { value: 'ALL', label: 'Tất cả lớp' },
      { value: 10, label: 'Lớp 10' },
      { value: 11, label: 'Lớp 11' },
      { value: 12, label: 'Lớp 12' },
    ],
  },
  level: {
    label: 'Độ khó',
    options: [
      { value: '0', label: 'Cơ bản' },
      { value: '1', label: 'Nâng cao' },
    ],
  },
  // Thêm các filter khác nếu cần
};

/**
 * Filter component động, truyền filterKeys để hiển thị các filter cần thiết
 * @param {Array} filterKeys - Mảng key filter muốn hiển thị (ví dụ: ['role','status'])
 * @param {Function} onChange - Callback khi thay đổi, trả về object các giá trị filter
 */
const Filter = ({ filterKeys = [], onChange }) => {
  const [values, setValues] = useState({});

  const handleChange = (key, value) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onChange && onChange(newValues);
  };

  return (
    <Row gutter={8}>
      {filterKeys.map((key) => {
        const config = FILTER_CONFIG[key];
        if (!config) return null;
        return (
          <Col key={key}>
            <CommonSelectFilter
              value={values[key]}
              onChange={(val) => handleChange(key, val)}
              options={config.options}
              selectProps={{ placeholder: config.label }}
            />
          </Col>
        );
      })}
    </Row>
  );
};

export default Filter;
