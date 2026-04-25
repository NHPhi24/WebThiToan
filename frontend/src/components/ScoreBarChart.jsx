import React from 'react';
import { Column } from '@ant-design/plots';

/**
 * data: array of { session_name: string, avg_score: number }
 * Example: [
 *   { session_name: 'Ca 1', avg_score: 7.5 },
 *   { session_name: 'Ca 2', avg_score: 8.2 },
 * ]
 */
const ScoreBarChart = ({ data }) => {
  const config = {
    data,
    xField: 'session_name',
    yField: 'avg_score',
    color: '#1976d2',
    label: {
      position: 'top',
      style: {
        fill: '#595959',
        fontWeight: 600,
      },
      formatter: (v) => v,
    },
    xAxis: {
      title: { text: 'Ca thi' },
    },
    yAxis: {
      title: { text: 'Điểm trung bình' },
      min: 0,
      max: 10,
    },
    columnWidthRatio: 0.2,
    height: 350,
    autoFit: true,
  };
  return <Column {...config} />;
};

export default ScoreBarChart;
