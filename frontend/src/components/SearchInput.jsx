import React from 'react';
import { Input } from 'antd';
import { Search } from 'lucide-react';

const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...', style, ...props }) => {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{ width: 250, ...style }}
      prefix={<Search size={16} />}
      allowClear
      {...props}
    />
  );
};

export default SearchInput;
