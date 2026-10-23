-- EduSmart fresh Supabase schema
-- Coding challenges
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/codingChallengeData.ts :: INITIAL_CODING_CHALLENGES (4 rows)
drop table if exists "edusmart"."coding_challenges" cascade;
create table "edusmart"."coding_challenges" (
  "id" text not null,
  "title" text not null,
  "description" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "target_group" text not null,
  "difficulty" text not null,
  "strand" text not null,
  "scratch_project_id" text not null,
  "scratch_embed_url" text not null,
  "starter_code_hint" text not null,
  "instructions" text[] not null,
  "completion_criteria" jsonb not null,
  "rubric_criteria" text[],
  "max_points" bigint not null,
  "due_date" text not null,
  "assigned_by" text not null,
  "assigned_at" text not null,
  "assigned_to_classes" text[] not null,
  "status" text not null,
  "submissions_count" bigint not null,
  "featured" boolean not null,
  primary key ("id")
);
comment on table "edusmart"."coding_challenges" is $es$Platform feature pack from src/data/codingChallengeData.ts export INITIAL_CODING_CHALLENGES. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."coding_challenges" ("id", "title", "description", "grade", "stream", "target_group", "difficulty", "strand", "scratch_project_id", "scratch_embed_url", "starter_code_hint", "instructions", "completion_criteria", "rubric_criteria", "max_points", "due_date", "assigned_by", "assigned_at", "assigned_to_classes", "status", "submissions_count", "featured") values
  ($es$ch-maze-01$es$, $es$Sprite Obstacle Maze & Coordinate Collision Sensor$es$, $es$Design a keyboard-controlled sprite that navigates through a labyrinth, detects boundary walls using sensing blocks, and awards points when reaching the treasure goal.$es$, 7, $es$ALL$es$, $es$Grade 7 CS All Streams$es$, $es$Intermediate$es$, $es$Computational Thinking & Game Algorithms$es$, $es$10128407$es$, $es$https://scratch.mit.edu/projects/10128407/embed$es$, $es$Use [when green flag clicked] -> [go to x: -180 y: 120] -> [forever] -> [if key pressed then move 10 steps]. Wrap collision detection with [touching color ?].$es$, array[$es$Initialize sprite at coordinate (-180, 120) with score set to 0.$es$, $es$Implement 4-directional arrow key controls (Up, Down, Left, Right).$es$, $es$Add wall collision sensing so sprite cannot walk through maze boundaries.$es$, $es$Trigger victory chime and increment score by 10 upon reaching the golden key sprite.$es$]::text[], $es$[{"id":"crit-1","label":"Continuous Event Loop (Forever Block)","type":"blocks_used","points":5,"description":"Code must incorporate a continuous forever loop to poll user inputs."},{"id":"crit-2","label":"Boundary Sensing & Wall Collision","type":"blocks_used","points":10,"description":"Sprite cleanly bounces or reverses upon touching maze wall lines."},{"id":"crit-3","label":"Score Variable Counter >= 10","type":"variable_score","targetValue":10,"points":10,"description":"Score variable must increment dynamically when reaching the objective."},{"id":"crit-4","label":"Victory Sound & Broadcast Signal","type":"broadcast_message","targetValue":"win_level","points":5,"description":"Broadcast message \"win_level\" to trigger next stage backdrop."}]$es$::jsonb, array[$es$Accurate coordinate mapping on the X-Y Cartesian grid$es$, $es$Smooth keyboard event polling without sprite lag$es$, $es$Proper nesting of conditional blocks (If-Then-Else)$es$, $es$Clean variable initialization on green flag restart$es$]::text[], 30, $es$2026-10-24$es$, $es$Mr. Kiprono (HOD Computer Studies)$es$, $es$2026-10-10$es$, array[$es$Grade 7 Dove$es$, $es$Grade 7 Eagle$es$, $es$Grade 7 Hawk$es$]::text[], $es$active$es$, 14, true),
  ($es$ch-timer-02$es$, $es$Variable-Driven Scorekeeper & 60s Countdown Timer$es$, $es$Construct a synchronized digital countdown timer that decrements every 1 second, terminates the session at 0 seconds, and locks interactive clicks.$es$, 6, $es$ALL$es$, $es$CBC Grade 6 Upper Primary Coders$es$, $es$Beginner$es$, $es$Variables, Sequencing & Digital Clocks$es$, $es$60917032$es$, $es$https://scratch.mit.edu/projects/60917032/embed$es$, $es$Create two variables: [Timer] and [Score]. Use [repeat until <Timer = 0>] -> [wait 1 seconds] -> [change Timer by -1].$es$, array[$es$Create variables named "TimeRemaining" and "PlayerScore".$es$, $es$Set TimeRemaining to 60 seconds when green flag is clicked.$es$, $es$Decrement TimeRemaining by 1 every second using a loop.$es$, $es$Stop all scripts when TimeRemaining equals 0 and broadcast "Game_Over".$es$]::text[], $es$[{"id":"crit-timer-1","label":"Repeat Until or While Timer Loop","type":"loop_execution","points":10,"description":"A dedicated loop decrementing variable TimeRemaining."},{"id":"crit-timer-2","label":"Timer Condition Boundary (0s)","type":"timer_condition","targetValue":0,"points":5,"description":"Game properly ceases sprite interaction once timer hits 0."},{"id":"crit-timer-3","label":"Broadcast \"Game_Over\" Signal","type":"broadcast_message","targetValue":"Game_Over","points":10,"description":"Stage switches to GameOver screen upon receiving message."}]$es$::jsonb, array[$es$Consistent 1.0-second delay calibration$es$, $es$Accurate variable resetting on game start$es$, $es$Stage backdrop transition coordination$es$]::text[], 25, $es$2026-10-20$es$, $es$Mrs. Wanjiku (Computer Science Faculty)$es$, $es$2026-10-09$es$, array[$es$Grade 6 Dove$es$, $es$Grade 6 Eagle$es$]::text[], $es$active$es$, 22, true),
  ($es$ch-physics-03$es$, $es$Autonomous Bouncing Ball & Wall Physics Simulator$es$, $es$Simulate kinetic bounce angles and gravity acceleration. Learners construct algorithms that replicate real-world projectile mechanics and elastic collisions.$es$, 8, $es$Dove$es$, $es$Grade 8 Junior School CS Accelerated$es$, $es$Intermediate$es$, $es$Computational Modeling & Physical Computing$es$, $es$10128407$es$, $es$https://scratch.mit.edu/projects/10128407/embed$es$, $es$Implement a [VelocityY] variable. Change Y by VelocityY, then change VelocityY by -1 (Gravity). If touching floor, multiply VelocityY by -0.85.$es$, array[$es$Initialize ball sprite at top of stage (x: 0, y: 150).$es$, $es$Create velocity variables: VelocityX and VelocityY.$es$, $es$Simulate gravity by decreasing VelocityY over time.$es$, $es$Add floor collision that reverses velocity with energy absorption.$es$]::text[], $es$[{"id":"crit-phys-1","label":"Gravity Variable Decrement","type":"variables_used","points":10,"description":"VelocityY must reduce on each iteration of the main loop."},{"id":"crit-phys-2","label":"Elastic Floor Collision & Bounce Inversion","type":"custom_rubric","points":15,"description":"Sprite detects bottom edge and rebounds upward."}]$es$::jsonb, array[$es$Realism of projectile parabolas$es$, $es$Clean handling of boundary clamping$es$, $es$Commented mathematical logic in Scratch blocks$es$]::text[], 25, $es$2026-10-28$es$, $es$Mr. Kiprono (HOD Computer Studies)$es$, $es$2026-10-11$es$, array[$es$Grade 8 Dove$es$]::text[], $es$active$es$, 8, false),
  ($es$ch-quiz-04$es$, $es$Interactive CBC Math Quiz Engine with Custom MyBlocks$es$, $es$Create an automated quiz game that generates random arithmetic questions, reads user text input, validates correctness, and announces learner distinctions.$es$, 8, $es$ALL$es$, $es$Junior School Coding Club & Innovators$es$, $es$Advanced$es$, $es$Modular Programming & Procedures (My Blocks)$es$, $es$60917032$es$, $es$https://scratch.mit.edu/projects/60917032/embed$es$, $es$Define a custom block: [define GenerateQuestion (num1) (num2)]. Use [ask (join num1 [+] num2) and wait]. Compare (answer) with (num1 + num2).$es$, array[$es$Create a modular Custom MyBlock to generate questions dynamically.$es$, $es$Pick random numbers between 1 and 25 for operands.$es$, $es$Check learner text response against mathematical truth.$es$, $es$Award 5 points per correct response and play distinctive audio fanfare.$es$]::text[], $es$[{"id":"crit-mod-1","label":"Custom MyBlock Subroutine Defined","type":"blocks_used","points":15,"description":"Student defines at least one custom procedure with parameters."},{"id":"crit-mod-2","label":"Dynamic Operator Calculation","type":"custom_rubric","points":15,"description":"Input answer is compared against actual computed addition/multiplication."},{"id":"crit-mod-3","label":"Streak Counter Variable","type":"variable_score","targetValue":5,"points":10,"description":"Tracks consecutive correct answers without mistakes."}]$es$::jsonb, null, 40, $es$2026-11-02$es$, $es$Mr. Kiprono (HOD Computer Studies)$es$, $es$2026-10-10$es$, array[$es$Grade 8 Dove$es$, $es$Grade 8 Eagle$es$, $es$Grade 8 Hawk$es$]::text[], $es$active$es$, 19, true);
alter table "edusmart"."coding_challenges" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
