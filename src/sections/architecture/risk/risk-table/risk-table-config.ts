export type RiskTableColumn = {
  id: string;
  labelKey: string;
  fallback: { en: string; es: string };
};

export const ALL_COLUMNS: RiskTableColumn[] = [
  { id: 'code', labelKey: 'risk.table.table.columns.code', fallback: { en: 'Code', es: 'Código' } },
  { id: 'name', labelKey: 'risk.table.table.columns.name', fallback: { en: 'Name', es: 'Nombre' } },
  { id: 'description', labelKey: 'risk.table.table.columns.description', fallback: { en: 'Description', es: 'Descripción' } },
  { id: 'riskType', labelKey: 'risk.table.table.columns.riskType', fallback: { en: 'Risk Type', es: 'Tipo de Riesgo' } },
  { id: 'superiorRisk', labelKey: 'risk.table.table.columns.superiorRisk', fallback: { en: 'Parent Risk', es: 'Riesgo Superior' } },
  { id: 'responsibleJob', labelKey: 'risk.table.table.columns.responsibleJob', fallback: { en: 'Responsible Job', es: 'Puesto Responsable' } },
  { id: 'createdBy', labelKey: 'risk.table.table.columns.createdBy', fallback: { en: 'Created By', es: 'Creado Por' } },
  { id: 'createdDate', labelKey: 'risk.table.table.columns.createdDate', fallback: { en: 'Created Date', es: 'Fecha de Creación' } },
  { id: 'lastModifiedBy', labelKey: 'risk.table.table.columns.lastModifiedBy', fallback: { en: 'Modified By', es: 'Modificado Por' } },
  { id: 'lastModifiedDate', labelKey: 'risk.table.table.columns.lastModifiedDate', fallback: { en: 'Modified Date', es: 'Fecha de Modificación' } },
];

export const DEFAULT_COLUMNS = ['code', 'name', 'description', 'riskType', 'superiorRisk', 'responsibleJob'];
