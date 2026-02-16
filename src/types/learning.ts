export type ILearningObjectProduct = {
  productId: number | string;
  name: string;
  description?: string;
  duration?: string;
  imageUrl?: string;
  videoUrl?: string;
  bannerUrl?: string;
  isStudentLimited?: boolean;
  studentLimit?: number;
  objective?: string;
  skillsToAcquire?: string;
  whatYouWillLearn?: string;
  isActive?: boolean;
  isFree?: boolean;
  price?: number;
  priceDiscount?: number;
  tags?: string[] | string; // Puede ser array o string
  order: number;
  // Campos para cursos de programas
  id?: string;
  lmsCourseId?: string;
  fullName?: string;
  isEkorp?: string; // "true" | "false" como string
  category?: {
    id: string;
    name: string;
    abreviation?: string;
    logo?: string | null;
  };
  difficultyLevel?: {
    id: string;
    name: string;
    levelOrder?: number;
  };
  courseLms?: {
    id: string;
    fullName: string;
    displayName?: string;
    codeCourse?: string;
    description?: string | null;
    lmsCourseId?: string;
    integrationId?: string;
  };
};

export type ILearningObject = {
  id: string;
  name: string;
  duration?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  bannerUrl?: string;
  isStudentLimited?: boolean;
  studentLimit?: string;
  objective?: string;
  skillsToAcquire?: string;
  whatYouWillLearn?: string;
  difficultyLevelId?: string;
  categoryId?: string;
  isActive?: boolean;
  isFree?: boolean;
  price?: number;
  priceDiscount?: number;
  tags?: string | string[];
  courseLmsId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  // Relaciones anidadas
  category?: {
    id: string;
    name: string;
    abreviation?: string;
    logo?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
  };
  difficultyLevel?: {
    id: string;
    name: string;
    levelOrder?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    deletedAt?: Date | string | null;
  };
  courseLms?: {
    id: string;
    fullName: string;
    displayName?: string;
    codeCourse?: string;
    description?: string | null;
    codeLanguague?: string | null;
    categorylmsId?: string;
    categorylmsName?: string | null;
    lmsCourseId?: string;
    integrationId?: string;
  };
  // Legacy fields - mantener para compatibilidad con vistas antiguas
  order?: number;
  products?: ILearningObjectProduct[];
  courses?: ILearningObjectProduct[];
  categoryName?: string;
  difficultyLevelName?: string;
  productImage?: string | null;
  coursesCount?: number;
};

export type ILearningObjectTableFilters = {
  name: string;
  status: string;
  order?: string;
  learningPathId?: string | null;
};

export type ILearningObjectTableFilterValue = string | string[];

export type ILearningObjectPaginationResponse = {
  data: ILearningObject[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

export type ILearningCategory = {
  id: string;
  name: string;
  abreviation?: string;
  logo?: string | null;
};

export type ILearningDifficultyLevel = {
  id: string;
  name: string;
  levelOrder?: number;
};

export type ILearningCourseLms = {
  id: string;
  fullName: string;
  displayName?: string;
  codeCourse?: string;
  description?: string | null;
  lmsCourseId?: string;
  integrationId?: string;
};

// Learning Paths Types
export type IPosition = {
  id: string;
  name: string;
  description?: string;
  abbreviation?: string;
};

// Curso dentro de un Learning Object en Learning Path
export type ILearningPathCourse = {
  id: string;
  name: string;
  duration: string;
  description: string;
  imageUrl: string;
  tags: string; // Nueva API retorna tags como string
  order: number;
};

export type ILearningPathObject = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  order: number;
  courses: ILearningPathCourse[]; // Nueva estructura: cursos dentro de learningObjects
  // Compatibilidad con estructura anterior
  duration?: any;
  learningPathModuleId?: string;
  learningObjectId?: string;
  isOptional?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  learningObject?: ILearningObject;
};

export type ILearningPathModule = {
  id: string;
  competencyName: string; // Nueva API: nombre de competencia directamente
  skillLevelName: string; // Nueva API: nombre de nivel de habilidad directamente
  order: number;
  learningObjects: ILearningPathObject[]; // Nueva estructura con courses anidados
  // Compatibilidad con estructura anterior y campos adicionales de GetLearningPathsByIdService
  name?: string;
  competencyId?: string;
  skillLevelId?: string;
  difficultyLevelId?: string;
  learningPathId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  // Nueva API: objetos completos de competencia y nivel de habilidad
  competency?: {
    id: number;
    code: string;
    name: string;
    description: string;
    type: string;
    color?: string | null;
    expectedLevel?: number;
  };
  skillLevel?: {
    id: string;
    name: string;
    levelOrder?: number;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string | null;
  } | null;
  // Compatibilidad legacy
  skill?: {
    id: string;
    name: string;
    color?: string;
  } | null;
  difficultyLevel?: {
    id: string;
    name: string;
  } | null;
};

export type ILearningPath = {
  id: string;
  name: string;
  description: string;
  bannerUrl: string;
  videoUrl: string;
  isActive: boolean;
  modules: ILearningPathModule[];
  // Compatibilidad con estructura anterior
  positionName?: string;
  jobPositionId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  moduleCount?: number;
  courseCount?: number;
  position?: {
    id: string;
    name: string;
    abbreviation?: string;
    description?: string;
  };
  // Nueva API: información de puesto de trabajo (job)
  job?: {
    id: number;
    name: string;
    code?: string;
    objectives?: string;
    expectedResults?: string;
    requirements?: string;
    otherFunctions?: string;
    numberOfPositions?: number | null;
    numberOfHoursPerPosition?: number | null;
    academicProfile?: string | null;
    psychologicalProfile?: string | null;
    internalRelationship?: string | null;
    externalRelationship?: string | null;
    economicResponsibility?: string | null;
    equipmentResponsibility?: string | null;
    informationResponsibility?: string | null;
    minimumAcademicLevel?: string;
    desiredAcademicLevel?: string;
    minimumExperience?: string;
    desiredExperience?: string;
    knowledge?: string | null;
    otherRequirements?: string | null;
    supervises?: string;
    regionalLocation?: string;
    headquarters?: string;
    competencies?: string | null;
    decisions?: string | null;
    version?: string;
    actorStatus?: string | null;
    organizationalUnitId?: string;
  };
};

export type ILearningPathTableFilters = {
  name: string;
  status: string;
  order?: string;
  positionId?: string;
};

export type ILearningPathTableFilterValue = string | string[];

export type ILearningPathPaginationResponse = {
  data: ILearningPath[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};


// ----------------------------------------------------------------------

export type ILearningCategories = {
  id: string;
  name: string;
  description: string;
  abreviation: string;
  logo?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type ILearningCategoriesTableFilters = {
  name: string;
  description?: string;
  abreviation?: string;
  logo?: string | null;
  status?: string;
};

export type ILearningCategoriesTableFilterValue = string | string[];


// ----------------------------------------------------------------------
// Product Courses Types

export type IProductCourse = {
  id: string;
  lmsCourseId: string;
  displayName: string;
  codeCourse: string;
  shortDescription: string;
  codeLanguague: string;
  image: string;
  integrationName: string;
  isActive: boolean;
};

export type IProductCourseTableFilters = {
  search: string;
  includeInactive: boolean;
  order: string;
  instanceId: string | null;
  instanceName?: string;
};

export type IProductCourseTableFilterValue = string | string[];

export type IProductCoursePaginationResponse = {
  data: IProductCourse[];
  meta: {
    page: number;
    perPage: number;
    itemCount: number;
    pageCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};


// ----------------------------------------------------------------------
// Learning Path Assignments Types (nueva estructura de API)
export type ILearningPathAssignment = {
  assignmentId: string;
  status: string;
  progress: string;
  assignedAt: string;
  learningPath: ILearningPath;
};

export type ILearningPathAssignmentPaginationResponse = {
  data: ILearningPathAssignment[];
  meta: {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
};