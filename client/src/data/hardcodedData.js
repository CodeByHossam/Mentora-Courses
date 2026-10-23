export const categories = [
  {
    id: 1,
    name: "Web Development",
    description: "Learn modern web development technologies and frameworks",
    icon: "code",
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2072&q=80",
  },
  {
    id: 2,
    name: "Data Science",
    description: "Master data analysis, machine learning, and AI",
    icon: "chart-bar",
    imageUrl:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2070&q=80",
  },
  {
    id: 3,
    name: "Mobile Development",
    description: "Build native and cross-platform mobile applications",
    icon: "mobile-alt",
    imageUrl:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=2070&q=80",
  },
  {
    id: 4,
    name: "Design",
    description: "Learn UI/UX design principles and tools",
    icon: "palette",
    imageUrl:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=2070&q=80",
  },
];

export const levels = [
  {
    id: 1,
    name: "General",
    description:
      "General level suitable for all learners with no specific prerequisites",
    difficulty: 1,
    color: "#6B7280",
    icon: "BookOpen",
  },
  {
    id: 2,
    name: "Beginner",
    description:
      "Perfect for those who are just starting their learning journey. No prior experience required.",
    difficulty: 2,
    color: "#10B981",
    icon: "Target",
  },
  {
    id: 3,
    name: "Intermediate",
    description:
      "For learners who have solid foundation and are ready for more challenging concepts.",
    difficulty: 6,
    color: "#8B5CF6",
    icon: "Layers",
  },
  {
    id: 4,
    name: "Advanced",
    description:
      "Designed for experienced learners who want to master complex topics and advanced techniques.",
    difficulty: 8,
    color: "#F59E0B",
    icon: "Award",
  },
  {
    id: 5,
    name: "Expert",
    description:
      "For experts who want to push the boundaries and explore cutting-edge concepts.",
    difficulty: 10,
    color: "#DC2626",
    icon: "Star",
  },
];

export const courses = [
  {
    id: 1,
    title: "React Fundamentals",
    description:
      "Learn the basics of React and how to build functional web applications.",
    category: "Web Development",
    level: "Beginner",
    price: 99.99,
    duration: "40 hours",
    topics: ["React", "Redux", "React Router", "JavaScript"],
    imageUrl:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=2070&q=80",
    instructor: "John Doe",
    students: 0,
    rating: 4.8,
  },
  {
    id: 2,
    title: "Python Data Analysis",
    description: "Master Python for data analysis, including Pandas and NumPy.",
    category: "Data Science",
    level: "Intermediate",
    price: 89.99,
    duration: "35 hours",
    topics: ["Python", "Pandas", "NumPy", "Machine Learning"],
    imageUrl:
      "https://images.unsplash.com/photo-1514070706115-47c142769603?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGF5dGhvbiUyMHByb2dyYW1taW5nfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600",
    instructor: "Mike Doe",
    students: 0,
    rating: 4.7,
  },
  {
    id: 3,
    title: "Flutter Mobile Apps",
    description:
      "Build cross-platform mobile applications using Flutter and Dart.",
    category: "Mobile Development",
    level: "Advanced",
    price: 79.99,
    duration: "45 hours",
    topics: ["Flutter", "Dart", "Mobile Development", "UI/UX"],
    imageUrl:
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=2074&q=80",
    instructor: "Sarah Wilson",
    students: 0,
    rating: 4.6,
  },
  {
    id: 4,
    title: "UI and UX Design",
    description:
      "Learn the fundamentals of user interface and user experience design.",
    category: "Design",
    level: "General",
    price: 69.99,
    duration: "30 hours",
    topics: ["UI Design", "UX Research", "Figma", "Prototyping"],
    imageUrl:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=2070&q=80",
    instructor: "David Brown",
    students: 0,
    rating: 4.5,
  },
  {
    id: 5,
    title: "Next.js Full Stack Bootcamp",
    description: "Build full-stack web apps using Next.js, Node, and MongoDB.",
    category: "Web Development",
    level: "Advanced",
    price: 119.99,
    duration: "55 hours",
    topics: ["Next.js", "Node.js", "MongoDB", "API Integration"],
    imageUrl:
      "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=2070&q=80",
    instructor: "James Carter",
    students: 0,
    rating: 4.9,
  },
  {
    id: 6,
    title: "Data Visualization with Power BI",
    description:
      "Create insightful dashboards using Power BI and data storytelling.",
    category: "Data Science",
    level: "Beginner",
    price: 59.99,
    duration: "25 hours",
    topics: ["Power BI", "Data Visualization", "DAX", "Reporting"],
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2070&q=80",
    instructor: "Sophia Green",
    students: 0,
    rating: 4.6,
  },
  {
    id: 7,
    title: "Kotlin Android Development",
    description: "Develop Android apps with Kotlin and Jetpack Compose.",
    category: "Mobile Development",
    level: "Intermediate",
    price: 89.99,
    duration: "40 hours",
    topics: ["Kotlin", "Android Studio", "Jetpack Compose", "Firebase"],
    imageUrl:
      "https://images.unsplash.com/photo-1649835152887-c62f625bdfc7?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fEtvdGxpbiUyMEFuZHJvaWQlMjBEZXZlbG9wbWVudHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&q=60&w=600",
    instructor: "Liam White",
    students: 0,
    rating: 4.7,
  },
  {
    id: 8,
    title: "Advanced Machine Learning",
    description: "Master deep learning, neural networks, and AI model tuning.",
    category: "Data Science",
    level: "Expert",
    price: 149.99,
    duration: "70 hours",
    topics: ["Deep Learning", "TensorFlow", "PyTorch", "AI Models"],
    imageUrl:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=2070&q=80",
    instructor: "Emma Johnson",
    students: 0,
    rating: 4.9,
  },
  {
    id: 9,
    title: "Responsive Web Design",
    description: "Design mobile-friendly and accessible web interfaces.",
    category: "Web Development",
    level: "General",
    price: 49.99,
    duration: "20 hours",
    topics: ["HTML", "CSS", "Accessibility", "Flexbox"],
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2070&q=80",
    instructor: "Noah King",
    students: 0,
    rating: 4.5,
  },
  {
    id: 10,
    title: "Pro Figma Design System",
    description: "Learn how to build scalable design systems with Figma.",
    category: "Design",
    level: "Intermediate",
    price: 74.99,
    duration: "28 hours",
    topics: ["Figma", "Design Systems", "Components", "UI Kits"],
    imageUrl:
      "https://images.unsplash.com/photo-1581276879432-15a71c6247d3?auto=format&fit=crop&w=2070&q=80",
    instructor: "Lucas Brown",
    students: 0,
    rating: 4.6,
  },
  {
    id: 11,
    title: "iOS Development with SwiftUI",
    description: "Create modern iOS applications using Swift and SwiftUI.",
    category: "Mobile Development",
    level: "Advanced",
    price: 99.99,
    duration: "48 hours",
    topics: ["Swift", "SwiftUI", "iOS Frameworks", "Core Data"],
    imageUrl:
      "https://images.unsplash.com/photo-1607250281164-3253bea7732d?auto=format&fit=crop&w=2070&q=80",
    instructor: "Olivia Davis",
    students: 0,
    rating: 4.8,
  },
  {
    id: 12,
    title: "Web Performance Optimization",
    description: "Boost your website’s speed, SEO, and Core Web Vitals.",
    category: "Web Development",
    level: "Expert",
    price: 109.99,
    duration: "32 hours",
    topics: ["Performance", "SEO", "Lighthouse", "Caching"],
    imageUrl:
      "https://images.unsplash.com/photo-1587620931295-4b88a1e73c73?auto=format&fit=crop&w=2070&q=80",
    instructor: "Ethan Moore",
    students: 0,
    rating: 4.7,
  },
];

export const getCoursesByCategory = (category) =>
  courses.filter((c) => c.category === category);

export const getCoursesByLevel = (level) =>
  courses.filter((c) => c.level === level);

export const getCourseById = (id) => courses.find((c) => c.id === id);
