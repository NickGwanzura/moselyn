export type FHAProgram = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  detail?: string;
};

export const fhaPrograms: FHAProgram[] = [
  { slug: 'education-scholarship-fund', title: 'Education Scholarship Fund', category: 'Education', summary: 'Scholarship support helps vulnerable students continue their education.', detail: 'FHA reports 131 students currently on the Education Scholarship Fund.' },
  { slug: 'eva-marie-learning-hub', title: 'Eva Marie Learning Hub & Mobile Library', category: 'Education', summary: 'A learning hub and mobile library supporting access to learning and books.' },
  { slug: 'coding-robotics', title: 'Coding & Robotics', category: 'Education', summary: 'Coding and robotics opportunities for young people.', detail: 'FHA reports reaching 491 young people through coding and robotics.' },
  { slug: 'domboshava-education-assistance', title: 'Domboshava Education Assistance', category: 'Education', summary: 'Education assistance for children and young people in Domboshava.' },
  { slug: 'better-together', title: 'Better Together: Women’s Livelihoods', category: 'Livelihoods', summary: 'Skills and livelihood support for women through the Better Together Initiative.', detail: 'The Better Together Initiative launched in 2020. FHA reports 200+ women engaged in livelihoods training.' },
  { slug: 'healthcare-training-access', title: 'Healthcare Training & Access', category: 'Healthcare', summary: 'Healthcare training and access as part of FHA’s community support.' },
  { slug: 'iam-zimbabwe-riddim', title: 'I Am Zimbabwe Riddim: Music & Arts', category: 'Creative arts', summary: 'Music and arts as part of FHA’s programmes with young people and communities.' },
  { slug: 'preschool-adoption', title: 'Preschool Adoption', category: 'Early learning', summary: 'Preschool support within FHA’s education work.' },
  { slug: 'ruwa-home', title: 'Ruwa Home', category: 'Shelter', summary: 'A home project within FHA’s safe shelter work.', detail: 'FHA’s supplied timeline says construction on the Ruwa Home began in 2025. Contact FHA for the current project status.' },
];
