import React, { useState, useRef, useEffect, useContext } from 'react';
import { FaRegPaperPlane, FaTimes, FaTrashAlt, FaHistory, FaMicrophone } from 'react-icons/fa';
import { FaRobot, FaExpand, FaCompress, FaGithub } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../contexts/ChatContext';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import { TfiGithub } from "react-icons/tfi";


// Custom animated chatbot icon component
const AnimatedChatbotIcon = ({ isDarkMode }) => {
  return (
    <div className="relative h-12 w-12 flex items-center justify-center">
      {/* Chatbot Icon */}
      <div className={`absolute h-full w-full rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700 text-teal-400' : 'bg-teal-600 text-white'}`}>
        <TfiGithub className="text-xl" />
      </div>

      {/* Water Drop Waves */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`absolute h-full w-full rounded-full border-2 ${isDarkMode ? 'border-teal-400' : 'border-white'} opacity-0`}
          style={{
            animation: `wave 3s ease-out infinite`,
            animationDelay: `${i * 1}s`,
          }}
        />
      ))}

      {/* CSS for the animation */}
      <style>{`
        @keyframes wave {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Custom CSS for hiding scrollbars
const scrollbarHideStyles = {
  msOverflowStyle: 'none',  /* IE and Edge */
  scrollbarWidth: 'none',   /* Firefox */
};

const GeminiChatbot = () => {
  // Theme context
  const { currentTheme } = useTheme();
  const isDarkMode = currentTheme === THEMES.DARK || currentTheme === THEMES.BLUE || currentTheme === THEMES.GREEN || currentTheme === THEMES.PURPLE;

  // Add a global style for webkit scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // State management
  const [inputValue, setInputValue] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Chat context
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    isChatVisible,
    toggleChatVisibility,
    chatSessions,
    loadChatSession,
    currentSessionId,
    createNewSession
  } = useChat();

  // Theme colors based on light/dark mode
  const theme = isDarkMode ? {
    primary: 'bg-indigo-600',
    primaryHover: 'hover:bg-indigo-700',
    secondary: 'bg-purple-600',
    secondaryHover: 'hover:bg-purple-700',
    accent: 'bg-cyan-400',
    accentHover: 'hover:bg-cyan-500',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    border: 'border-cyan-400',
    userBubble: 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50',
    botBubble: 'bg-gray-800 text-cyan-100 shadow-lg shadow-gray-700/50',
    listeningIndicator: 'bg-pink-500 text-white shadow-lg shadow-pink-500/50',
    inputBg: 'bg-gray-900',
    chatBg: 'bg-gray-950',
    headerBg: 'bg-gradient-to-r from-indigo-900 to-purple-900',
    suggestionBg: 'bg-gray-800',
    suggestionHover: 'hover:bg-gray-700',
    suggestionText: 'text-cyan-200',
    suggestionBorder: 'border-cyan-400/30',
    sidebarBg: 'bg-gray-900',
    sidebarBorder: 'border-cyan-400/30'
  } : {
    primary: 'bg-indigo-500',
    primaryHover: 'hover:bg-indigo-600',
    secondary: 'bg-purple-500',
    secondaryHover: 'hover:bg-purple-600',
    accent: 'bg-cyan-500',
    accentHover: 'hover:bg-cyan-600',
    textPrimary: 'text-gray-800',
    textSecondary: 'text-gray-600',
    border: 'border-indigo-300',
    userBubble: 'bg-indigo-500 text-white shadow-sm shadow-indigo-200/50',
    botBubble: 'bg-white text-gray-800 shadow-sm shadow-gray-200/50 border border-gray-200',
    listeningIndicator: 'bg-pink-400 text-white shadow-sm shadow-pink-200/50',
    inputBg: 'bg-white',
    chatBg: 'bg-gray-50',
    headerBg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    suggestionBg: 'bg-white',
    suggestionHover: 'hover:bg-gray-100',
    suggestionText: 'text-indigo-600',
    suggestionBorder: 'border-indigo-200',
    sidebarBg: 'bg-gray-100',
    sidebarBorder: 'border-indigo-200'
  };

  // Categorized suggested questions
  const categorizedSuggestions = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I find issues that match my skills?",
          response: [
            { type: 'text', content: "Finding issues that match your skills is simple:", style: 'font-normal' },
            {
              type: 'list', items: [
                "Complete your profile with skills and interests",
                "Connect your GitHub account for better matching",
                "Visit the 'Personalized Issues' section",
                "Browse the AI-recommended issues tailored to your profile",
                "Use filters to refine by language, difficulty, or project type"
              ]
            },
            { type: 'text', content: "Our AI analyzes issue descriptions and your profile to find the best matches!" }
          ]
        },
        {
          question: "What is IssueAlliance?",
          response: [
            { type: 'text', content: "**IssueAlliance** is an open-source contribution matchmaker that:", style: 'font-medium' },
            {
              type: 'list', items: [
                "Connects developers with GitHub issues that match their skills",
                "Uses AI to analyze and recommend suitable open-source projects",
                "Helps maintainers find qualified contributors",
                "Provides analytics on contribution patterns and skill development",
                "Makes open-source contribution more accessible for developers of all levels"
              ]
            },
            { type: 'text', content: "Our mission is to strengthen the open-source ecosystem by creating meaningful connections between projects and contributors." }
          ]
        }
      ]
    },
    {
      category: "How It Works",
      questions: [
        {
          question: "How does the matching algorithm work?",
          response: [
            { type: 'text', content: "Our matching algorithm uses **Vertex AI** to analyze several factors:", style: 'font-normal' },
            {
              type: 'list', items: [
                "Your GitHub contribution history",
                "Languages and technologies you're proficient in",
                "Issue difficulty level (beginner/intermediate/advanced)",
                "Project popularity and activity",
                "Your stated interests and preferences"
              ]
            },
            { type: 'text', content: "The system continuously learns from your interactions to improve recommendations." }
          ]
        },
        {
          question: "How do I connect my GitHub account?",
          response: [
            { type: 'text', content: "To connect your GitHub account:", style: 'font-normal' },
            {
              type: 'list', items: [
                "Click the 'Connect GitHub' button in your dashboard",
                "Authorize IssueAlliance to access your public data",
                "Select the permissions you want to grant",
                "Our system will then analyze your profile and contributions"
              ]
            },
            { type: 'text', content: "We only request read-only access to public repositories unless you choose to grant additional permissions." }
          ]
        }
      ]
    },
    {
      category: "Features",
      questions: [
        {
          question: "Can I track my contributions?",
          response: [
            { type: 'text', content: "Yes! IssueAlliance offers comprehensive contribution tracking:", style: 'font-normal' },
            {
              type: 'list', items: [
                "View all your contributions across repositories",
                "Track pull requests status (open, merged, closed)",
                "See contribution statistics by project and language",
                "Generate contribution reports for your portfolio",
                "Earn badges and achievements based on contribution milestones"
              ]
            },
            { type: 'text', content: "Visit the 'My Contributions' tab in your dashboard to access these features." }
          ]
        },
        {
          question: "Is there a mobile app?",
          response: [
            { type: 'text', content: "Currently, IssueAlliance is available as:", style: 'font-normal' },
            {
              type: 'list', items: [
                "A responsive web application that works on mobile browsers",
                "A Progressive Web App (PWA) that can be installed on your device"
              ]
            },
            { type: 'text', content: "We're developing native mobile apps for iOS and Android, planned for release next quarter. You can join the beta program by visiting your account settings." }
          ]
        }
      ]
    },
    {
      category: "General Questions",
      questions: [
        {
          question: "What are good first issues?",
          response: [
            { type: 'text', content: "**Good First Issues**", style: 'font-bold text-lg' },
            { type: 'text', content: "Good first issues are GitHub issues specifically tagged to be approachable for newcomers to a project. They typically require minimal code changes and have clear instructions.", style: 'font-normal mt-2' },
            { type: 'text', content: "These issues are perfect starting points for beginners or anyone new to a particular project, as they help you understand the codebase and contribution workflow without being overwhelming.", style: 'font-normal mt-2' }
          ]
        },
        {
          question: "How do I make my first open source contribution?",
          response: [
            { type: 'text', content: "**Making Your First Open Source Contribution**", style: 'font-bold text-lg' },
            { type: 'text', content: "Here's how to make your first contribution:", style: 'font-medium mt-2' },
            {
              type: 'list', items: [
                "Find a project that interests you",
                "Read the contribution guidelines",
                "Look for issues labeled 'good first issue' or 'beginner-friendly'",
                "Fork the repository",
                "Make your changes in a new branch",
                "Test your changes",
                "Submit a pull request with a clear description",
                "Respond to any feedback from maintainers"
              ]
            },
            { type: 'text', content: "Remember, documentation improvements and bug reports are also valuable contributions!", style: 'font-normal mt-2 italic' }
          ]
        },
        {
          question: "What programming languages should I learn in 2025?",
          response: [
            { type: 'text', content: "**Top Programming Languages for 2025**", style: 'font-bold text-lg' },
            { type: 'text', content: "Here are the most valuable languages to learn:", style: 'font-medium mt-2' },
            {
              type: 'list', items: [
                "**Python** - Versatile for AI, data science, web development, and automation",
                "**JavaScript/TypeScript** - Essential for web development with React and Node.js",
                "**Rust** - For systems programming with memory safety",
                "**Go** - Efficient for backend services and cloud applications",
                "**Kotlin** - For Android and cross-platform development"
              ]
            },
            { type: 'text', content: "The best choice depends on your interests - web, mobile, AI, cloud, or systems programming all have different optimal languages.", style: 'font-normal mt-2' }
          ]
        }
      ]
    },

  ];

  // Flatten categorized suggestions for searching
  const suggestedQuestions = categorizedSuggestions.flatMap(category =>
    category.questions
  );

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert('Please enable microphone permissions in your browser settings');
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        }
      };
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Format message content with styles
  const formatMessageContent = (content) => {
    if (typeof content === 'string') return content;

    return content.map((item, index) => {
      if (item.type === 'text') {
        return (
          <span key={index} className={item.style}>
            {item.content}
          </span>
        );
      }
      if (item.type === 'list') {
        return (
          <ul key={index} className="list-disc pl-5 mt-1 space-y-1">
            {item.items.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        );
      }
      return null;
    });
  };

  // Render plain markdown text from Gemini AI responses
  const renderMarkdown = (text) => {
    if (!text || typeof text !== 'string') return null;

    // Try to detect accidental JSON responses and show a fallback
    const trimmed = text.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return <span>Sorry, I had a formatting issue. Please try again.</span>;
    }

    const lines = text.split('\n');
    const elements = [];
    let listBuffer = [];
    let orderedBuffer = [];

    const flushUnordered = (key) => {
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-1 space-y-0.5">
            {listBuffer.map((li, i) => <li key={i} className="text-sm">{applyInline(li)}</li>)}
          </ul>
        );
        listBuffer = [];
      }
    };

    const flushOrdered = (key) => {
      if (orderedBuffer.length > 0) {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal pl-5 my-1 space-y-0.5">
            {orderedBuffer.map((li, i) => <li key={i} className="text-sm">{applyInline(li)}</li>)}
          </ol>
        );
        orderedBuffer = [];
      }
    };

    const applyInline = (str) => {
      // Bold **text** or __text__
      const parts = str.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
      return parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part) || /^__[^_]+__$/.test(part)) {
          const inner = part.replace(/^\*\*|\*\*$|^__|__$/g, '');
          return <strong key={i}>{inner}</strong>;
        }
        // Italic *text* or _text_
        if (/^\*[^*]+\*$/.test(part) || /^_[^_]+_$/.test(part)) {
          const inner = part.replace(/^\*|\*$|^_|_$/g, '');
          return <em key={i}>{inner}</em>;
        }
        return part;
      });
    };

    lines.forEach((line, idx) => {
      const unorderedMatch = line.match(/^[-*•]\s+(.*)/);
      const orderedMatch = line.match(/^\d+\.\s+(.*)/);
      const headingMatch = line.match(/^#{1,3}\s+(.*)/);
      const isBlank = line.trim() === '';

      if (unorderedMatch) {
        flushOrdered(idx);
        listBuffer.push(unorderedMatch[1]);
      } else if (orderedMatch) {
        flushUnordered(idx);
        orderedBuffer.push(orderedMatch[1]);
      } else {
        flushUnordered(idx);
        flushOrdered(idx);
        if (isBlank) {
          // skip extra blank lines but allow spacing via margins on paragraphs
        } else if (headingMatch) {
          elements.push(
            <p key={idx} className={`font-semibold mt-2 mb-1 text-sm ${isDarkMode ? 'text-cyan-300' : 'text-indigo-700'}`}>
              {applyInline(headingMatch[1])}
            </p>
          );
        } else {
          elements.push(
            <p key={idx} className="text-sm mb-1">{applyInline(line)}</p>
          );
        }
      }
    });

    flushUnordered('end');
    flushOrdered('end');

    return <div className="space-y-0.5">{elements}</div>;
  };

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!speechSupported) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Speech recognition start failed:', error);
        alert('Please allow microphone access to use speech recognition');
      }
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value === '');
  };

  // Handle suggestion selection
  const handleSuggestionClick = (question) => {
    // Send message directly instead of just filling the input
    handleSendMessageWithContent(question);
  };

  // Send message with content parameter
  const handleSendMessageWithContent = async (content) => {
    const messageContent = content || inputValue.trim();

    if (!messageContent) return;

    const matchedQuestion = suggestedQuestions.find(
      q => q.question.toLowerCase() === messageContent.toLowerCase().trim()
    );

    setIsBotTyping(true);

    if (matchedQuestion) {
      await sendMessage(messageContent, matchedQuestion.response);
    } else {
      // For unmatched questions, let the AI generate a response
      await sendMessage(messageContent);
    }

    setInputValue('');
    setShowSuggestions(false);
    setIsBotTyping(false);
  };

  // Send message handler
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    handleSendMessageWithContent();
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isChatVisible && !isFullscreen) return;

      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }

      if (e.altKey && e.key === 'f' && !isFullscreen) {
        setIsFullscreen(true);
        e.preventDefault();
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        handleSendMessage();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isChatVisible, inputValue]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Toggle chat history
  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
  };

  // Load chat session 
  const handleSelectSession = (sessionId) => {
    loadChatSession(sessionId);
    setShowChatHistory(false);
  };

  // Create new chat
  const handleNewChat = () => {
    createNewSession();
    setShowChatHistory(false);
  };

  return (
    <div className="relative z-50">
      {/* Chatbot Button */}
      <button
        onClick={toggleChatVisibility}
        className="fixed bottom-24 md:bottom-6 right-6 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
        aria-label="Open Chat"
      >
        <AnimatedChatbotIcon isDarkMode={isDarkMode} />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {(isChatVisible || isFullscreen) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`fixed ${isFullscreen ? 'inset-0' : 'bottom-36 md:bottom-20 right-6 w-96 h-[600px]'
              } flex flex-col rounded-lg shadow-2xl overflow-hidden z-30 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
          >
            {/* Chat Header */}
            <div className={`p-3 flex justify-between items-center ${isDarkMode ? 'bg-gray-900' : 'bg-teal-600'}`}>
              <div className="flex items-center space-x-2">
                <TfiGithub className="text-white" />
                <h3 className="font-semibold text-white">AI Assistant</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="text-white p-1 rounded hover:bg-opacity-20 hover:bg-white"
                  aria-label={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
                <button
                  onClick={clearMessages}
                  className="text-white p-1 rounded hover:bg-opacity-20 hover:bg-white"
                  aria-label="Clear Chat"
                >
                  <FaTrashAlt />
                </button>
                <button
                  onClick={toggleChatHistory}
                  className="text-white p-1 rounded hover:bg-opacity-20 hover:bg-white"
                  aria-label="Chat History"
                >
                  <FaHistory />
                </button>
                <button
                  onClick={toggleChatVisibility}
                  className="text-white p-1 rounded hover:bg-opacity-20 hover:bg-white"
                  aria-label="Close Chat"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Chat History Panel */}
            {showChatHistory && (
              <motion.div
                className={`absolute top-12 right-0 left-0 bottom-0 z-10 ${theme.sidebarBg} border-l ${theme.sidebarBorder} shadow-xl p-4 overflow-y-auto`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-cyan-200' : 'text-indigo-600'}`}>Chat History</h3>
                  <button
                    onClick={toggleChatHistory}
                    className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                    aria-label="Close History"
                  >
                    <FaTimes />
                  </button>
                </div>

                <button
                  onClick={handleNewChat}
                  className={`w-full mb-4 flex items-center justify-center space-x-2 p-2 rounded-lg ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'} transition-colors`}
                >
                  <span>New Chat</span>
                </button>

                <div className="space-y-2">
                  {chatSessions.length === 0 ? (
                    <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No previous chats found
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <motion.div
                        key={session.id}
                        onClick={() => handleSelectSession(session.id)}
                        className={`p-3 rounded-lg cursor-pointer border ${session.id === currentSessionId
                          ? (isDarkMode ? 'bg-gray-700 border-cyan-500' : 'bg-indigo-50 border-indigo-300')
                          : (isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50')
                          }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div className={`font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {session.title || 'Untitled Chat'}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {session.messageCount || 0} message{session.messageCount !== 1 ? 's' : ''}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {session.lastUpdated
                              ? new Date(session.lastUpdated).toLocaleDateString()
                              : new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* Message Container */}
            <div
              ref={chatContainerRef}
              className={`flex-1 overflow-y-auto p-4 hide-scrollbar`}
              style={scrollbarHideStyles}
            >
              {messages.length === 0 ? (
                <motion.div
                  className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-10`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p>Hi there! I'm IssueAlliance AI. I can help with project-related questions or answer general programming and development questions. What would you like to know?</p>

                  {/* Multiple categories of recommendations */}
                  <div className="mt-6 space-y-6">
                    {categorizedSuggestions.map((category, categoryIndex) => (
                      <div key={categoryIndex} className="space-y-2">
                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{category.category}</h3>
                        <div className="overflow-x-auto hide-scrollbar" style={scrollbarHideStyles}>
                          <div className="flex space-x-3 min-w-max px-2 pb-1">
                            {category.questions.map((item, index) => (
                              <motion.button
                                key={index}
                                onClick={() => handleSuggestionClick(item.question)}
                                className={`flex-shrink-0 px-4 py-3 ${theme.suggestionBg} rounded-lg text-sm ${theme.suggestionHover} transition-all ${theme.suggestionText} border ${theme.suggestionBorder} whitespace-nowrap`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {item.question}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'
                        }`}
                    >
                      <motion.div
                        className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${message.sender === 'user'
                          ? theme.userBubble
                          : theme.botBubble
                          }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="break-words text-sm">
                          {message.sender === 'bot' && message.isFormatted ? (
                            // For formatted messages (from predefined responses)
                            formatMessageContent(message.text)
                          ) : message.sender === 'bot' ? (
                            // All AI-generated responses rendered with markdown support
                            renderMarkdown(message.text)
                          ) : (
                            // User messages — plain text
                            <span className="whitespace-pre-wrap">{message.text}</span>
                          )}
                        </div>
                        <motion.span
                          className="text-xs opacity-70 block mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.7 }}
                          transition={{ delay: 0.3 }}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {(isLoading || isBotTyping) && (
                <motion.div
                  className="text-left mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className={`inline-block max-w-[80%] px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-cyan-200' : 'bg-white text-indigo-500 border border-gray-200'} rounded-tl-none`}>
                    <div className="flex space-x-1">
                      <motion.div
                        className={`h-2 w-2 ${isDarkMode ? 'bg-cyan-400' : 'bg-indigo-400'} rounded-full`}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1, repeatDelay: 0.2 }}
                      />
                      <motion.div
                        className={`h-2 w-2 ${isDarkMode ? 'bg-cyan-400' : 'bg-indigo-400'} rounded-full`}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2, repeatDelay: 0.2 }}
                      />
                      <motion.div
                        className={`h-2 w-2 ${isDarkMode ? 'bg-cyan-400' : 'bg-indigo-400'} rounded-full`}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4, repeatDelay: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Categorized horizontal scroll recommendations after messages */}
              {messages.length > 0 && !isLoading && !isBotTyping && (
                <motion.div
                  className="mt-4 space-y-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {categorizedSuggestions.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="space-y-1">
                      <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{category.category}</h3>
                      <div className="overflow-x-auto hide-scrollbar" style={scrollbarHideStyles}>
                        <div className="flex space-x-3 min-w-max px-2 pb-1">
                          {category.questions.map((item, index) => (
                            <motion.button
                              key={index}
                              onClick={() => handleSuggestionClick(item.question)}
                              className={`flex-shrink-0 px-3 py-2 ${theme.suggestionBg} rounded-lg text-xs ${theme.suggestionHover} transition-all ${theme.suggestionText} border ${theme.suggestionBorder} whitespace-nowrap`}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {item.question}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input area with speech recognition */}
            <div className={`relative border-t ${theme.border}`}>
              {showSuggestions && inputValue === '' && (
                <motion.div
                  className={`absolute bottom-full left-0 right-0 ${theme.suggestionBg} border ${theme.border} rounded-t-lg shadow-lg max-h-60 overflow-y-auto`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className={`p-2 text-xs ${isDarkMode ? 'text-cyan-300' : 'text-indigo-600'} font-medium`}>Try asking about IssueAlliance:</div>
                  {suggestedQuestions.map((item, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleSuggestionClick(item.question)}
                      className={`w-full text-left p-2 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-all text-sm ${isDarkMode ? 'text-cyan-100' : 'text-indigo-600'}`}
                      whileHover={{ backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(243, 244, 246, 1)' }}
                    >
                      {item.question}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              <div className={`flex items-center p-3 space-x-2 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
                {/* Voice button - separated from input group */}
                {speechSupported && (
                  <motion.button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`p-3 rounded-full ${isListening ? theme.listeningIndicator : (isDarkMode ? 'bg-gray-800 text-cyan-300' : 'bg-gray-100 text-indigo-500')} hover:opacity-90 transition-all flex-shrink-0`}
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaMicrophone className={isListening ? 'animate-pulse' : ''} />
                  </motion.button>
                )}

                {/* Input and send button group */}
                <div className="flex flex-1 items-center">
                  <motion.input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`flex-1 border ${theme.border} ${theme.inputBg} rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-cyan-400 text-gray-100' : 'focus:ring-indigo-400 text-gray-800'}`}
                    placeholder="Ask about IssueAlliance..."
                    disabled={isLoading}
                    whileFocus={{ borderColor: isDarkMode ? '#22d3ee' : '#818cf8' }}
                  />

                  <motion.button
                    type="submit"
                    onClick={handleSendMessage}
                    className={`p-3 rounded-r-lg bg-gradient-to-br ${isDarkMode ? 'from-cyan-400 to-indigo-600' : 'from-indigo-500 to-purple-500'} text-white hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0`}
                    disabled={!inputValue.trim() || isLoading}
                    whileHover={{ scale: !inputValue.trim() || isLoading ? 1 : 1.05 }}
                    whileTap={{ scale: !inputValue.trim() || isLoading ? 1 : 0.95 }}
                  >
                    <FaRegPaperPlane />
                  </motion.button>
                </div>
              </div>

              {isListening && (
                <motion.div
                  className="absolute -top-8 left-0 right-0 text-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="inline-flex items-center bg-pink-500 text-white text-xs px-2 py-1 rounded shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                    Listening... Speak now
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GeminiChatbot;