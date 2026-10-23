export const categories = [
  {
    id: 1,
    name: "Web Development",
    icon: "🌐",
    description: "Learn modern web development technologies and frameworks",
  },
  {
    id: 2,
    name: "Mobile Development",
    icon: "📱",
    description: "Build native and cross-platform mobile applications",
  },
  {
    id: 3,
    name: "Data Science",
    icon: "📊",
    description: "Master data analysis, machine learning, and AI",
  },
  {
    id: 4,
    name: "UI/UX Design",
    icon: "🎨",
    description: "Create beautiful and user-friendly interfaces",
  },
  {
    id: 5,
    name: "DevOps",
    icon: "⚙️",
    description: "Learn deployment, automation, and infrastructure",
  },
  {
    id: 6,
    name: "Cybersecurity",
    icon: "🔒",
    description: "Protect systems and networks from digital attacks",
  },
];

export const courses = [
  {
    id: 1,
    title: "Complete Web Development Bootcamp",
    description:
      "Master HTML, CSS, JavaScript, React, Node.js, and more in this comprehensive course.",
    category: "Web Development",
    price: 99.99,
    rating: 4.8,
    students: 12500,
    duration: "48 hours",
    level: "Beginner to Advanced",
    instructor: "Sarah Johnson",
    image: "/src/assets/web-dev.png",
    topics: ["HTML5", "CSS3", "JavaScript", "React", "Node.js", "MongoDB"],
  },
  {
    id: 2,
    title: "iOS App Development with Swift",
    description:
      "Build professional iOS applications using Swift and SwiftUI framework.",
    category: "Mobile Development",
    price: 89.99,
    rating: 4.7,
    students: 8500,
    duration: "36 hours",
    level: "Intermediate",
    instructor: "Michael Chen",
    image: "/src/assets/ios-dev.png",
    topics: ["Swift", "SwiftUI", "iOS Development", "Xcode", "Core Data"],
  },
  {
    id: 3,
    title: "Data Science and Machine Learning",
    description:
      "Learn data analysis, visualization, and machine learning algorithms.",
    category: "Data Science",
    price: 129.99,
    rating: 4.9,
    students: 15000,
    duration: "60 hours",
    level: "Advanced",
    instructor: "Emily Davis",
    image: "/src/assets/data-science.png",
    topics: ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow"],
  },
  {
    id: 4,
    title: "UI/UX Design Masterclass",
    description:
      "Master the principles of user interface and user experience design.",
    category: "UI/UX Design",
    price: 79.99,
    rating: 4.6,
    students: 9200,
    duration: "42 hours",
    level: "Beginner to Intermediate",
    instructor: "David Wilson",
    image: "/src/assets/ui-ux.png",
    topics: [
      "Figma",
      "Adobe XD",
      "User Research",
      "Wireframing",
      "Prototyping",
    ],
  },
  {
    id: 5,
    title: "DevOps and CI/CD Pipeline",
    description:
      "Learn modern DevOps practices, tools, and continuous integration/deployment.",
    category: "DevOps",
    price: 109.99,
    rating: 4.7,
    students: 7800,
    duration: "45 hours",
    level: "Intermediate to Advanced",
    instructor: "Alex Thompson",
    image: "/src/assets/devops.png",
    topics: ["Docker", "Kubernetes", "Jenkins", "AWS", "Terraform"],
  },
  {
    id: 6,
    title: "Cybersecurity Fundamentals",
    description: "Learn essential cybersecurity concepts and best practices.",
    category: "Cybersecurity",
    price: 119.99,
    rating: 4.8,
    students: 6500,
    duration: "54 hours",
    level: "Beginner to Advanced",
    instructor: "Lisa Anderson",
    image: "/src/assets/cybersecurity.png",
    topics: [
      "Network Security",
      "Ethical Hacking",
      "Cryptography",
      "Security Tools",
    ],
  },
];

export const featuredCourses = courses.filter((course) => course.rating >= 4.8);

export const getCoursesByCategory = (category) => {
  return courses.filter((course) => course.category === category);
};

export const getCourseById = (id) => {
  return courses.find((course) => course.id === id);
};
