export type DocumentType = {
  id: number;
  name: string;
  documentCode: string;
  createdBy?: string | null;
  createdDate?: string | null;
  lastModifiedBy?: string | null;
  lastModifiedDate?: string | null;
};

export type DocumentTypeFilters = {
  name: string;
  status: 'all';
};

export type DocumentTypePayload = {
  name: string;
  documentCode: string;
};
