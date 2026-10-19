import { LabApparatusItem, JSS_LAB_REQUIREMENTS } from '../labInventoryData';

export interface ApparatusDemonstrationData {
  itemNumber: number;
  diagramType: 
    | 'microscope'
    | 'bunsen_burner'
    | 'measuring_cylinder'
    | 'beaker'
    | 'conical_flask'
    | 'test_tubes_rack'
    | 'spring_balance'
    | 'vernier_calipers'
    | 'eureka_can'
    | 'separating_funnel'
    | 'condenser'
    | 'circuit_switch'
    | 'reagent_bottle'
    | 'indicator_paper'
    | 'thermometer'
    | 'magnet'
    | 'balance_scale'
    | 'gas_jar'
    | 'delivery_tube'
    | 'mortar_pestle'
    | 'safety_gear'
    | 'generic_apparatus';
  labeledParts: Array<{ label: string; x: number; y: number; description: string }>;
  primaryUses: string[];
  teacherDemonstrationGuide: {
    setup: string;
    action: string;
    observationPrompt: string;
    expectedLearnerResponse: string;
    discussionQuestions: string[];
  };
  keyScientificPrinciples: string[];
  safetyAndHandling: {
    hazardType: string;
    protectiveGear: string[];
    rules: string[];
    storageCare: string;
  };
  interactiveSimulationType?: 
    | 'flame_control'
    | 'meniscus_reading'
    | 'spring_load'
    | 'caliper_slide'
    | 'microscope_focus'
    | 'funnel_tap'
    | 'circuit_toggle'
    | 'reagent_color_test'
    | 'magnet_field'
    | 'generic';
}

export const APPARATUS_DEMONSTRATION_CATALOG: Record<number, ApparatusDemonstrationData> = {
  // #1: Litmus Solution
  1: {
    itemNumber: 1,
    diagramType: 'reagent_bottle',
    labeledParts: [
      { label: 'Amber Dropper Bottle', x: 50, y: 30, description: 'Protects light-sensitive organic litmus dye' },
      { label: 'Teat Pipette Dropper', x: 50, y: 15, description: 'Dispenses controlled micro-droplets' },
      { label: 'Neutral Violet Solution', x: 50, y: 70, description: 'Natural lichen dye with pH transition point ~7' }
    ],
    primaryUses: [
      'Qualitative chemical classification of unknown solutions as acidic, neutral, or alkaline',
      'Demonstrating the reversible nature of chemical acid-base neutralization indicators'
    ],
    teacherDemonstrationGuide: {
      setup: 'Set out three test tubes: Dilute HCl (acidic), Distilled Water (neutral), and Dilute NaOH (alkaline).',
      action: 'Using the teat dropper, add 2 drops of purple litmus solution to each test tube in front of the class.',
      observationPrompt: 'Observe the instantaneous colour shifts in each tube. What does violet turning red indicate?',
      expectedLearnerResponse: 'Acid turns litmus red, alkali turns it blue, and neutral water retains purple/violet.',
      discussionQuestions: [
        'Why is litmus extracted from lichens called a qualitative rather than quantitative indicator?',
        'If an unknown solution turns litmus red, what range do you expect its pH value to be?'
      ]
    },
    keyScientificPrinciples: [
      'Acidic hydrogen ions (H⁺) cause structural molecular rearrangement in the litmus pigment, reflecting red light wavelengths.',
      'Hydroxide ions (OH⁻) deprotonate the pigment, shifting light absorption to royal blue.'
    ],
    safetyAndHandling: {
      hazardType: 'General Safe (Organic Dye)',
      protectiveGear: ['Laboratory Coat', 'Eye Protection'],
      rules: ['Keep dropper clean to prevent cross-contamination of mother solution', 'Wipe bottle neck after dispensing'],
      storageCare: 'Store in cool Cabinet A away from direct solar radiation.'
    },
    interactiveSimulationType: 'reagent_color_test'
  },

  // #2: Litmus Papers (Red & Blue)
  2: {
    itemNumber: 2,
    diagramType: 'indicator_paper',
    labeledParts: [
      { label: 'Blue Litmus Strip', x: 35, y: 50, description: 'Turns red in acid solutions (pH < 4.5)' },
      { label: 'Red Litmus Strip', x: 65, y: 50, description: 'Turns blue in basic/alkaline solutions (pH > 8.3)' },
      { label: 'Watch Glass Contact Area', x: 50, y: 85, description: 'Place paper on clean watch glass before wetting' }
    ],
    primaryUses: [
      'Quick test for acidic and basic liquids and moist gases (e.g., ammonia, hydrogen chloride)',
      'Testing acidity of lemon juice, vinegar, ash filtrate, and soil samples in CBC agriculture and science'
    ],
    teacherDemonstrationGuide: {
      setup: 'Place red and blue litmus paper strips on a dry white porcelain tile or watch glass.',
      action: 'Touch each strip with a clean glass stirring rod dipped into dilute ethanoic acid, then dilute sodium hydroxide.',
      observationPrompt: 'Notice that dry gas cannot turn litmus paper until moisture is present. Why is water necessary?',
      expectedLearnerResponse: 'Acids and bases require water to dissociate into free H⁺ and OH⁻ ions that trigger the color change.',
      discussionQuestions: [
        'What will happen if you test dry ammonia gas with completely dry red litmus paper?',
        'Why does blue litmus paper turn red when exposed to sour milk or citrus juices?'
      ]
    },
    keyScientificPrinciples: [
      'Cellulose paper impregnated with azolitmin dye.',
      'Requires hydration sphere to permit proton transfer.'
    ],
    safetyAndHandling: {
      hazardType: 'General Safe',
      protectiveGear: ['Nitrile Gloves', 'Lab Coat'],
      rules: ['Handle strips by the dry end or with forceps', 'Do not insert fingers into the packet'],
      storageCare: 'Store in dry airtight container to prevent atmospheric moisture and fume absorption.'
    },
    interactiveSimulationType: 'reagent_color_test'
  },

  // #4: Phenolphthalein Indicator Solution
  4: {
    itemNumber: 4,
    diagramType: 'reagent_bottle',
    labeledParts: [
      { label: 'Alcoholic Solvent', x: 50, y: 40, description: '1% solution in 95% ethanol solvent' },
      { label: 'Sharp Endpoint Transition', x: 50, y: 65, description: 'Colourless (pH 0-8.2) to Vivid Magenta Pink (pH 8.3-10)' }
    ],
    primaryUses: [
      'Volumetric analysis indicator for strong acid / strong base titrations',
      'Detecting alkaline leakage, concrete carbonation, or hydroxide formation in metals reacting with water'
    ],
    teacherDemonstrationGuide: {
      setup: 'Prepare a conical flask containing dilute HCl and another with dilute NaOH.',
      action: 'Add 2 drops of phenolphthalein into the acid (remains clear), then add dropwise NaOH until a faint permanent pink color persists.',
      observationPrompt: 'Observe how one single extra drop of alkali transforms the solution from crystal clear to vibrant pink.',
      expectedLearnerResponse: 'The titration endpoint is reached when excess hydroxide ions deprotonate the indicator.',
      discussionQuestions: [
        'Why is phenolphthalein preferred over methyl orange for weak acid vs strong base titrations?',
        'What does it mean when a pink solution goes clear upon blowing exhaled breath into it through a straw?'
      ]
    },
    keyScientificPrinciples: [
      'Triarylmethane dye dye that opens a lactone ring in alkaline medium to form a resonance-stabilized quinoid ion.',
      'Lactone form is colorless; quinoid dianion exhibits intense pink absorption at 553 nm.'
    ],
    safetyAndHandling: {
      hazardType: 'Flammable (Alcohol solvent)',
      protectiveGear: ['Safety Goggles', 'Lab Coat'],
      rules: ['Keep away from open Bunsen flames when dispensing', 'Avoid inhalation of alcohol vapors'],
      storageCare: 'Flammables cabinet, tightly capped.'
    },
    interactiveSimulationType: 'reagent_color_test'
  },

  // #24: Weighing Machine (Top Pan & Electronic Balance)
  24: {
    itemNumber: 24,
    diagramType: 'balance_scale',
    labeledParts: [
      { label: 'Stainless Steel Weighing Pan', x: 50, y: 25, description: 'Corrosion-resistant flat surface for receiving vessels' },
      { label: 'Tare / Zero Calibration Button', x: 75, y: 75, description: 'Zeros out the mass of watch glass or beaker' },
      { label: 'Digital LCD Display (0.01g)', x: 50, y: 65, description: 'Displays mass in grams, milligrams, or ounces' },
      { label: 'Spirit Level Bubble', x: 25, y: 75, description: 'Ensures the balance is perfectly horizontal on the workbench' }
    ],
    primaryUses: [
      'Accurate measurement of chemical reagents, mineral samples, and specimen masses in grams',
      'Determining density of irregular and regular solids combined with displacement methods',
      'Measuring mass change in conservation of mass investigations and chemical precipitate reactions'
    ],
    teacherDemonstrationGuide: {
      setup: 'Place electronic balance on a sturdy vibration-free lab bench and verify spirit level centering.',
      action: 'Place an empty 100ml beaker on the pan. Press the "TARE" button to zero the display. Then add 5.00g of sodium chloride using a spatula.',
      observationPrompt: 'Watch how the TARE function subtracts container weight so we only weigh the chemical.',
      expectedLearnerResponse: 'The display resets to 0.00g, allowing direct measurement of the added salt without mental subtraction.',
      discussionQuestions: [
        'Why should you never place moist chemical crystals directly onto the bare metal pan?',
        'How do drafts from open laboratory windows affect digital balance precision?'
      ]
    },
    keyScientificPrinciples: [
      'Electromagnetic force restoration or strain gauge load cell converts mechanical gravitational pull into electrical resistance change.',
      'Mass is constant regardless of location; weight equals mass multiplied by gravitational field strength (W = mg).'
    ],
    safetyAndHandling: {
      hazardType: 'Precision Instrument (Delicate Load Cell)',
      protectiveGear: ['Clean Spatula', 'Weighing Boats'],
      rules: ['Never exceed maximum capacity (e.g. 500g)', 'Clean powder residue with camel hair brush immediately'],
      storageCare: 'Cover with plastic dust hood when not in use; disconnect power adapter during lightning.'
    },
    interactiveSimulationType: 'meniscus_reading'
  },

  // #25: Eureka Cans (Displacement Cans)
  25: {
    itemNumber: 25,
    diagramType: 'eureka_can',
    labeledParts: [
      { label: 'Angled Overflow Spout', x: 80, y: 40, description: 'Directs overflow liquid cleanly into receiving measuring cylinder' },
      { label: 'Cylindrical Metal Vessel', x: 45, y: 55, description: 'Smooth internal volume filled to level of spout' },
      { label: 'Submerged Irregular Solid', x: 45, y: 70, description: 'Displaces an exact volume of water equal to its own bulk' }
    ],
    primaryUses: [
      'Measuring the physical volume of irregular solids (stones, metal bolts, wood blocks) that cannot be measured with a ruler',
      'Demonstrating Archimedes’ Principle and displacement theory in JSS Integrated Science'
    ],
    teacherDemonstrationGuide: {
      setup: 'Fill the Eureka can with tap water until water begins to run out through the spout. Allow all dripping to completely cease.',
      action: 'Place a dry, empty graduated measuring cylinder under the spout. Slowly lower an irregular stone tied to cotton thread into the can.',
      observationPrompt: 'Observe the liquid overflowing into the measuring cylinder. What is the relation between the stone and the collected water?',
      expectedLearnerResponse: 'The volume of displaced water collected equals the exact volume of the stone.',
      discussionQuestions: [
        'Why must we wait for the spout to stop dripping before placing the measuring cylinder underneath?',
        'If the stone is porous and absorbs water, will the measured volume be too high or too low?'
      ]
    },
    keyScientificPrinciples: [
      'Archimedes’ principle: A completely submerged body displaces a volume of fluid equal to its own volume.',
      'Density (ρ) = Mass (m) / Volume (V). By combining electronic balance mass with Eureka can volume, irregular density is computed.'
    ],
    safetyAndHandling: {
      hazardType: 'Water Spill Hazard',
      protectiveGear: ['Laboratory Coat'],
      rules: ['Lower objects gently using thin thread to avoid water splashing or shock damage to the can bottom', 'Place on a level tray'],
      storageCare: 'Dry thoroughly after practical sessions to prevent galvanic corrosion.'
    },
    interactiveSimulationType: 'meniscus_reading'
  },

  // #26: Vernier Calipers
  26: {
    itemNumber: 26,
    diagramType: 'vernier_calipers',
    labeledParts: [
      { label: 'Outside Large Jaws', x: 25, y: 70, description: 'Measures outer diameter or thickness of spheres and cylinders' },
      { label: 'Inside Small Jaws', x: 25, y: 25, description: 'Measures internal diameter of beakers, pipes, and test tubes' },
      { label: 'Main Metric Scale (cm/mm)', x: 55, y: 45, description: 'Provides coarse reading in millimeters' },
      { label: 'Sliding Vernier Scale (0.01cm)', x: 40, y: 55, description: 'Secondary scale with 10 divisions providing 0.1mm precision' },
      { label: 'Depth Measuring Blade', x: 90, y: 48, description: 'Slender stem projecting from rear to measure cavity depth' },
      { label: 'Thumb Lock Screw', x: 45, y: 35, description: 'Locks jaw position to preserve reading for inspection' }
    ],
    primaryUses: [
      'High-precision dimension measurements accurate to 0.1 mm (0.01 cm)',
      'Measuring internal diameter of test tubes, external diameter of pendulums, and depth of narrow holes'
    ],
    teacherDemonstrationGuide: {
      setup: 'Hold the Vernier caliper in good light and project the scale on the screen.',
      action: 'First close jaws completely to demonstrate zero error. Then clamp a glass marble gently between outside jaws and lock screw.',
      observationPrompt: 'Find where the Vernier zero mark aligns on the main scale, then look for the single Vernier line that coincides perfectly with a main scale line.',
      expectedLearnerResponse: 'Main scale gives centimeters and whole millimeters; the coinciding vernier line gives tenths of a millimeter.',
      discussionQuestions: [
        'How do you adjust the reading if the caliper has a positive zero error of +0.02 cm?',
        'Why are Vernier calipers superior to a regular wooden meter rule when measuring round objects?'
      ]
    },
    keyScientificPrinciples: [
      'Vernier principle: 10 divisions on the vernier scale equal 9 divisions on the main scale, yielding a least count of 0.1 mm.',
      'Parallax error reduction through closely aligned overlapping engraved scale marks.'
    ],
    safetyAndHandling: {
      hazardType: 'Delicate Precision Tool',
      protectiveGear: ['Clean dry hands'],
      rules: ['Never force the sliding jaw against hard steel; tighten thumb lock gently', 'Do not drop on tiled floors'],
      storageCare: 'Lightly oil metal surfaces and store in velvet-lined protective plastic casing.'
    },
    interactiveSimulationType: 'caliper_slide'
  },

  // #27: Spring Balances (Newton Meters)
  27: {
    itemNumber: 27,
    diagramType: 'spring_balance',
    labeledParts: [
      { label: 'Zero Adjustment Nut', x: 50, y: 15, description: 'Calibrates pointer to 0 N mark before loading' },
      { label: 'Linear Helical Steel Spring', x: 50, y: 45, description: 'Stretches proportionally to applied gravitational tensile load' },
      { label: 'Dual Force Scale (Newtons / Grams)', x: 65, y: 55, description: 'Graduated in 0.1N increments up to 5N or 10N' },
      { label: 'Pointer Indicator', x: 35, y: 55, description: 'Moves vertically along scale as spring extends' },
      { label: 'Heavy Duty Suspension Hook', x: 50, y: 90, description: 'Attaches slotted masses, friction friction blocks, or submerged objects' }
    ],
    primaryUses: [
      'Measuring forces, weight, and friction in Newtons (N) in physics mechanics',
      'Demonstrating Hooke’s Law (extension is proportional to load within elastic limit)',
      'Measuring upthrust forces when objects are submerged in liquids (apparent loss of weight)'
    ],
    teacherDemonstrationGuide: {
      setup: 'Suspend the spring balance vertically from a retort stand. Verify pointer is at zero.',
      action: 'Hook a 100g slotted brass weight. Show the pointer drop to 1.0 Newton. Add a second 100g weight to demonstrate 2.0 Newtons.',
      observationPrompt: 'Notice that doubling the hanging mass exactly doubles the downward spring displacement.',
      expectedLearnerResponse: 'Weight is directly proportional to mass: F = mg, where g ≈ 9.8 or 10 N/kg.',
      discussionQuestions: [
        'If you pull a wooden block across sandpaper vs smooth glass, what happens to the spring balance reading?',
        'What will happen to the spring if you overload it beyond its elastic limit?'
      ]
    },
    keyScientificPrinciples: [
      'Hooke’s Law: F = -k·Δx, where k is the spring stiffness constant and Δx is displacement.',
      'Conversion: 1 kilogram of mass exerts approximately 9.8 Newtons of gravitational force on Earth.'
    ],
    safetyAndHandling: {
      hazardType: 'Spring Snap Hazard if Overloaded',
      protectiveGear: ['Safety Glasses'],
      rules: ['Never exceed the maximum rated load printed on the casing (e.g. 5N / 500g)', 'Keep fingers clear of hook when unweighting'],
      storageCare: 'Hang vertically or store flat in drawer without tension on spring.'
    },
    interactiveSimulationType: 'spring_load'
  },

  // #29: Cell Holder and Knife Switch
  29: {
    itemNumber: 29,
    diagramType: 'circuit_switch',
    labeledParts: [
      { label: 'Insulated Bakelite Base', x: 50, y: 75, description: 'Non-conductive stable mounting platform' },
      { label: 'Brass Knife Blade Contact', x: 40, y: 45, description: 'Hinged brass lever that closes or opens the circuit loop' },
      { label: 'Binding Screw Terminals', x: 20, y: 65, description: 'Clamps copper connecting wire leads securely' },
      { label: 'Dual D-Cell Spring Holder', x: 75, y: 50, description: 'Holds 1.5V alkaline cells in series connection' }
    ],
    primaryUses: [
      'Controlling electrical flow in simple DC circuits, series circuits, and parallel loops',
      'Investigating electrical conductors vs insulators in Grade 7 CBC Integrated Science',
      'Demonstrating that electric current requires an unbroken closed continuous loop to flow'
    ],
    teacherDemonstrationGuide: {
      setup: 'Assemble a basic circuit: 2 D-cells, knife switch, connecting wires, and a miniature MES bulb.',
      action: 'Leave the knife switch raised (open). Point out the bulb is dark. Push the knife blade down firmly into the contact jaw.',
      observationPrompt: 'Observe the instantaneous illumination of the bulb when the switch makes physical contact.',
      expectedLearnerResponse: 'Closing the switch completes the circuit loop, allowing electrons to flow from the negative to positive terminal.',
      discussionQuestions: [
        'Why is copper used for the wires while plastic or rubber covers the outside of the switch?',
        'If a circuit switch is placed after the bulb instead of before it, will the bulb still turn on and off?'
      ]
    },
    keyScientificPrinciples: [
      'Ohm’s Law: Current (I) = Voltage (V) / Resistance (R).',
      'Open circuit has infinite resistance; closed circuit provides low-resistance metallic pathway for free conduction electrons.'
    ],
    safetyAndHandling: {
      hazardType: 'Low Voltage Safe / Short Circuit Hazard',
      protectiveGear: ['Laboratory Coat'],
      rules: ['Never connect cell terminals directly without a bulb or resistor (causes overheating and cell leakage)', 'Open switch after demonstration'],
      storageCare: 'Remove dry cells from holder before long-term storage to prevent corrosive electrolyte leaks.'
    },
    interactiveSimulationType: 'circuit_toggle'
  },

  // #36: Separating Funnel (Pear-shaped with PTFE stopcock)
  36: {
    itemNumber: 36,
    diagramType: 'separating_funnel',
    labeledParts: [
      { label: 'Ground Glass / PE Stopper', x: 50, y: 15, description: 'Seals upper mouth during vigorous inverted shaking and venting' },
      { label: 'Upper Immiscible Layer (Oil)', x: 50, y: 40, description: 'Less dense liquid (density ~0.88 g/cm³) floating on top' },
      { label: 'Lower Aqueous Layer (Water)', x: 50, y: 60, description: 'Denser polar liquid (density 1.00 g/cm³) collecting at bottom' },
      { label: 'Sharp Phase Boundary Meniscus', x: 50, y: 52, description: 'Clear line of demarcation between the two immiscible phases' },
      { label: 'PTFE Fluoropolymer Stopcock Tap', x: 50, y: 75, description: 'Precision valve to control slow dropwise liquid discharge' },
      { label: 'Narrow Draining Stem', x: 50, y: 90, description: 'Delivers dense liquid into receiving beaker beneath' }
    ],
    primaryUses: [
      'Separation of mixtures containing immiscible liquids with differing densities (e.g. kerosene/water, cooking oil/water)',
      'Liquid-liquid chemical solvent extractions in senior chemistry practicals'
    ],
    teacherDemonstrationGuide: {
      setup: 'Clamp separating funnel vertically on a retort stand over a 250ml glass beaker. Pour 100ml water (tinted with blue food dye) and 50ml cooking oil.',
      action: 'Point out the distinct layers. Remove the top stopper. Slowly twist the PTFE stopcock tap 90 degrees to drain the blue water.',
      observationPrompt: 'Watch the blue water drain out. As the oil-water interface approaches the tap, slow the flow to dropwise.',
      expectedLearnerResponse: 'Turn the tap off precisely when the boundary reaches the bore, cleanly isolating the oil in the funnel.',
      discussionQuestions: [
        'Why must you always remove the top glass stopper before opening the stopcock tap?',
        'Can a separating funnel be used to separate ethanol and water? Why or why not?'
      ]
    },
    keyScientificPrinciples: [
      'Immiscibility: Polar molecules (water) form hydrogen bonds that exclude non-polar hydrocarbon molecules (oil).',
      'Density stratification: Gravitational separation where denser liquid sinks beneath buoyant lighter liquid.'
    ],
    safetyAndHandling: {
      hazardType: 'Fragile Borosilicate Glassware',
      protectiveGear: ['Safety Glasses', 'Lab Coat'],
      rules: ['Always hold the stopper with index finger when shaking and vent gas frequently', 'Support clamped funnel firmly with retort ring'],
      storageCare: 'Wash with detergent to remove oil films; store with stopcock slightly loosened.'
    },
    interactiveSimulationType: 'funnel_tap'
  },

  // #37: Liebig Condensers
  37: {
    itemNumber: 37,
    diagramType: 'condenser',
    labeledParts: [
      { label: 'Inner Borosilicate Vapor Tube', x: 50, y: 50, description: 'Direct pathway for hot chemical vapor to condense on cold walls' },
      { label: 'Outer Cooling Water Jacket', x: 50, y: 35, description: 'Surrounds inner tube with circulating cold counter-current water' },
      { label: 'Cold Water Inlet (Bottom)', x: 25, y: 70, description: 'Connects to tap hose; entering at bottom ensures jacket fills completely' },
      { label: 'Warm Water Outlet (Top)', x: 75, y: 30, description: 'Directs warm water to lab sink drain' },
      { label: 'Ground Glass Joint (19/26)', x: 15, y: 50, description: 'Connects securely to distillation flask without rubber bungs' }
    ],
    primaryUses: [
      'Simple distillation and fractional distillation of miscible mixtures (e.g., ethanol/water, salty sea water purification)',
      'Refluxing volatile organic reactions to prevent evaporation loss of solvents'
    ],
    teacherDemonstrationGuide: {
      setup: 'Assemble simple distillation apparatus: Round bottom boiling flask on heating mantle, three-way adapter, Liebig condenser, and receiving flask.',
      action: 'Turn on water tap gently. Show cold water filling the jacket from the bottom upward, eliminating air bubbles.',
      observationPrompt: 'Observe steam rising into the inner tube and instantly condensing into clear liquid droplets that roll down into the receiver.',
      expectedLearnerResponse: 'The cold water jacket absorbs latent heat of vaporization, turning gas back into liquid.',
      discussionQuestions: [
        'Why must cooling water enter at the lower nozzle and exit at the upper nozzle rather than the opposite?',
        'Why are porous pot chips (Item #38) placed inside the boiling flask before heating?'
      ]
    },
    keyScientificPrinciples: [
      'Latent Heat of Condensation: Gas releases thermal energy when changing phase to liquid at boiling point.',
      'Counter-current heat exchange maximizes temperature gradient along entire length of condenser tube.'
    ],
    safetyAndHandling: {
      hazardType: 'Thermal Shock / Glassware Fracture',
      protectiveGear: ['Safety Goggles', 'Heat Resistant Gloves'],
      rules: ['Ensure water hoses are secured with hose clips to prevent popping off under water pressure', 'Never apply direct flame to condenser'],
      storageCare: 'Drain water completely; store in padded drawer vertically or in dedicated cardboard tube.'
    },
    interactiveSimulationType: 'generic'
  },

  // #44: Strong Magnets (Bar and Horse Shoe Magnets)
  44: {
    itemNumber: 44,
    diagramType: 'magnet',
    labeledParts: [
      { label: 'North Magnetic Pole (Red / N)', x: 30, y: 50, description: 'Magnetic field lines emerge outward from North pole' },
      { label: 'South Magnetic Pole (Blue / S)', x: 70, y: 50, description: 'Magnetic field lines enter inward toward South pole' },
      { label: 'Neutral Magnetic Centre', x: 50, y: 50, description: 'Minimal external magnetic field attraction at physical midpoint' },
      { label: 'Soft Iron Keepers', x: 50, y: 80, description: 'Protective metal bars stored across poles to prevent demagnetization' }
    ],
    primaryUses: [
      'Demonstrating magnetic attraction and repulsion (like poles repel, unlike poles attract)',
      'Plotting magnetic field flux patterns using iron filings (#34) and plotting compasses',
      'Magnetic separation of mixtures (separating iron nails or filings from sulphur powder or sand)'
    ],
    teacherDemonstrationGuide: {
      setup: 'Place a bar magnet beneath a sheet of stiff white paper or clear perspex plate.',
      action: 'Gently sprinkle fine iron filings (#34) from a pepper shaker over the paper and tap the edges lightly with a pencil.',
      observationPrompt: 'Observe the filings align along curved continuous lines arching from North to South pole.',
      expectedLearnerResponse: 'Iron filings become temporary magnetic dipoles and trace the invisible three-dimensional magnetic field lines.',
      discussionQuestions: [
        'Where is the magnetic field concentration the strongest around the magnet?',
        'How can you tell if an unknown metallic bar is a permanent magnet or merely a magnetic material?'
      ]
    },
    keyScientificPrinciples: [
      'Ferromagnetism and domain theory: Alignment of electron spin magnetic moments within crystalline domains.',
      'Inverse square law behavior: Magnetic force diminishes rapidly with increasing spatial separation distance.'
    ],
    safetyAndHandling: {
      hazardType: 'Pinch Hazard with Neodymium / Demagnetization Hazard',
      protectiveGear: ['Safety Glasses'],
      rules: ['Do not drop or hammer magnets (thermal and mechanical shock disaligns magnetic domains)', 'Keep away from electronic displays and compasses'],
      storageCare: 'Store bar magnets in pairs with opposite poles adjacent and soft iron keepers bridging the ends.'
    },
    interactiveSimulationType: 'magnet_field'
  },

  // #46: Teat Pipette (Medicine Droppers)
  46: {
    itemNumber: 46,
    diagramType: 'reagent_bottle',
    labeledParts: [
      { label: 'Flexible Rubber Teat Bulb', x: 50, y: 15, description: 'Squeeze to expel air and create partial vacuum for suction' },
      { label: 'Clear Glass Suction Stem', x: 50, y: 50, description: 'Transparent tube allows visual check of liquid level and clarity' },
      { label: 'Narrow Calibrated Orifice Tip', x: 50, y: 90, description: 'Forms uniform micro-droplets (~0.05 ml per drop)' }
    ],
    primaryUses: [
      'Controlled dispensing of chemical indicators, acids, and stains one drop at a time',
      'Adding iodine solution to test for starch in food tests, or methylene blue for specimen slide staining'
    ],
    teacherDemonstrationGuide: {
      setup: 'Hold the teat pipette vertically over a watch glass with water.',
      action: 'Demonstrate proper technique: squeeze rubber teat BEFORE entering liquid, submerge tip, release pressure to draw liquid, then hold vertical to dispense single drops.',
      observationPrompt: 'Show learners what happens when pipette is held horizontally or inverted (liquid runs into rubber teat and damages it).',
      expectedLearnerResponse: 'Pipettes must always remain vertical with tip pointing downward.',
      discussionQuestions: [
        'Why must you never invert a teat pipette containing concentrated sulphuric acid?',
        'Approximately how many drops from a standard teat pipette make up 1 milliliter of water?'
      ]
    },
    keyScientificPrinciples: [
      'Atmospheric pressure drives liquid into the tube when internal gas pressure is reduced by releasing the squeezed bulb.',
      'Surface tension governs uniform droplet volume breakaway from the glass orifice.'
    ],
    safetyAndHandling: {
      hazardType: 'Cross-Contamination & Chemical Attack on Rubber',
      protectiveGear: ['Laboratory Coat', 'Gloves'],
      rules: ['Rinse thoroughly with distilled water between different reagents', 'Never lay filled pipette flat on bench'],
      storageCare: 'Separate rubber teats from glass stems before autoclaving; store clean in rack.'
    },
    interactiveSimulationType: 'reagent_color_test'
  },

  // #50: Torch Bulbs (MES Miniature)
  50: {
    itemNumber: 50,
    diagramType: 'circuit_switch',
    labeledParts: [
      { label: 'Clear Glass Bulb Envelope', x: 50, y: 20, description: 'Evacuated or inert-gas-filled glass protecting filament from oxidation' },
      { label: 'Coiled Tungsten Filament', x: 50, y: 35, description: 'High-melting-point wire that glows incandescently when carrying current' },
      { label: 'Brass Screw Thread Contact', x: 50, y: 65, description: 'First electrical connection terminal (MES size)' },
      { label: 'Lead Solder Foot Contact', x: 50, y: 85, description: 'Base contact terminal separated by insulating glass bead' }
    ],
    primaryUses: [
      'Visual indicator of current flow in electric circuit practicals',
      'Comparing brightness in series vs parallel circuits to demonstrate voltage division and branch currents'
    ],
    teacherDemonstrationGuide: {
      setup: 'Connect one bulb to two 1.5V cells. Note the brightness. Then add a second bulb in series.',
      action: 'Point out how adding bulbs in series causes both to dim. Then reconnect the bulbs in parallel and compare brightness.',
      observationPrompt: 'Why do bulbs in parallel glow at full brightness while bulbs in series dim?',
      expectedLearnerResponse: 'In series, bulbs share the total voltage (1.5V each); in parallel, each branch receives full battery voltage (3.0V).',
      discussionQuestions: [
        'If one bulb burns out in your house, do all the other lights go off? What type of circuit is used in home wiring?',
        'What energy transformation occurs inside an incandescent bulb filament?'
      ]
    },
    keyScientificPrinciples: [
      'Joule heating: Electrical energy converted into thermal and radiant energy (P = I²R = V²/R).',
      'Ohm’s law and circuit topology rules (Kirchhoff’s current and voltage laws).'
    ],
    safetyAndHandling: {
      hazardType: 'Fragile Glass & Thermal Burn if Hot',
      protectiveGear: ['Lab Coat'],
      rules: ['Do not apply voltages exceeding rated capacity (e.g. 2.5V or 3.8V)', 'Let cool before unscrewing'],
      storageCare: 'Store in compartmentalized plastic egg-crate trays to prevent glass crushing.'
    },
    interactiveSimulationType: 'circuit_toggle'
  },

  // #69: Match Box (Safety Strike Matches) & Heating Station (Bunsen Burner)
  69: {
    itemNumber: 69,
    diagramType: 'bunsen_burner',
    labeledParts: [
      { label: 'Heavy Cast Metal Base', x: 50, y: 90, description: 'Provides low centre of gravity to prevent tipping' },
      { label: 'Gas Inlet Tubing Nozzle', x: 25, y: 85, description: 'Connects to reinforced neoprene gas supply hose' },
      { label: 'Rotating Air Collar Hole', x: 50, y: 70, description: 'Adjusts air intake to switch between safety flame and roaring flame' },
      { label: 'Brass Barrel Tube', x: 50, y: 50, description: 'Mixes hydrocarbon gas with air before combustion at nozzle' },
      { label: 'Hottest Zone of Flame (Tip of Inner Cone)', x: 50, y: 25, description: 'Non-luminous blue zone reaching ~1000°C to 1500°C' },
      { label: 'Safety Strike Matchbox', x: 80, y: 85, description: 'Safety matchbox with red phosphorus striking strip' }
    ],
    primaryUses: [
      'Controllable high-temperature heating of solutions, test tubes, crucibles, and boiling flasks',
      'Demonstrating complete vs incomplete hydrocarbon combustion',
      'Flame test identification of metal cations (copper green, sodium persistent yellow, potassium lilac)'
    ],
    teacherDemonstrationGuide: {
      setup: 'Connect Bunsen burner to gas tap. Place wire gauze on tripod stand (#30). Close the air collar completely.',
      action: 'Light match, hold above burner nozzle, and turn on gas tap. Show luminous yellow flame. Then rotate collar open to reveal roaring blue flame.',
      observationPrompt: 'Listen to the sound and observe the flame color change as the air hole opens. Why is the yellow flame called the safety flame?',
      expectedLearnerResponse: 'Yellow flame is luminous, easily visible across the room, and cooler. Blue flame is roaring, intensely hot, and soot-free.',
      discussionQuestions: [
        'Which flame leaves black carbon soot on the bottom of beakers, and why?',
        'Where is the hottest part of the blue flame positioned when heating a test tube?'
      ]
    },
    keyScientificPrinciples: [
      'Complete combustion: Methane + 2O₂ → CO₂ + 2H₂O + High Energy (clean blue flame).',
      'Incomplete combustion (air collar closed): Insufficient oxygen produces unburned glowing incandescent carbon soot particles (yellow light).'
    ],
    safetyAndHandling: {
      hazardType: 'Open Flame & Thermal Burn Hazard',
      protectiveGear: ['Safety Glasses', 'Tied Back Hair', 'Lab Coat Buttoned'],
      rules: ['Always light match BEFORE turning on gas', 'Never leave a blue roaring flame unattended; switch to yellow safety flame when paused', 'Point test tubes away from peers'],
      storageCare: 'Allow burners to cool completely before coiling gas tubing; check rubber hose for dry rot.'
    },
    interactiveSimulationType: 'flame_control'
  },

  // #72: Laboratory Coats (White Cotton Protective)
  72: {
    itemNumber: 72,
    diagramType: 'safety_gear',
    labeledParts: [
      { label: '100% Breathable White Cotton Fabric', x: 50, y: 35, description: 'Natural fiber does not melt onto skin like synthetic polyester during flame exposure' },
      { label: 'Snap Front / Button Closures', x: 50, y: 55, description: 'Must be fully buttoned from neck to knee for complete torso coverage' },
      { label: 'Knee-Length Hemline', x: 50, y: 80, description: 'Protects thighs and upper legs from chemical spills falling off bench edge' },
      { label: 'Fitted Elasticated / Knitted Cuffs', x: 25, y: 55, description: 'Prevents sleeves from dragging through chemicals or knocking glassware' }
    ],
    primaryUses: [
      'Primary personal protective barrier shielding clothing and skin from splashes of corrosive acids, caustic alkalis, and hot reagents',
      'Instilling professional CBC scientific safety culture and hygiene in learners'
    ],
    teacherDemonstrationGuide: {
      setup: 'Display a standard cotton lab coat alongside a synthetic polyester jacket.',
      action: 'Demonstrate proper wearing: Button every single button, push wrists into cuffs, and secure long hair behind the collar.',
      observationPrompt: 'Explain why laboratory coats are made of heavy-duty cotton rather than nylon or polyester.',
      expectedLearnerResponse: 'Cotton chars and provides a thermal buffer; synthetic fibers melt instantly and fuse directly into human skin upon catching fire.',
      discussionQuestions: [
        'Why should lab coats never be worn into the school dining hall or home without laundering?',
        'What should a student do immediately if an entire beaker of concentrated acid spills onto their lab coat?'
      ]
    },
    keyScientificPrinciples: [
      'Barrier protection against chemical permeation and physical thermal radiation.',
      'Contaminant containment preventing hazardous residues from migrating out of the laboratory.'
    ],
    safetyAndHandling: {
      hazardType: 'Personal Protective Equipment (PPE)',
      protectiveGear: ['Must be worn in conjunction with Safety Goggles (#73)'],
      rules: ['Must be worn buttoned at all times in the laboratory', 'Launder separately from everyday school uniform'],
      storageCare: 'Hang on coat pegs near the laboratory entrance; wash immediately if contaminated.'
    },
    interactiveSimulationType: 'generic'
  }
};

// Generic fallback generator for items that do not have custom overrides
export function getApparatusDemonstrationData(itemNumber: number): ApparatusDemonstrationData {
  if (APPARATUS_DEMONSTRATION_CATALOG[itemNumber]) {
    return APPARATUS_DEMONSTRATION_CATALOG[itemNumber];
  }

  const rawItem = JSS_LAB_REQUIREMENTS.find(i => i.itemNumber === itemNumber);
  const name = rawItem ? rawItem.name : `Apparatus Item #${itemNumber}`;
  const category = rawItem ? rawItem.category : 'Laboratory Equipment';
  const desc = rawItem ? rawItem.description : 'Standard CBC JSS science laboratory apparatus.';

  let diagramType: ApparatusDemonstrationData['diagramType'] = 'generic_apparatus';
  let simType: ApparatusDemonstrationData['interactiveSimulationType'] = 'generic';

  if (category === 'Chemical Reagent' || category === 'Indicator & Acid/Base') {
    diagramType = 'reagent_bottle';
    simType = 'reagent_color_test';
  } else if (category === 'Physics & Electrical') {
    diagramType = 'circuit_switch';
    simType = 'circuit_toggle';
  } else if (category === 'Measurement & Optics') {
    diagramType = 'measuring_cylinder';
    simType = 'meniscus_reading';
  } else if (category === 'Glassware & Apparatus') {
    diagramType = 'beaker';
    simType = 'meniscus_reading';
  } else if (category === 'Separation & Biology') {
    diagramType = 'microscope';
    simType = 'microscope_focus';
  } else if (category === 'Safety & Furniture') {
    diagramType = 'safety_gear';
    simType = 'generic';
  }

  return {
    itemNumber,
    diagramType,
    labeledParts: [
      { label: `${name} Main Body`, x: 50, y: 40, description: desc },
      { label: 'Calibration / Specification Mark', x: 50, y: 70, description: `Official Kenya CBC JSS Section ${rawItem?.section || 'A'} standard specification` },
      { label: 'Safety / Handling Zone', x: 50, y: 85, description: rawItem?.hazardClass || 'General Laboratory Safe' }
    ],
    primaryUses: [
      `Used in CBC practical investigations: ${rawItem?.usedInExperiments.join(', ') || 'Practical science investigation'}`,
      `Standard requirement for JSS Science curriculum practical activities`
    ],
    teacherDemonstrationGuide: {
      setup: `Inspect ${name} to verify it is clean, dry, and undamaged before beginning class presentation.`,
      action: `Demonstrate correct orientation, handling, and placement on the laboratory workbench.`,
      observationPrompt: `Direct learners to examine the graduation marks, material texture, and safety symbols.`,
      expectedLearnerResponse: `Learners describe the function and proper handling protocol of ${name}.`,
      discussionQuestions: [
        `What role does ${name} play in maintaining accuracy or safety during practical investigations?`,
        `How should ${name} be cleaned and stored after class practical work is completed?`
      ]
    },
    keyScientificPrinciples: [
      `Practical scientific precision requires calibrated, standard-grade apparatus compliance.`,
      `Proper laboratory technique minimizes systematic errors and prevents experimental hazards.`
    ],
    safetyAndHandling: {
      hazardType: rawItem?.hazardClass || 'General Laboratory Safe',
      protectiveGear: ['Laboratory Coat', 'Eye Protection'],
      rules: ['Handle with clean, dry hands', 'Inspect for chips, cracks, or contamination before use'],
      storageCare: `Return to assigned storage location: ${rawItem?.location || 'Designated Science Cabinet'}.`
    },
    interactiveSimulationType: simType
  };
}
