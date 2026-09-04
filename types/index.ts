export type Facility = {
  slug: string;
  name: string;
  nameEn: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  equipment: Equipment[];
  modules?: string[];
};

export type Equipment = {
  name: string;
  spec: string;
  function: string;
  image?: string;
};

export type ResearchArea = {
  slug: string;
  name: string;
  description: string;
};

export type ResearchProject = {
  slug: string;
  title: string;
  researcher: string;
  year: number;
  field: string;
  status: "Ongoing" | "Completed" | "Planned";
  abstract: string;
};

export type Researcher = {
  name: string;
  role: string;
  field: string;
  photo?: string;
};

export type Publication = {
  id: string;
  year: number;
  title: string;
  authors: string;
  type: "Journal" | "Conference" | "Thesis";
  url?: string;
};

export type NewsItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  coverImage?: string;
};

export type PracticumModule = {
  slug: string;
  title: string;
  facility: string;
  description: string;
  fileUrl?: string;
};

export type TeamMember = {
  name: string;
  role: string;
  photo?: string;
};
