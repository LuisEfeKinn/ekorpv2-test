
export interface ActionMeasureProvider {
  id: number;
  name: string;
  contact: string;
  supportName: string;
  supportEmail: string;
  supportPhone: string;
  contractualName: string;
  contractualEmail: string;
  contractualPhone: string;
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
}

export interface ActionMeasureData {
  id: number;
  name: string;
  description: string;
  measureType: number;
  resultType: number;
  code: string;
  actionMeasureSuperior: any | null;
  provider: ActionMeasureProvider | null;
  superiorActionMeasure: {
    id: number;
    name: string;
    description: string;
    measureType: number;
    resultType: number;
    code: string;
    createdBy: string | null;
    createdDate: string;
    lastModifiedBy: string | null;
    lastModifiedDate: string;
  } | null;
  createdBy: string | null;
  createdDate: string;
  lastModifiedBy: string | null;
  lastModifiedDate: string;
}

export interface ActionMeasureNode {
  id: number;
  label: string;
  name: string; // Added for compatibility with OrganizationalChart
  data: ActionMeasureData;
  children: ActionMeasureNode[];
}
