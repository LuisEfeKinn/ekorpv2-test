// ----------------------------------------------------------------------

export interface TalentKPIs {
  totalEmployees: number;
  avgCompetencyScore: number;
  completedTrainings: number;
  openPositions: number; // Equipos asignados
  retentionRate: number; // Rutas de aprendizaje activas
  jobSatisfaction: number; // Licencias por vencer
}

export interface CompetencyScore {
  name: string;
  score: number;
  target: number;
}

export interface CompetencyLevel {
  id: string;
  name: string;
  score: number;
  level: 'talent.competencyRadar.levels.alto' | 'talent.competencyRadar.levels.medio' | 'talent.competencyRadar.levels.bajo';
}

export interface Training {
  id: string;
  employeeName: string;
  avatar: string;
  course: string;
  completedDate: string;
  status: 'talent.recentTrainings.statuses.completed' | 'talent.recentTrainings.statuses.inProgress' | 'talent.recentTrainings.statuses.pending';
  score: number;
}

export interface LearningPathProgress {
  label: string;
  value: number;
}

export interface ResourceStatus {
  label: string;
  value: number;
}

export interface PerformanceReview {
  id: string;
  employeeName: string;
  avatar: string;
  position: string;
  department: string;
  overallScore: number;
  productivity: number;
  quality: number;
  collaboration: number;
  lastReview: string;
  status: 'talent.performanceReviews.statuses.excellent' | 'talent.performanceReviews.statuses.good' | 'talent.performanceReviews.statuses.regular' | 'talent.performanceReviews.statuses.needsImprovement';
}

export interface NineBoxEmployee {
  id: string;
  name: string;
  avatar: string;
  position: string;
  email: string;
  performance: number; // 1-3 (1=Bajo, 2=Medio, 3=Alto)
  potential: number; // 1-3 (1=Bajo, 2=Medio, 3=Alto)
  category: string; // Categoría de la matriz
}

// ----------------------------------------------------------------------

export const BASE_AVATAR_URL = 'https://api-prod-minimal-v700.pages.dev';

export const _talentKPIs: TalentKPIs = {
  totalEmployees: 247,
  avgCompetencyScore: 78.5,
  completedTrainings: 142,
  openPositions: 156, // Ahora representa equipos asignados
  retentionRate: 45, // Ahora representa rutas de aprendizaje activas
  jobSatisfaction: 8, // Ahora representa licencias por vencer
};

export const _competencyScores: CompetencyScore[] = [
  { name: 'talent.competencyRadar.categories.liderazgo', score: 82, target: 80 },
  { name: 'talent.competencyRadar.categories.trabajoEnEquipo', score: 88, target: 80 },
  { name: 'talent.competencyRadar.categories.comunicacion', score: 75, target: 80 },
  { name: 'talent.competencyRadar.categories.innovacion', score: 71, target: 80 },
  { name: 'talent.competencyRadar.categories.resolucionDeProblemas', score: 79, target: 80 },
  { name: 'talent.competencyRadar.categories.adaptabilidad', score: 84, target: 80 },
  { name: 'talent.competencyRadar.categories.gestionDeProyectos', score: 76, target: 80 },
  { name: 'talent.competencyRadar.categories.analisisDeDatos', score: 73, target: 80 },
];

export const _competencyLevels: CompetencyLevel[] = [
  { id: '1', name: 'talent.competencyRadar.categories.liderazgo', score: 82, level: 'talent.competencyRadar.levels.alto' },
  { id: '2', name: 'talent.competencyRadar.categories.trabajoEnEquipo', score: 88, level: 'talent.competencyRadar.levels.alto' },
  { id: '3', name: 'talent.competencyRadar.categories.comunicacion', score: 75, level: 'talent.competencyRadar.levels.medio' },
  { id: '4', name: 'talent.competencyRadar.categories.innovacion', score: 71, level: 'talent.competencyRadar.levels.medio' },
  { id: '5', name: 'talent.competencyRadar.categories.resolucionDeProblemas', score: 79, level: 'talent.competencyRadar.levels.medio' },
  { id: '6', name: 'talent.competencyRadar.categories.adaptabilidad', score: 84, level: 'talent.competencyRadar.levels.alto' },
  { id: '7', name: 'talent.competencyRadar.categories.gestionDeProyectos', score: 76, level: 'talent.competencyRadar.levels.medio' },
  { id: '8', name: 'talent.competencyRadar.categories.analisisDeDatos', score: 73, level: 'talent.competencyRadar.levels.medio' },
];

export const _recentTrainings: Training[] = [
  {
    id: '1',
    employeeName: 'Ana García',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-1.webp`,
    course: 'Liderazgo Transformacional',
    completedDate: '2024-10-05',
    status: 'talent.recentTrainings.statuses.completed',
    score: 95,
  },
  {
    id: '2',
    employeeName: 'Carlos Rodríguez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-2.webp`,
    course: 'Metodologías Ágiles',
    completedDate: '2024-10-04',
    status: 'talent.recentTrainings.statuses.completed',
    score: 88,
  },
  {
    id: '3',
    employeeName: 'María López',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-3.webp`,
    course: 'Análisis de Datos con Python',
    completedDate: '2024-10-03',
    status: 'talent.recentTrainings.statuses.inProgress',
    score: 0,
  },
  {
    id: '4',
    employeeName: 'Juan Martínez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-4.webp`,
    course: 'Comunicación Asertiva',
    completedDate: '2024-10-02',
    status: 'talent.recentTrainings.statuses.completed',
    score: 92,
  },
  {
    id: '5',
    employeeName: 'Laura Hernández',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-5.webp`,
    course: 'Gestión del Cambio',
    completedDate: '2024-10-01',
    status: 'talent.recentTrainings.statuses.completed',
    score: 87,
  },
  {
    id: '6',
    employeeName: 'Pedro Sánchez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-6.webp`,
    course: 'Inteligencia Emocional',
    completedDate: '2024-09-30',
    status: 'talent.recentTrainings.statuses.pending',
    score: 0,
  },
  {
    id: '7',
    employeeName: 'Sofia Ramírez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-7.webp`,
    course: 'Design Thinking',
    completedDate: '2024-09-29',
    status: 'talent.recentTrainings.statuses.completed',
    score: 90,
  },
  {
    id: '8',
    employeeName: 'Diego Torres',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-8.webp`,
    course: 'Gestión de Conflictos',
    completedDate: '2024-09-28',
    status: 'talent.recentTrainings.statuses.completed',
    score: 85,
  },
];

export const _learningPathProgress: LearningPathProgress[] = [
  { label: 'talent.learningPaths.statuses.completed', value: 98 },
  { label: 'talent.learningPaths.statuses.inProgress', value: 85 },
  { label: 'talent.learningPaths.statuses.notStarted', value: 62 },
];

export const _resourceStatus: ResourceStatus[] = [
  { label: 'talent.resourceStatus.labels.activeLicenses', value: 148 },
  { label: 'talent.resourceStatus.labels.expiringLicenses', value: 8 },
  { label: 'talent.resourceStatus.labels.assignedEquipment', value: 156 },
  { label: 'talent.resourceStatus.labels.availableEquipment', value: 23 },
];

export const _performanceReviews: PerformanceReview[] = [
  {
    id: '1',
    employeeName: 'Ana García',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-1.webp`,
    position: 'Gerente de Proyectos',
    department: 'Tecnología',
    overallScore: 92,
    productivity: 95,
    quality: 90,
    collaboration: 91,
    lastReview: '2024-09-15',
    status: 'talent.performanceReviews.statuses.excellent',
  },
  {
    id: '2',
    employeeName: 'Carlos Rodríguez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-2.webp`,
    position: 'Desarrollador Senior',
    department: 'Desarrollo',
    overallScore: 88,
    productivity: 90,
    quality: 87,
    collaboration: 87,
    lastReview: '2024-09-20',
    status: 'talent.performanceReviews.statuses.excellent',
  },
  {
    id: '3',
    employeeName: 'María López',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-3.webp`,
    position: 'Analista de Datos',
    department: 'Analytics',
    overallScore: 85,
    productivity: 88,
    quality: 85,
    collaboration: 82,
    lastReview: '2024-09-10',
    status: 'talent.performanceReviews.statuses.good',
  },
  {
    id: '4',
    employeeName: 'Juan Martínez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-4.webp`,
    position: 'Diseñador UX',
    department: 'Diseño',
    overallScore: 78,
    productivity: 80,
    quality: 82,
    collaboration: 72,
    lastReview: '2024-09-25',
    status: 'talent.performanceReviews.statuses.good',
  },
  {
    id: '5',
    employeeName: 'Laura Hernández',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-5.webp`,
    position: 'Especialista en Marketing',
    department: 'Marketing',
    overallScore: 82,
    productivity: 85,
    quality: 80,
    collaboration: 81,
    lastReview: '2024-09-18',
    status: 'talent.performanceReviews.statuses.good',
  },
  {
    id: '6',
    employeeName: 'Pedro Sánchez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-6.webp`,
    position: 'Contador',
    department: 'Finanzas',
    overallScore: 70,
    productivity: 72,
    quality: 68,
    collaboration: 70,
    lastReview: '2024-09-12',
    status: 'talent.performanceReviews.statuses.regular',
  },
];

export const _nineBoxEmployees: NineBoxEmployee[] = [
  {
    id: '1',
    name: 'Ana García',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-1.webp`,
    position: 'Gerente de Proyectos',
    email: 'ana.garcia@company.com',
    performance: 3,
    potential: 3,
    category: 'Estrella',
  },
  {
    id: '2',
    name: 'Carlos Rodríguez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-2.webp`,
    position: 'Desarrollador Senior',
    email: 'carlos.rodriguez@company.com',
    performance: 3,
    potential: 3,
    category: 'Estrella',
  },
  {
    id: '3',
    name: 'María López',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-3.webp`,
    position: 'Analista de Datos',
    email: 'maria.lopez@company.com',
    performance: 2,
    potential: 3,
    category: 'Alto Potencial',
  },
  {
    id: '4',
    name: 'Roberto Silva',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-9.webp`,
    position: 'Designer UX/UI',
    email: 'roberto.silva@company.com',
    performance: 2,
    potential: 3,
    category: 'Alto Potencial',
  },
  {
    id: '5',
    name: 'Laura Hernández',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-5.webp`,
    position: 'Especialista Marketing',
    email: 'laura.hernandez@company.com',
    performance: 3,
    potential: 2,
    category: 'Profesional Clave',
  },
  {
    id: '6',
    name: 'Diego Torres',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-8.webp`,
    position: 'Consultor Senior',
    email: 'diego.torres@company.com',
    performance: 3,
    potential: 2,
    category: 'Profesional Clave',
  },
  {
    id: '7',
    name: 'Juan Martínez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-4.webp`,
    position: 'Desarrollador',
    email: 'juan.martinez@company.com',
    performance: 2,
    potential: 2,
    category: 'Colaborador Efectivo',
  },
  {
    id: '8',
    name: 'Sofia Ramírez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-7.webp`,
    position: 'Analista',
    email: 'sofia.ramirez@company.com',
    performance: 2,
    potential: 2,
    category: 'Colaborador Efectivo',
  },
  {
    id: '9',
    name: 'Patricia Gómez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-10.webp`,
    position: 'Coordinadora',
    email: 'patricia.gomez@company.com',
    performance: 2,
    potential: 2,
    category: 'Colaborador Efectivo',
  },
  {
    id: '10',
    name: 'Luis Fernández',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-11.webp`,
    position: 'Especialista Técnico',
    email: 'luis.fernandez@company.com',
    performance: 3,
    potential: 1,
    category: 'Experto Técnico',
  },
  {
    id: '11',
    name: 'Pedro Sánchez',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-6.webp`,
    position: 'Contador',
    email: 'pedro.sanchez@company.com',
    performance: 2,
    potential: 1,
    category: 'Necesita Desarrollo',
  },
  {
    id: '12',
    name: 'Carmen Ruiz',
    avatar: `${BASE_AVATAR_URL}/assets/images/avatar/avatar-12.webp`,
    position: 'Junior Developer',
    email: 'carmen.ruiz@company.com',
    performance: 1,
    potential: 3,
    category: 'Talento Emergente',
  },
];
