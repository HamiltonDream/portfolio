export const COLORS = {
  bg: '#050508',
  text: '#F0F0F8',
  dim: '#6B7280',
  accent: '#00D4FF',
  violet: '#7C3AED',
  dark: '#08081a',
  muted: '#374151',
  glass: '#1a1a2e',
} as const;

export const PROJECTS = [
  {
    id: 'saas',
    num: '01',
    title: 'SaaS Platform',
    description: 'Full-Stack Web Application',
    category: 'Software',
    hue: 250,
  },
  {
    id: 'music',
    num: '02',
    title: 'HamiltonDream',
    description: 'Music Production & Artistry',
    category: 'Music',
    hue: 340,
  },
  {
    id: 'motion',
    num: '03',
    title: 'Visual Stories',
    description: 'Editing & Animation',
    category: 'Motion',
    hue: 210,
  },
  {
    id: 'apps',
    num: '04',
    title: 'Mobile Suite',
    description: 'iOS & Android Development',
    category: 'Apps',
    hue: 180,
  },
  {
    id: 'design',
    num: '05',
    title: 'Brand Worlds',
    description: 'Identity & Visual Systems',
    category: 'Design',
    hue: 50,
  },
] as const;

export const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
  'Swift', 'Python', 'After Effects', 'Premiere Pro',
  'FL Studio', 'Blender', 'Figma',
] as const;

export const ROLES = [
  'Building Apps',
  'Making Beats',
  'Crafting Pixels',
  'Telling Stories',
] as const;
