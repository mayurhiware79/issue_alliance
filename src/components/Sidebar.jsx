import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaSearch,
  FaHistory,
  FaRegChartBar,
  FaUserEdit,
  FaCog,
  FaSignOutAlt,
  FaGithub,
  FaUser,
  FaEnvelope,
  FaSpinner,
  FaBookmark,
  FaMagic,
  FaChartPie,
  FaCalendarDay,
  FaTrophy,
  FaTimes,
  FaBars,
  FaChevronRight,
  FaCode,
  FaStar,
  FaComments
} from "react-icons/fa";

function Sidebar({ isOpen, toggleSidebar }) {
  const { currentUser, logout, loginWithGithub } = useAuth();
  const { currentTheme } = useTheme();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userProfile, setUserProfile] = useState({
    githubConnected: false,
    githubUsername: "",
  });
  const [collapsedSections, setCollapsedSections] = useState({});

  // Define sidebar menu items grouped into sections
  const menuSections = [
    {
      id: "core",
      title: "Core",
      items: [
        {
          path: "/dashboard",
          name: "Dashboard",
          icon: <FaTachometerAlt className="w-5 h-5" />,
        },
        {
          path: "/personalized-issues",
          name: "For You",
          icon: <FaMagic className="w-5 h-5" />,
          highlight: true,
          badge: "New",
        },
        {
          path: "/match-issues",
          name: "Find Projects",
          icon: <FaSearch className="w-5 h-5" />,
        },
        {
          path: "/projects",
          name: "My Projects",
          icon: <FaProjectDiagram className="w-5 h-5" />,
        },
        {
          path: "/github-issues",
          name: "GitHub Issues",
          icon: <FaGithub className="w-5 h-5" />,
        },
        {
          path: "/forum",
          name: "Forum",
          icon: <FaComments className="w-5 h-5" />,
          highlight: true,
          badge: "New",
          badgeColor: "bg-green-500"
        },
        {
          path: "/messages",
          name: "Messages",
          icon: <FaEnvelope className="w-5 h-5" />,
          badge: "5",
          badgeColor: "bg-red-500"
        },
        {
          path: "/my-contributions",
          name: "My Contributions",
          icon: <FaHistory className="w-5 h-5" />,
        }
      ]
    },
    {
      id: "analytics",
      title: "Analytics",
      items: [
        // {
        //   path: "/sheets-dashboard",
        //   name: "Shorts Analytics",
        //   icon: <FaChartPie className="w-5 h-5" />,
        //   highlight: true,
        // },
        {
          path: "/analytics",
          name: "Analytics",
          icon: <FaRegChartBar className="w-5 h-5" />,
        },
        {
          path: "/daily-challenge",
          name: "Daily Challenge",
          icon: <FaCalendarDay className="w-5 h-5" />,
          subText: "Complete daily GitHub issues",
          highlight: true,
          badge: "Today",
          badgeColor: "bg-green-500"
        },
        {
          path: "/leaderboard",
          name: "Leaderboard",
          icon: <FaTrophy className="w-5 h-5" />,
          highlight: true,
          subText: "See top contributors",
        }
      ]
    },
    {
      id: "account",
      title: "Account",
      items: [
        {
          path: "/profile",
          name: "Profile",
          icon: <FaUserEdit className="w-5 h-5" />,
        },
        {
          path: "/saved-issues",
          name: "Saved Issues",
          icon: <FaBookmark className="w-5 h-5" />,
        },
        {
          path: "/settings",
          name: "Settings",
          icon: <FaCog className="w-5 h-5" />,
        }
      ]
    }
  ];

  // Toggle section collapse
  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Fetch user profile data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserProfile({
            githubConnected: userData.githubConnected || false,
            githubUsername: userData.githubUsername || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to fetch user profile.");
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Check if a menu item is active
  const isActive = (path) => location.pathname === path;

  // Handle GitHub connection
  const handleConnectGithub = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await loginWithGithub();

      if (result.user) {
        const githubUser = result.user.providerData.find(
          (provider) => provider.providerId === "github.com"
        );

        if (githubUser) {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            githubConnected: true,
            githubUsername: githubUser.displayName || "",
            githubPhotoURL: githubUser.photoURL || "",
            githubEmail: githubUser.email || "",
            githubUID: githubUser.uid || "",
            updatedAt: new Date(),
          });

          setUserProfile({
            githubConnected: true,
            githubUsername: githubUser.displayName || "",
          });
        }
      }
    } catch (error) {
      console.error("Error connecting GitHub:", error);
      setError("Failed to connect GitHub account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Rendering components
  const renderUserProfile = () => (
    <div className="flex items-center space-x-3 p-4 relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg mx-2 my-4 shadow-md">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || "User"}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <FaUser className="w-5 h-5 text-blue-600" />
        )}
      </div>
      <div className="overflow-hidden flex-1">
        <h2 className="font-semibold text-white text-lg truncate">
          {currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "User"}
        </h2>
        <div className="flex items-center">
          <FaCode className="w-3 h-3 text-blue-200 mr-1" />
          <p className="text-blue-100 text-xs truncate">Developer</p>
        </div>
      </div>
      {/* Close button for sidebar - only visible on mobile */}
      <button
        onClick={toggleSidebar}
        className="absolute right-2 top-2 p-1 rounded-full bg-blue-800/40 text-white hover:bg-blue-800 transition-colors lg:hidden"
        aria-label="Close sidebar"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );

  const renderNavigation = () => (
    <nav className="space-y-6 px-2 py-4 mb-14">
      {menuSections.map((section, index) => (
        <div key={index} className="rounded-lg overflow-hidden">
          <button 
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between text-xs font-semibold text-theme-secondary uppercase tracking-wider px-4 py-2 hover:bg-theme-secondary/10 rounded-md"
          >
            <span>{section.title}</span>
            <FaChevronRight className={`w-3 h-3 transition-transform duration-200 ${collapsedSections[section.id] ? 'rotate-90' : ''}`} />
          </button>
          <div className={`space-y-1 mt-1 transition-all duration-200 ${collapsedSections[section.id] ? 'max-h-0 overflow-hidden opacity-0' : 'max-h-[500px] opacity-100'}`}>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center hover:text-blue-600 duration-300 group space-x-3 ${
                  isActive(item.path)
                    ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-theme hover:bg-theme-secondary/30"
                } rounded-lg px-4 py-2.5 font-medium transition-colors relative overflow-hidden`}
              >
                <span className={`flex-shrink-0 ${isActive(item.path) ? "text-blue-600 ml-2 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400"}`}>
                  {item.icon}
                </span>
                <div className="flex-1 flex flex-col">
                  <span>{item.name}</span>
                  {item.subText && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.subText}
                    </span>
                  )}
                </div>
                {item.badge && (
                  <span className={`text-xs py-0.5 px-2 rounded-full text-white ${item.badgeColor || 'bg-blue-500'} animate-pulse-slow`}>
                    {item.badge}
                  </span>
                )}
                {isActive(item.path) && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
                )}
                {item.highlight && (
                  <div className="absolute -right-6 -top-6 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full opacity-20"></div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const renderGithubConnection = () => (
    <div className="absolute bottom-0 left-0  right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-theme-secondary/10">
      {!userProfile.githubConnected ? (
        <div className="rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-3 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Connect your GitHub account
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Link your GitHub to contribute to open source issues
          </p>
          <button
            onClick={handleConnectGithub}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-black dark:bg-gray-700 hover:bg-gray-800 text-white rounded-md transition-colors text-sm"
          >
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <>
                <FaGithub className="w-4 h-4" />
                <span>Connect GitHub</span>
              </>
            )}
          </button>
          {error && (
            <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg mb-14 md:mb-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <FaGithub className="text-gray-700 dark:text-gray-300" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              GitHub Connected
            </h3>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center space-x-1">
            <FaStar className="text-yellow-500" />
            <span>You're ready to contribute to open source!</span>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 py-1 px-2 rounded-md mt-2 flex items-center justify-center">
            <span className="truncate">@{userProfile.githubUsername}</span>
          </p>
        </div>
      )}
    </div>
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar container */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-64 bg-theme z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-0 shadow-xl lg:shadow-none`}
      >
        {/* Main sidebar content with scrolling */}
        <div className="flex flex-col h-full pb-28  overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {renderUserProfile()}
          {renderNavigation()}
        </div>

        {/* GitHub connection section (fixed at bottom) */}
        {renderGithubConnection()}
      </div>

    
    </>
  );
}

export default Sidebar;