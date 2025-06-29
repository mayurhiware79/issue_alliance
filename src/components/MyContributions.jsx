import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FaGithub, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaTrash, 
  FaClock, 
  FaLink, 
  FaCheck,
  FaCodeBranch,
  FaCalendarAlt,
  FaChartLine,
  FaStar,
  FaEdit,
  FaPlusCircle
} from 'react-icons/fa';

function MyContributions() {
  const { currentUser } = useAuth();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    abandoned: 0
  });
  const [isEditing, setIsEditing] = useState(null);
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: ''
  });

  // Determine theme classes
  const themeClasses = {
    container: currentTheme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900',
    card: currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
    button: currentTheme === 'dark' ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700',
    secondaryButton: currentTheme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
    text: currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900',
    textSecondary: currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    border: currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200',
    input: currentTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300',
    statsCard: {
      default: currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200',
      inProgress: currentTheme === 'dark' ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200',
      completed: currentTheme === 'dark' ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200',
      abandoned: currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    },
    statusBadge: {
      inProgress: currentTheme === 'dark' ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-100 text-blue-800',
      completed: currentTheme === 'dark' ? 'bg-green-900/20 text-green-300' : 'bg-green-100 text-green-800',
      abandoned: currentTheme === 'dark' ? 'bg-gray-800/20 text-gray-300' : 'bg-gray-100 text-gray-800'
    }
  };
  
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchContributions = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const contributionHistory = userData.contributionHistory || [];
          
          // Sort by startedAt date (newest first)
          const sortedContributions = [...contributionHistory].sort((a, b) => 
            new Date(b.startedAt) - new Date(a.startedAt)
          );
          
          setContributions(sortedContributions);
          
          // Calculate stats
          setStats({
            total: contributionHistory.length,
            inProgress: contributionHistory.filter(item => item.status === 'in_progress').length,
            completed: contributionHistory.filter(item => item.status === 'completed').length,
            abandoned: contributionHistory.filter(item => item.status === 'abandoned').length
          });
        }
      } catch (err) {
        console.error("Error fetching contributions:", err);
        setError("Failed to load your contributions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchContributions();
    
    // Handle new contribution from GitHubIssuesFetcher
    if (location.state?.newContribution) {
      // Flash animation or notification could be added here
    }
  }, [currentUser, location.state]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Calculate time elapsed since started
  const getTimeElapsed = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
  };
  
  // Status badge with appropriate color
  const StatusBadge = ({ status }) => {
    let color, icon, text;
    
    switch(status) {
      case 'in_progress':
        color = themeClasses.statusBadge.inProgress;
        icon = <FaClock className="mr-1" />;
        text = 'In Progress';
        break;
      case 'completed':
        color = themeClasses.statusBadge.completed;
        icon = <FaCheckCircle className="mr-1" />;
        text = 'Completed';
        break;
      case 'abandoned':
        color = themeClasses.statusBadge.abandoned;
        icon = <FaExclamationCircle className="mr-1" />;
        text = 'Abandoned';
        break;
      default:
        color = themeClasses.statusBadge.inProgress;
        icon = <FaClock className="mr-1" />;
        text = 'Unknown';
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {icon}
        {text}
      </span>
    );
  };
  
  // Start editing a contribution
  const handleEditClick = (contribution) => {
    setIsEditing(contribution.issueId);
    setEditFormData({
      status: contribution.status,
      notes: contribution.notes || ''
    });
  };
  
  // Update form data while editing
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save edited contribution
  const handleSaveEdit = async (issueId) => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let updatedContributions = [...(userData.contributionHistory || [])];
        
        // Find and update the contribution
        const index = updatedContributions.findIndex(item => item.issueId === issueId);
        
        if (index >= 0) {
          const oldStatus = updatedContributions[index].status;
          const newStatus = editFormData.status;
          
          // Update with form data
          updatedContributions[index] = {
            ...updatedContributions[index],
            status: newStatus,
            notes: editFormData.notes,
            updatedAt: new Date().toISOString()
          };
          
          // If marked as completed, add completedAt date
          if (newStatus === 'completed' && !updatedContributions[index].completedAt) {
            updatedContributions[index].completedAt = new Date().toISOString();
            
            // Also update repository stats in Firestore
            try {
              const repoId = updatedContributions[index].repository.replace(/\//g, '_');
              const repoRef = doc(db, 'repositories', repoId);
              const repoSnap = await getDoc(repoRef);
              
              if (repoSnap.exists()) {
                // Update repository stats
                await updateDoc(repoRef, {
                  completedIssues: increment(1),
                  lastCompletedAt: Timestamp.now(),
                  lastActivity: Timestamp.now()
                });
              }
            } catch (repoError) {
              console.error("Error updating repository stats:", repoError);
              // Continue even if repository update fails
            }
          }
          
          // Update Firestore
          await updateDoc(userRef, {
            contributionHistory: updatedContributions,
            updatedAt: new Date()
          });
          
          // Update local state
          setContributions(updatedContributions.sort((a, b) => 
            new Date(b.startedAt) - new Date(a.startedAt)
          ));
          
          // Update stats
          setStats({
            total: updatedContributions.length,
            inProgress: updatedContributions.filter(item => item.status === 'in_progress').length,
            completed: updatedContributions.filter(item => item.status === 'completed').length,
            abandoned: updatedContributions.filter(item => item.status === 'abandoned').length
          });
          
          setIsEditing(null);
        }
      }
    } catch (err) {
      console.error("Error updating contribution:", err);
      setError("Failed to update contribution. Please try again.");
    }
  };
  
  // Delete a contribution
  const handleDeleteContribution = async (issueId) => {
    if (!window.confirm("Are you sure you want to remove this contribution from your history?")) {
      return;
    }
    
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        let updatedContributions = [...(userData.contributionHistory || [])];
        
        // Remove the contribution
        updatedContributions = updatedContributions.filter(item => item.issueId !== issueId);
        
        // Update Firestore
        await updateDoc(userRef, {
          contributionHistory: updatedContributions,
          updatedAt: new Date()
        });
        
        // Update local state
        setContributions(updatedContributions);
        
        // Update stats
        setStats({
          total: updatedContributions.length,
          inProgress: updatedContributions.filter(item => item.status === 'in_progress').length,
          completed: updatedContributions.filter(item => item.status === 'completed').length,
          abandoned: updatedContributions.filter(item => item.status === 'abandoned').length
        });
      }
    } catch (err) {
      console.error("Error deleting contribution:", err);
      setError("Failed to delete contribution. Please try again.");
    }
  };
  
  return (
    <div className={`rounded-xl shadow-md overflow-hidden ${themeClasses.container}`}>
      <div className="p-6">
        <h2 className={`text-2xl font-bold mb-6 flex items-center ${themeClasses.text}`}>
          <FaGithub className="mr-2" /> My Contributions
        </h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${themeClasses.statsCard.default}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Total</p>
                <p className={`text-2xl font-bold ${themeClasses.text}`}>{stats.total}</p>
              </div>
              <FaChartLine className={`text-xl ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${themeClasses.statsCard.inProgress}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme === 'dark' ? 'text-blue-300' : 'text-blue-500'}`}>In Progress</p>
                <p className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>{stats.inProgress}</p>
              </div>
              <FaClock className={`text-xl ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${themeClasses.statsCard.completed}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${currentTheme === 'dark' ? 'text-green-300' : 'text-green-500'}`}>Completed</p>
                <p className={`text-2xl font-bold ${currentTheme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>{stats.completed}</p>
              </div>
              <FaCheckCircle className={`text-xl ${currentTheme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
            </div>
          </div>
          
          <div className={`p-4 rounded-lg border ${themeClasses.statsCard.abandoned}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${themeClasses.textSecondary}`}>Abandoned</p>
                <p className={`text-2xl font-bold ${themeClasses.text}`}>{stats.abandoned}</p>
              </div>
              <FaExclamationCircle className={`text-xl ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg flex items-start ${currentTheme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'}`}>
            <FaExclamationCircle className="mr-2 mt-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center my-8">
            <FaSpinner className="animate-spin text-blue-600 text-2xl" />
          </div>
        )}
        
        {/* Find Issues Button */}
        <div className="mb-6 flex justify-end">
          <button 
            onClick={() => navigate('/github-issues')}
            className={`px-4 py-2 ${themeClasses.button} text-white rounded-lg transition-colors flex items-center`}
          >
            <FaPlusCircle className="mr-2" /> Find New Issues
          </button>
        </div>
        
        {/* Contributions List */}
        {!loading && contributions.length > 0 ? (
          <div className="space-y-6">
            {contributions.map(contribution => (
              <div 
                key={contribution.issueId} 
                className={`border rounded-lg p-4 ${currentTheme === 'dark' ? 'bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-gray-800/50' : 'bg-white border-gray-200 hover:shadow-md'} transition-shadow`}
              >
                {isEditing === contribution.issueId ? (
                  /* Edit Form */
                  <div className="space-y-4">
                    <div>
                      <h3 className={`text-lg font-medium mb-1 ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {contribution.title}
                      </h3>
                      <div className={`flex items-center text-sm mb-3 ${themeClasses.textSecondary}`}>
                        <FaCodeBranch className="mr-1" />
                        <span>{contribution.repository}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                        Status
                      </label>
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditFormChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                      >
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="abandoned">Abandoned</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${themeClasses.text}`}>
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={editFormData.notes}
                        onChange={handleEditFormChange}
                        placeholder="Add any notes about your contribution..."
                        rows="3"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${themeClasses.input}`}
                      ></textarea>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(contribution.issueId)}
                        className={`px-4 py-2 ${themeClasses.button} text-white rounded-lg transition-colors`}
                      >
                        <FaCheck className="inline mr-1" /> Save Changes
                      </button>
                      <button
                        onClick={() => setIsEditing(null)}
                        className={`px-4 py-2 ${themeClasses.secondaryButton} rounded-lg transition-colors ${themeClasses.text}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div className="flex justify-between">
                      <div>
                        <h3 className={`text-lg font-medium mb-1 ${currentTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                          <a 
                            href={contribution.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline"
                          >
                            {contribution.title}
                          </a>
                        </h3>
                        <div className={`flex items-center text-sm mb-3 ${themeClasses.textSecondary}`}>
                          <FaCodeBranch className="mr-1" />
                          <a 
                            href={contribution.repositoryUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {contribution.repository}
                          </a>
                        </div>
                      </div>
                      <StatusBadge status={contribution.status} />
                    </div>
                    
                    <div className={`flex text-sm mb-3 ${themeClasses.textSecondary}`}>
                      <div className="mr-4">
                        <FaCalendarAlt className="inline mr-1" />
                        Started: {formatDate(contribution.startedAt)}
                      </div>
                      {contribution.completedAt && (
                        <div>
                          <FaCheckCircle className={`inline mr-1 ${currentTheme === 'dark' ? 'text-green-400' : 'text-green-500'}`} />
                          Completed: {formatDate(contribution.completedAt)}
                        </div>
                      )}
                    </div>
                    
                    {contribution.notes && (
                      <div className={`p-3 rounded-lg mb-3 text-sm ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={`font-medium mb-1 ${themeClasses.text}`}>Notes:</p>
                        <p className={themeClasses.textSecondary}>{contribution.notes}</p>
                      </div>
                    )}
                    
                    <div className={`mt-3 pt-3 border-t ${themeClasses.border} flex justify-between items-center`}>
                      <div className={`text-sm ${themeClasses.textSecondary}`}>
                        <FaClock className="inline mr-1" />
                        {getTimeElapsed(contribution.startedAt)}
                      </div>
                      
                      <div className="flex space-x-2">
                        <a 
                          href={contribution.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={`inline-flex items-center text-sm ${currentTheme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          <FaLink className="mr-1" /> View Issue
                        </a>
                        <button
                          onClick={() => handleEditClick(contribution)}
                          className={`inline-flex items-center text-sm ${currentTheme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                        >
                          <FaEdit className="mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteContribution(contribution.issueId)}
                          className={`inline-flex items-center text-sm ${currentTheme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`}
                        >
                          <FaTrash className="mr-1" /> Remove
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
            <div className={`inline-block p-4 rounded-full mb-4 ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <FaGithub className={`text-3xl ${currentTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <p className={`text-lg font-medium ${themeClasses.text}`}>No contributions yet</p>
            <p className="text-sm mt-2">Start tracking your open source contributions by finding GitHub issues that match your skills</p>
            <button
              onClick={() => navigate('/github-issues')}
              className={`mt-4 px-4 py-2 ${themeClasses.button} text-white rounded-lg transition-colors`}
            >
              Find GitHub Issues
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MyContributions;