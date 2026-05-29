// ----------------------------------------------------------------------

export type ObjectiveType = {
  id: number;
  typeCode: string;
  typeName: string;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
};

export type ObjectiveTypeFilter = {
  name: string;
  status: string;
};
