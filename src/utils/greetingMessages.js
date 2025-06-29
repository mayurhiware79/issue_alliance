// Random greeting and engagement messages for the user experience

// Time-based greeting options
export const timeBasedGreetings = {
  morning: [
    'Good morning',
    'Rise and shine',
    'Morning',
    'Hello and good morning',
    'Top of the morning'
  ],
  afternoon: [
    'Good afternoon',
    'Hey there',
    'Hello',
    'Afternoon',
    'Greetings'
  ],
  evening: [
    'Good evening',
    'Evening',
    'Hey there',
    'Hello',
    'Welcome back'
  ],
  night: [
    'Working late',
    'Burning the midnight oil',
    'Night owl mode',
    'Hello night coder',
    'Late night session'
  ]
};

// Engagement messages to show randomly
export const engagementMessages = [
  "Ready to find your next contribution?",
  "Today is perfect for open source!",
  "Your skills are needed in the community",
  "New issues matching your skills are waiting",
  "Make an impact with your code today",
  "Great contributions start with small steps",
  "Your perfect issue match is one click away",
  "The open source community welcomes you",
  "Turn your skills into positive impact",
  "Build your portfolio with meaningful PRs",
  "Level up your GitHub profile today",
  "Connect with projects that matter to you",
  "Share your talents with the world",
  "Every line of code makes a difference",
  "Your contribution journey continues here"
];

// Helper function to get greeting based on time of day
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return getRandomItem(timeBasedGreetings.morning);
  } else if (hour >= 12 && hour < 17) {
    return getRandomItem(timeBasedGreetings.afternoon);
  } else if (hour >= 17 && hour < 22) {
    return getRandomItem(timeBasedGreetings.evening);
  } else {
    return getRandomItem(timeBasedGreetings.night);
  }
};

// Get random engagement message
export const getRandomEngagementMessage = () => {
  return getRandomItem(engagementMessages);
};

// Helper to get random item from array
export const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
}; 