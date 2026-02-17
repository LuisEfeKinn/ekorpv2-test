export type ActionMeasureApiItem = {
  id?: string | number;
  code?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

export type ActionMeasureRow = {
  id: string;
  code: string;
  name: string;
};

