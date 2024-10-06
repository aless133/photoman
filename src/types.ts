export type FileGroups = {
  [key: string]: string[];
};

export type NewFile = {
  name: string;
  basename: string;
  type?: string;
  ymd?: string | null;
  found?: string[];
};
