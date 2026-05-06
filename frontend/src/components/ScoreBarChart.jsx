import React from 'react';
import { Column } from '@ant-design/plots';

const ScoreBarChart = ({ data }) => {
  const config = {
    data,
    xField: 'session_name',
    yField: 'avg_score',
    color: '#1976d2',
    label: {
      position: 'top',
      style: {
        fill: '#ffffff', // màu xanh đậm nổi bật
        fontWeight: 600,
        fontSize: 16,
        lineWidth: 2,
        textShadow: '0 1px 4px #fff',
      },
      formatter: (v) => Number(v).toFixed(2), // làm tròn 2 số thập phân
      offset: 8, // đẩy số lên cao hơn khỏi cột
    },
    xAxis: {
      title: { text: 'Ca thi' },
    },
    yAxis: {
      title: { text: 'Điểm trung bình' },
      min: 0,
      max: 10,
    },
    columnWidthRatio: 0.1,
    height: 350,
    autoFit: true,
  };
  return <Column {...config} />;
};

export default ScoreBarChart;
