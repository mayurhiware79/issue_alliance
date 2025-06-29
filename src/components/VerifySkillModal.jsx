import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaSpinner, FaLightbulb, FaCode, FaBrain } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { doc, updateDoc, arrayUnion, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { generateSkillQuestions } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for quiz questions - to be replaced with Gemini API integration
const mockQuestionsBySkill = {
  javascript: [
    {
      question: "What does 'use strict' do in JavaScript?",
      options: [
        "Enforces stricter parsing and error handling",
        "Makes the code run faster",
        "Declares variables without the need for var/let/const",
        "Enables deprecated features"
      ],
      correctAnswer: 0
    },
    {
      question: "Which of these is a JavaScript Promise state?",
      options: ["Delayed", "Pending", "Running", "Started"],
      correctAnswer: 1
    },
    {
      question: "What is the output of: console.log(typeof NaN)?",
      options: ["undefined", "null", "number", "NaN"],
      correctAnswer: 2
    },
    {
      question: "Which array method creates a new array with the results of a function on every element?",
      options: ["filter()", "forEach()", "map()", "reduce()"],
      correctAnswer: 2
    },
    {
      question: "What does the '===' operator do?",
      options: [
        "Assigns a value",
        "Compares values, coercing types if necessary",
        "Compares values and types without coercion",
        "Checks if values have the same properties"
      ],
      correctAnswer: 2
    }
  ],
  python: [
    {
      question: "What function converts a string to an integer in Python?",
      options: ["int()", "integer()", "str2int()", "parse_int()"],
      correctAnswer: 0
    },
    {
      question: "Which of these is NOT a mutable data type in Python?",
      options: ["List", "Dictionary", "Tuple", "Set"],
      correctAnswer: 2
    },
    {
      question: "What does the 'self' parameter refer to in a class method?",
      options: [
        "The class itself",
        "The class's parent class",
        "The current instance of the class",
        "The method itself"
      ],
      correctAnswer: 2
    },
    {
      question: "What is a list comprehension in Python?",
      options: [
        "A way to understand lists better",
        "A concise way to create lists based on existing iterables",
        "A method to compress lists in memory",
        "A special type of list with extra functionality"
      ],
      correctAnswer: 1
    },
    {
      question: "What does the 'with' statement ensure in Python?",
      options: [
        "Exception handling",
        "Proper resource cleanup",
        "Async operation completion",
        "Parallel execution"
      ],
      correctAnswer: 1
    }
  ],
  react: [
    {
      question: "What is JSX in React?",
      options: [
        "A JavaScript library",
        "A syntax extension that looks similar to HTML",
        "A build tool",
        "A React component type"
      ],
      correctAnswer: 1
    },
    {
      question: "What function is used to update state in functional components?",
      options: ["this.state()", "useState()", "setState()", "reactState()"],
      correctAnswer: 1
    },
    {
      question: "What is the correct lifecycle method to make API calls in class components?",
      options: [
        "componentWillMount",
        "componentDidMount",
        "componentWillUpdate",
        "componentDidUpdate"
      ],
      correctAnswer: 1
    },
    {
      question: "What is a 'key' prop used for in lists?",
      options: [
        "CSS styling",
        "Data encryption",
        "Helps React identify which items have changed",
        "API authentication"
      ],
      correctAnswer: 2
    },
    {
      question: "What is the React Hook equivalent of componentDidMount?",
      options: [
        "useDidMount()",
        "useEffect(() => {}, [])",
        "useState()",
        "useMount()"
      ],
      correctAnswer: 1
    }
  ],
  typescript: [
    {
      question: "What is the 'any' type in TypeScript?",
      options: [
        "A type that can only hold primitive values",
        "A type that can hold any value",
        "A type alias for undefined",
        "A type that can only hold objects"
      ],
      correctAnswer: 1
    },
    {
      question: "What does the 'interface' keyword do in TypeScript?",
      options: [
        "Creates a class",
        "Defines a function",
        "Defines a contract for an object structure",
        "Creates a module"
      ],
      correctAnswer: 2
    },
    {
      question: "What is a 'generic' in TypeScript?",
      options: [
        "A placeholder type that gets replaced with a real type later",
        "A basic primitive type",
        "A namespace for holding related types",
        "A way to import types from another file"
      ],
      correctAnswer: 0
    },
    {
      question: "What is the union type syntax in TypeScript?",
      options: ["T & U", "T | U", "T + U", "T * U"],
      correctAnswer: 1
    },
    {
      question: "Which is NOT a valid TypeScript type?",
      options: ["number", "string", "boolean", "float"],
      correctAnswer: 3
    }
  ],
  // New questions for additional languages and frameworks
  c: [
    {
      question: "Which of these is NOT a valid data type in C?",
      options: ["int", "float", "string", "char"],
      correctAnswer: 2
    },
    {
      question: "What does the 'malloc' function do in C?",
      options: [
        "Frees memory that was previously allocated",
        "Allocates memory dynamically",
        "Creates a new thread",
        "Defines a macro"
      ],
      correctAnswer: 1
    },
    {
      question: "Which header file should be included to use the printf() function?",
      options: ["<stdlib.h>", "<math.h>", "<stdio.h>", "<string.h>"],
      correctAnswer: 2
    },
    {
      question: "What is the correct way to access elements of an array in C?",
      options: [
        "array.index",
        "array->index",
        "array[index]",
        "array(index)"
      ],
      correctAnswer: 2
    },
    {
      question: "What is a pointer in C?",
      options: [
        "A data type that can hold only integers",
        "A variable that stores the address of another variable",
        "A special kind of array",
        "A function that points to a memory location"
      ],
      correctAnswer: 1
    }
  ],
  "c++": [
    {
      question: "What feature differentiates C++ from C?",
      options: [
        "Pointers",
        "Object-oriented programming",
        "Procedural programming",
        "Memory allocation"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the correct way to create a new object of class 'MyClass' in C++?",
      options: [
        "MyClass myObj = create MyClass();",
        "new MyClass myObj;",
        "MyClass myObj;",
        "MyClass = new myObj();"
      ],
      correctAnswer: 2
    },
    {
      question: "In C++, what does the 'virtual' keyword indicate?",
      options: [
        "The function cannot be accessed outside the class",
        "The function uses virtual memory",
        "The function can be overridden in derived classes",
        "The function consumes no memory"
      ],
      correctAnswer: 2
    },
    {
      question: "Which C++ feature allows a function to handle different types of data?",
      options: [
        "Inheritance",
        "Templates",
        "Polymorphism",
        "Encapsulation"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the correct syntax for a destructor in C++?",
      options: [
        "~ClassName()",
        "!ClassName()",
        "delete ClassName()",
        "void destroy()"
      ],
      correctAnswer: 0
    }
  ],
  java: [
    {
      question: "Which of these is the correct way to create a single-dimensional array in Java?",
      options: [
        "int[5] array;",
        "array int[5];",
        "int array[5];",
        "int[] array = new int[5];"
      ],
      correctAnswer: 3
    },
    {
      question: "What is the default value of an instance variable of type int in Java?",
      options: ["0", "1", "null", "undefined"],
      correctAnswer: 0
    },
    {
      question: "In Java, which keyword is used to inherit a class?",
      options: ["extends", "implements", "inherits", "using"],
      correctAnswer: 0
    },
    {
      question: "What is the main difference between an interface and an abstract class in Java?",
      options: [
        "Abstract classes can have constructors, interfaces cannot",
        "Interfaces cannot have methods",
        "A class can implement multiple interfaces but extend only one abstract class",
        "Abstract classes are faster than interfaces"
      ],
      correctAnswer: 2
    },
    {
      question: "Which method must be implemented by all threads in Java?",
      options: ["start()", "run()", "execute()", "thread()"],
      correctAnswer: 1
    }
  ],
  mongodb: [
    {
      question: "What type of database is MongoDB?",
      options: [
        "Relational database",
        "Document-oriented NoSQL database",
        "Graph database",
        "Columnar database"
      ],
      correctAnswer: 1
    },
    {
      question: "In MongoDB, what is the equivalent of a 'table' in relational databases?",
      options: ["Row", "Document", "Collection", "Field"],
      correctAnswer: 2
    },
    {
      question: "Which of the following is NOT a valid CRUD operation in MongoDB?",
      options: ["insertOne()", "updateOne()", "removeOne()", "deleteOne()"],
      correctAnswer: 2
    },
    {
      question: "What does the MongoDB aggregation pipeline allow you to do?",
      options: [
        "Only insert documents in bulk",
        "Process data records and return computed results",
        "Create relationships between collections",
        "Encrypt data at rest"
      ],
      correctAnswer: 1
    },
    {
      question: "What data format does MongoDB use to store documents?",
      options: ["XML", "YAML", "BSON", "Plain text"],
      correctAnswer: 2
    }
  ],
  flask: [
    {
      question: "What is Flask in Python?",
      options: [
        "A database ORM",
        "A web framework",
        "A testing framework",
        "A data analysis library"
      ],
      correctAnswer: 1
    },
    {
      question: "Which decorator is used to define a route in Flask?",
      options: [
        "@app.route()",
        "@app.path()",
        "@flask.route()",
        "@app.url()"
      ],
      correctAnswer: 0
    },
    {
      question: "What is the correct way to start a Flask application in development mode?",
      options: [
        "flask.run(app)",
        "app.run(debug=True)",
        "flask --debug start",
        "python app.py --dev"
      ],
      correctAnswer: 1
    },
    {
      question: "Which template engine is used by Flask by default?",
      options: ["Django Templates", "Mako", "Jinja2", "Cheetah"],
      correctAnswer: 2
    },
    {
      question: "How do you access form data in Flask?",
      options: [
        "flask.form['field_name']",
        "request.POST['field_name']",
        "request.form['field_name']",
        "form.get('field_name')"
      ],
      correctAnswer: 2
    }
  ],
  flutter: [
    {
      question: "What programming language is used to develop Flutter applications?",
      options: ["JavaScript", "Java", "Kotlin", "Dart"],
      correctAnswer: 3
    },
    {
      question: "What is a 'Widget' in Flutter?",
      options: [
        "A database connection",
        "A UI component",
        "A background service",
        "A third-party library"
      ],
      correctAnswer: 1
    },
    {
      question: "Which widget would you use to create a scrollable list of widgets?",
      options: ["Container", "Row", "ListView", "Stack"],
      correctAnswer: 2
    },
    {
      question: "What is the purpose of the 'pubspec.yaml' file in a Flutter project?",
      options: [
        "To define app permissions",
        "To specify project dependencies and metadata",
        "To configure Firebase services",
        "To define UI layouts"
      ],
      correctAnswer: 1
    },
    {
      question: "Which of these is NOT a state management solution for Flutter?",
      options: ["Provider", "Riverpod", "Redux", "FlutterFlow"],
      correctAnswer: 3
    }
  ],
  r: [
    {
      question: "What is R primarily used for?",
      options: [
        "Web development",
        "Mobile app development",
        "Statistical computing and graphics",
        "Game development"
      ],
      correctAnswer: 2
    },
    {
      question: "In R, how do you create a vector of numbers from 1 to 10?",
      options: [
        "vector(1:10)",
        "c(1:10)",
        "array(1-10)",
        "seq(1, 10)"
      ],
      correctAnswer: 1
    },
    {
      question: "Which function is used to read CSV files in R?",
      options: ["read.csv()", "import.csv()", "load.csv()", "csv.read()"],
      correctAnswer: 0
    },
    {
      question: "Which package in R is commonly used for data visualization?",
      options: ["data.vis", "visual", "ggplot2", "plotr"],
      correctAnswer: 2
    },
    {
      question: "What does the '%>%' operator do in R?",
      options: [
        "Modulo division",
        "String concatenation",
        "Pipe operator that chains commands",
        "Matrix multiplication"
      ],
      correctAnswer: 2
    }
  ]
  // Add more skills and questions as needed
};

// Fallback questions for skills not in our database
const fallbackQuestions = [
  {
    question: "Which best describes the purpose of programming?",
    options: [
      "Creating instructions for computers to follow",
      "Designing websites",
      "Fixing hardware issues",
      "Networking computers together"
    ],
    correctAnswer: 0
  },
  {
    question: "What is a function in programming?",
    options: [
      "A type of variable",
      "A reusable block of code that performs a specific task",
      "A database connection",
      "An error message"
    ],
    correctAnswer: 1
  },
  {
    question: "What is debugging?",
    options: [
      "Writing new code",
      "The process of finding and fixing errors in code",
      "Deleting unused code",
      "Adding comments to code"
    ],
    correctAnswer: 1
  },
  {
    question: "What is version control?",
    options: [
      "Controlling which version of a program users can download",
      "A system that records changes to files over time",
      "Checking if your code is up to date",
      "Making different versions of the same program"
    ],
    correctAnswer: 1
  },
  {
    question: "What is an API?",
    options: [
      "A programming language",
      "A type of computer",
      "A set of rules that allow programs to communicate with each other",
      "A user interface"
    ],
    correctAnswer: 2
  }
];

function VerifySkillModal({ skill, userId, onClose, onSuccess }) {
  const { currentTheme } = useTheme();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [passed, setPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loadingPhase, setLoadingPhase] = useState(0);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { 
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };

  const questionVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: {
        duration: 0.4,
        ease: "easeIn"
      }
    }
  };

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        
        // Create loading phases animation
        const loadingInterval = setInterval(() => {
          setLoadingPhase(prev => (prev + 1) % 4);
        }, 1500);
        
        // Generate questions using Gemini API
        const skillQuestions = await generateSkillQuestions(skill, 5);
        setQuestions(skillQuestions);
        
        // Initialize selected options array with nulls
        setSelectedOptions(new Array(skillQuestions.length).fill(null));
        
        // Clear interval after loading
        clearInterval(loadingInterval);
      } catch (error) {
        console.error('Error loading quiz questions:', error);
        setError('Failed to load quiz questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [skill]);

  const handleOptionSelect = (optionIndex) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentQuestionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let newScore = 0;
      for (let i = 0; i < questions.length; i++) {
        if (selectedOptions[i] === questions[i].correctAnswer) {
          newScore++;
        }
      }
      
      setScore(newScore);
      setQuizCompleted(true);
      setPassed(newScore >= 3); // Passing threshold is 3 correct answers out of 5
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const saveQuizResult = async () => {
    if (!userId) return;
    
    try {
      setSubmitting(true);
      
      // If passed (at least 3 correct answers), add the skill to user's verified skills
      if (passed) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          verifiedSkills: arrayUnion(skill),
          updatedAt: new Date()
        });
      }
      
      // Save quiz attempt in the database
      const quizAttemptRef = collection(db, 'skillQuizAttempts');
      await addDoc(quizAttemptRef, {
        userId,
        skill,
        score,
        passed,
        requiredToPass: 3, // Document the required passing score
        timestamp: Timestamp.now(),
        selectedOptions,
        // Only save question text and correct answers, not all options
        questions: questions.map(q => ({
          question: q.question,
          correctAnswer: q.correctAnswer
        }))
      });
      
      if (passed && onSuccess) {
        onSuccess(skill);
      }
      
      // Close modal after a delay to show result
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving quiz result:', error);
      setError('Failed to save quiz result. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Current question object
  const currentQuestion = questions[currentQuestionIndex];

  // Loading animations content based on phase
  const renderLoadingContent = () => {
    switch(loadingPhase) {
      case 0:
        return (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <FaCode className="text-blue-500 text-6xl mb-4" />
            <p>Finding {skill} questions...</p>
          </motion.div>
        );
      case 1:
        return (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <FaBrain className="text-purple-500 text-6xl mb-4" />
            <p>Analyzing {skill} knowledge patterns...</p>
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <FaLightbulb className="text-yellow-500 text-6xl mb-4" />
            <p>Preparing skill verification...</p>
          </motion.div>
        );
      default:
        return (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <FaSpinner className="animate-spin text-blue-500 text-6xl mb-4" />
            <p>Almost ready...</p>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center p-4 overflow-y-auto">
        <motion.div 
          className={`w-full max-w-2xl rounded-lg shadow-lg ${currentTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} overflow-hidden`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Modal Header */}
          <div className={`px-6 py-4 flex justify-between items-center border-b ${currentTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-xl font-semibold">Verify Your {skill} Knowledge</h3>
            <motion.button 
              onClick={onClose}
              className={`p-1 rounded-full ${currentTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>
          </div>
          
          {/* Modal Body - Add max-height and overflow-y-auto for mobile scrolling */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {!loading && !error && !quizCompleted && (
              <motion.div 
                className={`mb-4 p-3 rounded-lg ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-wrap justify-between items-center">
                  <p className="flex-1 min-w-[200px]">
                    Answer the following questions about {skill} to verify your knowledge. 
                    You need to answer at least <strong>3 out of 5</strong> questions correctly to add this skill to your profile.
                  </p>
                  <motion.button 
                    onClick={() => {
                      setLoading(true);
                      setCurrentQuestionIndex(0);
                      setSelectedOptions([]);
                      
                      generateSkillQuestions(skill, 5)
                        .then(newQuestions => {
                          setQuestions(newQuestions);
                          setSelectedOptions(new Array(newQuestions.length).fill(null));
                        })
                        .catch(err => {
                          console.error('Error getting new questions:', err);
                          setError('Failed to load new questions. Please try again.');
                        })
                        .finally(() => {
                          setLoading(false);
                        });
                    }}
                    className={`ml-2 px-3 py-1 text-sm rounded-lg ${
                      currentTheme === 'dark' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white transition-colors whitespace-nowrap mt-2 sm:mt-0`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get New Questions
                  </motion.button>
                </div>
              </motion.div>
            )}
            
            {loading ? (
              <motion.div 
                className="flex flex-col items-center justify-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnimatePresence mode="wait">
                  <div key={loadingPhase}>
                    {renderLoadingContent()}
                  </div>
                </AnimatePresence>
              </motion.div>
            ) : error ? (
              <motion.div 
                className="text-red-500 text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <p>{error}</p>
                <motion.button 
                  onClick={onClose}
                  className={`mt-4 px-4 py-2 rounded-lg ${currentTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </motion.div>
            ) : quizCompleted ? (
              <motion.div 
                className="flex flex-col items-center py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {passed ? (
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ 
                        duration: 0.8, 
                        times: [0, 0.6, 1],
                        ease: "easeInOut" 
                      }}
                    >
                      <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto" />
                    </motion.div>
                    <motion.h4 
                      className="text-xl font-bold mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Congratulations!
                    </motion.h4>
                    <motion.p 
                      className="mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      You scored {score} out of {questions.length} and have verified your {skill} knowledge.
                    </motion.p>
                    {submitting ? (
                      <FaSpinner className="animate-spin text-blue-500 text-2xl mx-auto" />
                    ) : (
                      <motion.button 
                        onClick={saveQuizResult}
                        className={`px-6 py-2 rounded-lg ${currentTheme === 'dark' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Add to My Skills
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <motion.div
                      initial={{ rotate: 0, scale: 0 }}
                      animate={{ rotate: [0, 15, -15, 0], scale: 1 }}
                      transition={{ duration: 0.8 }}
                    >
                      <FaTimesCircle className="text-red-500 text-6xl mb-4 mx-auto" />
                    </motion.div>
                    <motion.h4 
                      className="text-xl font-bold mb-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Not Quite Yet
                    </motion.h4>
                    <motion.p 
                      className="mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      You scored {score} out of {questions.length}. You need at least 3 correct answers to verify this skill.
                    </motion.p>
                    {submitting ? (
                      <FaSpinner className="animate-spin text-blue-500 text-2xl mx-auto" />
                    ) : (
                      <motion.div 
                        className="flex flex-wrap space-y-3 sm:space-y-0 sm:space-x-4 justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                      >
                        <motion.button 
                          onClick={saveQuizResult}
                          className={`w-full sm:w-auto px-6 py-2 rounded-lg ${currentTheme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Try Again Later
                        </motion.button>
                        <motion.button 
                          onClick={() => {
                            setQuizCompleted(false);
                            setCurrentQuestionIndex(0);
                            setSelectedOptions(new Array(questions.length).fill(null));
                          }}
                          className={`w-full sm:w-auto px-6 py-2 rounded-lg ${currentTheme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white transition-colors`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Retry Now
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  variants={questionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {/* Progress indicator */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                      <span>Progress: {Math.round(((currentQuestionIndex) / questions.length) * 100)}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <motion.div 
                        className="h-2 rounded-full bg-blue-500"
                        initial={{ width: `${((currentQuestionIndex - 1) / questions.length) * 100}%` }}
                        animate={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>
                  
                  {/* Question */}
                  {currentQuestion && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-4">{currentQuestion.question}</h4>
                      
                      {/* Options */}
                      <div className="space-y-3">
                        {currentQuestion.options.map((option, index) => (
                          <motion.div 
                            key={index}
                            onClick={() => handleOptionSelect(index)}
                            className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                              selectedOptions[currentQuestionIndex] === index
                                ? currentTheme === 'dark'
                                  ? 'bg-blue-900 border-blue-700 text-white'
                                  : 'bg-blue-100 border-blue-500 text-blue-800'
                                : currentTheme === 'dark'
                                  ? 'border-gray-700 hover:bg-gray-700'
                                  : 'border-gray-300 hover:bg-gray-100'
                            }`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                                selectedOptions[currentQuestionIndex] === index
                                  ? currentTheme === 'dark'
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-blue-600 bg-blue-600'
                                  : currentTheme === 'dark'
                                    ? 'border-gray-500'
                                    : 'border-gray-400'
                              }`}>
                                {selectedOptions[currentQuestionIndex] === index && (
                                  <motion.div 
                                    className="w-2 h-2 rounded-full bg-white"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                  ></motion.div>
                                )}
                              </div>
                              {option}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-6">
                    <motion.button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentQuestionIndex === 0
                          ? currentTheme === 'dark'
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : currentTheme === 'dark'
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                      whileHover={currentQuestionIndex !== 0 ? { scale: 1.05 } : {}}
                      whileTap={currentQuestionIndex !== 0 ? { scale: 0.95 } : {}}
                    >
                      Previous
                    </motion.button>
                    
                    <motion.button
                      onClick={handleNextQuestion}
                      disabled={selectedOptions[currentQuestionIndex] === null}
                      className={`px-4 py-2 rounded-lg ${
                        selectedOptions[currentQuestionIndex] === null
                          ? currentTheme === 'dark'
                            ? 'bg-blue-800 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-300 text-gray-500 cursor-not-allowed'
                          : currentTheme === 'dark'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                      } transition-colors`}
                      whileHover={selectedOptions[currentQuestionIndex] !== null ? { scale: 1.05 } : {}}
                      whileTap={selectedOptions[currentQuestionIndex] !== null ? { scale: 0.95 } : {}}
                    >
                      {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    </motion.button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default VerifySkillModal; 