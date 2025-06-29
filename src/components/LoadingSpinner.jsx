/**
 * LoadingSpinner component
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner (sm, md, lg)
 * @param {string} props.color - Color of the spinner
 */
export default function LoadingSpinner({ size = 'md', color = 'blue' }) {
  const sizeClass = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size] || 'w-8 h-8';
  
  const colorClass = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    green: 'text-green-600',
  }[color] || 'text-blue-600';
  
  return (
    <div className="flex justify-center items-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-current ${sizeClass} ${colorClass}`} />
    </div>
  );
} 