import { CodingChallenge } from '../types';

export const INITIAL_CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: 'ch-maze-01',
    title: 'Sprite Obstacle Maze & Coordinate Collision Sensor',
    description: 'Design a keyboard-controlled sprite that navigates through a labyrinth, detects boundary walls using sensing blocks, and awards points when reaching the treasure goal.',
    grade: 7,
    stream: 'ALL',
    targetGroup: 'Grade 7 CS All Streams',
    difficulty: 'Intermediate',
    strand: 'Computational Thinking & Game Algorithms',
    scratchProjectId: '10128407',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/10128407/embed',
    starterCodeHint: 'Use [when green flag clicked] -> [go to x: -180 y: 120] -> [forever] -> [if key pressed then move 10 steps]. Wrap collision detection with [touching color ?].',
    instructions: [
      'Initialize sprite at coordinate (-180, 120) with score set to 0.',
      'Implement 4-directional arrow key controls (Up, Down, Left, Right).',
      'Add wall collision sensing so sprite cannot walk through maze boundaries.',
      'Trigger victory chime and increment score by 10 upon reaching the golden key sprite.'
    ],
    completionCriteria: [
      {
        id: 'crit-1',
        label: 'Continuous Event Loop (Forever Block)',
        type: 'blocks_used',
        points: 5,
        description: 'Code must incorporate a continuous forever loop to poll user inputs.'
      },
      {
        id: 'crit-2',
        label: 'Boundary Sensing & Wall Collision',
        type: 'blocks_used',
        points: 10,
        description: 'Sprite cleanly bounces or reverses upon touching maze wall lines.'
      },
      {
        id: 'crit-3',
        label: 'Score Variable Counter >= 10',
        type: 'variable_score',
        targetValue: 10,
        points: 10,
        description: 'Score variable must increment dynamically when reaching the objective.'
      },
      {
        id: 'crit-4',
        label: 'Victory Sound & Broadcast Signal',
        type: 'broadcast_message',
        targetValue: 'win_level',
        points: 5,
        description: 'Broadcast message "win_level" to trigger next stage backdrop.'
      }
    ],
    rubricCriteria: [
      'Accurate coordinate mapping on the X-Y Cartesian grid',
      'Smooth keyboard event polling without sprite lag',
      'Proper nesting of conditional blocks (If-Then-Else)',
      'Clean variable initialization on green flag restart'
    ],
    maxPoints: 30,
    dueDate: '2026-10-24',
    assignedBy: 'Mr. Kiprono (HOD Computer Studies)',
    assignedAt: '2026-10-10',
    assignedToClasses: ['Grade 7 Dove', 'Grade 7 Eagle', 'Grade 7 Hawk'],
    status: 'active',
    submissionsCount: 14,
    featured: true
  },
  {
    id: 'ch-timer-02',
    title: 'Variable-Driven Scorekeeper & 60s Countdown Timer',
    description: 'Construct a synchronized digital countdown timer that decrements every 1 second, terminates the session at 0 seconds, and locks interactive clicks.',
    grade: 6,
    stream: 'ALL',
    targetGroup: 'CBC Grade 6 Upper Primary Coders',
    difficulty: 'Beginner',
    strand: 'Variables, Sequencing & Digital Clocks',
    scratchProjectId: '60917032',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/60917032/embed',
    starterCodeHint: 'Create two variables: [Timer] and [Score]. Use [repeat until <Timer = 0>] -> [wait 1 seconds] -> [change Timer by -1].',
    instructions: [
      'Create variables named "TimeRemaining" and "PlayerScore".',
      'Set TimeRemaining to 60 seconds when green flag is clicked.',
      'Decrement TimeRemaining by 1 every second using a loop.',
      'Stop all scripts when TimeRemaining equals 0 and broadcast "Game_Over".'
    ],
    completionCriteria: [
      {
        id: 'crit-timer-1',
        label: 'Repeat Until or While Timer Loop',
        type: 'loop_execution',
        points: 10,
        description: 'A dedicated loop decrementing variable TimeRemaining.'
      },
      {
        id: 'crit-timer-2',
        label: 'Timer Condition Boundary (0s)',
        type: 'timer_condition',
        targetValue: 0,
        points: 5,
        description: 'Game properly ceases sprite interaction once timer hits 0.'
      },
      {
        id: 'crit-timer-3',
        label: 'Broadcast "Game_Over" Signal',
        type: 'broadcast_message',
        targetValue: 'Game_Over',
        points: 10,
        description: 'Stage switches to GameOver screen upon receiving message.'
      }
    ],
    rubricCriteria: [
      'Consistent 1.0-second delay calibration',
      'Accurate variable resetting on game start',
      'Stage backdrop transition coordination'
    ],
    maxPoints: 25,
    dueDate: '2026-10-20',
    assignedBy: 'Mrs. Wanjiku (Computer Science Faculty)',
    assignedAt: '2026-10-09',
    assignedToClasses: ['Grade 6 Dove', 'Grade 6 Eagle'],
    status: 'active',
    submissionsCount: 22,
    featured: true
  },
  {
    id: 'ch-physics-03',
    title: 'Autonomous Bouncing Ball & Wall Physics Simulator',
    description: 'Simulate kinetic bounce angles and gravity acceleration. Learners construct algorithms that replicate real-world projectile mechanics and elastic collisions.',
    grade: 8,
    stream: 'Dove',
    targetGroup: 'Grade 8 Junior School CS Accelerated',
    difficulty: 'Intermediate',
    strand: 'Computational Modeling & Physical Computing',
    scratchProjectId: '10128407',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/10128407/embed',
    starterCodeHint: 'Implement a [VelocityY] variable. Change Y by VelocityY, then change VelocityY by -1 (Gravity). If touching floor, multiply VelocityY by -0.85.',
    instructions: [
      'Initialize ball sprite at top of stage (x: 0, y: 150).',
      'Create velocity variables: VelocityX and VelocityY.',
      'Simulate gravity by decreasing VelocityY over time.',
      'Add floor collision that reverses velocity with energy absorption.'
    ],
    completionCriteria: [
      {
        id: 'crit-phys-1',
        label: 'Gravity Variable Decrement',
        type: 'variables_used' as any,
        points: 10,
        description: 'VelocityY must reduce on each iteration of the main loop.'
      },
      {
        id: 'crit-phys-2',
        label: 'Elastic Floor Collision & Bounce Inversion',
        type: 'custom_rubric',
        points: 15,
        description: 'Sprite detects bottom edge and rebounds upward.'
      }
    ],
    rubricCriteria: [
      'Realism of projectile parabolas',
      'Clean handling of boundary clamping',
      'Commented mathematical logic in Scratch blocks'
    ],
    maxPoints: 25,
    dueDate: '2026-10-28',
    assignedBy: 'Mr. Kiprono (HOD Computer Studies)',
    assignedAt: '2026-10-11',
    assignedToClasses: ['Grade 8 Dove'],
    status: 'active',
    submissionsCount: 8,
    featured: false
  },
  {
    id: 'ch-quiz-04',
    title: 'Interactive CBC Math Quiz Engine with Custom MyBlocks',
    description: 'Create an automated quiz game that generates random arithmetic questions, reads user text input, validates correctness, and announces learner distinctions.',
    grade: 8,
    stream: 'ALL',
    targetGroup: 'Junior School Coding Club & Innovators',
    difficulty: 'Advanced',
    strand: 'Modular Programming & Procedures (My Blocks)',
    scratchProjectId: '60917032',
    scratchEmbedUrl: 'https://scratch.mit.edu/projects/60917032/embed',
    starterCodeHint: 'Define a custom block: [define GenerateQuestion (num1) (num2)]. Use [ask (join num1 [+] num2) and wait]. Compare (answer) with (num1 + num2).',
    instructions: [
      'Create a modular Custom MyBlock to generate questions dynamically.',
      'Pick random numbers between 1 and 25 for operands.',
      'Check learner text response against mathematical truth.',
      'Award 5 points per correct response and play distinctive audio fanfare.'
    ],
    completionCriteria: [
      {
        id: 'crit-mod-1',
        label: 'Custom MyBlock Subroutine Defined',
        type: 'blocks_used',
        points: 15,
        description: 'Student defines at least one custom procedure with parameters.'
      },
      {
        id: 'crit-mod-2',
        label: 'Dynamic Operator Calculation',
        type: 'custom_rubric',
        points: 15,
        description: 'Input answer is compared against actual computed addition/multiplication.'
      },
      {
        id: 'crit-mod-3',
        label: 'Streak Counter Variable',
        type: 'variable_score',
        targetValue: 5,
        points: 10,
        description: 'Tracks consecutive correct answers without mistakes.'
      }
    ],
    maxPoints: 40,
    dueDate: '2026-11-02',
    assignedBy: 'Mr. Kiprono (HOD Computer Studies)',
    assignedAt: '2026-10-10',
    assignedToClasses: ['Grade 8 Dove', 'Grade 8 Eagle', 'Grade 8 Hawk'],
    status: 'active',
    submissionsCount: 19,
    featured: true
  }
];
