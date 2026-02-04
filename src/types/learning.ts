export type ILearningObjectProduct = {
  productId: number;
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
  tags?: string;
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

export type ILearningPathObject = {
  duration: any;
  id?: string;
  learningPathModuleId?: string;
  learningObjectId?: string;
  order: number;
  isOptional: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  learningObject?: ILearningObject;
};

export type ILearningPathModule = {
  id?: string;
  name?: string;
  order: number;
  competencyId?: string;
  skillLevelId?: string;
  difficultyLevelId?: string;
  learningPathId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  learningObjects: ILearningPathObject[];
  skill?: {
    id: string;
    name: string;
    color?: string;
  } | null;
  skillLevel?: {
    id: string;
    name: string;
    levelOrder?: number;
  } | null;
  difficultyLevel?: {
    id: string;
    name: string;
  } | null;
};

export type ILearningPath = {
  id: string;
  name: string;
  description?: string;
  bannerUrl?: string;
  videoUrl?: string;
  positionName?: string;
  jobPositionId?: string;
  isActive?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
  modules?: ILearningPathModule[];
  moduleCount?: number;
  courseCount?: number;
  position?: {
    id: string;
    name: string;
    abbreviation?: string;
    description?: string;
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
  name: string;
  description?: string;
  duration?: string;
  price?: number;
  isFree?: boolean;
  isActive?: boolean;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  categoryName?: string;
  difficultyLevelName?: string;
  tags?: string;
  createdAt?: Date | string;
  priceDiscount?: number;
  videoUrl?: string;
  isStudentLimited?: boolean;
  studentLimit?: string;
  objective?: string;
  skillsToAcquire?: string;
  whatYouWillLearn?: string;
  categoryId?: string;
  difficultyLevelId?: string;
  courseLmsId?: string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
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
};

export type IProductCourseTableFilters = {
  name: string;
  status: string;
  categoryId: string;
  difficultyLevelId: string;
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
// Learning Path Assignments Types
export type ILearningPathAssignment = {
  assignmentId: string;
  status: string;
  progress: string;
  assignedAt: string;
  learningPath: ILearningPath;
};