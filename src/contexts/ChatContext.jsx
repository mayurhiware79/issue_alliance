import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';

// Create the context
const ChatContext = createContext();

// Hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

// Provider component
export const ChatProvider = ({ children }) => {
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const geminiChat = useGeminiChat();
  
  // On first load, initialize sessions from localStorage
  useEffect(() => {
    // Load all chat sessions from localStorage
    const savedSessions = localStorage.getItem('chatSessions');
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          setChatSessions(parsedSessions);
          
          // Also get the last active session ID
          const lastActiveSession = localStorage.getItem('currentSessionId');
          if (lastActiveSession) {
            setCurrentSessionId(lastActiveSession);
            
            // Load the messages for this session
            const sessionMessages = localStorage.getItem(`session_${lastActiveSession}`);
            if (sessionMessages) {
              const parsedMessages = JSON.parse(sessionMessages);
              // Restore timestamps as Date objects
              const messagesWithDates = parsedMessages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
              geminiChat.setMessages(messagesWithDates);
            }
          } else {
            // If no active session, create one
            createNewSession();
          }
        } else {
          // If no sessions, create one
          createNewSession();
        }
      } catch (error) {
        console.error('Error parsing saved chat sessions:', error);
        localStorage.removeItem('chatSessions');
        createNewSession();
      }
    } else {
      // If no sessions in storage, create one
      createNewSession();
    }
  }, []);

  // Create a new chat session
  const createNewSession = () => {
    const newSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messageCount: 0,
    };
    
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    geminiChat.clearMessages();
    
    // Update localStorage
    localStorage.setItem('chatSessions', JSON.stringify([newSession, ...chatSessions]));
    localStorage.setItem('currentSessionId', newSession.id);
  };

  // Load an existing chat session
  const loadChatSession = (sessionId) => {
    if (sessionId === currentSessionId) return;
    
    // Save current session messages first if needed
    if (currentSessionId && geminiChat.messages.length > 0) {
      saveCurrentSession();
    }
    
    // Load messages for the selected session
    setCurrentSessionId(sessionId);
    localStorage.setItem('currentSessionId', sessionId);
    
    const sessionMessages = localStorage.getItem(`session_${sessionId}`);
    if (sessionMessages) {
      try {
        const parsedMessages = JSON.parse(sessionMessages);
        // Restore timestamps as Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        geminiChat.setMessages(messagesWithDates);
      } catch (error) {
        console.error(`Error loading messages for session ${sessionId}:`, error);
        geminiChat.clearMessages();
      }
    } else {
      geminiChat.clearMessages();
    }
  };

  // Save the current session to localStorage
  const saveCurrentSession = () => {
    if (!currentSessionId) return;
    
    // Save messages for the current session
    localStorage.setItem(`session_${currentSessionId}`, JSON.stringify(geminiChat.messages));
    
    // Update session metadata
    const firstMessage = geminiChat.messages[0]?.text || '';
    const sessionTitle = firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : '');
    
    const updatedSessions = chatSessions.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          title: sessionTitle || 'Untitled Chat',
          messageCount: geminiChat.messages.length,
          lastUpdated: new Date().toISOString()
        };
      }
      return session;
    });
    
    setChatSessions(updatedSessions);
    localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
  };

  // Save current session messages when they change
  useEffect(() => {
    if (currentSessionId && geminiChat.messages.length > 0) {
      saveCurrentSession();
    }
  }, [geminiChat.messages]);

  const toggleChatVisibility = () => {
    setIsChatVisible(prev => !prev);
  };

  // Value object to be provided by the context
  const value = {
    ...geminiChat,
    isChatVisible,
    toggleChatVisibility,
    chatSessions,
    currentSessionId,
    createNewSession,
    loadChatSession
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 