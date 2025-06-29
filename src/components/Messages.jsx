import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, FaTrash, FaStar, FaRegStar, FaArchive, FaReply, 
  FaFilter, FaSpinner, FaEnvelope, FaEnvelopeOpen, FaUser, 
  FaPaperPlane, FaCheck, FaEllipsisV
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  collection, addDoc, getDocs, query, where, orderBy, doc, 
  updateDoc, deleteDoc, Timestamp, onSnapshot, limit, getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Messages() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [messageActionsOpen, setMessageActionsOpen] = useState(null);
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    message: '',
  });
  
  const messageEndRef = useRef(null);
  const replyInputRef = useRef(null);
  const actionsMenuRef = useRef(null);
  
  // Get theme from the global context instead of maintaining local state
  const { currentTheme } = useTheme();
  const darkMode = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';
  
  // Close actions menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setMessageActionsOpen(null);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // ValidateRecipient component definition
  const ValidateRecipient = ({ recipient }) => {
    const [validationStatus, setValidationStatus] = useState('checking');
    const [validatedUser, setValidatedUser] = useState(null);
    
    useEffect(() => {
      // Reset validation when recipient changes
      setValidationStatus('checking');
      setValidatedUser(null);
      
      // Don't check short inputs
      if (recipient.length < 3) {
        setValidationStatus('too_short');
        return;
      }
      
      const checkRecipient = async () => {
        try {
          // If it's an email
          if (recipient.includes('@')) {
            // Look for users with this email
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', recipient), limit(1));
            const userSnapshot = await getDocs(q);
            
            if (!userSnapshot.empty) {
              // User found
              const userData = userSnapshot.docs[0].data();
              setValidatedUser({
                id: userSnapshot.docs[0].id,
                name: userData.displayName || recipient.split('@')[0],
                email: userData.email || recipient
              });
              setValidationStatus('valid');
            } else {
              // User not found, but email is valid
              setValidationStatus('email_not_registered');
            }
          } else {
            // If it's a user ID
            const userRef = doc(db, 'users', recipient);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              setValidatedUser({
                id: recipient,
                name: userData.displayName || recipient,
                email: userData.email || recipient
              });
              setValidationStatus('valid');
            } else {
              setValidationStatus('user_not_found');
            }
          }
        } catch (error) {
          console.error("Error validating recipient:", error);
          setValidationStatus('error');
        }
      };
      
      // Use debounce to avoid too many checks
      const timer = setTimeout(() => {
        checkRecipient();
      }, 500);
      
      return () => clearTimeout(timer);
    }, [recipient]);
    
    // Render appropriate message based on validation status
    if (validationStatus === 'checking' || validationStatus === 'too_short') {
      return null;
    }
    
    if (validationStatus === 'valid' && validatedUser) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'} border rounded-lg flex items-center`}
        >
          <span className={`w-6 h-6 ${darkMode ? 'bg-green-800' : 'bg-green-100'} rounded-full flex items-center justify-center mr-2`}>
            <FaCheck className={`${darkMode ? 'text-green-400' : 'text-green-600'} text-xs`} />
          </span>
          <div>
            <span className={`${darkMode ? 'text-green-300' : 'text-green-800'} text-sm font-medium`}>
              {validatedUser.name}
            </span>
            <span className={`${darkMode ? 'text-green-400' : 'text-green-600'} text-xs ml-1`}>
              ({validatedUser.email})
            </span>
          </div>
        </motion.div>
      );
    }
    
    if (validationStatus === 'email_not_registered') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 ${darkMode ? 'bg-yellow-900 border-yellow-800' : 'bg-yellow-50 border-yellow-200'} border rounded-lg`}
        >
          <p className={`${darkMode ? 'text-yellow-300' : 'text-yellow-800'} text-sm`}>
            This email is not registered in the system. We'll send them a notification anyway.
          </p>
        </motion.div>
      );
    }
    
    if (validationStatus === 'user_not_found') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 ${darkMode ? 'bg-red-900 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg`}
        >
          <p className={`${darkMode ? 'text-red-300' : 'text-red-800'} text-sm`}>
            No user found with this ID. Please check and try again.
          </p>
        </motion.div>
      );
    }
    
    if (validationStatus === 'error') {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 ${darkMode ? 'bg-red-900 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg`}
        >
          <p className={`${darkMode ? 'text-red-300' : 'text-red-800'} text-sm`}>
            Error checking recipient. Please try again.
          </p>
        </motion.div>
      );
    }
    
    return null;
  };
  
  // Fetch messages from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    const messagesRef = collection(db, 'messages');
    
    // Create array of possible recipient IDs based on the current user's email
    const possibleRecipientIds = [
      currentUser.uid,
      `email-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '-')}` // For email-based messaging
    ];
    
    // Query messages where either:
    // 1. The user is in the participants array, OR
    // 2. The recipient is a synthetic email ID based on the user's email
    const q = query(
      messagesRef,
      where('participants', 'array-contains-any', possibleRecipientIds),
      orderBy('timestamp', 'desc')
    );
    
    // Set up real-time listener
    let unsubscribe;
    let retryCount = 0;
    const maxRetries = 5;
    const retryDelay = 3000; // 3 seconds
    
    const setupListener = () => {
      try {
        // Clear any previous error state
        setError('');
        
        unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedMessages = [];
          querySnapshot.forEach((doc) => {
            fetchedMessages.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate(),
            });
          });
          
          setMessages(fetchedMessages);
          setLoading(false);
          
          // If there are messages and none is selected, select the first one
          if (fetchedMessages.length > 0 && !selectedMessage) {
            setSelectedMessage(fetchedMessages[0]);
          }
          
          // Reset retry count on successful connection
          retryCount = 0;
        }, (error) => {
          console.error("Error fetching messages:", error);
          
          // Check if it's a network-related error
          if (error.code === 'unavailable' || error.message.includes('network') || error.message.includes('jd')) {
            setError("Network issue detected. Messages may not update in real-time.");
            
            // Retry logic for network errors
            if (retryCount < maxRetries && navigator.onLine) {
              retryCount++;
              console.log(`Retrying connection (${retryCount}/${maxRetries}) in ${retryDelay/1000}s...`);
              
              setTimeout(() => {
                if (unsubscribe) {
                  unsubscribe();
                }
                setupListener();
              }, retryDelay);
            } else if (!navigator.onLine) {
              setError("You appear to be offline. Please check your connection.");
              setLoading(false);
            } else {
              setError("Failed to connect after multiple attempts. Please refresh the page.");
              setLoading(false);
            }
          } else {
            setError("Failed to load messages. Please try again later.");
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error setting up messages listener:", err);
        setError("Failed to initialize messages. Please refresh the page.");
        setLoading(false);
      }
    };
    
    setupListener();
    
    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser]);
  
  // Scroll to bottom of message thread when a new reply is added
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMessage]);
  
  // Mark message as read when selected
  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead && selectedMessage.recipient === currentUser.uid) {
      markAsRead(selectedMessage.id);
    }
  }, [selectedMessage, currentUser]);
  
  // Handle selecting a message
  const handleSelectMessage = (message) => {
    // Mark as read when selected
    if (!message.isRead) {
      const updatedMessages = messages.map(m => 
        m.id === message.id ? { ...m, isRead: true } : m
      );
      setMessages(updatedMessages);
    }
    setSelectedMessage(message);
    // Focus on reply input when selecting a message
    setTimeout(() => {
      if (replyInputRef.current) {
        replyInputRef.current.focus();
      }
    }, 300);
  };
  
  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isRead: true
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };
  
  // Toggle star status
  const handleToggleStar = async (messageId) => {
    try {
      const messageToUpdate = messages.find(msg => msg.id === messageId);
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isStarred: !messageToUpdate.isStarred
      });
    } catch (error) {
      console.error("Error toggling star:", error);
      setError("Failed to update message. Please try again.");
    }
    
    // Update selected message if it's the one being starred/unstarred
    if (selectedMessage && selectedMessage.id === messageId) {
      setSelectedMessage({
        ...selectedMessage,
        isStarred: !selectedMessage.isStarred
      });
    }
  };
  
  // Archive message
  const handleArchive = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        isArchived: !messages.find(msg => msg.id === messageId).isArchived
      });
      
      // Update or clear selected message
      if (selectedMessage && selectedMessage.id === messageId) {
        if (activeFilter !== 'all' && activeFilter !== 'archived') {
          setSelectedMessage(null);
        } else {
          setSelectedMessage({
            ...selectedMessage,
            isArchived: !selectedMessage.isArchived
          });
        }
      }
    } catch (error) {
      console.error("Error archiving message:", error);
      setError("Failed to archive message. Please try again.");
    }
  };
  
  // Delete message with confirmation dialog
  const handleDelete = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      try {
        const messageRef = doc(db, 'messages', messageId);
        await deleteDoc(messageRef);
        
        // Clear selected message if it's the one being deleted
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(null);
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        setError("Failed to delete message. Please try again.");
      }
    }
  };
  
  // Send reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    
    if (!replyText.trim() || !selectedMessage) return;
    
    try {
      setSending(true);
      setError('');
      
      // Create a new reply message
      const reply = {
        subject: `Re: ${selectedMessage.subject}`,
        message: replyText.trim(),
        sender: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderEmail: currentUser.email,
        recipient: selectedMessage.sender === currentUser.uid ? selectedMessage.recipient : selectedMessage.sender,
        recipientName: selectedMessage.sender === currentUser.uid 
          ? selectedMessage.recipientName 
          : selectedMessage.senderName,
        recipientEmail: selectedMessage.sender === currentUser.uid
          ? selectedMessage.recipientEmail
          : selectedMessage.senderEmail,
        timestamp: Timestamp.now(),
        isRead: false,
        isStarred: false,
        isArchived: false,
        parentMessageId: selectedMessage.id,
        participants: [currentUser.uid, selectedMessage.sender === currentUser.uid ? selectedMessage.recipient : selectedMessage.sender]
      };
      
      await addDoc(collection(db, 'messages'), reply);
      
      setReplyText('');
      setSending(false);
    } catch (error) {
      console.error("Error sending reply:", error);
      setError("Failed to send reply. Please try again.");
      setSending(false);
    }
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    
    const today = new Date();
    const messageDate = new Date(date);
    
    // Check if the message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if the message is from this year
    if (messageDate.getFullYear() === today.getFullYear()) {
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // If the message is from a previous year
    return messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Filter messages based on search query and active filter
  const filteredMessages = messages.filter(message => {
    // Search filter
    const matchesSearch = 
      (message.senderName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (message.recipientName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesFilter = true;
    if (activeFilter === 'unread') matchesFilter = !message.isRead;
    else if (activeFilter === 'starred') matchesFilter = message.isStarred;
    else if (activeFilter === 'archived') matchesFilter = message.isArchived;
    else if (activeFilter === 'all') matchesFilter = !message.isArchived;
    
    return matchesSearch && matchesFilter;
  });
  
  // Handle URL query parameters for pre-filling the compose form
  useEffect(() => {
    if (!currentUser) return;
    
    // Check if URL has query parameters for composing a message
    const queryParams = new URLSearchParams(window.location.search);
    const recipient = queryParams.get('recipient');
    const recipientName = queryParams.get('recipientName');
    const subject = queryParams.get('subject');
    
    // If we have query parameters, open the compose modal with pre-filled fields
    if (recipient) {
      setNewMessage({
        recipient: recipient,
        subject: subject || '',
        message: recipientName ? `Hello ${recipientName},\n\n` : '',
      });
      setShowComposeModal(true);
      
      // Clear the query parameters from the URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser]);
  
  const handleComposeChange = (e) => {
    const { name, value } = e.target;
    setNewMessage(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const sendNewMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.recipient.trim() || !newMessage.subject.trim() || !newMessage.message.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    try {
      setSending(true);
      setError('');
      
      let recipientUid, recipientName, recipientEmail;
      
      // Check if the recipient is an email address
      if (newMessage.recipient.includes('@')) {
        recipientEmail = newMessage.recipient;
        recipientName = recipientEmail.split('@')[0]; // Use part before @ as name
        
        // Create a synthetic ID based on email
        recipientUid = `email-${recipientEmail.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        // Check for existing user with this email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', recipientEmail), limit(1));
        const userSnapshot = await getDocs(q);
        
        if (!userSnapshot.empty) {
          // If the user exists, use their actual UID
          const userData = userSnapshot.docs[0].data();
          recipientUid = userSnapshot.docs[0].id;
          recipientName = userData.displayName || recipientName;
        }
      } else {
        // Assume it's a user ID
        recipientUid = newMessage.recipient;
        
        // Try to fetch user info for this ID
        try {
          const userRef = doc(db, 'users', recipientUid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            recipientName = userData.displayName || recipientUid;
            recipientEmail = userData.email || recipientUid;
          } else {
            recipientName = recipientUid;
            recipientEmail = recipientUid;
          }
        } catch (err) {
          console.error("Error fetching recipient info:", err);
          recipientName = recipientUid;
          recipientEmail = recipientUid;
        }
      }
      
      const messageData = {
        subject: newMessage.subject.trim(),
        message: newMessage.message.trim(),
        sender: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderEmail: currentUser.email,
        recipient: recipientUid,
        recipientName: recipientName,
        recipientEmail: recipientEmail,
        timestamp: Timestamp.now(),
        isRead: false,
        isStarred: false,
        isArchived: false,
        participants: [currentUser.uid, recipientUid]
      };
      
      // Add message to Firestore
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      // Add the message to the local state for immediate display
      const newMessageWithId = {
        id: docRef.id,
        ...messageData,
        timestamp: messageData.timestamp.toDate()
      };
      
      setMessages([newMessageWithId, ...messages]);
      
      // Store notification for recipient
      await addDoc(collection(db, 'notifications'), {
        type: 'new_message',
        messageId: docRef.id,
        recipientId: recipientUid,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        subject: newMessage.subject.trim(),
        timestamp: Timestamp.now(),
        read: false,
        recipientEmail: recipientEmail
      });
      
      // Show success notification with subtle animation
      const successToast = document.createElement('div');
      successToast.className = `fixed bottom-4 right-4 bg-${darkMode ? 'green-800' : 'green-500'} text-white p-3 rounded-lg shadow-lg z-50 flex items-center`;
      successToast.innerHTML = `
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        Message sent successfully!
      `;
      document.body.appendChild(successToast);
      setTimeout(() => {
        successToast.style.opacity = '0';
        successToast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          document.body.removeChild(successToast);
        }, 500);
      }, 3000);
      
      setNewMessage({
        recipient: '',
        subject: '',
        message: '',
      });
      setShowComposeModal(false);
      setSending(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setError(`Failed to send message: ${error.message || "Please try again."}`);
      setSending(false);
    }
  };
  
  // Add some sample messages if none exist
  useEffect(() => {
    if (!currentUser) return;
    
    // Only add sample data if no messages exist
    const checkAndAddSampleData = async () => {
      try {
        const messagesRef = collection(db, 'messages');
        const q = query(
          messagesRef,
          where('participants', 'array-contains', currentUser.uid),
          limit(1)
        );
        
        const snapshot = await getDocs(q);
        
        // If no messages exist, add sample data
        if (snapshot.empty) {
          console.log("Adding sample messages");
          
          // Sample users to simulate conversations
          const sampleUsers = [
            { id: 'sample-user-1', name: 'John Doe', email: 'john@example.com' },
            { id: 'sample-user-2', name: 'Sarah Johnson', email: 'sarah@example.com' },
            { id: 'sample-user-3', name: 'Michael Wong', email: 'michael@example.com' },
          ];
          
          // Sample messages
          const sampleMessages = [
            {
              subject: 'Question about your React project',
              message: `Hi there,\n\nI came across your React project on GitHub and I'm interested in contributing. Could you tell me more about the features you're planning to implement?\n\nI have experience with React hooks and context API, and I'd love to work on some frontend components.\n\nLooking forward to your response,\nJohn`,
              sender: sampleUsers[0].id,
              senderName: sampleUsers[0].name,
              senderEmail: sampleUsers[0].email,
              recipient: currentUser.uid,
              recipientName: currentUser.displayName || currentUser.email,
              recipientEmail: currentUser.email,
              timestamp: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
              isRead: false,
              isStarred: false,
              isArchived: false,
              participants: [sampleUsers[0].id, currentUser.uid]
            },
            {
              subject: 'Backend API collaboration opportunity',
              message: `Hello,\n\nI noticed your project needs API integration. I'm a backend developer with experience in Node.js and Express, and I'd be interested in contributing to your open-source project.\n\nI've implemented authentication systems and RESTful APIs for several projects. Let me know if you'd like to discuss this further.\n\nBest regards,\nSarah`,
              sender: sampleUsers[1].id,
              senderName: sampleUsers[1].name,
              senderEmail: sampleUsers[1].email,
              recipient: currentUser.uid,
              recipientName: currentUser.displayName || currentUser.email,
              recipientEmail: currentUser.email,
              timestamp: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
              isRead: true,
              isStarred: true,
              isArchived: false,
              participants: [sampleUsers[1].id, currentUser.uid]
            },
            {
              subject: 'Bug report: login page issue',
              message: `Hello,\n\nI've been testing your application and found an issue with the login page. When using Safari on iOS, the form submission doesn't work correctly.\n\nI'd be happy to fix this bug if you're interested. I can reproduce the issue consistently and have some ideas about what might be causing it.\n\nLet me know how you'd like to proceed.\n\nBest,\nMichael`,
              sender: sampleUsers[2].id,
              senderName: sampleUsers[2].name,
              senderEmail: sampleUsers[2].email,
              recipient: currentUser.uid,
              recipientName: currentUser.displayName || currentUser.email,
              recipientEmail: currentUser.email,
              timestamp: Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)), // 7 days ago
              isRead: true,
              isStarred: false,
              isArchived: false,
              participants: [sampleUsers[2].id, currentUser.uid]
            }
          ];
          
          // Add sample messages to Firestore
          for (const message of sampleMessages) {
            await addDoc(collection(db, 'messages'), message);
          }
        }
      } catch (error) {
        console.error("Error adding sample messages:", error);
      }
    };
    
    checkAndAddSampleData();
  }, [currentUser]);
  
  // Loading state
  if (loading) {
    return (
      <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} rounded-xl shadow-md overflow-hidden p-6 transition-all duration-300`}>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className={`animate-spin ${darkMode ? 'text-blue-400' : 'text-blue-600'} w-8 h-8`} />
        </div>
      </div>
    );
  }
  
  // Empty message state component
  const EmptyState = ({ type, searchActive }) => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      {type === 'list' ? (
        <>
          <FaEnvelope className={`w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-3`} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No{searchActive ? 'matching messages found' : 'messages'}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 max-w-xs`}>
            {searchActive ? 'Try using different keywords or filters' : 'Your inbox is empty. Send a message to get started!'}
          </p>
          {!searchActive && (
            <button 
              onClick={() => setShowComposeModal(true)}
              className={`mt-4 px-4 py-2 rounded-lg ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              Compose a message
            </button>
          )}
        </>
      ) : (
        <>
          <FaEnvelopeOpen className={`w-12 h-12 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mb-3`} />
          <h3 className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Select a message
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 max-w-xs`}>
            Choose a message from the list to view its contents
          </p>
        </>
      )}
    </div>
  );
  
  return (
    <div className={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} min-h-screen transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Messages</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowComposeModal(true)}
              className={`px-4 py-2 rounded-lg flex items-center ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
            >
              <FaPaperPlane className="mr-2" /> Compose
            </button>
          </div>
        </div>
        
        {error && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'} flex items-center`}>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          {/* Message List Panel */}
          <div className={`md:col-span-1 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden`}>
            <div className="p-4 border-b border-opacity-20 border-gray-300">
              <div className={`relative flex items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-2`}>
                <FaSearch className={`absolute left-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:outline-none rounded-lg`}
                />
              </div>
            </div>
            
            <div className={`flex ${darkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b border-opacity-20 border-gray-300`}>
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 py-2 text-center text-sm font-medium ${
                  activeFilter === 'all' 
                    ? `${darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600'} border-b-2 border-blue-500` 
                    : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`flex-1 py-2 text-center text-sm font-medium ${
                  activeFilter === 'unread' 
                    ? `${darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600'} border-b-2 border-blue-500` 
                    : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setActiveFilter('starred')}
                className={`flex-1 py-2 text-center text-sm font-medium ${
                  activeFilter === 'starred' 
                    ? `${darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600'} border-b-2 border-blue-500` 
                    : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                Starred
              </button>
              <button
                onClick={() => setActiveFilter('archived')}
                className={`flex-1 py-2 text-center text-sm font-medium ${
                  activeFilter === 'archived' 
                    ? `${darkMode ? 'bg-gray-700 text-blue-400' : 'bg-white text-blue-600'} border-b-2 border-blue-500` 
                    : `${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                Archived
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              {filteredMessages.length === 0 ? (
                <EmptyState type="list" searchActive={searchQuery.length > 0} />
              ) : (
                filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-3 border-b border-opacity-10 ${darkMode ? 'border-gray-700' : 'border-gray-200'} cursor-pointer transition-colors ${
                      selectedMessage?.id === message.id 
                        ? darkMode ? 'bg-blue-900 bg-opacity-20' : 'bg-blue-50' 
                        : darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                    } ${
                      !message.isRead && message.recipient === currentUser.uid
                        ? darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className={`font-medium text-sm truncate max-w-[180px] ${
                        !message.isRead && message.recipient === currentUser.uid
                          ? darkMode ? 'text-white' : 'text-gray-900'
                          : darkMode ? 'text-gray-300' : 'text-gray-800'
                      }`}>
                        {message.sender === currentUser.uid ? message.recipientName : message.senderName}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatDate(message.timestamp)}
                        </span>
                        {!message.isRead && message.recipient === currentUser.uid && (
                          <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'}`}></div>
                        )}
                      </div>
                    </div>
                    <div className={`text-sm font-medium truncate ${
                      !message.isRead && message.recipient === currentUser.uid
                        ? darkMode ? 'text-white' : 'text-gray-900'
                        : darkMode ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      {message.subject}
                    </div>
                    <div className={`text-xs truncate mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {message.message.substring(0, 60)}{message.message.length > 60 ? '...' : ''}
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(message.id);
                          }}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                        >
                          {message.isStarred ? (
                            <FaStar className="text-yellow-400" />
                          ) : (
                            <FaRegStar className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                          )}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMessageActionsOpen(message.id === messageActionsOpen ? null : message.id);
                          }}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                        >
                          <FaEllipsisV className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        </button>
                        
                        {/* Dropdown menu for message actions */}
                        {messageActionsOpen === message.id && (
                          <div 
                            ref={actionsMenuRef}
                            className={`absolute z-10 mt-6 ml-6 py-1 ${
                              darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
                            } rounded-md shadow-lg border ${
                              darkMode ? 'border-gray-600' : 'border-gray-200'
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchive(message.id);
                                setMessageActionsOpen(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center">
                                <FaArchive className="mr-2" />
                                {message.isArchived ? 'Unarchive' : 'Archive'}
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(message.id);
                                setMessageActionsOpen(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${
                                darkMode ? 'hover:bg-gray-600 text-red-400' : 'hover:bg-gray-100 text-red-600'
                              }`}
                            >
                              <div className="flex items-center">
                                <FaTrash className="mr-2" />
                                Delete
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {message.sender === currentUser.uid ? (
                        <div className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          Sent
                        </div>
                      ) : (
                        <div className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                        }`}>
                          Inbox
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Message Content Panel */}
          <div className={`md:col-span-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-md overflow-hidden flex flex-col h-[calc(100vh-170px)]`}>
            {selectedMessage ? (
              <>
                {/* Message Header */}
                <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleToggleStar(selectedMessage.id)}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        {selectedMessage.isStarred ? (
                          <FaStar className="text-yellow-400" />
                        ) : (
                          <FaRegStar className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                        )}
                      </button>
                      <button 
                        onClick={() => handleArchive(selectedMessage.id)}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <FaArchive className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </button>
                      <button 
                        onClick={() => handleDelete(selectedMessage.id)}
                        className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <FaTrash className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-3">
                    <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mr-3`}>
                      <FaUser className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                          {selectedMessage.sender === currentUser.uid ? selectedMessage.recipientName : selectedMessage.senderName}
                        </span>
                        <span className={`text-xs mx-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedMessage.sender === currentUser.uid ? selectedMessage.recipientEmail : selectedMessage.senderEmail}
                        </span>
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {selectedMessage.timestamp ? new Date(selectedMessage.timestamp).toLocaleString() : 'Date unknown'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Message Body */}
                <div className="flex-grow overflow-y-auto p-5">
                  <div className={`whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {selectedMessage.message}
                  </div>
                  <div ref={messageEndRef} />
                </div>
                
                {/* Reply Form */}
                <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <form onSubmit={handleSendReply}>
                    <div className={`flex items-start border ${
                      darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
                    } rounded-lg overflow-hidden`}>
                      <textarea
                        ref={replyInputRef}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className={`w-full p-3 ${
                          darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                        } focus:outline-none resize-none`}
                        rows="3"
                      />
                    </div>
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={!replyText.trim() || sending}
                        className={`flex items-center px-4 py-2 rounded-lg ${
                          !replyText.trim() || sending
                            ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'}`
                            : `${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                        } transition-colors disabled:cursor-not-allowed`}
                      >
                        {sending ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaReply className="mr-2" />
                            Send Reply
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <EmptyState type="content" />
            )}
          </div>
        </div>
      </div>
      
      {/* Compose Message Modal */}
      <AnimatePresence>
        {showComposeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`w-full max-w-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden`}
            >
              <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  New Message
                </h3>
                <button 
                  onClick={() => setShowComposeModal(false)}
                  className={`${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} p-1 rounded-full`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={sendNewMessage} className="p-6">
                <div className="mb-4">
                  <label htmlFor="recipient" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    To:
                  </label>
                  <input
                    type="text"
                    id="recipient"
                    name="recipient"
                    value={newMessage.recipient}
                    onChange={handleComposeChange}
                    placeholder="Email address or user ID"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 ${
                      darkMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-blue-400 focus:border-blue-400'
                    }`}
                  />
                  <ValidateRecipient recipient={newMessage.recipient} />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="subject" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Subject:
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={newMessage.subject}
                    onChange={handleComposeChange}
                    placeholder="Message subject"
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 ${
                      darkMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-blue-400 focus:border-blue-400'
                    }`}
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="message" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Message:
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={newMessage.message}
                    onChange={handleComposeChange}
                    rows="8"
                    placeholder="Write your message here..."
                    className={`w-full px-3 py-2 border rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
                        : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 ${
                      darkMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-blue-400 focus:border-blue-400'
                    } resize-none`}
                  />
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className={`mr-3 px-4 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    } transition-colors`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newMessage.recipient || !newMessage.subject || !newMessage.message || sending}
                    className={`px-4 py-2 rounded-lg ${
                      !newMessage.recipient || !newMessage.subject || !newMessage.message || sending
                        ? `${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-300 text-gray-500'}`
                        : `${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                    } transition-colors flex items-center disabled:cursor-not-allowed`}
                  >
                    {sending ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Messages;