export interface ICategory {
  id: number;
  name: string;
}

export interface IState {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
}

export interface IEmployee {
  id: string;
  firstName: string;
  firstLastName: string;
  secondName?: string;
  secondLastName?: string;
  email: string;
  phone?: string;
}

export interface ICurrentAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  assignedAt: string;
  notes?: string;
}

export interface IAssetsItem {
  id: string;
  internalId: string;
  name: string;
  isActive: boolean;
  note?: string;
  category?: ICategory;
  serial: string;
  purchaseDate?: string;
  purchaseValue?: number;
  deprecationDate?: string;
  warrantyExpiration?: string;
  state?: IState;
  currentAssignments?: ICurrentAssignment[];
  createdAt: string;
  updatedAt: string;
}

export interface IAssetsTableFilters {
  name: string;
  category: ICategory[];
  state: IState[];
  employee: IEmployee[];
  serial: string;
  internalId: string;
  includeInactive: boolean;
  hasActiveAssignment?: boolean;
}

export interface IInventoryHistoryChange {
  old: string | null;
  new: string | null;
  label: string;
}

export interface IInventoryHistory {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  asset: {
    id: string;
    name: string;
    internalId: string;
    serial: string;
    category: {
      id: string;
      name: string;
    };
    state: {
      id: string;
      name: string;
    };
  };
  performedBy: {
    id: string;
    name: string;
  } | null;
  targetEmployee: {
    id: string;
    name: string;
  } | null;
  changes: Record<string, IInventoryHistoryChange>;
}

export interface IInventoryAssignmentInput {
  employeeId: string;
  action: 'ASSIGN' | 'UNASSIGN' | 'TRANSFER' | 'RETURN';
  expectedReturnDate?: string;
  notes?: string;
}

export interface IInventoryAssignmentsPayload {
  assignments: IInventoryAssignmentInput[];
}

// Asset Record (History Tracking)

export type IAssetRecordType = 'ASSIGN' | 'UNASSIGN' | 'STATE_CHANGE' | 'CREATE' | 'UPDATE';

export interface IUserManagementEmployee {
  id: string;
  firstName: string;
  secondName?: string;
  firstLastName: string;
  secondLastName?: string;
  email: string;
}

export interface IAssetRecordTableFilters {
  name: string;
  assetId: IAssetsItem[];
  type: IAssetRecordType[];
  fromDate: string;
  toDate: string;
  category: ICategory[];
  performedById: IUserManagementEmployee[];
  targetEmployeeId: IUserManagementEmployee[];
}

export type IAssetRecordTableFilterValue = string | IAssetsItem[] | IAssetRecordType[] | ICategory[] | IUserManagementEmployee[];


// My Assets

export interface IMyAssets extends IAssetsItem {
  assignedAt: string;
  assignmentNotes?: string;
}

export interface IMyAssetsTableFilters {
  name: string;
}

export type IMyAssetsTableFilterValue = string;


// Categories

export type ICategoriesInventory = {
  id: string;
  name: string;
  assetCount: number;
  isActive: boolean;
};

export type ICategoriesInventoryTableFilters = {
  name: string;
};

export type ICategoriesInventoryInput = {
  name: string;
  isActive: boolean;
};

export type ICategoriesInventoryTableFilterValue = string | string[];