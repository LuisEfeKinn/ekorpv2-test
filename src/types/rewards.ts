// REWARDS TYPES

// ----------------------------------------------------------------------

export type IRewardCategory = {
  id: string;
  name: string;
};

export type IReward = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  pointsRequired: number;
  stockAvailable: number;
  categoryReward: IRewardCategory;
  createdAt: string;
  imageUrl?: string;
};

export type IRewardTableFilters = {
  name: string;
  categoryRewardId?: string;
};

export type IRewardInput = {
  name: string;
  description: string;
  pointsRequired: number;
  stockTotal: number;
  categoryRewardId: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  imageUrl?: string;
};

export type IRewardTableFilterValue = string | string[];


// REWARDS CATEGORIES 
// ----------------------------------------------------------------------

export type IRewardsCategories = {
  id: string;
  name: string;
  abreviation: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
};

export type IRewardsCategoriesTableFilters = {
  name: string;
  abreviation?: string;
  status?: string;
};

export type IRewardsCategoriesTableFilterValue = string | string[];

// REWARDS RULES
// ----------------------------------------------------------------------
// TYPES
export type IRewardsRuleType = {
  id: string;
  name: string;
  description: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;
};

export type IRewardsRuleTypeTableFilters = {
  name: string;
  description?: string;
  status?: string;
};
export type IRewardsRuleTypeTableFilterValue = string | string[];

// REWARDS RULES
export type IRewardsRule = {
  id: string;
  name: string;
  description: string;
  points: number;
  typeRule: IRewardsRuleType;
  isActive: boolean;
  createdAt?: Date | string;
};

export type IRewardsRuleTableFilters = {
  name: string;
  typeRuleId?: string;
};
export type IRewardsRuleTableFilterValue = string | string[];

//----------------------------------------------------------------------
// REWARDS REDEMPTIONS
export type IRewardHistoryItem = {
  historyId: string;
  rewardId: string;
  name: string;
  imageUrl: string;
  points: number;
  redeemedAt: string;
  myRating: number | null;
};

export type IRatingDialogState = {
  open: boolean;
  item: IRewardHistoryItem | null;
  rating: number;
  comment: string;
};

export type IDetailsDialogState = {
  open: boolean;
  item: IRewardHistoryItem | null;
};