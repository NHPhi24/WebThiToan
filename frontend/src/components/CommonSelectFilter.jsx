import React from 'react';
import { Select } from 'antd';

/**
 * CommonSelectFilter: Component select filter dùng chung cho mọi loại dữ liệu
 * @param {string|number} value - Giá trị hiện tại
 * @param {function} onChange - Hàm callback khi thay đổi
 * @param {Array} options - Danh sách options [{value, label}]
 * @param {object} [selectProps] - Các props khác cho Select
 */
const CommonSelectFilter = ({ value, onChange, options = [], selectProps }) => {
  return (
    <Select
      style={{ width: 160, ...selectProps?.style }}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={selectProps?.placeholder || 'Lọc'}
      {...selectProps}
      allowClear
    />
  );
};

export default CommonSelectFilter;
