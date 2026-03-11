// Mock data for personal dashboard

// Learning Paths Data (3 paths)
export const _personalLearningPaths = [
  {
    id: '1',
    name: 'Liderazgo Digital',
    progress: 75,
    totalCourses: 3,
    completedCourses: 2,
    status: 'inProgress',
    color: '#00AB55',
  },
  {
    id: '2', 
    name: 'Desarrollo Frontend',
    progress: 100,
    totalCourses: 3,
    completedCourses: 3,
    status: 'completed',
    color: '#FFC107',
  },
  {
    id: '3',
    name: 'Gestión de Proyectos Ágiles',
    progress: 33,
    totalCourses: 3,
    completedCourses: 1,
    status: 'inProgress',
    color: '#3366FF',
  },
];

// Personal Points/Rewards Data
export const _personalPoints = {
  totalEarned: 2450,
  totalSpent: 780,
  availableBalance: 1670,
  monthlyEarned: 340,
  monthlySpent: 120,
};

// Personal Licenses Data
export const _personalLicenses = [
  {
    id: '1',
    name: 'Microsoft Office 365',
    status: 'active',
    expirationDate: '2025-08-15',
    daysRemaining: 302,
  },
  {
    id: '2',
    name: 'Adobe Creative Suite',
    status: 'expiring',
    expirationDate: '2025-01-20',
    daysRemaining: 25,
  },
];

// Personal Equipment Data
export const _personalEquipment = {
  assigned: [
    { name: 'Laptop HP EliteBook', id: 'LP001', assignedDate: '2024-01-15' },
    { name: 'Monitor Dell 24"', id: 'MN002', assignedDate: '2024-01-15' },
    { name: 'Mouse Logitech MX', id: 'MS003', assignedDate: '2024-02-01' },
  ],
  available: [
    { name: 'Tablet Samsung', id: 'TB004' },
    { name: 'Webcam Logitech', id: 'WC005' },
    { name: 'Audífonos Sony', id: 'AU006' },
  ],
};

// Personal Courses Data (9 courses total across 3 paths)
export const _personalCourses = [
  // Liderazgo Digital (3 courses)
  {
    id: '1',
    name: 'Fundamentos del Liderazgo',
    learningPath: 'Liderazgo Digital',
    learningPathId: '1',
    status: 'completed',
    startDate: '2024-01-10',
    completionDate: '2024-02-15',
    score: 92,
    duration: '20 horas',
  },
  {
    id: '2',
    name: 'Liderazgo en la Era Digital',
    learningPath: 'Liderazgo Digital',
    learningPathId: '1',
    status: 'completed',
    startDate: '2024-02-20',
    completionDate: '2024-03-25',
    score: 88,
    duration: '25 horas',
  },
  {
    id: '3',
    name: 'Gestión de Equipos Remotos',
    learningPath: 'Liderazgo Digital',
    learningPathId: '1',
    status: 'inProgress',
    startDate: '2024-04-01',
    completionDate: null,
    score: null,
    duration: '30 horas',
    progress: 60,
  },
  
  // Desarrollo Frontend (3 courses)
  {
    id: '4',
    name: 'HTML5 y CSS3 Avanzado',
    learningPath: 'Desarrollo Frontend',
    learningPathId: '2',
    status: 'completed',
    startDate: '2024-02-01',
    completionDate: '2024-03-01',
    score: 95,
    duration: '40 horas',
  },
  {
    id: '5',
    name: 'JavaScript ES6+',
    learningPath: 'Desarrollo Frontend',
    learningPathId: '2',
    status: 'completed',
    startDate: '2024-03-05',
    completionDate: '2024-04-10',
    score: 90,
    duration: '50 horas',
  },
  {
    id: '6',
    name: 'React & TypeScript',
    learningPath: 'Desarrollo Frontend',
    learningPathId: '2',
    status: 'completed',
    startDate: '2024-04-15',
    completionDate: '2024-06-20',
    score: 93,
    duration: '60 horas',
  },

  // Gestión de Proyectos Ágiles (3 courses)
  {
    id: '7',
    name: 'Introducción a Scrum',
    learningPath: 'Gestión de Proyectos Ágiles',
    learningPathId: '3',
    status: 'completed',
    startDate: '2024-05-01',
    completionDate: '2024-05-30',
    score: 87,
    duration: '25 horas',
  },
  {
    id: '8',
    name: 'Kanban y Lean Principles',
    learningPath: 'Gestión de Proyectos Ágiles',
    learningPathId: '3',
    status: 'pending',
    startDate: null,
    completionDate: null,
    score: null,
    duration: '20 horas',
  },
  {
    id: '9',
    name: 'Certificación Scrum Master',
    learningPath: 'Gestión de Proyectos Ágiles',
    learningPathId: '3',
    status: 'pending',
    startDate: null,
    completionDate: null,
    score: null,
    duration: '35 horas',
  },
];

// Personal Competency Scores (for radar chart) - más volátil
export const _personalCompetencyScores = [
  { name: 'talent.competencyRadar.categories.liderazgo', score: 65, target: 80 },
  { name: 'talent.competencyRadar.categories.trabajoEnEquipo', score: 92, target: 80 },
  { name: 'talent.competencyRadar.categories.comunicacion', score: 78, target: 80 },
  { name: 'talent.competencyRadar.categories.innovacion', score: 45, target: 80 },
  { name: 'talent.competencyRadar.categories.resolucionDeProblemas', score: 88, target: 80 },
  { name: 'talent.competencyRadar.categories.adaptabilidad', score: 72, target: 80 },
  { name: 'talent.competencyRadar.categories.gestionDeProyectos', score: 55, target: 80 },
  { name: 'talent.competencyRadar.categories.analisisDeDatos', score: 38, target: 80 },
];

// Personal Competency Distribution - basada en las 8 competencias del radar
export const _personalCompetencyLevels = [
  { 
    id: '1',
    name: 'talent.competencyRadar.categories.liderazgo', 
    score: 65, 
    level: 'talent.competencyRadar.levels.medio' as const,
    color: '#FFC107' 
  },
  { 
    id: '2',
    name: 'talent.competencyRadar.categories.trabajoEnEquipo', 
    score: 92, 
    level: 'talent.competencyRadar.levels.alto' as const,
    color: '#00AB55' 
  },
  { 
    id: '3',
    name: 'talent.competencyRadar.categories.comunicacion', 
    score: 78, 
    level: 'talent.competencyRadar.levels.alto' as const,
    color: '#00AB55' 
  },
  { 
    id: '4',
    name: 'talent.competencyRadar.categories.innovacion', 
    score: 45, 
    level: 'talent.competencyRadar.levels.bajo' as const,
    color: '#FF5630' 
  },
  { 
    id: '5',
    name: 'talent.competencyRadar.categories.resolucionDeProblemas', 
    score: 88, 
    level: 'talent.competencyRadar.levels.alto' as const,
    color: '#00AB55' 
  },
  { 
    id: '6',
    name: 'talent.competencyRadar.categories.adaptabilidad', 
    score: 72, 
    level: 'talent.competencyRadar.levels.alto' as const,
    color: '#00AB55' 
  },
  { 
    id: '7',
    name: 'talent.competencyRadar.categories.gestionDeProyectos', 
    score: 55, 
    level: 'talent.competencyRadar.levels.medio' as const,
    color: '#FFC107' 
  },
  { 
    id: '8',
    name: 'talent.competencyRadar.categories.analisisDeDatos', 
    score: 38, 
    level: 'talent.competencyRadar.levels.bajo' as const,
    color: '#FF5630' 
  },
];

// Personal KPIs Summary
export const _personalKPIs = {
  coursesEnrolled: 9,
  coursesCompleted: 6,
  coursesPending: 2,
  coursesInProgress: 1,
  averageScore: 90.8,
  totalLearningHours: 305,
  completedLearningHours: 255,
  activeLearningPaths: 3,
  completedLearningPaths: 1,
};

// Personal Resource Status for chart
export const _personalResourceStatus = [
  { label: 'Licencias Activas', value: 1 },
  { label: 'Licencias por Vencer', value: 1 },
  { label: 'Equipos Asignados', value: 3 },
  { label: 'Equipos Disponibles', value: 2 },
];

// Structured data for the new personal courses table
export const _personalLearningPathsWithCourses = [
  {
    id: '1',
    name: 'Liderazgo Digital',
    progress: 75,
    totalCourses: 3,
    completedCourses: 2,
    status: 'inProgress',
    courses: [
      {
        id: '1',
        name: 'Fundamentos del Liderazgo',
        status: 'completed',
        startDate: '2024-01-10',
        score: 92,
        duration: '20 horas',
      },
      {
        id: '2',
        name: 'Liderazgo en la Era Digital',
        status: 'completed',
        startDate: '2024-02-20',
        score: 88,
        duration: '25 horas',
      },
      {
        id: '3',
        name: 'Gestión de Equipos Remotos',
        status: 'inProgress',
        startDate: '2024-04-01',
        score: null,
        duration: '30 horas',
        progress: 60,
      },
    ],
  },
  {
    id: '2',
    name: 'Desarrollo Frontend',
    progress: 100,
    totalCourses: 3,
    completedCourses: 3,
    status: 'completed',
    courses: [
      {
        id: '4',
        name: 'HTML5 y CSS3 Avanzado',
        status: 'completed',
        startDate: '2024-02-01',
        score: 95,
        duration: '40 horas',
      },
      {
        id: '5',
        name: 'JavaScript ES6+',
        status: 'completed',
        startDate: '2024-03-05',
        score: 90,
        duration: '50 horas',
      },
      {
        id: '6',
        name: 'React & TypeScript',
        status: 'completed',
        startDate: '2024-04-15',
        score: 93,
        duration: '60 horas',
      },
    ],
  },
  {
    id: '3',
    name: 'Gestión de Proyectos Ágiles',
    progress: 33,
    totalCourses: 3,
    completedCourses: 1,
    status: 'inProgress',
    courses: [
      {
        id: '7',
        name: 'Introducción a Scrum',
        status: 'completed',
        startDate: '2024-05-01',
        score: 87,
        duration: '25 horas',
      },
      {
        id: '8',
        name: 'Kanban y Lean Principles',
        status: 'pending',
        startDate: null,
        score: null,
        duration: '20 horas',
      },
      {
        id: '9',
        name: 'Certificación Scrum Master',
        status: 'pending',
        startDate: null,
        score: null,
        duration: '35 horas',
      },
    ],
  },
];
