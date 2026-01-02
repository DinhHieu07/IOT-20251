import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

/**
 * PPMGauge - semicircle gauge using Chart.js Doughnut
 * Props:
 *  - value: numeric ppm value
 *  - max: max ppm for gauge scale
 *  - mediumThreshold: ppm where status becomes warning
 *  - dangerThreshold: ppm where status becomes danger
 *  - unit: unit label e.g., "PPM"
 *  - size: height in px for the chart container
 */
const PPMGauge = ({
  value = 0,
  max = 100,
  mediumThreshold = 50,
  dangerThreshold = 80,
  unit = 'PPM',
  size = 160,
}) => {
  const ppmValue = Math.max(0, Math.min(value, max));
  const percentage = Math.min((ppmValue / max) * 100, 100);

  let gaugeColor = 'rgba(34, 197, 94, 0.9)'; // green
  let statusText = 'AN TOÀN';
  let statusClass = 'text-green-500 border-green-500';
  if (ppmValue >= dangerThreshold) {
    gaugeColor = 'rgba(239, 68, 68, 0.9)'; // red
    statusText = 'NGUY HIỂM';
    statusClass = 'text-red-500 border-red-500';
  } else if (ppmValue >= mediumThreshold) {
    gaugeColor = 'rgba(234, 179, 8, 0.9)'; // yellow
    statusText = 'CẢNH BÁO';
    statusClass = 'text-yellow-500 border-yellow-500';
  }

  const chartData = {
    datasets: [
      {
        data: [percentage, 100 - percentage],
        backgroundColor: [gaugeColor, 'rgba(255, 255, 255, 0.08)'],
        borderWidth: 0,
        circumference: 180,
        rotation: 270, // start from left
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
    },
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div style={{ height: size, width: '100%' }}>
        <Doughnut data={chartData} options={options} />
      </div>
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold">
          {ppmValue.toFixed(2)}
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className={`mt-2 inline-flex items-center px-2 py-1 rounded border ${statusClass}`}>
          {statusText}
        </div>
      </div>
    </div>
  );
};

export default PPMGauge;
