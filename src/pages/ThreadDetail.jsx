import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FaThumbsUp, FaCheck, FaComment, FaArrowLeft, FaEye, FaRegThumbsUp } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { 
  getThread, 
  incrementThreadView, 
  voteOnThread, 
  addAnswer,
  voteOnAnswer,
  toggleAnswerAcceptance,
  hasUserVotedOnThread,
  hasUserVotedOnAnswer
} from '../services/forumService';

function ThreadDetail() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [thread, setThread] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answerContent, setAnswerContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [votingStatus, setVotingStatus] = useState({});
  const [userVotedOnThread, setUserVotedOnThread] = useState(false);
  const [userVotedAnswers, setUserVotedAnswers] = useState({});

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch thread data
  useEffect(() => {
    const fetchThread = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Increment view count
        await incrementThreadView(threadId);
        
        // Fetch thread data
        const threadData = await getThread(threadId);
        
        // Set thread and answers
        setThread({
          ...threadData,
          postedAt: threadData.createdAt ? new Date(threadData.createdAt.toDate()).toISOString() : new Date().toISOString()
        });
        
        // Format answers for display
        const formattedAnswers = threadData.answers?.map(answer => ({
          ...answer,
          postedAt: answer.createdAt ? new Date(answer.createdAt.toDate()).toISOString() : new Date().toISOString()
        })) || [];
        
        setAnswers(formattedAnswers);
      } catch (err) {
        console.error('Error fetching thread:', err);
        setError('Failed to load thread. It may have been deleted or you do not have permission to view it.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchThread();
  }, [threadId]);

  // Add a function to check if user has voted on thread and answers
  useEffect(() => {
    const checkUserVotes = async () => {
      if (!currentUser || !thread) return;
      
      try {
        // Check if user voted on thread
        const threadVoted = await hasUserVotedOnThread(threadId, currentUser.uid);
        setUserVotedOnThread(threadVoted);
        
        // Check if user voted on any answers
        const votedAnswersMap = {};
        for (const answer of answers) {
          const answerVoted = await hasUserVotedOnAnswer(answer.id, currentUser.uid);
          votedAnswersMap[answer.id] = answerVoted;
        }
        setUserVotedAnswers(votedAnswersMap);
      } catch (error) {
        console.error('Error checking user votes:', error);
      }
    };
    
    checkUserVotes();
  }, [currentUser, thread, answers, threadId]);

  // Function to format the posted time
  const formatPostedTime = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  // Function to get author display name
  const getAuthorName = (item) => {
    return item.authorName || item.author || 'Anonymous';
  };

  // Handle submitting a new answer
  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/thread/${threadId}#answer-form` } });
      return;
    }
    
    const answerText = answerContent.trim();
    if (!answerText) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare answer data
      const answerData = {
        content: answerText,
        authorName: currentUser.displayName || currentUser.email.split('@')[0] || 'Anonymous',
        authorEmail: currentUser.email,
        authorPhotoURL: currentUser.photoURL || null
      };
      
      // Add answer to Firebase
      const result = await addAnswer(threadId, answerData, currentUser.uid);
      
      // Update thread data
      setThread(prevThread => ({
        ...prevThread,
        answerCount: result.thread.answerCount,
        updatedAt: result.thread.updatedAt
      }));
      
      // Format the new answer for display
      const newAnswer = {
        ...result.answer,
        postedAt: new Date().toISOString(),
      };
      
      // Add the new answer to the answers list
      setAnswers(prevAnswers => [...prevAnswers, newAnswer]);
      
      // Reset form and submit state
      setAnswerContent('');
      
      // Scroll to the new answer
      setTimeout(() => {
        const answerElements = document.querySelectorAll('.answer-item');
        if (answerElements.length > 0) {
          answerElements[answerElements.length - 1].scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err) {
      console.error('Error adding answer:', err);
      alert("Error posting answer: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle voting on the thread
  const handleThreadVote = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/thread/${threadId}` } });
      return;
    }
    
    // Prevent double voting
    if (votingStatus.thread || userVotedOnThread) return;
    
    try {
      // Set voting status to prevent multiple clicks
      setVotingStatus(prev => ({ ...prev, thread: true }));
      
      // Update UI optimistically
      setThread(prevThread => ({
        ...prevThread,
        votes: (prevThread.votes || 0) + 1
      }));
      setUserVotedOnThread(true);
      
      // Call Firebase service with user ID
      const result = await voteOnThread(threadId, 'up', currentUser.uid);
      
      if (result.alreadyVoted) {
        // If the server says user already voted, keep the UI showing as voted
        // but don't increment the count again
        setThread(prevThread => ({
          ...prevThread,
          votes: result.updatedThread.votes
        }));
      } else {
        // Otherwise update with the actual result from the server
        setThread(prevThread => ({
          ...prevThread,
          votes: result.updatedThread.votes,
          updatedAt: result.updatedThread.updatedAt
        }));
      }
    } catch (error) {
      console.error('Error voting on thread:', error);
      // Revert the optimistic update
      setThread(prevThread => ({
        ...prevThread,
        votes: (prevThread.votes || 0) - 1
      }));
      setUserVotedOnThread(false);
      alert("Error voting: " + error.message);
    } finally {
      // Reset voting status after a delay
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, thread: false }));
      }, 1000);
    }
  };

  // Handle voting on an answer
  const handleAnswerVote = async (answerId) => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/thread/${threadId}` } });
      return;
    }
    
    // Prevent double voting
    if (votingStatus[answerId] || userVotedAnswers[answerId]) return;
    
    try {
      // Set voting status to prevent multiple clicks
      setVotingStatus(prev => ({ ...prev, [answerId]: true }));
      
      // Update UI optimistically
      setAnswers(prevAnswers => 
        prevAnswers.map(answer => 
          answer.id === answerId 
            ? { ...answer, votes: (answer.votes || 0) + 1 } 
            : answer
        )
      );
      setUserVotedAnswers(prev => ({ ...prev, [answerId]: true }));
      
      // Call Firebase service with user ID
      const result = await voteOnAnswer(answerId, 'up', currentUser.uid);
      
      if (result.alreadyVoted) {
        // If user already voted according to server, update UI to match server state
        if (result.updatedAnswer) {
          setAnswers(prevAnswers => 
            prevAnswers.map(answer => 
              answer.id === answerId 
                ? { ...answer, votes: result.updatedAnswer.votes } 
                : answer
            )
          );
        }
      }
    } catch (error) {
      console.error('Error voting on answer:', error);
      // Revert the optimistic update
      setAnswers(prevAnswers => 
        prevAnswers.map(answer => 
          answer.id === answerId 
            ? { ...answer, votes: (answer.votes || 0) - 1 } 
            : answer
        )
      );
      setUserVotedAnswers(prev => ({ ...prev, [answerId]: false }));
      alert("Error voting: " + error.message);
    } finally {
      // Reset voting status after a delay
      setTimeout(() => {
        setVotingStatus(prev => ({ ...prev, [answerId]: false }));
      }, 1000);
    }
  };

  // Handle accepting an answer
  const handleAcceptAnswer = async (answerId) => {
    if (!currentUser || !thread || currentUser.uid !== thread.authorId) {
      alert("Only the question author can mark an answer as accepted");
      return;
    }
    
    try {
      // Find the answer
      const answer = answers.find(a => a.id === answerId);
      
      if (!answer) {
        console.error('Answer not found:', answerId);
        return;
      }
      
      // Toggle the acceptance status
      const newAcceptedStatus = !answer.isAccepted;
      
      // Update Firebase
      await toggleAnswerAcceptance(threadId, answerId, newAcceptedStatus);
      
      // Update local state
      setAnswers(prevAnswers => 
        prevAnswers.map(a => {
          if (a.id === answerId) {
            return { ...a, isAccepted: newAcceptedStatus };
          }
          // If we're accepting a new answer, unaccept any others
          if (newAcceptedStatus && a.isAccepted) {
            return { ...a, isAccepted: false };
          }
          return a;
        })
      );
    } catch (error) {
      console.error('Error toggling answer acceptance:', error);
      alert("Error updating answer status: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-md dark:bg-red-900 dark:text-red-200">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error || "Thread not found"}</p>
          <button 
            onClick={() => navigate('/forum')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Return to forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/forum')}
          className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <FaArrowLeft className="mr-2" /> Back to Forum
        </button>
      </div>
      
      {/* Thread Question */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row">
            {/* Stats column */}
            <div className="flex flex-row md:flex-col items-center justify-between md:mr-6 md:space-y-4 mb-4 md:mb-0 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex flex-col items-center">
                <button 
                  className={`${
                    votingStatus.thread 
                      ? 'text-blue-500 cursor-not-allowed' 
                      : userVotedOnThread 
                        ? 'text-blue-500' 
                        : 'text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                  } p-1`}
                  onClick={handleThreadVote}
                  disabled={votingStatus.thread || userVotedOnThread}
                  title={userVotedOnThread ? "You already voted" : "Vote up"}
                >
                  {userVotedOnThread ? (
                    <FaThumbsUp className="h-5 w-5" />
                  ) : (
                    <FaRegThumbsUp className="h-5 w-5" />
                  )}
                </button>
                <div className="text-xl font-medium text-blue-600 dark:text-blue-400">{thread.votes || 0}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">votes</div>
              </div>
              
              <div className="text-center">
                <div className={`text-xl font-medium ${answers.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {answers.length}
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
              <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{thread.title}</h1>
              
              <div className="prose max-w-none dark:prose-invert dark:text-gray-300">
                {thread.content && thread.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-700 dark:text-gray-200">
                  {thread.category || 'Uncategorized'}
                </span>
                {thread.tags && thread.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Posted by <span className="font-medium dark:text-gray-300">{getAuthorName(thread)}</span> {formatPostedTime(thread.postedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Answers Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{answers.length} Answers</h2>
        
        {answers.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-md text-center dark:bg-gray-700">
            <p className="text-gray-600 dark:text-gray-300">No answers yet. Be the first to answer this question!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {answers.map(answer => (
              <div key={answer.id} className="answer-item bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
                <div className="px-6 py-4 relative">
                  {answer.isAccepted && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-green-100 text-green-800 rounded-bl-md dark:bg-green-900 dark:text-green-200">
                      <FaCheck className="inline mr-1" /> Accepted Answer
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row">
                    {/* Vote column */}
                    <div className="flex flex-row md:flex-col items-center md:mr-6 mb-4 md:mb-0">
                      <button 
                        className={`${
                          votingStatus[answer.id] 
                            ? 'text-blue-500 cursor-not-allowed' 
                            : userVotedAnswers[answer.id] 
                              ? 'text-blue-500' 
                              : 'text-gray-400 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
                        } p-1`}
                        onClick={() => handleAnswerVote(answer.id)}
                        disabled={votingStatus[answer.id] || userVotedAnswers[answer.id]}
                        title={userVotedAnswers[answer.id] ? "You already voted" : "Vote up"}
                      >
                        {userVotedAnswers[answer.id] ? (
                          <FaThumbsUp className="h-5 w-5" />
                        ) : (
                          <FaRegThumbsUp className="h-5 w-5" />
                        )}
                      </button>
                      <div className="text-xl font-medium text-blue-600 dark:text-blue-400 mx-2 md:mx-0 md:my-1">{answer.votes || 0}</div>
                      {currentUser && currentUser.uid === thread.authorId && (
                        <button 
                          className={`p-1 ${answer.isAccepted ? 'text-green-600 dark:text-green-400' : 'text-gray-400 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'}`}
                          onClick={() => handleAcceptAnswer(answer.id)}
                          title={answer.isAccepted ? "Unmark as accepted" : "Mark as accepted answer"}
                        >
                          <FaCheck className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    
                    {/* Content column */}
                    <div className="flex-1">
                      <div className="prose max-w-none dark:prose-invert dark:text-gray-300">
                        {answer.content && answer.content.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-4">{paragraph}</p>
                        ))}
                      </div>
                      
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Answered by <span className="font-medium dark:text-gray-300">{getAuthorName(answer)}</span> {formatPostedTime(answer.postedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Answer Form */}
      <div id="answer-form" className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800 dark:text-white">
            <FaComment className="mr-2" /> Your Answer
          </h2>
          
          {currentUser ? (
            <form onSubmit={handleAnswerSubmit}>
              <textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={6}
                placeholder="Type your answer here..."
                required
                disabled={isSubmitting}
              ></textarea>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center dark:bg-blue-700 dark:hover:bg-blue-800 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                    'Post Your Answer'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded-md dark:bg-gray-700">
              <p className="text-gray-600 mb-4 dark:text-gray-300">You need to be logged in to post an answer</p>
              <button
                onClick={() => navigate('/login', { state: { from: `/thread/${threadId}#answer-form` } })}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Log in to answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreadDetail; 