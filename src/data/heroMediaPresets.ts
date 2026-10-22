export interface HeroVideoPreset {
  id: string;
  label: string;
  durationLabel: string;
  durationSeconds: number;
  url: string;
  poster: string;
  category: 'classroom' | 'stem' | 'library' | 'cbc' | 'robotics' | 'sports';
  description: string;
}

export interface HeroImagePreset {
  id: string;
  label: string;
  url: string;
  description: string;
}

export const HERO_VIDEO_PRESETS: HeroVideoPreset[] = [
  {
    id: 'vid-classroom',
    label: 'Interactive Classroom & Teaching',
    durationLabel: '22 sec',
    durationSeconds: 22,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-students-in-a-classroom-with-their-teacher-41147-large.mp4',
    poster: '/gad@edusmart.jpeg',
    category: 'classroom',
    description: 'Teacher mentoring enthusiastic learners with interactive digital board'
  },
  {
    id: 'vid-science',
    label: 'STEM Science Lab & Microscopy',
    durationLabel: '19 sec',
    durationSeconds: 19,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-looking-through-a-microscope-in-a-laboratory-41144-large.mp4',
    poster: '/src/assets/images/diagram_science_ecosystem_1790859717590.jpg',
    category: 'stem',
    description: 'Learner conducting biology cell examination under optical microscope'
  },
  {
    id: 'vid-library',
    label: 'Digital Library & Research Hub',
    durationLabel: '26 sec',
    durationSeconds: 26,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-young-students-studying-in-a-library-41143-large.mp4',
    poster: '/src/assets/images/edusmart_campus_banner_1790859700873.jpg',
    category: 'library',
    description: 'Students collaborating in modern digital library resource center'
  },
  {
    id: 'vid-cbc-project',
    label: 'CBC Project Discovery & Teamwork',
    durationLabel: '28 sec',
    durationSeconds: 28,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-students-studying-together-41145-large.mp4',
    poster: '/src/assets/images/diagram_math_geometry_1790859731617.jpg',
    category: 'cbc',
    description: 'Teamwork and group discussion on project-based competency task'
  },
  {
    id: 'vid-robotics',
    label: 'Robotics & Hardware Prototyping',
    durationLabel: '16 sec',
    durationSeconds: 16,
    url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-person-working-with-electronics-41148-large.mp4',
    poster: '/src/assets/images/diagram_math_geometry_1790859731617.jpg',
    category: 'robotics',
    description: 'Hands-on practical engineering circuit assembly and microcontrollers'
  }
];

export const HERO_IMAGE_PRESETS: HeroImagePreset[] = [
  {
    id: 'img-gadaffih-smartboard',
    label: 'Mr. Gadaffih & Interactive Smart Board (Official)',
    url: '/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg',
    description: 'Teacher Mr. Gadaffih and learners with interactive EduSmart smart board and tablets'
  },
  {
    id: 'img-campus-aerial',
    label: 'Campus Aerial & Grounds',
    url: '/src/assets/images/edusmart_campus_banner_1790859700873.jpg',
    description: 'Bird-eye view of lush school grounds, administration blocks and sports field'
  },
  {
    id: 'img-science-eco',
    label: 'Science & Ecosystem Lab',
    url: '/src/assets/images/diagram_science_ecosystem_1790859717590.jpg',
    description: 'Hands-on biological taxonomy, ecology flora and fauna research workbench'
  },
  {
    id: 'img-math-geometry',
    label: 'Mathematics & Spatial Geometry',
    url: '/src/assets/images/diagram_math_geometry_1790859731617.jpg',
    description: 'CBC junior secondary geometry charts, coordinate planes and solid shapes'
  },
  {
    id: 'img-african-uniforms',
    label: 'African Classroom Uniforms (Unsplash)',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80',
    description: 'Learners in traditional school uniforms engaging with teacher in classroom'
  },
  {
    id: 'img-digital-classroom',
    label: 'Modern Digital Classroom (Unsplash)',
    url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    description: 'High-tech smart classroom with laptops and collaborative group seating'
  }
];
