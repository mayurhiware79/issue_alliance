import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaRegCommentAlt, FaComment, FaList, FaCheck, FaThumbsUp, FaEye, FaRegThumbsUp } from 'react-icons/fa';
import { voteOnThread, getThreadAnswers, addAnswer, incrementThreadView, hasUserVotedOnThread } from '../../services/forumService';
import { useAuth } from '../../contexts/AuthContext';

function ThreadList({ threads: initialThreads, currentUser, showViewAnswersButton = false, isDarkMode = false }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState(initialThreads);
  const [votingStatus, setVotingStatus] = useState({});
  const [expandedThread, setExpandedThread] = useState(null);
  const [threadAnswers, setThreadAnswers] = useState({});
  const [loadingAnswers, setLoadingAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userVotedThreads, setUserVotedThreads] = useState({});
  
  // Check which threads user has already voted on
  useEffect(() => {
    const checkUserVotes = async () => {
      if (!currentUser) return;
      
      try {
        const votedMap = {};
        for (const thread of initialThreads) {
          const voted = await hasUserVotedOnThread(thread.id, currentUser.uid);
          votedMap[thread.id] = voted;
        }
        setUserVotedThreads(votedMap);
      } catch (error) {
        console.error("Error checking user votes:", error);
      }
    };
    
    checkUserVotes();
  }, [initialThreads, currentUser]);

  // Update thread view count when a thread is clicked
  const incrementView = async (threadId) => {
    try {
      await incrementThreadView(threadId);
      // Update UI optimistically
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === threadId 
            ? { ...thread, views: (thread.views || 0) + 1 } 
            : thread
        )
      );
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const handleThreadClick = (threadId) => {
    // Regular click navigates to thread detail
    if (expandedThread === threadId) {
      // If already expanded, collapse it
      setExpandedThread(null);
    } else {
      incrementView(threadId); // Increment view count
      navigate(`/thread/${threadId}`);
    }
  };

  const handleAnswerClick = (threadId, e) => {
    e.stopPropagation(); // Prevent the card click from triggering
    
    // Instead of navigating, expand the thread preview
    setExpandedThread(threadId === expandedThread ? null : threadId);
    
    // Focus the answer form if expanding
    if (threadId !== expandedThread) {
      setTimeout(() => {
        const answerForm = document.getElementById(`answer-form-${threadId}`);
        if (answerForm) {
          answerForm.scrollIntoView({ behavior: 'smooth' });
          answerForm.querySelector('textarea')?.focus();
        }
      }, 100);
    }
  };

  const handleViewAllAnswers = async (threadId, e) => {
    e.stopPropagation(); // Prevent the card click from triggering
    
    // Set loading state for this thread
    setLoadingAnswers(prev => ({ ...prev, [threadId]: true }));
    
    try {
      // Fetch answers from Firebase
      const answers = await getThreadAnswers(threadId);
      console.log("Fetched answers:", answers); // Debug
      
      if (!answers || answers.length === 0) {
        // Handle case where there are no answers despite answerCount > 0
        alert("No answers found for this thread yet.");
        setLoadingAnswers(prev => ({ ...prev, [threadId]: false }));
        return;
      }
      
      // Ensure answers are properly formatted
      const formattedAnswers = answers.map(answer => ({
        ...answer,
        // Ensure content is always a string
        content: answer.content || '',
        // Ensure votes is always a number
        votes: typeof answer.votes === 'number' ? answer.votes : 0,
        // Ensure isAccepted is always a boolean
        isAccepted: !!answer.isAccepted
      }));
      
      // Update state with fetched answers
      setThreadAnswers(prev => ({ ...prev, [threadId]: formattedAnswers }));
      
      // Expand thread to show answers
      setExpandedThread(threadId);
      
      // Scroll to answers section
      setTimeout(() => {
        const answersSection = document.getElementById(`answers-section-${threadId}`);
        if (answersSection) {
          answersSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error("Error fetching answers:", error);
      alert("Error loading answers: " + error.message);
    } finally {
      // Clear loading state
      setLoadingAnswers(prev => ({ ...prev, [threadId]: false }));
    }
  };

  const handleVoteClick = async (e, threadId) => {
    e.stopPropagation(); // Prevent the card click from triggering
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/forum` } });
      return;
    }
    
    // Prevent double voting or voting while a request is in progress
    if (votingStatus[threadId] || userVotedThreads[threadId]) return;
    
    try {
      // Set voting status to prevent multiple clicks
      setVotingStatus(prev => ({ ...prev, [threadId]: true }));
      
      // First, update the UI optimistically for immediate feedback
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === threadId 
            ? { ...thread, votes: (thread.votes || 0) + 1 } 
            : thread
        )
      );
      
      // Mark as voted in local state
      setUserVotedThreads(prev => ({ ...prev, [threadId]: true }));
      
      // Call Firebase service with user ID
      const result = await voteOnThread(threadId, 'up', currentUser.uid);
      
      if (result.alreadyVoted) {
        // If server says user already voted, keep the UI showing as voted but don't count twice
        setThreads(prevThreads => 
          prevThreads.map(thread => 
            thread.id === threadId 
              ? { 
                  ...thread, 
                  votes: result.updatedThread.votes
                } 
              : thread
          )
        );
      } else {
        // Update with the actual result from the server
        setThreads(prevThreads => 
          prevThreads.map(thread => 
            thread.id === threadId 
              ? { 
                  ...thread, 
                  votes: result.updatedThread.votes,
                  updatedAt: result.updatedThread.updatedAt 
                } 
              : thread
          )
        );
      }
    } catch (error) {
      console.error(`Error voting for thread ${threadId}:`, error);
      // Revert the optimistic update
      setThreads(initialThreads);
      setUserVotedThreads(prev => ({ ...prev, [threadId]: false }));
      // Show error notification
      alert("Error voting: " + error.message);
    } finally {
      // Reset voting status after a delay
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [threadId]: false }));
      }, 1000);
    }
  };

  // Function to format the posted time
  const formatPostedTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Function to get author display name
  const getAuthorName = (thread) => {
    return thread.authorName || thread.author || 'Anonymous';
  };

  const handleGoToFullThread = (threadId, e) => {
    e.stopPropagation();
    incrementView(threadId); // Increment view count
    navigate(`/thread/${threadId}`);
  };

  // Real implementation for adding a quick answer
  const handleQuickAnswerSubmit = async (e, threadId) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/thread/${threadId}#answer-form` } });
      return;
    }
    
    const form = e.target;
    const answerText = form.quickAnswer.value;
    
    if (!answerText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare answer data
      const answerData = {
        content: answerText.trim(),
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email.split('@')[0] || 'Anonymous',
        authorEmail: currentUser.email,
        authorPhotoURL: currentUser.photoURL || null
      };
      
      // Add answer to Firebase
      const result = await addAnswer(threadId, answerData, currentUser.uid);
      
      // Update the thread in the threads list
      setThreads(prevThreads => 
        prevThreads.map(thread => 
          thread.id === threadId 
            ? { 
                ...thread, 
                answerCount: result.thread.answerCount,
                updatedAt: result.thread.updatedAt 
              } 
            : thread
        )
      );
      
      // Format the new answer for display
      const newAnswer = {
        ...result.answer,
        postedAt: new Date().toISOString(),
      };
      
      // Add the new answer to threadAnswers if that thread's answers are being shown
      if (threadAnswers[threadId]) {
        setThreadAnswers(prev => ({
          ...prev,
          [threadId]: [...(prev[threadId] || []), newAnswer]
        }));
      }
      
      // Reset form and submit state
      form.reset();
      
      // Show confirmation message
      alert("Your answer has been posted!");
    } catch (err) {
      console.error('Error adding answer:', err);
      alert("Error posting answer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {threads.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-300">No threads found for this category.</p>
        </div>
      ) : (
        threads.map((thread) => (
          <div key={thread.id} className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div 
              className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600"
              onClick={() => handleThreadClick(thread.id)}
            >
              <div className="flex flex-col md:flex-row">
                {/* Stats column */}
                <div className="flex flex-row md:flex-col items-center justify-between md:mr-6 md:space-y-4 mb-4 md:mb-0 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex flex-col items-center">
                    <button 
                      className={`${
                        votingStatus[thread.id] 
                          ? 'text-blue-500 cursor-not-allowed' 
                          : userVotedThreads[thread.id]
                            ? 'text-blue-500'
                            : 'text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                      } p-1`}
                      onClick={(e) => handleVoteClick(e, thread.id)}
                      disabled={votingStatus[thread.id] || userVotedThreads[thread.id]}
                      title={userVotedThreads[thread.id] ? "You already voted" : "Vote up"}
                    >
                      {userVotedThreads[thread.id] ? (
                        <FaThumbsUp className="h-5 w-5" />
                      ) : (
                        <FaRegThumbsUp className="h-5 w-5" />
                      )}
                    </button>
                    <div className="text-xl font-medium text-blue-600 dark:text-blue-400">{thread.votes || 0}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">votes</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-xl font-medium ${thread.answerCount > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {thread.answerCount || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">answers</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl font-medium text-gray-600 dark:text-gray-300">
                      <FaEye className="inline h-4 w-4 mr-1" />
                      {thread.views || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">views</div>
                  </div>
                </div>
                
                {/* Content column */}
                <div className="flex-1">
                  <h3 className="text-xl font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    {thread.title}
                  </h3>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-700 dark:text-gray-200">
                      {thread.category || 'Uncategorized'}
                    </span>
                    {thread.tags && thread.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      Posted by <span className="font-medium dark:text-gray-300">{getAuthorName(thread)}</span> {formatPostedTime(thread.postedAt)}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <button 
                        className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                        onClick={(e) => handleAnswerClick(thread.id, e)}
                      >
                        {expandedThread === thread.id ? (
                          <FaComment className="mr-1 h-3 w-3" />
                        ) : (
                          <FaRegCommentAlt className="mr-1 h-3 w-3" />
                        )}
                        Answer This
                      </button>
                      
                      {showViewAnswersButton && thread.answerCount > 0 && (
                        <button 
                          className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                          onClick={(e) => handleViewAllAnswers(thread.id, e)}
                          disabled={loadingAnswers[thread.id]}
                        >
                          {loadingAnswers[thread.id] ? (
                            <span className="flex items-center">
                              <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Loading...
                            </span>
                          ) : (
                            <>
                              <FaList className="mr-1 h-3 w-3" />
                              View All Answers ({thread.answerCount})
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable quick answer section */}
            {expandedThread === thread.id && (
              <div className="bg-gray-50 border border-t-0 border-gray-200 p-4 rounded-b-lg dark:bg-gray-700 dark:border-gray-600" id={`answer-form-${thread.id}`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium dark:text-white">Quick Answer</h4>
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => handleGoToFullThread(thread.id, e)}
                      className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Go to full thread
                    </button>
                  </div>
                </div>
                
                {currentUser ? (
                  <form onSubmit={(e) => handleQuickAnswerSubmit(e, thread.id)}>
                    <textarea
                      name="quickAnswer"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600"
                      rows={4}
                      placeholder="Your answer..."
                      required
                      disabled={isSubmitting}
                    ></textarea>
                    <div className="mt-3 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setExpandedThread(null)}
                        className="px-3 py-1 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center dark:bg-blue-700 dark:hover:bg-blue-800 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Posting...
                          </>
                        ) : (
                          'Post Answer'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-2 dark:text-gray-300">You need to be logged in to answer</p>
                    <button
                      onClick={() => navigate('/login', { state: { from: `/thread/${thread.id}#answer-form` } })}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                      Log in to answer
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Display answers section */}
            {expandedThread === thread.id && threadAnswers[thread.id] && threadAnswers[thread.id].length > 0 && (
              <div id={`answers-section-${thread.id}`} className="bg-gray-50 border border-t-0 border-gray-200 p-4 rounded-b-lg mt-1 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium dark:text-white">All Answers ({threadAnswers[thread.id].length})</h4>
                  <button
                    onClick={(e) => handleGoToFullThread(thread.id, e)}
                    className="text-blue-600 hover:text-blue-800 text-sm dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Go to full thread
                  </button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {threadAnswers[thread.id].map(answer => (
                    <div key={answer.id} className="p-3 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:border-gray-600 hover:shadow-md transition-shadow">
                      <div className="prose max-w-none text-sm dark:text-gray-200">
                        {answer.content && answer.content.split('\n').map((paragraph, index) => (
                          <p key={index}>{paragraph}</p>
                        ))}
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          Answered by <span className="font-medium dark:text-gray-300">{answer.authorName || 'Anonymous'}</span>
                        </span>
                        <div className="flex items-center">
                          <span className="mr-2">
                            <FaThumbsUp className="inline h-3 w-3 mr-1" />
                            {answer.votes || 0}
                          </span>
                          {answer.isAccepted && (
                            <span className="text-green-600 dark:text-green-400" title="Accepted solution">
                              <FaCheck className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between mt-3">
                  <button
                    onClick={(e) => handleGoToFullThread(thread.id, e)}
                    className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  >
                    Go to full thread details
                  </button>
                  <button
                    onClick={() => setExpandedThread(null)}
                    className="px-3 py-2 bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f1f1f1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#4B5563' : '#c1c1c1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#6B7280' : '#a8a8a8'};
        }
        `
      }} />
    </div>
  );
}

export default ThreadList; 