import { useState, useEffect } from 'react';

/**
 * SkillsFilter component
 * @param {Object} props - Component props
 * @param {Array} props.data - Data with skills to filter by
 * @param {Function} props.onFilterChange - Callback when filters change
 */
export default function SkillsFilter({ data, onFilterChange }) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  
  // Extract unique skills from data
  useEffect(() => {
    if (!data || !data.length) return;
    
    const uniqueSkills = new Set();
    
    data.forEach(item => {
      if (item.skills && item.skills.length) {
        item.skills.forEach(skill => {
          if (skill) uniqueSkills.add(skill);
        });
      }
    });
    
    setAvailableSkills(Array.from(uniqueSkills).sort());
  }, [data]);
  
  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };
  
  const handleApplyFilter = () => {
    onFilterChange(selectedSkills);
  };
  
  const handleResetFilter = () => {
    setSelectedSkills([]);
    onFilterChange([]);
  };
  
  if (!availableSkills.length) {
    return null;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Filter by Skills</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {availableSkills.map(skill => (
          <button
            key={skill}
            onClick={() => handleSkillToggle(skill)}
            className={`px-3 py-1 rounded-full text-sm ${
              selectedSkills.includes(skill)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {skill}
          </button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={handleApplyFilter}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Apply Filters
        </button>
        
        <button
          onClick={handleResetFilter}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          Reset
        </button>
      </div>
    </div>
  );
} 