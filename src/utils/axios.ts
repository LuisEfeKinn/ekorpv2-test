import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
// import dashboard from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

// Interceptor para agregar el token de autenticación automáticamente
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const accessToken =
        sessionStorage.getItem('accessToken') || sessionStorage.getItem('jwt_access_token');

      if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      sessionStorage.removeItem('jwt_access_token');
      window.location.href = paths.auth.jwt.signIn;
    }

    return Promise.reject((error.response && error.response.data) || 'Algo salió mal');
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  ai: {
    settings: {
      all: '/ai-providers',
      save: '/ai-providers',
      update: '/ai-providers',
      edit: '/ai-providers', // + /:id
      delete: '/ai-providers' // + /:id
    },
    providers: {
      all: '/ai-providers/complete',
    },
    models: {
      all: '/ai-models',
      save: '/ai-models',
      update: '/ai-models',
      edit: '/ai-models', // + /:id
      delete: '/ai-models' // + /:id
    },
    courseGenerator: {
      all: '/learning-units',
      save: '/learning-units',
      update: '/learning-units',
      edit: '/learning-units', // + /:id
      delete: '/learning-units', // + /:id
    }
  },
  file: {
    upload: '/upload-file/upload',
    delete: '/upload-file/delete'
  },
  auth: {
    me: '/user/init/data',
    login: '/auth/login',
    register: '/users/access/register',
    refresh: '/auth/refresh-token',
    changePassword: '/auth/reset-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/forgot-password'
  },
  register: {
    publicUploadDocument: '/digital-authentication/media/public-upload',
    livenessSession: '/digital-authentication/liveness/session',
    validateSession: '/digital-authentication/liveness/validateSession',
    publicUploadLiveness: '/digital-authentication/liveness/public-upload-liveness',
    sendPhoneVerificationCode: '/digital-authentication/send-phone-verification-code',
    verifyPhoneCode: '/digital-authentication/validate-phone-verification-code',
    biometricValidationVerify: '/digital-authentication/biometric-validation-verify',
    biometricValidationUpdateData: '/digital-authentication/biometric-validation-update-data',
    biometricSignIn: '/digital-authentication/login',
    // Biometric Activation User
    uploadDocument: '/digital-authentication/media/upload',
    uploadLiveness: '/digital-authentication/liveness/upload-liveness',
    biometricActivation: '/digital-authentication/onboarding/biometric-activation'
  },
  analytics: {
    licenses: 'analytics/licenses/totals',
    machine: 'analytics/machine/totals',
    licensesStates: 'analytics/licenses/states',
  },
  employees: {
    employeesTypes: {
      all: '/type-employment',
      save: '/type-employment',
      update: '/type-employment',
      edit: '/type-employment', // + /:id
      delete: '/type-employment' // + /:id
    },
    userManagment: {
      all: '/employees',
      save: '/employees',
      update: '/employees',
      edit: '/employees', // + /:id
      delete: '/employees', // + /:id
      learningPaths: {
        all: '/employees',
        assign: '/employees', // + /:id/learning-paths
        delete: '/employees/employee-learning-paths' // + /:id
      }
    },
    skills: {
      all: '/skills',
      save: '/skills',
      update: '/skills',
      edit: '/skills', // + /:id
      delete: '/skills' // + /:id
    },
    enrollments: {
      all: '/employees/course/employee-enrollments'
    }
  },
  organization: {
    company: {
      all: '/company',
      update: '/company',
      save: '/company',
      select: '/company/coins'
    },
    organizationalUnits: {
      all: '/api/organizational-unit',
      save: '/api/organizational-unit',
      update: '/api/organizational-unit',
      edit: '/api/organizational-unit', // + /:id
      delete: '/api/organizational-unit' // + /:id
    },
    organigram: {
      jobs: '/api/jobs/tree',
      organization: '/organizational-unit/tree'
    },
    positions: {
      all: '/api/jobs',
      save: '/api/jobs',
      update: '/api/jobs',
      edit: '/api/jobs', // + /:id
      delete: '/api/jobs' // + /:id
    },
    vigencies: {
      all: '/vigencies',
      save: '/vigencies',
      update: '/vigencies',
      edit: '/vigencies', // + /:id
      delete: '/vigencies', // + /:id
      periods: {
        all: '/vigencies', // + /:id/periods
        save: '/vigencies/periods',
        update: '/vigencies/periods', // + /:id
        edit: '/vigencies/periods', // + /:id
        delete: '/vigencies/periods' // + /:id
      }
    }
  },
  security: {
    roles: {
      all: '/rol',
      save: '/rol',
      update: '/rol',
      edit: '/rol', // + /:id
      delete: '/rol' // + /:id
    },
    permissions: {
      getByRole: '/items-with-permission',
      updateByRole: '/items-with-permission',
      relatedData: '/items-with-permission/related-data-form-permission',
      delete: '/items-with-permission' // + /:id
    },
    users: {
      all: '/user',
      save: '/user',
      update: '/user',
      edit: '/user', // + /:id
      delete: '/user', // + /:id
      changePassword: '/user', // + /:id/password
      pointsByLogged: '/user/points/bylogged'
    }
  },
  settings: {
    coins: {
      all: '/coins',
      save: '/coins',
      update: '/coins',
      edit: '/coins', // + /:id
      delete: '/coins' // + /:id
    },
    languages: {
      all: '/languages',
      save: '/languages',
      update: '/languages',
      edit: '/languages', // + /:id
      delete: '/languages' // + /:id
    },
    tags: {
      all: '/tags',
      save: '/tags',
      update: '/tags',
      edit: '/tags', // + /:id
      delete: '/tags' // + /:id
    },
    integrations: {
      all: '/integration-instances/paginated',
      save: '/integration-instances',
      update: '/integration-instances', // + //:instanceId
      edit: '/integration-instances', // + /:instanceId/parameters
      delete: '/integration-instances', // + /:instanceId
      sync: '/lms/instances', // + /:instanceId/synchronize
      parameters: '/integration-instances',
      categories: {
        all: '/integration-instances/paginated' // + /:instanceId/categories
      },
      courses: {
        all: '/integration-instances/paginated', // + /:instanceId/categories/:categoryLmsId/courses
      },
    },
    locations: {
      countries: '/locations/countries',
      regions: '/locations/regions', // + /:id
      municipalities: '/locations/municipalities/search' // + /:id
    },
  },
  learning: {
    courses: {
      all: '/products',
      save: '/products',
      update: '/products',
      edit: '/products', // + /:id
      delete: '/products', // + /:id
      selectSkillLevels: '/products/skill-levels',
      learningPathByEmployee: '/learning-paths/for-position-employee'
    },
    learningObjects: {
      all: '/learning-objects',
      save: '/learning-objects',
      update: '/learning-objects',
      edit: '/learning-objects', // + /:id
      delete: '/learning-objects', // + /:id
      selectCategories: '/learning-categories',
      selectLevels: '/learning-objects/skill-levels',
      selectCourses: '/lms/courses'
    },
    learningPaths: {
      all: '/learning-paths',
      save: '/learning-paths',
      update: '/learning-paths',
      edit: '/learning-paths', // + /:id
      delete: '/learning-paths', // + /:id
      forEmployee: '/learning-paths/for-employee'
    },
    learningCategories: {
      all: '/learning-categories',
      save: '/learning-categories',
      update: '/learning-categories',
      edit: '/learning-categories', // + /:id
      delete: '/learning-categories' // + /:id
    },
    positions: {
      all: '/api/jobs',
      save: '/api/jobs',
      update: '/api/jobs',
      edit: '/api/jobs', // + /:id
      delete: '/api/jobs' // + /:id
    },
    reports: {
      getReport: '/reports/enrollments-by-employee'
    }
  },
  assets: {
    inventory: {
      all: '/assets',
      save: '/assets',
      update: '/assets', // + /:id
      edit: '/assets', // + /:id
      assignEmployees: '/assets', // + /:id/assign-employees
      delete: '/assets', // + /:id
      states: '/assets/states',
      history: '/assets/history', // + /:assetId (optional)
      assignments: '/assets', // + /:id/assignments
      mine: '/assets/mine'
    },
    categories: {
      all: '/asset-categories',
      save: '/asset-categories',
      update: '/asset-categories',
      edit: '/asset-categories', // + /:id
      delete: '/asset-categories' // + /:id
    },
    states: {
      all: '/product-states',
      save: '/product-states',
      update: '/product-states',
      edit: '/product-states', // + /:id
      delete: '/product-states' // + /:id
    },
  },
  rewards: {
    all: '/rewards',
    save: '/rewards',
    update: '/rewards',
    edit: '/rewards', // + /:id
    delete: '/rewards', // + /:id
    category: {
      all: '/categories-rewards',
      save: '/categories-rewards',
      update: '/categories-rewards',
      edit: '/categories-rewards', // + /:id
      delete: '/categories-rewards' // + /:id
    },
    ruleType: {
      all: '/type-rules',
      save: '/type-rules',
      update: '/type-rules', // + /:id
      edit: '/type-rules', // + /:id
      delete: '/type-rules' // + /:id
    },
    rule: {
      all: '/rules',
      save: '/rules',
      update: '/rules', // + /:id
      edit: '/rules', // + /:id
      delete: '/rules' // + /:id
    },
    redemption: {
      history: '/redemption/history',
      employeeHistory: '/redemption/employee-rewards-history',
      create: '/redemption/create'
    },
    rate: {
      save: '/rewards/rate'
    },
    history: {
      getReport: '/redemption/history'
    }
  },

  performance: {
    relatedData: '/performance-management/evaluation-campaigns/related-data',
    // Scales
    scales: {
      all: '/performance-management/scales',
      save: '/performance-management/scales',
      update: '/performance-management/scales',
      edit: '/performance-management/scales', // + /:id
      delete: '/performance-management/scales' // + /:id
    },
    // Configure Tests
    configureTests: {
      all: '/performance-management/templates',
      save: '/performance-management/templates',
      update: '/performance-management/templates',
      edit: '/performance-management/templates', // + /:id
      delete: '/performance-management/templates' // + /:id
    },
    // Configure Evaluations
    configureEvaluations: {
      all: '/performance-management/evaluation-campaigns',
      save: '/performance-management/evaluation-campaigns',
      update: '/performance-management/evaluation-campaigns',
      edit: '/performance-management/evaluation-campaigns', // + /:id
      delete: '/performance-management/evaluation-campaigns', // + /:id
      participants: {
        all: '/performance-management/evaluation-campaigns', // + /:id/participants
        sync: '/performance-management/evaluation-campaigns', // + /:id/assign-participants
        assingEvaluators: '/performance-management/evaluation-campaigns', // + /:id/smart-assign-evaluator
        listEvaluatorsByParticipant: '/performance-management/evaluation-campaigns', // + /:campaignId/participants/:participantId/evaluators
        updateEvaluatorsAssignment: '/performance-management/evaluation-campaigns', // + /:campaignId/evaluators/:assignmentId
        deleteEvaluatorsAssignment: '/performance-management/evaluation-campaigns', // + /:campaignId/evaluators/:assignmentId
        listParticipantsWithEvaluators: '/performance-management/evaluation-campaigns' // + /:campaignId/participants-with-evaluators
      }
    },
    // Questions
    questions: {
      all: '/performance-management/competences/questions/competence', // + /:competenceId/campaign/:campaignId
      save: '/performance-management/competences/questions/competence', // + /:competenceId
      update: '/performance-management/competences/questions/questions', // + /:id
      edit: '/performance-management/competences/questions', // + /:id
      delete: '/performance-management/competences/questions' // + /:id
    },
    // Competences
    evaluationResponses: {
      all: '/performance-management/evaluation-responses/employee-pending-evaluations',
      save: '/performance-management/evaluation-responses',
      evaluationByEvaluator: '/performance-management/evaluation-responses', // + /:assignmentId/form
      questionsByCompetence: '/performance-management/evaluation-responses', // + /:/assignmentId/sections/competences/competenceId
      myMyResults: '/performance-management/results/my-results/campaign', // + /:campaingId
    },
    // Nine Box Settings
    nineBoxSettings: {
      all: '/performance-management/nine-box-config',
      save: '/performance-management/nine-box-config', // + /:boxNumber,
      delete: '/performance-management/nine-box-config' // + /:id
    },
    // Results
    nineBox: {
      nineBoxLive: '/performance-management/results/campaign', // + /:id/nine-box
      closeEvaluationCampaign: '/performance-management/results/campaign', // + /:id/close
      nineBoxHistory: '/performance-management/results/campaign' // + /:id/history
    }
  },

  // Architecture Module
  architecture: {
    relatedData: {
      impactRatio: '/clarity/enum/impact-ratio',
      localExternal: '/clarity/enum/local-external',
      mandatoryRecommended: '/clarity/enum/mandatory-recommended',
      controlLevel: '/clarity/enum/control-level',
    },
      business: {
        jobs: {
          all: '/api/jobs',
          save: '/api/jobs',
          update: '/api/jobs',
          edit: '/api/jobs', // + /:id
          delete: '/api/jobs' // + /:id
        },
        jobProcesses: '/api/job-processes',
        risks: {
          relationSave: '/api/risk-jobs'
        },
      objectives: {
        all: '/api/objectives',
        save: '/api/objectives',
        update: '/api/objectives',
        edit: '/api/objectives', // + /:id
        delete: '/api/objectives' // + /:id
      },
      competencies: {
        all: '/api/competencies',
        save: '/api/competencies',
        update: '/api/competencies',
        edit: '/api/competencies', // + /:id
        delete: '/api/competencies' // + /:id
      },
      objectiveRelations: {
        objectiveProcesses: '/api/objective-processes',
        jobObjectives: '/api/job-objectives',
        documentObjectives: '/api/document-objectives',
        objectiveIndicators: '/api/objective-indicators',
      },
      jobRelations: {
        jobProcesses: '/api/job-processes',
        jobDocuments: '/api/job-documents',
        jobSystems: '/api/job-systems',
        jobIndicators: '/api/job-indicators',
        jobLessonsLearnedAndProposalsForImprovement: '/api/feedbacks/job', // + /:jobId
        jobData: '/api/job-data',
        jobTechnologies: '/api/job-technologies'
      },
    },
    risk: {
      table: {
        all: '/api/risks',
        save: '/api/risks',
        update: '/api/risks',
        edit: '/api/risks', // + /:id
        delete: '/api/risks', // + /:id
        types: '/api/risk-types'
        ,
        downloadExcel: '/api/risks/download/excel',
        upload: '/api/risks/upload'
      }
      ,
      flow: {
        all: '/api/risk/flow',
        byId: '/api/risk/flow' // + /:id
      }
      ,
      map: {
        byId: '/api/risks/map',
        expand: '/api/risks/map',
        createNode: '/api/risks/map'
      }
      ,
      processRisks: '/api/process-risks'
      ,
      processRisksMatrix: '/api/process-risks/matrix'
      ,
      toolRisks: '/api/tool-risks'
      ,
      riskActionMeasures: '/api/risk-action-measures'
    },
    process: {
      table: {
        all: '/api/processes',
        save: '/api/processes',
        update: '/api/processes',
        edit: '/api/processes', // + /:id
        delete: '/api/processes', // + /:id
      },
      flow: {
        all: '/api/process/flow',
      },
      tools: '/api/process-tools',
      documents: '/api/process-documents',
      systems: '/api/system-processes',
      competencies: '/api/process-competencies',
      risks: '/api/process-risks',
      objectives: '/api/objective-processes',
      indicators: '/api/process-indicators',
      feedbacks: {
        all: '/api/feedbacks',
        save: '/api/feedbacks',
        update: '/api/feedbacks',
        delete: '/api/feedbacks',
        relationSave: '/api/feedback-objects'
      },
    },
    tools: {
      table: {
        all: '/api/tools',
        save: '/api/tools',
        update: '/api/tools',
        edit: '/api/tools', // + /:id
        delete: '/api/tools', // + /:id
      }
      ,
      map: {
        byId: '/api/tools/map', // + /:id
      }
    },
    documents: {
      table: {
        all: '/api/documents',
      }
    },
    indicators: {
      table: {
        all: '/api/indicators',
      }
    },
    actionMeasures: '/api/action-measures',
    aplications: {
      table: {
        all: '/api/systems',
        save: '/api/systems',
        update: '/api/systems',
        edit: '/api/systems', // + /:id
        delete: '/api/systems', // + /:id
      },
      flow: {
        all: '/api/system/flow',
        byId: '/api/system/flow', // + /:id
        save: '/api/system/flow', // + /:id/children
        delete: '/api/system/flow', // + /:id/children
        domain: '/api/system/flow/domains',
        domainById: '/api/system/flow/domain', // + /:id
        type: '/api/system/flow/type',
        typeById: '/api/system/flow/type', // + /:id
      },
      map: {
        byId: '/api/systems/map', // + /:id
        expand: '/api/systems/map', // + /:id/expand/:nodeId
        createNode: '/api/systems/map', // + //:id/expand/:nodeId
        deleteNode: '/api/systems/map' // + /:id/expand/:nodeId
      },
      timeline: {
        active: '/api/systems/timeline/active',
        inactive: '/api/systems/timeline/expired'
      }
    },
    data: {
      table: {
        all: '/api/data',
        save: '/api/data',
        update: '/api/data',
        edit: '/api/data', // + /:id
        delete: '/api/data', // + /:id
      },
      flow: {
        all: '/api/dataflow/flow',
        byId: '/api/dataflow', // + /:id
        save: '/api/dataflow', // + /:id/children
        delete: '/api/dataflow', // + /:id/children
        domain: '/api/dataflow/domains',
        domainById: '/api/dataflow/domain', // + /:id
        type: '/api/dataflow/type',
        typeById: '/api/dataflow/type', // + /:id
      },
      map: {
        byId: '/api/data/map', // + /:id
        expand: '/api/data/map', // + /:id/expand/:nodeId
        createNode: '/api/data/map', // + //:id/expand/:nodeId
        deleteNode: '/api/data/map' // + /:id/expand/:nodeId
      },
      timeline: {
        active: '/api/data/timeline/active',
        inactive: '/api/data/timeline/expired'
      }
    },
    infrastructure: {
      table: {
        all: '/api/technologies',
        save: '/api/technologies',
        update: '/api/technologies',
        edit: '/api/technologies', // + /:id
        delete: '/api/technologies', // + /:id
      },
      flow: {
        all: '/api/technology/flow',
        byId: '/api/technology/flow', // + /:id
        save: '/api/technology/flow', // + /:id/children
        delete: '/api/technology/flow', // + /:id/children
        domain: '/api/technology/domains',
        domainById: '/api/technology/domain', // + /:id
        type: '/api/technology/type',
        typeById: '/api/technology/type', // + /:id
      },
      map: {
        byId: '/api/technologies/map', // + /:id
        expand: '/api/technologies/map', // + /:id/expand/:nodeId
        createNode: '/api/technologies/map', // + //:id/expand/:nodeId
        deleteNode: '/api/technologies/map' // + /:id/expand/:nodeId
      },
      timeline: {
        active: '/api/technologies/timeline/active',
        inactive: '/api/technologies/timeline/expired'
      }
    },
    catalogs: {
      actionTypes: {
        all: '/api/action-types',
        save: '/api/action-types',
        update: '/api/action-types',
        edit: '/api/action-types', // + /:id
        delete: '/api/action-types' // + /:id
      },
      competenciesClasses: {
        all: '/api/competency-classes',
        save: '/api/competency-classes',
        update: '/api/competency-classes',
        edit: '/api/competency-classes', // + /:id
        delete: '/api/competency-classes' // + /:id
      },
      competencies: {
        all: '/api/competencies',
        save: '/api/competencies',
        update: '/api/competencies',
        edit: '/api/competencies', // + /:id
        delete: '/api/competencies' // + /:id
      },
      dataTypes: {
        all: '/api/data-types',
        save: '/api/data-types',
        update: '/api/data-types',
        edit: '/api/data-types', // + /:id
        delete: '/api/data-types' // + /:id
      },
      jobTypes: {
        all: '/api/job-types',
        save: '/api/job-types',
        update: '/api/job-types',
        edit: '/api/job-types', // + /:id
        delete: '/api/job-types' // + /:id
      },
      measureActionTypes: {
        all: '/api/measure-action-types',
        save: '/api/measure-action-types',
        update: '/api/measure-action-types',
        edit: '/api/measure-action-types', // + /:id
        delete: '/api/measure-action-types' // + /:id
      },
      objectiveTypes: {
        all: '/api/objective-types',
        save: '/api/objective-types',
        update: '/api/objective-types',
        edit: '/api/objective-types', // + /:id
        delete: '/api/objective-types' // + /:id}
      },
      organizationalUnitTypes: {
        all: '/api/organizational-unit-types',
        save: '/api/organizational-unit-types',
        update: '/api/organizational-unit-types',
        edit: '/api/organizational-unit-types', // + /:id
        delete: '/api/organizational-unit-types' // + /:id
      },
      processTypes: {
        all: '/api/process-types',
        save: '/api/process-types',
        update: '/api/process-types',
        edit: '/api/process-types', // + /:id
        delete: '/api/process-types' // + /:id
      },
      providers: {
        all: '/api/providers',
        save: '/api/providers',
        update: '/api/providers',
        edit: '/api/providers', // + /:id
        delete: '/api/providers' // + /:id
      },
      riskTypes: {
        all: '/api/risk-types',
        save: '/api/risk-types',
        update: '/api/risk-types',
        edit: '/api/risk-types', // + /:id
        delete: '/api/risk-types' // + /:id
      },
      systemTypes: {
        all: '/api/system-types',
        save: '/api/system-types',
        update: '/api/system-types',
        edit: '/api/system-types', // + /:id
        delete: '/api/system-types' // + /:id
      },
      technologyTypes: {
        all: '/api/technology-types',
        save: '/api/technology-types',
        update: '/api/technology-types',
        edit: '/api/technology-types', // + /:id
        delete: '/api/technology-types' // + /:id
      },
      toolTypes: {
        all: '/api/tool-types',
        save: '/api/tool-types',
        update: '/api/tool-types',
        edit: '/api/tool-types', // + /:id
        delete: '/api/tool-types' // + /:id
      },
      topics: {
        all: '/api/topics',
        save: '/api/topics',
        update: '/api/topics',
        edit: '/api/topics', // + /:id
        delete: '/api/topics' // + /:id
      },
      domains: {
        all: '/api/domains',
        save: '/api/domains',
        update: '/api/domains',
        edit: '/api/domains', // + /:id
        delete: '/api/domains' // + /:id
      },
      dateControls: {
        all: '/api/date-controls',
        save: '/api/date-controls',
        update: '/api/date-controls',
        edit: '/api/date-controls', // + /:id
        delete: '/api/date-controls' // + /:id
      }
    }
  }
}
