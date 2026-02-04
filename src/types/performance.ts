// ----------------------------------------------------------------------

export type IScaleLevel = {
  id?: string;
  value: number;
  label: string;
  description: string;
  color?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type IScale = {
  id: string;
  name: string;
  description: string;
  type: string;
  maxValue: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  levels: IScaleLevel[];
};

export type IScaleTableFilters = {
  name: string;
  type: string;
  status: string;
};

export type IScaleFormInput = {
  name: string;
  description: string;
  type: string;
  maxValue: number;
  levels: Omit<IScaleLevel, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'color'>[];
};

export type IScaleTypeOption = {
  value: string;
  label: string;
};

export type IPerformanceRelatedData = {
  evaluationRelationships: IScaleTypeOption[];
  evaluationStatuses: IScaleTypeOption[];
  participantStatuses: IScaleTypeOption[];
  evaluationTypes: IScaleTypeOption[];
  scaleTypes: IScaleTypeOption[];
};

// ----------------------------------------------------------------------
// Configure Evaluations Types

export type IConfigureEvaluation = {
  id: string;
  name: string;
  description: string;
  type: string;
  period: string;
  status: string;
  autoAssign: boolean;
  editableEvaluators: boolean;
  startDate: string;
  endDate: string;
  totalCompetences: number;
  totalObjectives: number;
  totalDepartments: number;
  totalPositions: number;
  totalEmployees: number;
  createdAt: string;
  objectiveScaleId?: number | null;
  objectiveScale?: {
    id: number;
    name: string;
  } | null;
  competences?: IEvaluationCompetence[];
  objectives?: IEvaluationObjective[];
  departments?: number[];
  positions?: number[];
  employees?: number[];
  evaluatorConfigs?: IEvaluatorConfig[];
  // Campos de relaciones del backend
  campaignCompetences?: any[];
  campaignObjectives?: any[];
  campaignDepartments?: any[];
  campaignPositions?: any[];
  campaignEmployees?: any[];
};

export type IConfigureEvaluationTableFilters = {
  name: string;
  type: string;
  status: string;
  departmentIds: string;
  positionIds: string;
  employeeIds: string;
};

export type IEvaluationCompetence = {
  competenceId: number;
  competenceName?: string;
  weight: number;
};

export type IEvaluationObjective = {
  objectiveId: number;
  objectiveName?: string;
  weight: number;
  targetValue: number;
  customKpi: string;
};

export type IEvaluatorConfig = {
  relationship: string;
  weight: number;
  maxEvaluators: number;
  enabled: boolean;
};

export type IConfigureEvaluationFormInput = {
  name: string;
  description: string;
  type: string;
  period: string;
  status?: string;
  autoAssign: boolean;
  editableEvaluators: boolean;
  startDate: string;
  endDate: string;
  competences: IEvaluationCompetence[];
  objectives: IEvaluationObjective[];
  departments: number[];
  positions: number[];
  employees: number[];
  evaluatorConfigs: IEvaluatorConfig[];
};

// Competency type from architecture
export type ICompetency = {
  id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  competencyClass: any;
  createdBy?: string | null;
  createdDate?: string;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string;
};

// Objective type from architecture
export type IObjective = {
  id: number;
  code: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  measurementForm: string;
  consequencesOfNotAchieving: string;
  objectiveLevel: number;
  participantId: any;
  superiorObjective: any;
  objectiveType: any;
  createdBy?: string | null;
  createdDate?: string;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string;
};

// ----------------------------------------------------------------------
// Campaign Participants Types

export type ICampaignParticipantEmployee = {
  id: string;
  fullName: string;
  organizationalUnitId: string;
};

export type ICampaignParticipant = {
  id: string;
  campaignId: string;
  employeeId: string;
  status: string;
  employee: ICampaignParticipantEmployee;
  createdAt: string;
};

export type ICampaignParticipantTableFilters = {
  search: string;
  status: string;
};

// ----------------------------------------------------------------------
// Campaign Participant Evaluators Types

export type IParticipantEvaluatorEmployee = {
  id: string;
  fullName: string;
  organizationalUnitId: string;
};

export type IParticipantEvaluator = {
  id: string;
  participantId: string;
  evaluatorEmployeeId: string;
  relationship: string;
  weight: number;
  completed: boolean;
  evaluatorEmployee: IParticipantEvaluatorEmployee;
};

// ----------------------------------------------------------------------
// List Participants With Evaluators Types

export type IParticipantWithEvaluatorsEmployee = {
  id: string;
  fullName: string;
};

export type IParticipantWithEvaluatorsEvaluator = {
  id: string;
  evaluatorEmployeeId: string;
  fullName: string;
  relationship: string;
  completed: boolean;
};

export type IParticipantWithEvaluators = {
  participantId: string;
  employee: IParticipantWithEvaluatorsEmployee;
  evaluators: IParticipantWithEvaluatorsEvaluator[];
};

export type IParticipantWithEvaluatorsTableFilters = {
  search: string;
  organizationalUnitId: string;
};

// ----------------------------------------------------------------------
// Questions Types

export type IQuestion = {
  id: string;
  campaignId: number;
  competenceId: number;
  description: string;
  weight: number;
  scaleId: number;
  isOptional: boolean;
  visibleFor?: any[];
  scale?: any;
  createdAt?: string;
  updatedAt?: string;
};

export type IQuestionTableFilters = {
  search: string;
};

export type IQuestionFormInput = {
  campaignId: number;
  description: string;
  weight: number;
  scaleId: number;
  isOptional: boolean;
  visibleTo: string[];
};

// ----------------------------------------------------------------------
// Evaluation Responses Types

export type IEvaluationResponse = {
  assignmentId: string;
  campaignId: string;
  campaignName: string;
  campaignType: string;
  participantName: string;
  relationship: string;
  deadline: string;
  progress: number;
  isCompleted: boolean;
  isCampaignActive: boolean;
};

export type IEvaluationResponseTableFilters = {
  search: string;
  status: string;
};

// ----------------------------------------------------------------------
// Evaluation Form Types (for viewing responses)

export type IEvaluationFormScaleLevel = {
  id: string;
  value: number;
  label: string;
};

export type IEvaluationFormScale = {
  id: string;
  name: string;
  levels: IEvaluationFormScaleLevel[];
};

export type IEvaluationFormQuestion = {
  questionId: string;
  text: string;
  weight: number;
  isOptional: boolean;
  scale: IEvaluationFormScale;
};

export type IEvaluationFormCompetence = {
  competenceId: number;
  name: string;
  weight: number;
  questions: IEvaluationFormQuestion[];
};

export type IEvaluationFormObjective = {
  objectiveId: number;
  name: string;
  weight: number;
  questions: IEvaluationFormQuestion[];
};

export type IEvaluationFormResponse = {
  responseId: string;
  questionId: string;
  objectiveId: string | null;
  customQuestion: string | null;
  scaleLevel: IEvaluationFormScaleLevel;
  comments: string;
  isAnonymous: boolean;
};

// ----------------------------------------------------------------------

export type IMyResultsBreakdownByRole = {
  relationship: string;
  score: number;
  weight: number;
};

export type IMyResultsCompetence = {
  competenceId: number;
  competenceName: string;
  color: string;
  expectedLevel: number;
  obtainedLevel: number;
  gap: number;
  compliancePercentage: number;
  breakdownByRole: IMyResultsBreakdownByRole[];
};

export type IMyResults = {
  participantId: number;
  employeeName: string;
  overallCompetencyScore: number;
  competencies: IMyResultsCompetence[];
};

export type IEvaluationFormParticipant = {
  id: string;
  fullName: string;
  organizationalUnitId: string;
  positionId: number;
  status: string;
};

export type IEvaluationFormEvaluator = {
  id: string;
  employeeId: string;
  fullName: string;
  relationship: string;
  completed: boolean;
};

export type IEvaluationFormCampaign = {
  id: string;
  name: string;
  type: string;
  status: string;
};

export type IEvaluationForm = {
  participant: IEvaluationFormParticipant;
  evaluator: IEvaluationFormEvaluator;
  campaign: IEvaluationFormCampaign;
  competences: IEvaluationFormCompetence[];
  objectives: IEvaluationFormObjective[];
  responses: IEvaluationFormResponse[];
};

// ----------------------------------------------------------------------
// Evaluation Data Types (for response history)

export type IEvaluationDataParticipant = {
  id: string;
  fullName: string;
  organizationalUnitId: string;
  positionId: number;
  status: string;
};

export type IEvaluationDataEvaluator = {
  id: string;
  employeeId: string;
  fullName: string;
  relationship: string;
  completed: boolean;
};

export type IEvaluationDataCampaign = {
  id: string;
  name: string;
  type: string;
  status: string;
};

export type IEvaluationDataProgress = {
  totalQuestions: number;
  answeredQuestions: number;
  percentage: number;
};

export type IEvaluationDataCompetence = {
  competenceId: number;
  name: string;
  description?: string;
  weight: number;
  questionsCount: number;
  answeredCount: number;
};

export type IEvaluationDataObjective = {
  objectiveId: number;
  name: string;
  weight: number;
  targetValue: number;
  customKpi: string;
  scale?: {
    id: string;
    name: string;
    levels: Array<{
      id: string;
      value: number;
      label: string;
      description: string;
      color: string | null;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
    }>;
  };
  achievedValue?: number | null;
  compliancePercentage?: number;
  complianceScaleValue?: number;
  complianceScaleLabel?: string;
  weightedScore?: number;
  currentAnswer?: {
    id: string;
    comments: string | null;
    scaleLevelId: number;
  } | null;
};

export type IEvaluationDataSections = {
  competences?: IEvaluationDataCompetence[];
  objectives?: IEvaluationDataObjective[];
  objectivesTotalScore?: number;
};

export type IEvaluationData = {
  participant: IEvaluationDataParticipant;
  evaluator: IEvaluationDataEvaluator;
  campaign: IEvaluationDataCampaign;
  progress: IEvaluationDataProgress;
  sections: IEvaluationDataSections;
};

export type IQuestionScaleLevel = {
  id: string;
  value: number;
  label: string;
};

export type IQuestionScale = {
  id: string;
  name: string;
  levels: IQuestionScaleLevel[];
};

export type IQuestionCurrentAnswer = {
  id: string;
  scaleLevelId: string;
  comments: string;
};

export type ICompetenceQuestions = {
  competenceId: number;
  name: string;
  questions: IQuestion[];
};

// ----------------------------------------------------------------------
// Configure Tests Types
// ----------------------------------------------------------------------

export type IConfigureTest = {
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  type: string;
  isActive: boolean;
  objectiveScaleId: string | null;
  totalCompetences: number;
  totalObjectives: number;
  createdAt: string;
  updatedAt: string;
  competences?: ITestCompetence[];
  objectives?: ITestObjective[];
  objectiveScale?: {
    id: number;
    name: string;
  } | null;
};

export type IConfigureTestTableFilters = {
  name: string;
  type: string;
};

export type ITestCompetence = {
  competencyId: number;
  competenceName?: string;
  weight: number;
  questions?: ITestQuestion[];
};

export type ITestQuestion = {
  description: string;
  scaleId: number;
  weight: number;
  isOptional: boolean;
  order: number;
  visibleFor: string[];
};

export type ITestObjective = {
  objectiveId: number;
  objectiveName?: string;
  weight: number;
  targetValue: number;
  customKpi: string;
};

export type IConfigureTestFormInput = {
  name: string;
  description: string;
  coverImage?: string;
  type: string;
  isActive: boolean;
  objectiveScaleId?: number | null;
  competences: ITestCompetence[];
  objectives: ITestObjective[];
};

