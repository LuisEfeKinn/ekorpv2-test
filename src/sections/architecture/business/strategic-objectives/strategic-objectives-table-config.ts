
export const ALL_COLUMNS = [
  { id: 'code', label: 'Código' },
  { id: 'name', label: 'Nombre' },
  { id: 'description', label: 'Descripción' },
  { id: 'startDate', label: 'Fecha de Inicio' },
  { id: 'endDate', label: 'Fecha de Fin' },
  { id: 'measurementForm', label: 'Forma de Medición' },
  { id: 'consequencesOfNotAchieving', label: 'Consecuencias de no cumplir' },
  { id: 'objectiveLevel', label: 'Nivel del Objetivo' },
  { id: 'typeName', label: 'Tipo de Objetivo' },
  { id: 'superiorObjectiveName', label: 'Objetivo Superior' },
  { id: 'createdBy', label: 'Creado Por' },
  { id: 'createdDate', label: 'Fecha de Creación' },
  { id: 'lastModifiedBy', label: 'Modificado Por' },
  { id: 'lastModifiedDate', label: 'Fecha de Modificación' },
];

export const FIXED_COLUMNS = ['code', 'name'] as const;

export const DEFAULT_COLUMNS = ['code', 'name', 'description', 'startDate', 'endDate'];
