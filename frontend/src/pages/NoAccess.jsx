import React from 'react';
import { Result, Button } from 'antd';

const NoAccess = () => (
  <Result
    status="403"
    title="403"
    subTitle="Bạn không có quyền truy cập trang này."
    extra={
      <Button type="primary" href="/">
        Về trang chủ
      </Button>
    }
  />
);

export default NoAccess;
