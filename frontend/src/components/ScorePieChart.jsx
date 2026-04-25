import React from 'react';
import { Pie } from '@ant-design/plots';

const ScorePieChart = ({ data }) => {
  // data: array of { range: '0-2', count: 5 }
  const config = {
    appendPadding: 10,
    data,
    angleField: 'count',
    colorField: 'range',
    radius: 0.9,
    label: {
      type: 'outer',
      content: '{name} ({percentage})',
    },
    interactions: [{ type: 'element-active' }],
  };
  return <Pie {...config} />;
};

export default ScorePieChart;
