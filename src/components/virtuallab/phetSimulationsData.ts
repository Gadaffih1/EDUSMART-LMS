export interface PhetSimulation {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Integrated Science' | 'Mathematics';
  gradeLevel: string;
  strand: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  description: string;
  phetUrl: string;
  nativeEngineType: 
    | 'circuits' 
    | 'ph_scale' 
    | 'forces_motion' 
    | 'energy_skate' 
    | 'states_of_matter' 
    | 'bending_light' 
    | 'density_buoyancy' 
    | 'microscope';
  thumbnailUrl: string;
  learningGoals: string[];
  inquiryPrompts: string[];
  keyFormulas: string[];
  classicTools: Array<'voltmeter' | 'ammeter' | 'ph_meter' | 'stopwatch' | 'ruler' | 'protractor' | 'energy_graph'>;
  cbcCurriculumRef: string;
}

export const PHET_SIMULATIONS: PhetSimulation[] = [
  {
    id: 'phet-circuits-dc',
    title: 'Circuit Construction Kit: DC (Ohm\'s Law & Energy)',
    subject: 'Physics',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Energy: Electrical Circuitry & Ohm\'s Law',
    difficulty: 'Intermediate',
    durationMinutes: 30,
    description: 'Build interactive series and parallel circuits with batteries, light bulbs, resistors, and switches. Measure voltage across any component using multimeter test probes and observe real-time electron flow.',
    phetUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html',
    nativeEngineType: 'circuits',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc-600.png',
    learningGoals: [
      'Construct closed circuits and observe the relationship between voltage, current, and resistance (Ohm\'s Law: V = I × R).',
      'Compare bulb brightness and total current draw between series and parallel configurations.',
      'Use a digital voltmeter with red (+) and black (-) probes to measure potential difference across components.',
      'Observe electron movement and analyze safety protocols to prevent short circuits.'
    ],
    inquiryPrompts: [
      'What happens to bulb brightness in series when you double the number of bulbs? Why?',
      'If you disconnect one bulb in parallel, why do other branches remain lit?',
      'Calculate the resistance of your circuit when 4 cells (6.0V) produce a current of 0.60A.'
    ],
    keyFormulas: ['V = I × R', 'P = V × I = I² × R', 'R_series = R₁ + R₂', '1/R_parallel = 1/R₁ + 1/R₂'],
    classicTools: ['voltmeter', 'ammeter', 'stopwatch'],
    cbcCurriculumRef: 'CBC Grade 7 Science Strand 4.2 · JSS Physics Kit Items #24, #29, #50, #51, #67'
  },
  {
    id: 'phet-ph-scale',
    title: 'pH Scale: Acids, Bases & Dilution Solutions',
    subject: 'Chemistry',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Matter & Chemical Changes: Acids, Bases & Indicators',
    difficulty: 'Beginner',
    durationMinutes: 25,
    description: 'Test the pH of everyday liquids such as lemon juice, coffee, pure water, blood, bleach, and hydrochloric acid. Dip the digital pH probe, dilute with water, and observe hydronium / hydroxide ion shifts.',
    phetUrl: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html',
    nativeEngineType: 'ph_scale',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale-600.png',
    learningGoals: [
      'Determine the pH of acidic (pH < 7), neutral (pH = 7), and alkaline/basic (pH > 7) solutions.',
      'Analyze the effect of water dilution on solution acidity and alkalinity.',
      'Relate pH values to Universal Indicator color spectra and domestic household reagents.'
    ],
    inquiryPrompts: [
      'Does adding water to an acid increase or decrease its pH? Can dilution ever push an acid above pH 7.0?',
      'Why is human blood maintained strictly near pH 7.4 in biological systems?',
      'Predict the color of Universal Indicator in stomach acid (pH ~ 1.5) vs household bleach (pH ~ 13.0).'
    ],
    keyFormulas: ['pH = -log₁₀[H⁺]', '[H⁺][OH⁻] = 1.0 × 10⁻¹⁴ (at 25°C)', 'Neutral pH = 7.00'],
    classicTools: ['ph_meter', 'stopwatch'],
    cbcCurriculumRef: 'CBC Grade 7 Chemistry Strand 2.3 · JSS Reagents Items #1, #2, #3, #4, #6, #16'
  },
  {
    id: 'phet-forces-motion',
    title: 'Forces & Motion: Basics (Tug-of-War & Friction)',
    subject: 'Physics',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Force & Energy: Newton\'s Laws & Net Force Vectors',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    description: 'Explore the forces at work in a tug-of-war cart, investigate frictional resistance against sliding crates and refrigerators, and measure resulting speed and acceleration.',
    phetUrl: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html',
    nativeEngineType: 'forces_motion',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics-600.png',
    learningGoals: [
      'Determine balanced and unbalanced forces and compute the net force vector (F_net).',
      'Demonstrate Newton\'s Second Law: acceleration is proportional to applied force and inversely proportional to mass.',
      'Quantify the effect of static and kinetic surface friction on motion.'
    ],
    inquiryPrompts: [
      'If the blue team pulls with 250N left and the red team pulls with 200N right, what is the net force vector?',
      'Why does a 100kg refrigerator require more initial force to start moving than a 50kg crate?',
      'What happens to cart speed when the net force becomes zero after motion has already started?'
    ],
    keyFormulas: ['F_net = m × a', 'F_friction = μ × F_normal', 'W = m × g (g = 9.8 m/s²)'],
    classicTools: ['stopwatch', 'ruler'],
    cbcCurriculumRef: 'CBC Grade 8 Integrated Science Strand 3.1 · Force, Mass & Acceleration'
  },
  {
    id: 'phet-energy-skate-park',
    title: 'Energy Skate Park: Basics & Conservation of Energy',
    subject: 'Physics',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Energy Transformations: Kinetic, Potential & Thermal',
    difficulty: 'Intermediate',
    durationMinutes: 30,
    description: 'Track the skater\'s kinetic and gravitational potential energy in real-time bar charts as they ride curved ramps. Alter gravity between Earth, Moon, Jupiter, and test track friction.',
    phetUrl: 'https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_en.html',
    nativeEngineType: 'energy_skate',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics-600.png',
    learningGoals: [
      'Demonstrate the Law of Conservation of Energy: Total Mechanical Energy remains constant in the absence of friction.',
      'Observe potential energy conversion into kinetic energy at the bottom of the ramp.',
      'Investigate the impact of planetary gravity (Earth vs Moon vs Jupiter) on skate velocity.'
    ],
    inquiryPrompts: [
      'Where on the track is kinetic energy at its maximum? Where is potential energy highest?',
      'When friction is enabled, which energy bar increases as the skater gradually slows down?',
      'How does the skater\'s motion on the Moon compare with their motion on Jupiter?'
    ],
    keyFormulas: ['E_total = E_k + E_p + E_thermal', 'E_k = ½ × m × v²', 'E_p = m × g × h'],
    classicTools: ['energy_graph', 'stopwatch'],
    cbcCurriculumRef: 'CBC Grade 7 Science Strand 4.1 · Conservation of Mechanical Energy'
  },
  {
    id: 'phet-bending-light',
    title: 'Bending Light: Snell\'s Law, Reflection & Refraction',
    subject: 'Physics',
    gradeLevel: 'Grade 8-9 & JSS',
    strand: 'Light & Optics: Refraction at Material Boundaries',
    difficulty: 'Advanced',
    durationMinutes: 30,
    description: 'Direct a laser ray through air, water, glass, and diamond. Measure angles with the protractor tool to verify Snell\'s Law, and observe critical angle Total Internal Reflection.',
    phetUrl: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_en.html',
    nativeEngineType: 'bending_light',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light-600.png',
    learningGoals: [
      'Measure angle of incidence (θ₁) and angle of refraction (θ₂) at boundary interfaces.',
      'Calculate refractive index using Snell\'s Law (n₁ sin θ₁ = n₂ sin θ₂).',
      'Identify the critical angle and observe Total Internal Reflection (TIR).'
    ],
    inquiryPrompts: [
      'Why does a light ray bend toward the normal when entering a denser optical medium like glass?',
      'What is the critical angle for a water-to-air boundary (n_water = 1.33, n_air = 1.00)?',
      'Explain how fiber optic telecommunications cables use total internal reflection.'
    ],
    keyFormulas: ['n₁ sin θ₁ = n₂ sin θ₂', 'n = c / v', 'sin θ_c = n₂ / n₁ (when n₁ > n₂)'],
    classicTools: ['protractor', 'ruler'],
    cbcCurriculumRef: 'CBC Grade 8 Optics Strand 4.4 · JSS Physics Optics Kit Items #31, #32, #33'
  },
  {
    id: 'phet-states-of-matter',
    title: 'States of Matter & Gas Laws: Basics (PV = nRT)',
    subject: 'Chemistry',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Matter: Kinetic Theory, Pressure & Temperature',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    description: 'Heat, cool, and compress atoms and molecules in a sealed chamber. Watch phase transitions between solid, liquid, and gas, and observe how temperature and volume govern pressure.',
    phetUrl: 'https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_en.html',
    nativeEngineType: 'states_of_matter',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics-600.png',
    learningGoals: [
      'Describe molecular spacing, bonding, and kinetic vibration in solids, liquids, and gases.',
      'Analyze Gay-Lussac\'s Law: pressure of a fixed volume of gas increases directly with temperature.',
      'Relate temperature changes to particle velocity and phase changes (melting, evaporation, condensation).'
    ],
    inquiryPrompts: [
      'What happens to the pressure gauge when you slide the burner to Fire without changing volume?',
      'Why do gas particles push outward against the cylinder walls and lid?',
      'Explain what happens at Absolute Zero (0 Kelvin / -273.15°C).'
    ],
    keyFormulas: ['P × V = n × R × T', 'P₁ / T₁ = P₂ / T₂ (Gay-Lussac\'s Law)', 'K = °C + 273.15'],
    classicTools: ['stopwatch'],
    cbcCurriculumRef: 'CBC Grade 7 Chemistry Strand 2.1 · States of Matter & Particle Motion'
  },
  {
    id: 'phet-density-buoyancy',
    title: 'Density & Archimedes Buoyancy Principle',
    subject: 'Physics',
    gradeLevel: 'Grade 6-8 & JSS',
    strand: 'Physical Quantities: Measurement, Volume & Sinking/Floating',
    difficulty: 'Beginner',
    durationMinutes: 20,
    description: 'Submerge blocks of wood, aluminum, iron, and stone into a water cylinder. Measure mass and displaced liquid volume using the Eureka can to compute density and buoyant force.',
    phetUrl: 'https://phet.colorado.edu/sims/html/density/latest/density_en.html',
    nativeEngineType: 'density_buoyancy',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/density/latest/density-600.png',
    learningGoals: [
      'Determine volume of irregular solids through fluid displacement.',
      'Calculate density using ρ = mass / volume and predict whether an object floats or sinks in water (ρ_water = 1.0 g/cm³).',
      'Verify Archimedes\' Principle: buoyant force equals the weight of displaced liquid.'
    ],
    inquiryPrompts: [
      'Why does a 5kg block of wood float while a 2kg block of iron sinks?',
      'If an irregular stone displaces 24ml of water and has a mass of 64.8g, what is its density?',
      'How does adding salt to water change the buoyant force exerted on floating objects?'
    ],
    keyFormulas: ['Density (ρ) = Mass / Volume', 'F_buoyant = ρ_fluid × V_displaced × g'],
    classicTools: ['ruler', 'stopwatch'],
    cbcCurriculumRef: 'CBC Grade 6-7 Measurement Strand · JSS Equipment Items #24, #25, #26, #27'
  },
  {
    id: 'phet-pendulum-lab',
    title: 'Pendulum Lab: Period, Mass & Gravity Oscillations',
    subject: 'Physics',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Oscillations: Simple Harmonic Motion & Periodic Time',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    description: 'Swing one or two pendulums with customizable string length, bob mass, release angle, and planetary gravity. Measure time period T using the photogate stopwatch.',
    phetUrl: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_en.html',
    nativeEngineType: 'energy_skate',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab-600.png',
    learningGoals: [
      'Investigate variables affecting periodic time: length, mass, amplitude angle, and gravity.',
      'Confirm that pendulum period is independent of bob mass for small angles.',
      'Calculate local gravitational acceleration g using T = 2π√(L/g).'
    ],
    inquiryPrompts: [
      'Does a heavier pendulum bob swing faster or slower than a light bob of the same length?',
      'How must you alter string length L to double the period of oscillation?',
      'What would happen to the pendulum\'s period if transported from Nairobi to the surface of the Moon?'
    ],
    keyFormulas: ['T = 2π × √(L / g)', 'f = 1 / T', 'g = 4π² × L / T²'],
    classicTools: ['stopwatch', 'protractor', 'ruler'],
    cbcCurriculumRef: 'CBC Grade 8 Physics Strand 4.3 · Periodic Motion & Gravitational Fields'
  },
  {
    id: 'phet-balancing-equations',
    title: 'Balancing Chemical Equations & Stoichiometry',
    subject: 'Chemistry',
    gradeLevel: 'Grade 8-9 & JSS',
    strand: 'Matter & Chemical Reactions: Conservation of Mass',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    description: 'Balance synthesis, combustion, and water decomposition reactions using visual balance scales and molecule models to satisfy the Law of Conservation of Mass.',
    phetUrl: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_en.html',
    nativeEngineType: 'ph_scale',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations-600.png',
    learningGoals: [
      'Balance chemical reaction equations by adjusting stoichiometric coefficients.',
      'Demonstrate that number of reactant atoms equals number of product atoms for every element.',
      'Practice with reactions: Water synthesis (2H₂ + O₂ → 2H₂O), Ammonia synthesis, and Methane combustion.'
    ],
    inquiryPrompts: [
      'Why can you only change coefficients in front of formulas, but never subscripts within a chemical formula?',
      'Balance: __ CH₄ + __ O₂ → __ CO₂ + __ H₂O.',
      'State the Law of Conservation of Mass and explain how balanced equations verify it.'
    ],
    keyFormulas: ['Reactant Atoms = Product Atoms', 'N₂ + 3H₂ → 2NH₃', '2H₂ + O₂ → 2H₂O'],
    classicTools: ['stopwatch'],
    cbcCurriculumRef: 'CBC Grade 8 Chemistry Strand 2.4 · Chemical Equations & Stoichiometry'
  },
  {
    id: 'phet-static-electricity',
    title: 'Balloons & Static Electricity: Electrostatic Charges',
    subject: 'Physics',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Electricity & Magnetism: Electrostatics & Charge Transfer',
    difficulty: 'Beginner',
    durationMinutes: 20,
    description: 'Rub yellow and green balloons on a wool sweater to transfer negative electrons. Observe electrostatic attraction to the positively charged sweater and induced polarization against neutral walls.',
    phetUrl: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_en.html',
    nativeEngineType: 'circuits',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity-600.png',
    learningGoals: [
      'Explain static charging through friction: electron transfer from wool sweater to balloon.',
      'Observe fundamental law of electrostatics: like charges repel, opposite charges attract.',
      'Demonstrate charge polarization in a neutral wall when approached by a negatively charged balloon.'
    ],
    inquiryPrompts: [
      'Why does the rubbed balloon stick to the neutral wall even though the wall has no net charge?',
      'If two balloons are both rubbed on the sweater, what happens when you bring them close together?',
      'Which subatomic particles are transferred during rubbing: protons, neutrons, or electrons?'
    ],
    keyFormulas: ['F = k × (q₁ × q₂) / r² (Coulomb\'s Law)', 'Net Charge Q = n × e (e = 1.6 × 10⁻¹⁹ C)'],
    classicTools: ['ruler'],
    cbcCurriculumRef: 'CBC Grade 7 Science Strand 4.1 · Electrostatics & Charge Induction'
  },
  {
    id: 'phet-build-atom',
    title: 'Build an Atom: Subatomic Particles & Periodic Table',
    subject: 'Chemistry',
    gradeLevel: 'Grade 7-9 & JSS',
    strand: 'Matter & Atomic Structure: Protons, Neutrons & Electrons',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    description: 'Drag protons, neutrons, and electrons into the nucleus and energy orbitals to construct stable atoms and ions. Identify element symbols, mass numbers, and net charges on the periodic table.',
    phetUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html',
    nativeEngineType: 'ph_scale',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom-600.png',
    learningGoals: [
      'Recognize that proton number defines atomic number Z and the chemical identity of an element.',
      'Calculate mass number A = Protons + Neutrons and identify isotopes.',
      'Determine net electrical charge: Net Charge = Protons - Electrons (positive cations vs negative anions).'
    ],
    inquiryPrompts: [
      'What happens to the element identity when you add an extra proton to an oxygen nucleus?',
      'Construct a stable neutral Carbon-12 atom. How many protons, neutrons, and electrons are needed?',
      'What is the net charge of an atom with 11 protons and 10 electrons? Which element is this?'
    ],
    keyFormulas: ['Atomic Number Z = Number of Protons', 'Mass Number A = Protons + Neutrons', 'Net Charge = Protons - Electrons'],
    classicTools: ['stopwatch'],
    cbcCurriculumRef: 'CBC Grade 8 Chemistry Strand 2.2 · Atomic Structure & Periodic Table'
  },
  {
    id: 'phet-wave-on-string',
    title: 'Wave on a String: Frequency, Amplitude & Tension',
    subject: 'Physics',
    gradeLevel: 'Grade 8-9 & JSS',
    strand: 'Waves & Sound: Transverse Waves, Reflection & Resonance',
    difficulty: 'Intermediate',
    durationMinutes: 25,
    description: 'Wiggle a string manually or use an oscillator. Adjust wave frequency, amplitude, damping, and string tension. Measure wavelength with rulers and observe fixed vs loose end reflections.',
    phetUrl: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_en.html',
    nativeEngineType: 'bending_light',
    thumbnailUrl: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string-600.png',
    learningGoals: [
      'Identify wave properties: crest, trough, wavelength (λ), amplitude (A), and frequency (f).',
      'Verify the fundamental wave equation: v = f × λ.',
      'Investigate the effect of damping and string tension on wave speed.'
    ],
    inquiryPrompts: [
      'When frequency f is increased, what happens to wavelength λ if tension is kept constant?',
      'How does wave reflection from a fixed end differ from reflection at a loose end ring?',
      'Calculate wave speed if frequency is 2.0 Hz and measured wavelength is 3.5 cm.'
    ],
    keyFormulas: ['v = f × λ', 'T = 1 / f', 'v = √(Tension / linear_density)'],
    classicTools: ['ruler', 'stopwatch'],
    cbcCurriculumRef: 'CBC Grade 8 Physics Strand 4.5 · Wave Motion, Frequency & Amplitude'
  }
];
