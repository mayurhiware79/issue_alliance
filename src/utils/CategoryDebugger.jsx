import React from 'react';

/**
 * A debugging component to visualize thread categories in the forum
 * This helps diagnose issues with thread filtering and category assignments
 */
function CategoryDebugger({ threads, activeCategory }) {
  if (!threads || threads.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md dark:bg-yellow-900 dark:border-yellow-700 text-sm">
        <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Category Debugger</h3>
        <p className="text-yellow-600 dark:text-yellow-300">No threads to analyze</p>
      </div>
    );
  }

  // Count threads per category
  const categoryCounts = threads.reduce((acc, thread) => {
    const category = thread.category || 'undefined';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  // Get unique categories
  const categories = Object.keys(categoryCounts).sort();

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900 dark:border-blue-700 text-sm">
      <h3 className="font-medium text-blue-800 dark:text-blue-200">Category Debugger</h3>
      <p className="text-blue-600 dark:text-blue-300 mb-2">
        Active category: <span className="font-medium">{activeCategory}</span>, 
        Total threads: <span className="font-medium">{threads.length}</span>
      </p>
      
      <div className="space-y-1">
        <div className="text-blue-600 dark:text-blue-300 font-medium">Category distribution:</div>
        {categories.map(category => (
          <div key={category} className="flex items-center">
            <div className={`w-24 text-blue-700 dark:text-blue-200 ${category === activeCategory ? 'font-bold' : ''}`}>
              {category}:
            </div>
            <div className="w-8 text-blue-700 dark:text-blue-200 font-medium">{categoryCounts[category]}</div>
            <div className="flex-1 h-4 bg-blue-100 dark:bg-blue-800 overflow-hidden rounded-sm">
              <div 
                className="h-full bg-blue-500 dark:bg-blue-400" 
                style={{width: `${(categoryCounts[category] / threads.length) * 100}%`}}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <details>
          <summary className="text-blue-600 dark:text-blue-300 cursor-pointer">Thread details</summary>
          <div className="mt-2 p-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left p-1">ID</th>
                  <th className="text-left p-1">Title</th>
                  <th className="text-left p-1">Category</th>
                </tr>
              </thead>
              <tbody>
                {threads.map(thread => (
                  <tr key={thread.id} className="border-b dark:border-gray-700">
                    <td className="p-1 font-mono">{thread.id?.substring(0, 6)}</td>
                    <td className="p-1">{thread.title}</td>
                    <td className={`p-1 ${thread.category === activeCategory ? 'font-bold' : ''}`}>
                      {thread.category || 'undefined'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

export default CategoryDebugger; 