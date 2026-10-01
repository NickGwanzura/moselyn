export type BlogStory = {
  slug: string;
  title: string;
  tag: string;
  image: string;
  programSlug: string;
  paragraphs: readonly string[];
};

// Shared by the homepage and blog index so story cards stay in sync.
export const blogStories: BlogStory[] = [
  {
    slug: 'education-support',
    title: 'A place to learn, grow and belong',
    tag: 'Education',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=85',
    programSlug: 'education-scholarship-fund',
    paragraphs: [
      'Finding Hope Africa’s education work includes support with books, food, and school fees. The supplied FHA brief reports that more than 1,000 students have been supported, with 131 students currently on the Education Scholarship Fund.',
      'Scholarship support is one part of a wider commitment to walk alongside children and young people as they continue learning. Contact FHA for current programme details and ways to help.',
    ],
  },
  {
    slug: 'womens-livelihoods',
    title: 'Building futures with practical skills',
    tag: 'Livelihoods',
    image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=900&q=85',
    programSlug: 'better-together',
    paragraphs: [
      'FHA launched the Better Together Initiative in 2020 to help women develop skills and livelihoods while continuing its work with children and families.',
      'The supplied FHA brief reports more than 200 women engaged in livelihoods training. For current activities and participation details, contact the FHA team.',
    ],
  },
  {
    slug: 'ruwa-home',
    title: 'When a home becomes a family',
    tag: 'Ruwa Home',
    image: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=900&q=85',
    programSlug: 'ruwa-home',
    paragraphs: [
      'Ruwa Home is part of Finding Hope Africa’s safe shelter work. FHA’s supplied timeline says construction began in 2025.',
      'The current project status and opening details were not included in the available materials. Contact FHA for an up-to-date account of the project.',
    ],
  },
];
