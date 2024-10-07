export type FileGroups = {
  [key: string]: string[];
};

export type NewFile = {
  name: string;
  basename: string;
  type?: string;
  destination?: string | null;
  found?: string[];
};

export type Destinations = Record<string, string>;