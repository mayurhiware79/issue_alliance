import React, { useState, useEffect, useRef } from 'react';
import { FaGithub, FaStar, FaCodeBranch, FaEye, FaExclamationCircle, FaPlus, FaEdit, FaTrash, FaSpinner, FaFilter, FaSearch, FaTags } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// Tag color mapping based on technology type
const TAG_COLORS = {
  "react": { bg: "#61dafb33", text: "#61dafb", border: "#61dafb" },
  "vue": { bg: "#42b88333", text: "#42b883", border: "#42b883" },
  "angular": { bg: "#dd003333", text: "#dd0031", border: "#dd0031" },
  "javascript": { bg: "#f7df1e33", text: "#f0db4f", border: "#f0db4f" },
  "typescript": { bg: "#3178c633", text: "#3178c6", border: "#3178c6" },
  "node": { bg: "#43853d33", text: "#43853d", border: "#43853d" },
  "python": { bg: "#3776ab33", text: "#3776ab", border: "#3776ab" },
  "java": { bg: "#b0751233", text: "#b07512", border: "#b07512" },
  "c#": { bg: "#68217a33", text: "#68217a", border: "#68217a" },
  "ruby": { bg: "#cc342d33", text: "#cc342d", border: "#cc342d" },
  "php": { bg: "#777bb433", text: "#777bb4", border: "#777bb4" },
  "go": { bg: "#00add833", text: "#00add8", border: "#00add8" },
  "rust": { bg: "#dea58433", text: "#dea584", border: "#dea584" },
  "swift": { bg: "#fa734333", text: "#fa7343", border: "#fa7343" },
  "kotlin": { bg: "#7f52ff33", text: "#7f52ff", border: "#7f52ff" },
  "ui": { bg: "#ec407a33", text: "#ec407a", border: "#ec407a" },
  "backend": { bg: "#6c757d33", text: "#6c757d", border: "#6c757d" },
  "frontend": { bg: "#ff980033", text: "#ff9800", border: "#ff9800" },
  "fullstack": { bg: "#9c27b033", text: "#9c27b0", border: "#9c27b0" },
  "mobile": { bg: "#4caf5033", text: "#4caf50", border: "#4caf50" },
  "database": { bg: "#00bcd433", text: "#00bcd4", border: "#00bcd4" },
  "ai": { bg: "#f4433633", text: "#f44336", border: "#f44336" },
  "ml": { bg: "#673ab733", text: "#673ab7", border: "#673ab7" },
  "web": { bg: "#2196f333", text: "#2196f3", border: "#2196f3" },
  "api": { bg: "#ff572233", text: "#ff5722", border: "#ff5722" },
  "devops": { bg: "#79554833", text: "#795548", border: "#795548" },
};

// Get tag color or return a default color
const getTagColor = (tag) => {
  const lowercaseTag = tag.toLowerCase();
  
  // Check for exact match
  if (TAG_COLORS[lowercaseTag]) {
    return TAG_COLORS[lowercaseTag];
  }
  
  // Check for partial match (e.g., "reactjs" should match "react")
  for (const key in TAG_COLORS) {
    if (lowercaseTag.includes(key)) {
      return TAG_COLORS[key];
    }
  }
  
  // Default color if no match found
  return { bg: "#64748b33", text: "#64748b", border: "#64748b" };
};

function Projects() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const { currentTheme, themeConfig } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repoUrl: '',
    tags: '',
    coverImage: '',
    isPublic: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Get the current theme for styling
  const isDarkTheme = currentTheme === 'dark' || currentTheme === 'blue' || currentTheme === 'purple' || currentTheme === 'green';

  // Add some animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    hover: { 
      y: -5, 
      boxShadow: isDarkTheme ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' : 
                             '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    }
  };
  
  // Fetch projects from Firestore
  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    const projectsRef = collection(db, 'projects');
    const q = query(
      projectsRef,
      where('userId', '==', currentUser.uid),
      orderBy('lastUpdated', 'desc')
    );
    
    // Set up real-time listener instead of one-time fetch
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedProjects = [];
      
      querySnapshot.forEach((doc) => {
        fetchedProjects.push({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated?.toDate()
        });
      });
      
      setProjects(fetchedProjects);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching projects:", error);
      setError("Failed to load projects. Please try again later.");
      setLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [currentUser]);

  // Get unique tags for filter options
  const uniqueTags = Array.from(new Set(projects.flatMap(project => project.tags))).sort();

  // Filter projects based on tags and search query
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') {
      return matchesSearch;
    } else {
      return project.tags.includes(filter) && matchesSearch;
    }
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle file selection for cover image
  const handleFileSelect = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Upload cover image to Firebase Storage
  const uploadCoverImage = async (projectId) => {
    if (!selectedFile) return null;
    
    const storageRef = ref(storage, `project_covers/${currentUser.uid}/${projectId || 'new'}_${Date.now()}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  // Open add project modal
  const handleAddProject = () => {
    setFormData({
      name: '',
      description: '',
      repoUrl: '',
      tags: '',
      coverImage: '',
      isPublic: true
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
    setShowAddModal(true);
  };

  // Open edit project modal
  const handleEditProject = (project) => {
    setCurrentProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      tags: project.tags.join(', '),
      coverImage: project.coverImage,
      isPublic: project.isPublic
    });
    setSelectedFile(null);
    setUploadProgress(0);
    setError('');
    setShowEditModal(true);
  };

  // Save new project
  const handleSaveNewProject = async () => {
    if (!formData.name || !formData.description || !formData.repoUrl) {
      setError("Please fill in all required fields");
      showError("Please fill in all required fields");
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      let coverImageUrl = formData.coverImage;
      
      // Upload cover image if selected
      if (selectedFile) {
        coverImageUrl = await uploadCoverImage();
      }
      
      // Prepare project data
      const projectData = {
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        userEmail: currentUser.email,
        name: formData.name,
        description: formData.description,
        repoUrl: formData.repoUrl,
        tags: tagsArray,
        stars: 0,
        forks: 0,
        watchers: 0,
        openIssues: 0,
        lastUpdated: Timestamp.now(),
        createdAt: Timestamp.now(),
        coverImage: coverImageUrl || 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
        isPublic: formData.isPublic,
        // Add owner object with the necessary fields for project cards
        owner: {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'U'}`
        }
      };
      
      // Add project to Firestore
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      // Add the project to local state
      setProjects([{
        id: docRef.id,
        ...projectData,
        lastUpdated: projectData.lastUpdated.toDate()
      }, ...projects]);
      
      showSuccess(`Project "${formData.name}" created successfully!`);
      setShowAddModal(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error adding project:", error);
      setError("Failed to save project. Please try again.");
      showError("Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Save edited project
  const handleSaveEditedProject = async () => {
    if (!formData.name || !formData.description || !formData.repoUrl) {
      setError("Please fill in all required fields");
      showError("Please fill in all required fields");
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag);
      
      let coverImageUrl = formData.coverImage;
      
      // Upload cover image if selected
      if (selectedFile) {
        coverImageUrl = await uploadCoverImage(currentProject.id);
      }
      
      // Prepare updated project data
      const updatedData = {
        name: formData.name,
        description: formData.description,
        repoUrl: formData.repoUrl,
        tags: tagsArray,
        lastUpdated: Timestamp.now(),
        isPublic: formData.isPublic
      };
      
      // Only update the cover image if it changed
      if (coverImageUrl !== currentProject.coverImage) {
        updatedData.coverImage = coverImageUrl;
      }
      
      // Ensure owner data is properly updated if needed
      if (!currentProject.owner || currentProject.owner.name !== (currentUser.displayName || currentUser.email)) {
        updatedData.owner = {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'U'}`
        };
      }
      
      // Update project in Firestore
      const projectRef = doc(db, 'projects', currentProject.id);
      await updateDoc(projectRef, updatedData);
      
      // Update project in local state
      const updatedProjects = projects.map(project => 
        project.id === currentProject.id 
          ? {
              ...project,
              ...updatedData,
              lastUpdated: updatedData.lastUpdated.toDate()
            }
          : project
      );
      
      setProjects(updatedProjects);
      showSuccess(`Project "${formData.name}" updated successfully!`);
      setShowEditModal(false);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error("Error updating project:", error);
      setError("Failed to update project. Please try again.");
      showError("Failed to update project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        // Get project name before deletion
        const projectToDelete = projects.find(project => project.id === id);
        const projectName = projectToDelete ? projectToDelete.name : 'Project';
        
        // Delete project from Firestore
        const projectRef = doc(db, 'projects', id);
        await deleteDoc(projectRef);
        
        // Remove project from local state
        setProjects(projects.filter(project => project.id !== id));
        
        // Show success message
        showSuccess(`"${projectName}" has been deleted successfully.`);
      } catch (error) {
        console.error("Error deleting project:", error);
        setError("Failed to delete project. Please try again.");
        showError("Failed to delete project. Please try again.");
      }
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div 
        className="rounded-xl shadow-md overflow-hidden p-6 flex justify-center items-center h-64"
        style={{ 
          backgroundColor: themeConfig[currentTheme].bgTertiary,
          color: themeConfig[currentTheme].textPrimary
        }}
      >
        <div className="text-center">
          <FaSpinner className="animate-spin mx-auto w-10 h-10 mb-4" style={{ color: themeConfig[currentTheme].accentPrimary }} />
          <p className="text-lg">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl shadow-md overflow-hidden p-6 transition-colors duration-300"
      style={{ 
        backgroundColor: themeConfig[currentTheme].bgTertiary,
        color: themeConfig[currentTheme].textPrimary,
        backgroundImage: isDarkTheme 
          ? 'radial-gradient(circle at 80% 20%, rgba(64, 64, 180, 0.04) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(64, 180, 64, 0.04) 0%, transparent 40%)'
          : 'radial-gradient(circle at 80% 20%, rgba(229, 231, 235, 0.6) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(243, 244, 246, 0.6) 0%, transparent 40%)'
      }}
    >
      {/* Header Section */}
      <div 
        className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 pb-6 border-b"
        style={{ borderColor: `${themeConfig[currentTheme].textSecondary}20` }}
      >
        <div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: themeConfig[currentTheme].textPrimary }}>
            My Open Source Projects
          </h2>
          <p className="text-base" style={{ color: themeConfig[currentTheme].textSecondary }}>
            Manage and showcase your contributions to the open source community
          </p>
        </div>
        <motion.button 
          onClick={handleAddProject}
          className="px-5 py-3 rounded-lg flex items-center gap-2 text-white font-medium shadow-lg"
          style={{ 
            backgroundColor: themeConfig[currentTheme].accentPrimary,
            boxShadow: isDarkTheme 
              ? `0 10px 15px -3px ${themeConfig[currentTheme].accentPrimary}40, 0 4px 6px -4px ${themeConfig[currentTheme].accentPrimary}30`
              : `0 10px 15px -3px ${themeConfig[currentTheme].accentPrimary}30, 0 4px 6px -4px ${themeConfig[currentTheme].accentPrimary}20`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FaPlus className="text-white" /> Add Project
        </motion.button>
      </div>
      
      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="mb-6 p-4 rounded-lg flex items-center"
            style={{ 
              backgroundColor: isDarkTheme ? 'rgba(239, 68, 68, 0.2)' : 'rgba(254, 226, 226, 1)',
              color: isDarkTheme ? 'rgb(248, 180, 180)' : 'rgb(185, 28, 28)'
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <FaExclamationCircle className="mr-2" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search and Filter */}
      <div 
        className="p-4 mb-8 rounded-xl"
        style={{ 
          backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'rgba(243, 244, 246, 0.7)',
          boxShadow: isDarkTheme 
            ? '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.2)' 
            : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        }}
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search input */}
          <div className="md:w-1/2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch style={{ color: themeConfig[currentTheme].textSecondary }} />
            </div>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none"
              style={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                color: themeConfig[currentTheme].textPrimary,
                borderColor: `${themeConfig[currentTheme].textSecondary}20`,
                borderWidth: '1px',
                boxShadow: 'none',
                focusRing: themeConfig[currentTheme].accentPrimary
              }}
            />
          </div>
          
          {/* Filter dropdown */}
          <div className="md:w-1/2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaTags style={{ color: themeConfig[currentTheme].textSecondary }} />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-opacity-50 focus:outline-none appearance-none"
              style={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                color: themeConfig[currentTheme].textPrimary,
                borderColor: `${themeConfig[currentTheme].textSecondary}20`,
                borderWidth: '1px',
                boxShadow: 'none',
                focusRing: themeConfig[currentTheme].accentPrimary
              }}
            >
              <option value="all" style={{ backgroundColor: isDarkTheme ? themeConfig[currentTheme].bgSecondary : 'white' }}>All Technologies</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag} style={{ backgroundColor: isDarkTheme ? themeConfig[currentTheme].bgSecondary : 'white' }}>{tag}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <FaFilter style={{ color: themeConfig[currentTheme].textSecondary }} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div 
          className="text-center py-16 rounded-lg border border-dashed"
          style={{ 
            borderColor: `${themeConfig[currentTheme].textSecondary}30`,
            color: themeConfig[currentTheme].textSecondary 
          }}
        >
          <FaGithub className="mx-auto w-16 h-16 mb-4 opacity-30" />
          <h3 className="text-xl font-medium mb-2">No projects found</h3>
          <p className="max-w-md mx-auto">
            {searchQuery || filter !== 'all' 
              ? "No projects match your current filters. Try adjusting your search criteria." 
              : "You haven't added any projects yet. Click 'Add Project' to showcase your work."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div 
              key={project.id} 
              className="overflow-hidden rounded-xl flex flex-col h-full"
              style={{ 
                backgroundColor: isDarkTheme ? 'rgba(255, 255, 255, 0.03)' : 'white',
                boxShadow: isDarkTheme 
                  ? '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)' 
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
              }}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              transition={{ delay: index * 0.05 }}
            >
              {/* Project Cover Image with Gradient Overlay */}
              <div className="relative h-48 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"
                  style={{ mixBlendMode: isDarkTheme ? 'overlay' : 'normal' }}
                ></div>
                <img 
                  src={project.coverImage} 
                  alt={project.name} 
                  className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                  }}
                />
                
                {/* Status badge */}
                <div className="absolute top-3 left-3 z-20">
                  {project.isPublic ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{ 
                        backgroundColor: isDarkTheme ? 'rgba(16, 185, 129, 0.2)' : 'rgba(209, 250, 229, 1)', 
                        color: isDarkTheme ? 'rgb(167, 243, 208)' : 'rgb(6, 95, 70)',
                        border: '1px solid',
                        borderColor: isDarkTheme ? 'rgba(16, 185, 129, 0.4)' : 'rgba(167, 243, 208, 1)'
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Public
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      style={{ 
                        backgroundColor: isDarkTheme ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 1)', 
                        color: isDarkTheme ? 'rgb(209, 213, 219)' : 'rgb(31, 41, 55)',
                        border: '1px solid',
                        borderColor: isDarkTheme ? 'rgba(75, 85, 99, 0.4)' : 'rgba(209, 213, 219, 1)'
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                      Private
                    </span>
                  )}
                </div>
                
                {/* Action buttons */}
                <div className="absolute top-3 right-3 space-x-2 z-20">
                  <motion.button 
                    onClick={() => handleEditProject(project)}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
                  >
                    <FaEdit className="text-gray-600" />
                  </motion.button>
                  <motion.button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100 transition-colors"
                  >
                    <FaTrash className="text-gray-600" />
                  </motion.button>
                </div>
              </div>
              
              {/* Project Info */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                <p className="text-gray-600 mb-4 flex-grow">{project.description}</p>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map(tag => (
                    <span 
                      key={`${project.id}-${tag}`} 
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center"><FaStar className="mr-1 text-yellow-400" /> {project.stars}</span>
                    <span className="flex items-center"><FaCodeBranch className="mr-1" /> {project.forks}</span>
                    <span className="flex items-center"><FaEye className="mr-1" /> {project.watchers}</span>
                    <span className="flex items-center"><FaExclamationCircle className="mr-1 text-red-500" /> {project.openIssues}</span>
                  </div>
                  <span>Updated {formatDate(project.lastUpdated)}</span>
                </div>
                
                {/* Repository Link */}
                <a 
                  href={project.repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 rounded-lg transition-colors"
                >
                  <FaGithub className="mr-2" /> View Repository
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Add New Project</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL*</label>
                <input
                  type="url"
                  name="repoUrl"
                  value={formData.repoUrl}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  placeholder="React, JavaScript, UI"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <div className="flex flex-col space-y-2">
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleFormChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Or upload an image:</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      id="coverImageUpload"
                      onChange={handleFileSelect} 
                    />
                    <label 
                      htmlFor="coverImageUpload"
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Visibility
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                    Make this project public
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Public projects will be visible to other users who can reach out to collaborate. Private projects are only visible to you.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
                disabled={saving || !formData.name || !formData.description || !formData.repoUrl}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Project'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Project</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name*</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description*</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL*</label>
                <input
                  type="url"
                  name="repoUrl"
                  value={formData.repoUrl}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                <div className="flex flex-col space-y-2">
                  <div className="w-full h-32 border border-gray-300 rounded-lg overflow-hidden mb-2">
                    <img 
                      src={formData.coverImage} 
                      alt="Current cover"
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80";
                      }}
                    />
                  </div>
                  <input
                    type="url"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-500">Or upload a new image:</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      id="editCoverImageUpload"
                      onChange={handleFileSelect} 
                    />
                    <label 
                      htmlFor="editCoverImageUpload"
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm cursor-pointer transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      Selected: {selectedFile.name}
                    </div>
                  )}
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditedProject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:bg-blue-400"
                disabled={saving || !formData.name || !formData.description || !formData.repoUrl}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects; 