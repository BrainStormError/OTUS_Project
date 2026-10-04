export type DirectoryEntry = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
};

export type DirectoryCursor = {
  createdAt: string;
  id: string;
};

export type ListDirectoryResult = {
  items: DirectoryEntry[];
  nextCursor: string | null;
};
