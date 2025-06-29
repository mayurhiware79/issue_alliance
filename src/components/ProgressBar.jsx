import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({ value = 0, color = 'blue', height = 4 }) => {
  // Calculate width based on value (0-100)
  const width = Math.min(Math.max(value, 0), 100);
  
  // Map color to tailwind classes
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };
  
  const bgClass = colorClasses[color] || 'bg-blue-500';
  
  return (
    <div className="w-full overflow-hidden" style={{ height: `${height}px` }}>
      <motion.div
        className={`h-full ${bgClass}`}
        initial={{ width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ ease: "easeInOut", duration: 0.4 }}
      />
    </div>
  );
};

export default ProgressBar; 