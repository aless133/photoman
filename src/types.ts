export type FileGroups = {
  [key: string]: string[];
};

export type NewFile = {
  name: string;
  type?: string;
  ymd?: string | null;
  found?: string[];
};
