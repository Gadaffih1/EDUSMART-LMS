-- EduSmart fresh Supabase schema
-- Core school seed
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/initialData.ts :: INITIAL_GRADE_PASSWORDS (9 rows)
drop table if exists "edusmart"."grade_passwords" cascade;
create table "edusmart"."grade_passwords" (
  "grade" bigint not null,
  "password" text not null,
  "is_active" boolean not null,
  "school_id" text not null,
  primary key ("school_id", "grade")
);
comment on table "edusmart"."grade_passwords" is $es$School data from src/data/initialData.ts export INITIAL_GRADE_PASSWORDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."grade_passwords" ("grade", "password", "is_active", "school_id") values
  (1, $es$GR1@2026$es$, true, $es$tenant-riara$es$),
  (2, $es$GR2@2026$es$, true, $es$tenant-riara$es$),
  (3, $es$GR3@2026$es$, true, $es$tenant-riara$es$),
  (4, $es$GR4@2026$es$, true, $es$tenant-riara$es$),
  (5, $es$GR5@2026$es$, true, $es$tenant-riara$es$),
  (6, $es$GR6@2026$es$, true, $es$tenant-riara$es$),
  (7, $es$GR7@2026$es$, true, $es$tenant-riara$es$),
  (8, $es$GR8@2026$es$, true, $es$tenant-riara$es$),
  (9, $es$GR9@2026$es$, true, $es$tenant-riara$es$);
create index "grade_passwords_school_id_idx" on "edusmart"."grade_passwords" ("school_id");
alter table "edusmart"."grade_passwords" enable row level security;

-- src/data/initialData.ts :: INITIAL_USERS (22 rows)
drop table if exists "edusmart"."users" cascade;
create table "edusmart"."users" (
  "id" text not null,
  "name" text not null,
  "email" text not null,
  "password" text not null,
  "role" text not null,
  "avatar_url" text not null,
  "school_id" text not null,
  "tsc_number" text,
  "designation" text,
  "phone" text,
  "department" text,
  "assigned_subjects" text[],
  "children_ids" text[],
  "grade" bigint,
  "stream" text,
  "assigned_streams" jsonb,
  primary key ("id")
);
comment on table "edusmart"."users" is $es$School data from src/data/initialData.ts export INITIAL_USERS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."users" ("id", "name", "email", "password", "role", "avatar_url", "school_id", "tsc_number", "designation", "phone", "department", "assigned_subjects", "children_ids", "grade", "stream", "assigned_streams") values
  ($es$usr-admin-1$es$, $es$Main Administrator$es$, $es$admin@edusmart.ac.ke$es$, $es$admin2026$es$, $es$admin$es$, $es$https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, null, null, null, null, null, null, null, null, null),
  ($es$usr-admin-staff-1$es$, $es$Mrs. Sarah Cherono$es$, $es$adminstaff@edusmart.ac.ke$es$, $es$staff2026$es$, $es$school_admin_staff$es$, $es$https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$ADM/45120/SEC$es$, $es$Senior Administrative Officer & Academic Registrar$es$, null, null, null, null, null, null, null),
  ($es$usr-nurse-grace$es$, $es$Sister Grace Wambui, RN$es$, $es$nurse@edusmart.ac.ke$es$, $es$nurse2026$es$, $es$nurse$es$, $es$https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$NCK/RN-58921$es$, $es$School Nursing Officer In-Charge · Sanatorium Bay$es$, null, null, null, null, null, null, null),
  ($es$usr-transport-lead$es$, $es$Mr. Josephat Kipkoech$es$, $es$transport@edusmart.ac.ke$es$, $es$transport2026$es$, $es$transport_team$es$, $es$https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$NTSA/PSV-78412$es$, $es$Lead School Bus Driver & Fleet Operations Supervisor$es$, $es$+254 712 345 678$es$, null, null, null, null, null, null),
  ($es$usr-transport-assistant$es$, $es$Ms. Mary Wambui$es$, $es$chaperone@edusmart.ac.ke$es$, $es$transport2026$es$, $es$transport_team$es$, $es$https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TRN/CHP-014$es$, $es$Senior Bus Chaperone & Student Roll Officer$es$, $es$+254 723 456 789$es$, null, null, null, null, null, null),
  ($es$usr-cocurricular-lead$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$cocurricular2026$es$, $es$cocurricular_team$es$, $es$https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/SP-38910$es$, $es$Director of Sports & Head Football Academy Coach$es$, $es$+254 722 789 012$es$, null, null, null, null, null, null),
  ($es$usr-patron-debate$es$, $es$Madame Grace Achieng$es$, $es$patron@edusmart.ac.ke$es$, $es$cocurricular2026$es$, $es$cocurricular_team$es$, $es$https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/CL-49201$es$, $es$Senior Patron, Great Debaters Society & Drama Troupe$es$, $es$+254 721 345 987$es$, null, null, null, null, null, null),
  ($es$usr-head-1$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$head2026$es$, $es$head_teacher$es$, $es$https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/14982/ED$es$, null, null, null, null, null, null, null, null),
  ($es$usr-deputy-1$es$, $es$Mr. Charles Omondi$es$, $es$deputy@edusmart.ac.ke$es$, $es$deputy2026$es$, $es$deputy_head$es$, $es$https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/23491/ED$es$, null, null, null, null, null, null, null, null),
  ($es$usr-dean-1$es$, $es$Ms. Beatrice Wanjiku$es$, $es$dean@edusmart.ac.ke$es$, $es$dean2026$es$, $es$dean_of_studies$es$, $es$https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/38910/ED$es$, null, null, null, null, null, null, null, null),
  ($es$usr-coord-curriculum$es$, $es$Mrs. Beatrice Omari$es$, $es$curriculum@edusmart.ac.ke$es$, $es$coord2026$es$, $es$curriculum_coordinator$es$, $es$https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/41029/ED$es$, $es$Director of Curriculum Coordination & CBC Assessment$es$, null, null, null, null, null, null, null),
  ($es$usr-hod-sciences$es$, $es$Dr. Mercy Mwangi$es$, $es$hod.sciences@edusmart.ac.ke$es$, $es$hod2026$es$, $es$hod$es$, $es$https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/31204/ED$es$, null, null, $es$Sciences & Mathematics$es$, array[$es$Integrated Science$es$, $es$Mathematics$es$]::text[], null, null, null, null),
  ($es$usr-senior-ochieng$es$, $es$Mr. Peter Ochieng$es$, $es$senior.teacher@edusmart.ac.ke$es$, $es$senior2026$es$, $es$senior_teacher$es$, $es$https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/29410/ED$es$, null, null, null, null, null, null, null, null),
  ($es$usr-lib-esther$es$, $es$Mrs. Esther Kamau$es$, $es$librarian@edusmart.ac.ke$es$, $es$lib2026$es$, $es$librarian$es$, $es$https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/48102/ED$es$, null, null, null, null, null, null, null, null),
  ($es$usr-parent-otieno$es$, $es$Mrs. Grace Otieno (Parent)$es$, $es$parent.otieno@edusmart.ac.ke$es$, $es$parent2026$es$, $es$parent$es$, $es$https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, null, null, $es$+254 722 123 456$es$, null, null, array[$es$usr-stu-brian$es$, $es$usr-stu-faith$es$, $es$usr-stu-peter$es$]::text[], null, null, null),
  ($es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$teach2026$es$, $es$class_teacher$es$, $es$https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/44120/ED$es$, null, null, null, array[$es$Mathematics$es$, $es$Integrated Science$es$]::text[], null, 4, $es$Dove$es$, $es$[{"grade":4,"stream":"Dove"},{"grade":4,"stream":"Eagle"}]$es$::jsonb),
  ($es$usr-teach-akinyi$es$, $es$Mrs. Florence Akinyi$es$, $es$mrs.akinyi@edusmart.ac.ke$es$, $es$teach2026$es$, $es$class_teacher$es$, $es$https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/51294/ED$es$, null, null, null, array[$es$English$es$, $es$Social Studies$es$]::text[], null, 8, $es$Mara$es$, $es$[{"grade":8,"stream":"Mara"},{"grade":8,"stream":"Athi"}]$es$::jsonb),
  ($es$usr-teach-mutua$es$, $es$Mr. Peter Mutua$es$, $es$mr.mutua@edusmart.ac.ke$es$, $es$teach2026$es$, $es$teacher$es$, $es$https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$TSC/67891/ED$es$, null, null, null, array[$es$Mathematics$es$, $es$Pretechnical Education$es$, $es$Agriculture and Nutrition$es$]::text[], null, null, null, $es$[{"grade":4,"stream":"Dove"},{"grade":7,"stream":"Kerio"},{"grade":8,"stream":"Mara"},{"grade":9,"stream":"Tana"}]$es$::jsonb),
  ($es$usr-fin-david$es$, $es$Mr. David Mwangi$es$, $es$finance@edusmart.ac.ke$es$, $es$finance2026$es$, $es$finance_officer$es$, $es$https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$FIN/09281/BUR$es$, $es$Senior Finance Officer & School Bursar$es$, null, null, null, null, null, null, null),
  ($es$usr-procure-linda$es$, $es$Ms. Linda Kiprop$es$, $es$procurement@edusmart.ac.ke$es$, $es$procure2026$es$, $es$procurement_officer$es$, $es$https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$KISM/PR-44120$es$, $es$Head of Procurement & Supply Chain$es$, null, null, null, null, null, null, null),
  ($es$usr-stores-joseph$es$, $es$Mr. Joseph Otieno$es$, $es$stores@edusmart.ac.ke$es$, $es$stores2026$es$, $es$storekeeper$es$, $es$https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$STR/LOG-38102$es$, $es$Central Stores & Inventory Master$es$, null, null, null, null, null, null, null),
  ($es$usr-hr-caroline$es$, $es$Mrs. Caroline Nduta$es$, $es$hr@edusmart.ac.ke$es$, $es$hr2026$es$, $es$hr_manager$es$, $es$https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80$es$, $es$tenant-riara$es$, $es$IHRM/HR-51204$es$, $es$Director of Human Resources & Payroll$es$, null, null, null, null, null, null, null);
create index "users_school_id_idx" on "edusmart"."users" ("school_id");
alter table "edusmart"."users" enable row level security;

-- src/data/initialData.ts :: INITIAL_TOPICS (8 rows)
drop table if exists "edusmart"."topics" cascade;
create table "edusmart"."topics" (
  "id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "term" bigint not null,
  "week" bigint not null,
  "description" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."topics" is $es$School data from src/data/initialData.ts export INITIAL_TOPICS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."topics" ("id", "grade", "subject", "title", "term", "week", "description", "school_id") values
  ($es$top-gr4-math-1$es$, 4, $es$Mathematics$es$, $es$Topic 1: Numbers & Place Values$es$, 1, 1, $es$Whole numbers up to 10,000, place values, reading, writing in symbols and words, and rounding off to the nearest 10 and 100.$es$, $es$tenant-riara$es$),
  ($es$top-gr4-math-2$es$, 4, $es$Mathematics$es$, $es$Topic 2: Fractions$es$, 1, 3, $es$Understanding proper fractions, equivalent fractions, addition and subtraction of like fractions, and solving real-world fractional word problems.$es$, $es$tenant-riara$es$),
  ($es$top-gr4-math-3$es$, 4, $es$Mathematics$es$, $es$Topic 3: Decimals$es$, 1, 5, $es$Tenths, hundredths, converting fractions to decimals, comparing decimals, and practical applications in Kenyan Shillings and measurements.$es$, $es$tenant-riara$es$),
  ($es$top-gr4-sci-1$es$, 4, $es$Integrated Science$es$, $es$Topic 1: Living Things & Plant Systems$es$, 1, 2, $es$Characteristics of plants, plant nutrition, xylem and phloem functions, photosynthesis, and caring for domestic vegetation.$es$, $es$tenant-riara$es$),
  ($es$top-gr4-sci-2$es$, 4, $es$Integrated Science$es$, $es$Topic 2: Matter & Energy Transformations$es$, 1, 4, $es$States of matter (solid, liquid, gas), heat transfer, water cycle, and renewable energy sources in everyday life.$es$, $es$tenant-riara$es$),
  ($es$top-gr4-eng-1$es$, 4, $es$English$es$, $es$Topic 1: Reading Comprehension & Vocabulary$es$, 1, 1, $es$Narrative structures, contextual vocabulary, parts of speech: nouns and verbs, and descriptive paragraph composition.$es$, $es$tenant-riara$es$),
  ($es$top-gr8-math-1$es$, 8, $es$Mathematics$es$, $es$Topic 1: Algebraic Expressions & Linear Equations$es$, 1, 1, $es$Simplifying algebraic expressions, factorisation, solving linear equations in one unknown, and real-life problem modeling.$es$, $es$tenant-riara$es$),
  ($es$top-gr8-pretech-1$es$, 8, $es$Pretechnical Education$es$, $es$Topic 1: Workshop Safety & Technical Drawing$es$, 1, 2, $es$Occupational safety protocols, personal protective equipment (PPE), orthographic projection, and drafting instruments.$es$, $es$tenant-riara$es$);
create index "topics_school_id_idx" on "edusmart"."topics" ("school_id");
alter table "edusmart"."topics" enable row level security;

-- src/data/initialData.ts :: INITIAL_LESSON_NOTES (4 rows)
drop table if exists "edusmart"."lesson_notes" cascade;
create table "edusmart"."lesson_notes" (
  "id" text not null,
  "topic_id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "summary" text not null,
  "content" text not null,
  "key_takeaways" text[] not null,
  "diagram_url" text,
  "diagram_caption" text,
  "author" text not null,
  "created_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."lesson_notes" is $es$School data from src/data/initialData.ts export INITIAL_LESSON_NOTES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."lesson_notes" ("id", "topic_id", "grade", "subject", "title", "summary", "content", "key_takeaways", "diagram_url", "diagram_caption", "author", "created_at", "school_id") values
  ($es$note-gr4-math-fractions$es$, $es$top-gr4-math-2$es$, 4, $es$Mathematics$es$, $es$Understanding Fractions: Part of a Whole & Equal Portions$es$, $es$Master proper fractions, numerators, denominators, and addition of like fractions with real visual models.$es$, $es$
### 1. What is a Fraction?
A fraction represents **one or more equal parts of a whole**. 
When an item is divided into equal portions, each portion is a fraction.

- **Numerator (Top Number)**: Tells us how many equal parts are selected or considered.
- **Denominator (Bottom Number)**: Tells us the total number of equal parts the whole is divided into.

Example: In the fraction 3/4:
- 3 is the **Numerator** (3 parts taken).
- 4 is the **Denominator** (4 equal parts in total).

---

### 2. Types of Fractions
1. **Proper Fractions**: The numerator is strictly less than the denominator (e.g., 1/2, 3/4, 5/8).
2. **Improper Fractions**: The numerator is greater than or equal to the denominator (e.g., 5/3, 7/4).
3. **Mixed Numbers**: A whole number combined with a proper fraction (e.g., 1 1/2).

---

### 3. Adding Fractions with the Same Denominator
When denominators are identical, simply add the numerators together and keep the denominator unchanged:

$$\frac{1}{2} + \frac{1}{2} = \frac{1 + 1}{2} = \frac{2}{2} = 1$$

$$\frac{2}{5} + \frac{1}{5} = \frac{2 + 1}{5} = \frac{3}{5}$$

---

### 4. Finding a Fraction of a Given Quantity
To calculate a fraction of a quantity:
$$\text{Fraction} \times \text{Total} = \frac{\text{Numerator}}{\text{Denominator}} \times \text{Total}$$

Example: Find 3/4 of 20:
- Step 1: Divide 20 by the denominator 4: $20 \div 4 = 5$
- Step 2: Multiply the result by the numerator 3: $5 \times 3 = 15$
- **Result: 15**
    $es$, array[$es$The numerator indicates portions taken; the denominator indicates total equal portions.$es$, $es$When adding fractions with identical denominators, add only the numerators.$es$, $es$3/4 of 20 equals 15 by calculating (20 ÷ 4) × 3.$es$, $es$Always simplify fractions to their simplest form where applicable.$es$]::text[], $es$/src/assets/images/diagram_math_geometry_1790859731617.jpg$es$, $es$Visual representation of fraction circular models and proportional division$es$, $es$Mr. David Kiprono$es$, $es$2026-09-15$es$, $es$tenant-riara$es$),
  ($es$note-gr4-sci-plants$es$, $es$top-gr4-sci-1$es$, 4, $es$Integrated Science$es$, $es$Plant Nutrition: Photosynthesis & Vascular Systems$es$, $es$Explore how green plants manufacture food using sunlight, water, and carbon dioxide through chlorophyll.$es$, $es$
### 1. Plant Nutrition (Photosynthesis)
Green plants are **autotrophs**—they make their own food through the process called **photosynthesis**.

The word photosynthesis comes from:
- *Photo* = Light
- *Synthesis* = Putting together

---

### 2. Requirements for Photosynthesis
For photosynthesis to take place, plants require four crucial components:
1. **Chlorophyll**: Green pigment inside chloroplasts that traps light energy.
2. **Sunlight**: Natural solar radiation providing energy for the chemical reaction.
3. **Carbon Dioxide ($CO_2$)**: Absorbed from the atmosphere through microscopic leaf pores called **stomata**.
4. **Water ($H_2O$)**: Absorbed from soil by root hairs and transported upward via xylem vessels.

---

### 3. Vascular Bundles: Xylem and Phloem
Plants have specialized transport tubes:
- **Xylem Vessels**: Conduct water and dissolved minerals from the roots upwards to stems and leaves.
- **Phloem Vessels**: Translocate manufactured sugars (glucose) from leaves to growing stems, storage roots, and fruits.

---

### 4. Word Equation of Photosynthesis
$$\text{Carbon Dioxide} + \text{Water} \xrightarrow[\text{Chlorophyll}]{\text{Sunlight}} \text{Glucose (Food)} + \text{Oxygen}$$
    $es$, array[$es$Photosynthesis produces glucose and releases vital oxygen into the atmosphere.$es$, $es$Xylem conducts water and mineral salts upward from roots to leaves.$es$, $es$Phloem distributes manufactured food from leaves to all other plant parts.$es$, $es$Stomata control gas exchange in plant leaves.$es$]::text[], $es$/src/assets/images/diagram_science_ecosystem_1790859717590.jpg$es$, $es$Cellular diagram of leaf photosynthesis, chloroplasts, and vascular transport$es$, $es$Mr. David Kiprono$es$, $es$2026-09-18$es$, $es$tenant-riara$es$),
  ($es$note-gr4-math-numbers$es$, $es$top-gr4-math-1$es$, 4, $es$Mathematics$es$, $es$Numbers: Place Value, Total Value & Rounding Off$es$, $es$Master place values up to ten thousands and learn systematic rounding techniques.$es$, $es$
### 1. Understanding Place Value
Every digit in a number has a value depending on its position:
- **Ten Thousands (T.Th)**
- **Thousands (Th)**
- **Hundreds (H)**
- **Tens (T)**
- **Ones (O)**

Example in the number **8,452**:
- 8 is in Thousands place: Total Value = $8 \times 1000 = 8000$
- 4 is in Hundreds place: Total Value = $4 \times 100 = 400$
- 5 is in Tens place: Total Value = $5 \times 10 = 50$
- 2 is in Ones place: Total Value = $2 \times 1 = 2$

---

### 2. Rounding Off Numbers
- **To the nearest 10**: Look at the digit in the Ones place. If it is 5 or greater, round up; if less than 5, round down.
- **To the nearest 100**: Look at the digit in the Tens place.
    $es$, array[$es$Place value indicates the position of a digit in a numeral.$es$, $es$Total value is the product of the digit and its place value.$es$, $es$Digits 0-4 round down; digits 5-9 round up to the next unit.$es$]::text[], null, null, $es$Mr. David Kiprono$es$, $es$2026-09-10$es$, $es$tenant-riara$es$),
  ($es$note-gr8-pretech$es$, $es$top-gr8-pretech-1$es$, 8, $es$Pretechnical Education$es$, $es$Workshop Safety Protocols & Technical Drafting Tools$es$, $es$Junior school foundation for occupational health, safety equipment, and orthographic drafting rules.$es$, $es$
### 1. Workshop Safety Regulations
A technical workshop requires strict adherence to safety to prevent injuries:
- **Personal Protective Equipment (PPE)**: Safety goggles, leather aprons, steel-toed boots, and ear defenders.
- **Fire Precautions**: Familiarity with Carbon Dioxide ($CO_2$), Foam, and Water fire extinguishers.
- **Tidiness**: Keep walking aisles clear of wood shavings, metal turnings, and electrical cords.

---

### 2. Basic Technical Drafting Instruments
- **T-Square**: Used for drawing horizontal lines on the drawing board.
- **Set Squares (45° and 30°/60°)**: Used for precise angled and perpendicular lines.
- **Divider and Compass**: Used for transferring measurements and striking arcs.
    $es$, array[$es$PPE must be inspected before starting any workshop activity.$es$, $es$Clean workbenches minimize accidents and tool damage.$es$, $es$Drawing instruments must be cleaned and stored in protective cases.$es$]::text[], null, null, $es$Mr. Peter Mutua$es$, $es$2026-09-20$es$, $es$tenant-riara$es$);
create index "lesson_notes_school_id_idx" on "edusmart"."lesson_notes" ("school_id");
alter table "edusmart"."lesson_notes" enable row level security;

-- src/data/initialData.ts :: INITIAL_VIDEOS (2 rows)
drop table if exists "edusmart"."videos" cascade;
create table "edusmart"."videos" (
  "id" text not null,
  "topic_id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "duration_minutes" bigint not null,
  "video_url" text not null,
  "video_thumbnail" text not null,
  "key_points" text[] not null,
  "teacher_name" text not null,
  "created_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."videos" is $es$School data from src/data/initialData.ts export INITIAL_VIDEOS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."videos" ("id", "topic_id", "grade", "subject", "title", "duration_minutes", "video_url", "video_thumbnail", "key_points", "teacher_name", "created_at", "school_id") values
  ($es$vid-gr4-math-fractions$es$, $es$top-gr4-math-2$es$, 4, $es$Mathematics$es$, $es$Interactive Video: Visualizing Fractions with Geometric Shapes$es$, 14, $es$https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4$es$, $es$/src/assets/images/diagram_math_geometry_1790859731617.jpg$es$, array[$es$Visual breakdown of 1/2, 1/4, 3/4 using divided circles and chocolate bar models$es$, $es$Step-by-step method to add fractions with common denominators$es$, $es$Worked examples calculating 3/4 of 20 and 2/3 of 15$es$, $es$Common pitfalls to avoid when simplifying answers$es$]::text[], $es$Mr. David Kiprono$es$, $es$2026-09-16$es$, $es$tenant-riara$es$),
  ($es$vid-gr4-sci-plants$es$, $es$top-gr4-sci-1$es$, 4, $es$Integrated Science$es$, $es$Laboratory Demonstration: Investigating Photosynthesis in Green Leaves$es$, 18, $es$https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4$es$, $es$/src/assets/images/diagram_science_ecosystem_1790859717590.jpg$es$, array[$es$Testing a variegated leaf for the presence of starch with iodine solution$es$, $es$Demonstration of oxygen bubbles released by Elodea pondweed under light$es$, $es$Microscope view of open and closed stomatal guard cells$es$, $es$Role of xylem and phloem vessels explained with food dye experiment$es$]::text[], $es$Mr. David Kiprono$es$, $es$2026-09-19$es$, $es$tenant-riara$es$);
create index "videos_school_id_idx" on "edusmart"."videos" ("school_id");
alter table "edusmart"."videos" enable row level security;

-- src/data/initialData.ts :: INITIAL_AUDIOS (2 rows)
drop table if exists "edusmart"."audios" cascade;
create table "edusmart"."audios" (
  "id" text not null,
  "topic_id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "duration_minutes" bigint not null,
  "audio_url" text not null,
  "transcript" text not null,
  "key_points" text[] not null,
  "teacher_name" text not null,
  "created_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."audios" is $es$School data from src/data/initialData.ts export INITIAL_AUDIOS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."audios" ("id", "topic_id", "grade", "subject", "title", "duration_minutes", "audio_url", "transcript", "key_points", "teacher_name", "created_at", "school_id") values
  ($es$aud-gr4-math-fractions$es$, $es$top-gr4-math-2$es$, 4, $es$Mathematics$es$, $es$Audio Masterclass: Mental Math with Fractions & Decimals$es$, 9, $es$https://actions.google.com/sounds/v1/ambiences/outdoor_water_fountain.ogg$es$, $es$Welcome Grade 4 scholars to our EduSmart Audio Masterclass. Today we are unlocking mental math shortcuts for fractions. Remember, when someone asks you what is one half plus one half, do not hesitate—two halves make one whole! Now listen carefully to our word challenge: if a farmer has 20 eggs and sells three quarters of them, how many eggs are sold? Divide 20 into four equal baskets: each basket has 5 eggs. Take three baskets: 5 times 3 equals 15! Practice this anytime in your head.$es$, array[$es$Quick mental addition of common unit fractions$es$, $es$Associating halves, quarters, and eighths with everyday objects$es$, $es$Audio word problems to sharpen analytical listening$es$]::text[], $es$Mr. David Kiprono$es$, $es$2026-09-17$es$, $es$tenant-riara$es$),
  ($es$aud-gr4-sci-plants$es$, $es$top-gr4-sci-1$es$, 4, $es$Integrated Science$es$, $es$Nature Audio Walk: The Secret Life of Plant Roots and Leaves$es$, 11, $es$https://actions.google.com/sounds/v1/ambiences/gentle_rain.ogg$es$, $es$Step into the school botanical garden with Mr. Kiprono. Close your eyes and listen to the gentle breeze in the canopy. Those emerald green leaves are solar powered food factories. Right now, through tiny mouth-like pores called stomata, carbon dioxide enters the leaf while water ascends all the way from the roots through xylem conduits...$es$, array[$es$How plants act as the lungs and food providers of Planet Earth$es$, $es$Sensory identification of tree bark, leaves, and vascular veins$es$, $es$Conservation of indigenous trees in Kenya$es$]::text[], $es$Mr. David Kiprono$es$, $es$2026-09-21$es$, $es$tenant-riara$es$);
create index "audios_school_id_idx" on "edusmart"."audios" ("school_id");
alter table "edusmart"."audios" enable row level security;

-- src/data/initialData.ts :: INITIAL_QUIZZES (2 rows)
drop table if exists "edusmart"."quizzes" cascade;
create table "edusmart"."quizzes" (
  "id" text not null,
  "topic_id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "pass_percentage" bigint not null,
  "time_limit_minutes" bigint not null,
  "teacher_name" text not null,
  "created_at" text not null,
  "questions" jsonb not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."quizzes" is $es$School data from src/data/initialData.ts export INITIAL_QUIZZES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."quizzes" ("id", "topic_id", "grade", "subject", "title", "pass_percentage", "time_limit_minutes", "teacher_name", "created_at", "questions", "school_id") values
  ($es$quiz-gr4-math-fractions$es$, $es$top-gr4-math-2$es$, 4, $es$Mathematics$es$, $es$Mathematics: Fractions Mastery Quiz$es$, 70, 10, $es$Mr. David Kiprono$es$, $es$2026-09-20$es$, $es$[{"id":"q1","questionText":"What is 1/2 + 1/2 = ?","options":["1","2","1/4","1/3"],"correctOptionIndex":0,"explanation":"1/2 + 1/2 = 2/2, which simplifies to 1 whole."},{"id":"q2","questionText":"Find 3/4 of 20 = ?","options":["12","15","16","18"],"correctOptionIndex":1,"explanation":"Divide 20 by 4 = 5. Then multiply by 3: 5 × 3 = 15."},{"id":"q3","questionText":"Which fraction is equivalent to 2/4?","options":["1/2","1/3","3/4","2/8"],"correctOptionIndex":0,"explanation":"Dividing both numerator and denominator of 2/4 by 2 gives 1/2."},{"id":"q4","questionText":"In the fraction 5/8, what is the number 8 called?","options":["Numerator","Denominator","Quotient","Dividend"],"correctOptionIndex":1,"explanation":"The bottom number in a fraction is the denominator."},{"id":"q5","questionText":"A pupil ate 3/7 of a cake on Monday and 2/7 on Tuesday. What total fraction of cake was eaten?","options":["5/14","5/7","1/7","6/7"],"correctOptionIndex":1,"explanation":"Add numerators: 3/7 + 2/7 = 5/7."}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$quiz-gr4-sci-plants$es$, $es$top-gr4-sci-1$es$, 4, $es$Integrated Science$es$, $es$Integrated Science: Plant Nutrition & Photosynthesis Quiz$es$, 70, 12, $es$Mr. David Kiprono$es$, $es$2026-09-22$es$, $es$[{"id":"qs1","questionText":"Which green pigment in leaves absorbs solar energy for photosynthesis?","options":["Chlorophyll","Melanin","Hemoglobin","Keratin"],"correctOptionIndex":0,"explanation":"Chlorophyll is the green pigment in chloroplasts responsible for trapping light."},{"id":"qs2","questionText":"Which vascular tube transports water and mineral salts from roots to leaves?","options":["Phloem","Xylem","Stomata","Cortex"],"correctOptionIndex":1,"explanation":"Xylem conducts water and minerals upward, while phloem transports food."},{"id":"qs3","questionText":"What vital gas is produced and released by green plants during daylight photosynthesis?","options":["Carbon Dioxide","Nitrogen","Oxygen","Methane"],"correctOptionIndex":2,"explanation":"Plants release oxygen ($O_2$) as a byproduct of photosynthesis."}]$es$::jsonb, $es$tenant-riara$es$);
create index "quizzes_school_id_idx" on "edusmart"."quizzes" ("school_id");
alter table "edusmart"."quizzes" enable row level security;

-- src/data/initialData.ts :: INITIAL_QUIZ_ATTEMPTS (9 rows)
drop table if exists "edusmart"."quiz_attempts" cascade;
create table "edusmart"."quiz_attempts" (
  "id" text not null,
  "quiz_id" text not null,
  "quiz_title" text not null,
  "subject" text not null,
  "grade" bigint not null,
  "student_id" text not null,
  "student_name" text not null,
  "stream" text not null,
  "score" bigint not null,
  "total_questions" bigint not null,
  "percentage" bigint not null,
  "passed" boolean not null,
  "user_answers" jsonb not null,
  "completed_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."quiz_attempts" is $es$School data from src/data/initialData.ts export INITIAL_QUIZ_ATTEMPTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."quiz_attempts" ("id", "quiz_id", "quiz_title", "subject", "grade", "student_id", "student_name", "stream", "score", "total_questions", "percentage", "passed", "user_answers", "completed_at", "school_id") values
  ($es$att-1$es$, $es$quiz-gr4-math-fractions$es$, $es$Mathematics: Fractions Mastery Quiz$es$, $es$Mathematics$es$, 4, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$Dove$es$, 5, 5, 100, true, $es${"q1":0,"q2":1,"q3":0,"q4":1,"q5":1}$es$::jsonb, $es$2026-09-25 10:45 AM$es$, $es$tenant-riara$es$),
  ($es$att-2$es$, $es$quiz-gr4-sci-plants$es$, $es$Integrated Science: Plant Nutrition & Photosynthesis$es$, $es$Integrated Science$es$, 4, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$Dove$es$, 3, 3, 100, true, $es${"qs1":0,"qs2":1,"qs3":2}$es$::jsonb, $es$2026-09-26 02:15 PM$es$, $es$tenant-riara$es$),
  ($es$att-3$es$, $es$quiz-gr4-eng-vocab$es$, $es$English: Grammar & Reading Comprehension$es$, $es$English$es$, 4, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$Dove$es$, 4, 5, 80, true, $es${"q1":0,"q2":1,"q3":0,"q4":0,"q5":1}$es$::jsonb, $es$2026-09-27 11:30 AM$es$, $es$tenant-riara$es$),
  ($es$att-4$es$, $es$quiz-gr4-agri-nutrition$es$, $es$Agriculture & Nutrition: Crops & Soil Fertility$es$, $es$Agriculture and Nutrition$es$, 4, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$Dove$es$, 4, 5, 80, true, $es${"q1":1,"q2":0,"q3":1,"q4":1,"q5":0}$es$::jsonb, $es$2026-09-28 09:10 AM$es$, $es$tenant-riara$es$),
  ($es$att-5$es$, $es$quiz-gr4-math-decimals$es$, $es$Mathematics: Decimals & Place Value$es$, $es$Mathematics$es$, 4, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$Dove$es$, 4, 5, 80, true, $es${"q1":0,"q2":0,"q3":1,"q4":1,"q5":0}$es$::jsonb, $es$2026-09-29 03:40 PM$es$, $es$tenant-riara$es$),
  ($es$att-6$es$, $es$quiz-gr4-social-studies$es$, $es$Social Studies: Physical Environment & Communities$es$, $es$Social Studies$es$, 4, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$Dove$es$, 5, 5, 100, true, $es${"q1":0,"q2":1,"q3":0,"q4":1,"q5":1}$es$::jsonb, $es$2026-09-30 08:20 AM$es$, $es$tenant-riara$es$),
  ($es$att-7$es$, $es$quiz-gr4-math-fractions$es$, $es$Mathematics: Fractions Mastery Quiz$es$, $es$Mathematics$es$, 4, $es$usr-stu-amina$es$, $es$Amina Hassan$es$, $es$Dove$es$, 4, 5, 80, true, $es${"q1":0,"q2":1,"q3":0,"q4":0,"q5":1}$es$::jsonb, $es$2026-09-25 11:10 AM$es$, $es$tenant-riara$es$),
  ($es$att-8$es$, $es$quiz-gr8-pretech$es$, $es$Pretechnical Education: Workshop Safety Protocols$es$, $es$Pretechnical Education$es$, 8, $es$usr-stu-faith$es$, $es$Faith Wanjiru$es$, $es$Mara$es$, 5, 5, 100, true, $es${"q1":0,"q2":1,"q3":0,"q4":1,"q5":1}$es$::jsonb, $es$2026-09-27 10:00 AM$es$, $es$tenant-riara$es$),
  ($es$att-9$es$, $es$quiz-gr8-math-linear$es$, $es$Mathematics: Linear Equations in One Unknown$es$, $es$Mathematics$es$, 8, $es$usr-stu-faith$es$, $es$Faith Wanjiru$es$, $es$Mara$es$, 4, 5, 80, true, $es${"q1":1,"q2":0,"q3":1,"q4":1,"q5":0}$es$::jsonb, $es$2026-09-28 01:30 PM$es$, $es$tenant-riara$es$);
create index "quiz_attempts_school_id_idx" on "edusmart"."quiz_attempts" ("school_id");
alter table "edusmart"."quiz_attempts" enable row level security;

-- src/data/initialData.ts :: INITIAL_ASSIGNMENTS (4 rows)
drop table if exists "edusmart"."assignments" cascade;
create table "edusmart"."assignments" (
  "id" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "subject" text not null,
  "title" text not null,
  "instructions" text not null,
  "due_date" text not null,
  "max_score" bigint not null,
  "teacher_name" text not null,
  "teacher_id" text not null,
  "submissions_count" bigint not null,
  "school_id" text not null,
  "is_virtual_lab" boolean,
  "virtual_lab_type" text,
  "lab_experiment_id" text,
  "lab_title" text,
  primary key ("id")
);
comment on table "edusmart"."assignments" is $es$School data from src/data/initialData.ts export INITIAL_ASSIGNMENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."assignments" ("id", "grade", "stream", "subject", "title", "instructions", "due_date", "max_score", "teacher_name", "teacher_id", "submissions_count", "school_id", "is_virtual_lab", "virtual_lab_type", "lab_experiment_id", "lab_title") values
  ($es$asg-gr4-math-1$es$, 4, $es$Dove$es$, $es$Mathematics$es$, $es$Practical Fraction Modeling with Household Items$es$, $es$Divide a piece of fruit or paper into 8 equal parts. Photograph or write down three fractions you can create (e.g., 2/8, 4/8, 6/8) and simplify them.$es$, $es$2026-10-06$es$, 20, $es$Mr. David Kiprono$es$, $es$usr-teach-kiprono$es$, 4, $es$tenant-riara$es$, null, null, null, null),
  ($es$asg-gr4-sci-1$es$, 4, $es$Dove$es$, $es$Integrated Science$es$, $es$Seed Germination Observation Journal$es$, $es$Plant 4 bean seeds in wet cotton wool or soil. Record the daily growth changes, root development, and emergence of first leaves over 5 days.$es$, $es$2026-10-08$es$, 25, $es$Mr. David Kiprono$es$, $es$usr-teach-kiprono$es$, 3, $es$tenant-riara$es$, null, null, null, null),
  ($es$asg-gr4-vlab-chem$es$, 4, $es$Dove$es$, $es$Integrated Science$es$, $es$Virtual Lab: Acid-Base Indicator & Neutralization Practical$es$, $es$Launch the assigned Virtual Science Lab. Test hydrochloric acid and sodium hydroxide with litmus paper and phenolphthalein. Record color changes and submit your digital lab observation report.$es$, $es$2026-10-18$es$, 30, $es$Mr. David Kiprono$es$, $es$usr-teach-kiprono$es$, 2, $es$tenant-riara$es$, true, $es$science$es$, $es$exp-chem-acid-base$es$, $es$Acid-Base Titration & pH Indicator Neutralization$es$),
  ($es$asg-gr4-vlab-scratch$es$, 4, $es$Dove$es$, $es$Computer Studies$es$, $es$Scratch Coding Challenge: Maze Navigator & Collision Sensing$es$, $es$Open the assigned Scratch Computer Lab. Build the block script with Green Flag start, coordinates, and collision sensing. Test the sprite on stage, note down your algorithm score, and submit work.$es$, $es$2026-10-20$es$, 30, $es$Mr. David Kiprono$es$, $es$usr-teach-kiprono$es$, 1, $es$tenant-riara$es$, true, $es$scratch$es$, $es$scratch-maze-game$es$, $es$Interactive Maze Navigator & Collision Sensing$es$);
create index "assignments_school_id_idx" on "edusmart"."assignments" ("school_id");
alter table "edusmart"."assignments" enable row level security;

-- src/data/initialData.ts :: INITIAL_ANNOUNCEMENTS (3 rows)
drop table if exists "edusmart"."announcements" cascade;
create table "edusmart"."announcements" (
  "id" text not null,
  "title" text not null,
  "content" text not null,
  "type" text not null,
  "target_grade" bigint,
  "target_stream" text,
  "author" text not null,
  "author_role" text not null,
  "created_at" text not null,
  "meet_link" text,
  "scheduled_time" text,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."announcements" is $es$School data from src/data/initialData.ts export INITIAL_ANNOUNCEMENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."announcements" ("id", "title", "content", "type", "target_grade", "target_stream", "author", "author_role", "created_at", "meet_link", "scheduled_time", "school_id") values
  ($es$ann-1$es$, $es$Mathematics Live Google Meet Lesson Reminder$es$, $es$All Grade 4 learners in Dove & Eagle streams are reminded to join our live Google Meet session on Fractions and Decimals. Have your exercise books, geometry ruler, and pencils ready.$es$, $es$lesson_reminder$es$, 4, $es$Dove$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-01 07:30 AM$es$, $es$https://meet.google.com/edu-gr4-dove$es$, $es$Today at 10:00 AM$es$, $es$tenant-riara$es$),
  ($es$ann-2$es$, $es$CBC Term 1 Assessment & Mid-Term Schedule$es$, $es$The school continuous assessment tests for Grades 1 to 9 will commence next week. Learners are advised to review notes and attempt all topical quizzes in their student workspace.$es$, $es$general$es$, null, null, $es$Ms. Beatrice Wanjiku$es$, $es$Dean of Studies$es$, $es$2026-09-28 08:00 AM$es$, null, null, $es$tenant-riara$es$),
  ($es$ann-3$es$, $es$Junior School Pretechnical Workshop Orientation$es$, $es$Grade 8 Mara learners will have a practical session in the Technical Workshop on Friday. Full workshop safety gear (coats and closed footwear) is required.$es$, $es$general$es$, 8, $es$Mara$es$, $es$Mr. Peter Mutua$es$, $es$Subject Teacher$es$, $es$2026-09-29 09:15 AM$es$, null, null, $es$tenant-riara$es$);
create index "announcements_school_id_idx" on "edusmart"."announcements" ("school_id");
alter table "edusmart"."announcements" enable row level security;

-- src/data/initialData.ts :: INITIAL_VIRTUAL_CLASSES (3 rows)
drop table if exists "edusmart"."virtual_classes" cascade;
create table "edusmart"."virtual_classes" (
  "id" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "subject" text not null,
  "topic" text not null,
  "google_meet_link" text not null,
  "is_live" boolean not null,
  "teacher_name" text not null,
  "scheduled_time" text not null,
  "duration_minutes" bigint not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."virtual_classes" is $es$School data from src/data/initialData.ts export INITIAL_VIRTUAL_CLASSES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."virtual_classes" ("id", "grade", "stream", "subject", "topic", "google_meet_link", "is_live", "teacher_name", "scheduled_time", "duration_minutes", "school_id") values
  ($es$vc-gr4-dove$es$, 4, $es$Dove$es$, $es$Mathematics$es$, $es$Fractions & Mental Calculation Strategies$es$, $es$https://meet.google.com/edu-gr4-dove$es$, true, $es$Mr. David Kiprono$es$, $es$10:00 AM - 10:45 AM$es$, 45, $es$tenant-riara$es$),
  ($es$vc-gr4-sci$es$, 4, $es$Dove$es$, $es$Integrated Science$es$, $es$Photosynthesis Virtual Lab Experiment$es$, $es$https://meet.google.com/edu-gr4-sci$es$, false, $es$Mr. David Kiprono$es$, $es$Tomorrow at 02:00 PM$es$, 40, $es$tenant-riara$es$),
  ($es$vc-gr8-mara$es$, 8, $es$Mara$es$, $es$Pretechnical Education$es$, $es$Technical Drafting and Orthographic Projections$es$, $es$https://meet.google.com/edu-gr8-mara$es$, true, $es$Mr. Peter Mutua$es$, $es$11:15 AM - 12:00 PM$es$, 45, $es$tenant-riara$es$);
create index "virtual_classes_school_id_idx" on "edusmart"."virtual_classes" ("school_id");
alter table "edusmart"."virtual_classes" enable row level security;

-- src/data/initialData.ts :: INITIAL_WORK_ENTRY_LOGS (3 rows)
drop table if exists "edusmart"."work_entry_logs" cascade;
create table "edusmart"."work_entry_logs" (
  "id" text not null,
  "teacher_id" text not null,
  "teacher_name" text not null,
  "staff_no" text not null,
  "first_name" text not null,
  "last_name" text not null,
  "email" text not null,
  "sign_in_location" text not null,
  "photo_url" text not null,
  "geo_stamp" jsonb not null,
  "date" text not null,
  "time" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "subject" text not null,
  "topic_taught" text not null,
  "objectives_covered" text not null,
  "learners_present" bigint not null,
  "teacher_remarks" text not null,
  "timestamp" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."work_entry_logs" is $es$School data from src/data/initialData.ts export INITIAL_WORK_ENTRY_LOGS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."work_entry_logs" ("id", "teacher_id", "teacher_name", "staff_no", "first_name", "last_name", "email", "sign_in_location", "photo_url", "geo_stamp", "date", "time", "grade", "stream", "subject", "topic_taught", "objectives_covered", "learners_present", "teacher_remarks", "timestamp", "school_id") values
  ($es$wel-1$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$TSC/44120/ED$es$, $es$David$es$, $es$Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$EduSmart Main Campus, Staffroom Block A · Nairobi Grounds$es$, $es$https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80$es$, $es${"latitude":-1.2921,"longitude":36.8219,"accuracy":4,"address":"EduSmart Main Campus Gate A · Coordinates -1.2921° S, 36.8219° E (Campus Perimeter Verified)","verifiedCampus":true}$es$::jsonb, $es$2026-09-30$es$, $es$08:30 AM$es$, 4, $es$Dove$es$, $es$Mathematics$es$, $es$Fractions: Addition of like fractions and word problems$es$, $es$Learners able to add fractions with same denominators and calculate fraction of a quantity.$es$, 38, $es$Active participation. 35 out of 38 scored 80%+ on exit slip.$es$, $es$2026-09-30T08:30:00$es$, $es$tenant-riara$es$),
  ($es$wel-2$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$TSC/44120/ED$es$, $es$David$es$, $es$Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$EduSmart Main Campus, Science Lab 1 · Nairobi Grounds$es$, $es$https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80$es$, $es${"latitude":-1.2922,"longitude":36.8218,"accuracy":5,"address":"EduSmart Laboratory Complex · Coordinates -1.2922° S, 36.8218° E (Campus Perimeter Verified)","verifiedCampus":true}$es$::jsonb, $es$2026-09-29$es$, $es$11:00 AM$es$, 4, $es$Eagle$es$, $es$Integrated Science$es$, $es$Plant Nutrition: Xylem and Phloem transport demonstration$es$, $es$Identified pathways of water and food through celery stalk experiment.$es$, 40, $es$Practical experiment completed successfully. Students submitted laboratory diagrams.$es$, $es$2026-09-29T11:00:00$es$, $es$tenant-riara$es$),
  ($es$wel-3$es$, $es$usr-teach-mutua$es$, $es$Mr. Peter Mutua$es$, $es$TSC/39821/ED$es$, $es$Peter$es$, $es$Mutua$es$, $es$mr.mutua@edusmart.ac.ke$es$, $es$EduSmart Technical Wing, Workshop 2 · Nairobi Grounds$es$, $es$https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80$es$, $es${"latitude":-1.292,"longitude":36.8222,"accuracy":6,"address":"EduSmart Pre-Technical Workshop Gate · Coordinates -1.2920° S, 36.8222° E (Campus Perimeter Verified)","verifiedCampus":true}$es$::jsonb, $es$2026-09-30$es$, $es$09:45 AM$es$, 8, $es$Mara$es$, $es$Pretechnical Education$es$, $es$Workshop Safety Protocols & PPE requirements$es$, $es$Mastered fire hazard management, eye protection, and tool storage safety.$es$, 36, $es$Safety demonstration carried out in workshop. All students passed safety checklist.$es$, $es$2026-09-30T09:45:00$es$, $es$tenant-riara$es$);
create index "work_entry_logs_school_id_idx" on "edusmart"."work_entry_logs" ("school_id");
alter table "edusmart"."work_entry_logs" enable row level security;

-- src/data/initialData.ts :: INITIAL_GATE_EXIT_PASSES (2 rows)
drop table if exists "edusmart"."gate_exit_passes" cascade;
create table "edusmart"."gate_exit_passes" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "teacher_id" text not null,
  "teacher_name" text not null,
  "departure_time" text not null,
  "expected_return_time" text,
  "reason" text not null,
  "guardian_name" text not null,
  "guardian_phone" text not null,
  "gate_pass_code" text not null,
  "status" text not null,
  "approved_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."gate_exit_passes" is $es$School data from src/data/initialData.ts export INITIAL_GATE_EXIT_PASSES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."gate_exit_passes" ("id", "student_id", "student_name", "grade", "stream", "teacher_id", "teacher_name", "departure_time", "expected_return_time", "reason", "guardian_name", "guardian_phone", "gate_pass_code", "status", "approved_at", "school_id") values
  ($es$gep-1$es$, $es$usr-stu-kelvin$es$, $es$Kelvin Kiprop$es$, 4, $es$Dove$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$11:30 AM$es$, $es$02:00 PM$es$, $es$Dental appointment at Nairobi Hospital with medical card verification$es$, $es$Dr. Joseph Kiprop (Father)$es$, $es$+254 722 891 042$es$, $es$GP-4D-8921$es$, $es$active$es$, $es$2026-10-01 11:15 AM$es$, $es$tenant-riara$es$),
  ($es$gep-2$es$, $es$usr-stu-sharon$es$, $es$Sharon Cherono$es$, 8, $es$Mara$es$, $es$usr-teach-akinyi$es$, $es$Mrs. Florence Akinyi$es$, $es$01:00 PM$es$, null, $es$Sudden fever reported to sanatorium; signed out to parent for rest$es$, $es$Grace Cherono (Mother)$es$, $es$+254 711 445 892$es$, $es$GP-8M-3310$es$, $es$departed$es$, $es$2026-09-30 12:45 PM$es$, $es$tenant-riara$es$);
create index "gate_exit_passes_school_id_idx" on "edusmart"."gate_exit_passes" ("school_id");
alter table "edusmart"."gate_exit_passes" enable row level security;

-- src/data/initialData.ts :: INITIAL_ATTENDANCE (5 rows)
drop table if exists "edusmart"."attendance" cascade;
create table "edusmart"."attendance" (
  "id" text not null,
  "date" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "teacher_id" text not null,
  "teacher_name" text not null,
  "records" jsonb not null,
  "summary" jsonb not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."attendance" is $es$School data from src/data/initialData.ts export INITIAL_ATTENDANCE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."attendance" ("id", "date", "grade", "stream", "teacher_id", "teacher_name", "records", "summary", "school_id") values
  ($es$att-rec-4d-today$es$, $es$2026-10-01$es$, 4, $es$Dove$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$[{"studentId":"usr-stu-brian","studentName":"Brian Otieno","status":"present"},{"studentId":"usr-stu-amina","studentName":"Amina Hassan","status":"present"},{"studentId":"usr-stu-kelvin","studentName":"Kelvin Kiprop","status":"excused","remarks":"Medical appointment at clinic"},{"studentId":"usr-stu-mercy","studentName":"Mercy Chebet","status":"present"},{"studentId":"usr-stu-daniel","studentName":"Daniel Njoroge","status":"late","remarks":"Arrived at 08:20 AM"}]$es$::jsonb, $es${"present":3,"absent":0,"late":1,"excused":1,"total":5,"attendanceRate":80}$es$::jsonb, $es$tenant-riara$es$),
  ($es$att-rec-4d-sep30$es$, $es$2026-09-30$es$, 4, $es$Dove$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$[{"studentId":"usr-stu-brian","studentName":"Brian Otieno","status":"present"},{"studentId":"usr-stu-amina","studentName":"Amina Hassan","status":"present"},{"studentId":"usr-stu-kelvin","studentName":"Kelvin Kiprop","status":"present"},{"studentId":"usr-stu-mercy","studentName":"Mercy Chebet","status":"present"},{"studentId":"usr-stu-daniel","studentName":"Daniel Njoroge","status":"present"}]$es$::jsonb, $es${"present":5,"absent":0,"late":0,"excused":0,"total":5,"attendanceRate":100}$es$::jsonb, $es$tenant-riara$es$),
  ($es$att-rec-4d-sep29$es$, $es$2026-09-29$es$, 4, $es$Dove$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$[{"studentId":"usr-stu-brian","studentName":"Brian Otieno","status":"present"},{"studentId":"usr-stu-amina","studentName":"Amina Hassan","status":"present"},{"studentId":"usr-stu-kelvin","studentName":"Kelvin Kiprop","status":"present"},{"studentId":"usr-stu-mercy","studentName":"Mercy Chebet","status":"present"},{"studentId":"usr-stu-daniel","studentName":"Daniel Njoroge","status":"absent","remarks":"Reported fever & flu by parent"}]$es$::jsonb, $es${"present":4,"absent":1,"late":0,"excused":0,"total":5,"attendanceRate":80}$es$::jsonb, $es$tenant-riara$es$),
  ($es$att-rec-4d-sep28$es$, $es$2026-09-28$es$, 4, $es$Dove$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$[{"studentId":"usr-stu-brian","studentName":"Brian Otieno","status":"present"},{"studentId":"usr-stu-amina","studentName":"Amina Hassan","status":"present"},{"studentId":"usr-stu-kelvin","studentName":"Kelvin Kiprop","status":"present"},{"studentId":"usr-stu-mercy","studentName":"Mercy Chebet","status":"present"},{"studentId":"usr-stu-daniel","studentName":"Daniel Njoroge","status":"present"}]$es$::jsonb, $es${"present":5,"absent":0,"late":0,"excused":0,"total":5,"attendanceRate":100}$es$::jsonb, $es$tenant-riara$es$),
  ($es$att-rec-8m-today$es$, $es$2026-10-01$es$, 8, $es$Mara$es$, $es$usr-teach-akinyi$es$, $es$Mrs. Florence Akinyi$es$, $es$[{"studentId":"usr-stu-faith","studentName":"Faith Wanjiru","status":"present"},{"studentId":"usr-stu-ian","studentName":"Ian Mwangi","status":"present"},{"studentId":"usr-stu-sharon","studentName":"Sharon Cherono","status":"absent","remarks":"Sick leave granted - high fever"},{"studentId":"usr-stu-victor","studentName":"Victor Ochieng","status":"present"}]$es$::jsonb, $es${"present":3,"absent":1,"late":0,"excused":0,"total":4,"attendanceRate":75}$es$::jsonb, $es$tenant-riara$es$);
create index "attendance_school_id_idx" on "edusmart"."attendance" ("school_id");
alter table "edusmart"."attendance" enable row level security;

-- src/data/initialData.ts :: INITIAL_TIMETABLE (86 rows)
drop table if exists "edusmart"."timetable" cascade;
create table "edusmart"."timetable" (
  "id" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "day_of_week" text not null,
  "period" bigint not null,
  "start_time" text not null,
  "end_time" text not null,
  "subject" text not null,
  "teacher_name" text not null,
  "teacher_email" text not null,
  "room_name" text not null,
  "room_or_meet_link" text,
  "strand_topic" text not null,
  "materials_needed" text[],
  "competencies" text[],
  "school_id" text not null,
  "is_remedial" boolean,
  "notes" text,
  primary key ("id")
);
comment on table "edusmart"."timetable" is $es$School data from src/data/initialData.ts export INITIAL_TIMETABLE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."timetable" ("id", "grade", "stream", "day_of_week", "period", "start_time", "end_time", "subject", "teacher_name", "teacher_email", "room_name", "room_or_meet_link", "strand_topic", "materials_needed", "competencies", "school_id", "is_remedial", "notes") values
  ($es$tt-4d-m1$es$, 4, $es$Dove$es$, $es$Monday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-dove$es$, $es$Fractions & Decimals in Everyday Life$es$, array[$es$Maths Pupil Book 4$es$, $es$Ruler$es$, $es$Pencil$es$]::text[], array[$es$Critical Thinking$es$, $es$Problem Solving$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m2$es$, 4, $es$Dove$es$, $es$Monday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-eng$es$, $es$Reading Comprehension: Our Environment$es$, array[$es$English Course Book 4$es$, $es$Exercise Book$es$]::text[], array[$es$Communication$es$, $es$Digital Literacy$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m3$es$, 4, $es$Dove$es$, $es$Monday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Integrated Science$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Junior Science Lab 1$es$, $es$https://meet.google.com/edu-gr4-sci$es$, $es$Living Things: Plant Classification and Habitats$es$, array[$es$Fresh leaf specimens$es$, $es$Hand lenses$es$, $es$Lab notebook$es$]::text[], array[$es$Learning to Learn$es$, $es$Observation$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m4$es$, 4, $es$Dove$es$, $es$Monday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-swa$es$, $es$Kusikiliza na Kuzungumza: Maadili Kazini$es$, array[$es$Kitabu cha Kiswahili Ghorofa ya 4$es$]::text[], array[$es$Uzalendo$es$, $es$Mawasiliano$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m5$es$, 4, $es$Dove$es$, $es$Monday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Agricultural Demonstration Plot$es$, null, $es$Kitchen Gardening & Compost Pit Preparation$es$, array[$es$Garden gloves$es$, $es$Trowel$es$]::text[], array[$es$Self-Efficacy$es$, $es$Collaboration$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m6$es$, 4, $es$Dove$es$, $es$Monday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Physical Environment of Our County$es$, array[$es$Kenya Atlas$es$, $es$Colored Pencils$es$]::text[], array[$es$Citizenship$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m7$es$, 4, $es$Dove$es$, $es$Monday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Fine Art & Music Studio$es$, null, $es$Color Wheel & Pattern Weaving$es$, array[$es$Drawing pad$es$, $es$Poster paints$es$, $es$Brush #4$es$]::text[], array[$es$Creativity and Imagination$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-m8$es$, 4, $es$Dove$es$, $es$Monday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Physical and Health Education$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Main Sports Pitch$es$, null, $es$Athletics: Relay Baton Passing Technique$es$, array[$es$PE Kit$es$, $es$Running shoes$es$, $es$Water bottle$es$]::text[], array[$es$Collaboration$es$, $es$Physical Fitness$es$]::text[], $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t1$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Crop Maintenance & Drip Irrigation Models$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t2$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-dove$es$, $es$Multiplication Arrays & Mental Math Challenges$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t3$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Cultural Heritage: Traditional Ceremonies$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t4$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Grammar: Past Simple Regular & Irregular Verbs$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t5$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Religious Education$es$, $es$Pastor James$es$, $es$pastor.james@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Creation & Stewardship of Natural Resources$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t6$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Integrated Science$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Junior Science Lab 1$es$, null, $es$Water Cycle Experiment and Cloud Formation$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t7$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Kusoma kwa Ufahamu: Usafi wa Kibinafsi$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-t8$es$, 4, $es$Dove$es$, $es$Tuesday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Music Studio$es$, null, $es$Traditional Kenyan Percussion & Descant Recorder$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w1$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Art Studio$es$, null, $es$Clay Modeling: Domestic Utensils$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w2$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Religious Education$es$, $es$Pastor James$es$, $es$pastor.james@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Honesty and Integrity at School$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w3$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-dove$es$, $es$Measurement: Length in Meters and Centimeters$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w4$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Integrated Science$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Junior Science Lab 1$es$, null, $es$Human Digestive System: Organs & Functions$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w5$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Creative Writing: A Day at the County Market$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w6$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Kuandika Insha: Sherehe ya Kuzaliwa$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w7$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Food Groups & Balanced Diet Planning$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-w8$es$, 4, $es$Dove$es$, $es$Wednesday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Physical and Health Education$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Swimming Pool / Field$es$, null, $es$Water Safety and Freestyle Kicking$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th1$es$, 4, $es$Dove$es$, $es$Thursday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-dove$es$, $es$Geometry: 2D Shapes & Symmetry Lines$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th2$es$, 4, $es$Dove$es$, $es$Thursday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Poetry Recitation & Rhyme Schemes$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th3$es$, 4, $es$Dove$es$, $es$Thursday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Msamiati: Vyombo vya Nyumbani$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th4$es$, 4, $es$Dove$es$, $es$Thursday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Integrated Science$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Junior Science Lab 1$es$, null, $es$Energy: Sources of Heat and Light$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th5$es$, 4, $es$Dove$es$, $es$Thursday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Economic Activities: Fishing and Trade$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th6$es$, 4, $es$Dove$es$, $es$Thursday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Religious Education$es$, $es$Pastor James$es$, $es$pastor.james@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Forgiveness and Conflict Resolution$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th7$es$, 4, $es$Dove$es$, $es$Thursday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Drama & Elocution Room$es$, null, $es$Dramatic Skits on Road Safety$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-th8$es$, 4, $es$Dove$es$, $es$Thursday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Home Science Kitchen$es$, null, $es$Table Setting and Fruit Salad Prep$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f1$es$, 4, $es$Dove$es$, $es$Friday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Spelling Bee & Vocabulary Expansion$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f2$es$, 4, $es$Dove$es$, $es$Friday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, $es$https://meet.google.com/edu-gr4-dove$es$, $es$Weekly Formative Diagnostic Assessment$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f3$es$, 4, $es$Dove$es$, $es$Friday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Imla na Maswali ya Marudio$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f4$es$, 4, $es$Dove$es$, $es$Friday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Integrated Science$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Junior Science Lab 1$es$, null, $es$Science Project Presentations$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f5$es$, 4, $es$Dove$es$, $es$Friday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$County Government Administration$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f6$es$, 4, $es$Dove$es$, $es$Friday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Physical and Health Education$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Main Field$es$, null, $es$Inter-House Mini Soccer Match$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f7$es$, 4, $es$Dove$es$, $es$Friday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$School Hall$es$, null, $es$Choral Folk Song Rehearsal$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-4d-f8$es$, 4, $es$Dove$es$, $es$Friday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Religious Education$es$, $es$Pastor James$es$, $es$pastor.james@edusmart.ac.ke$es$, $es$Classroom 4-Dove$es$, null, $es$Pastoral Counseling & Weekend Preparation$es$, null, null, $es$tenant-riara$es$, null, null);
insert into "edusmart"."timetable" ("id", "grade", "stream", "day_of_week", "period", "start_time", "end_time", "subject", "teacher_name", "teacher_email", "room_name", "room_or_meet_link", "strand_topic", "materials_needed", "competencies", "school_id", "is_remedial", "notes") values
  ($es$tt-8m-m1$es$, 8, $es$Mara$es$, $es$Monday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Pretechnical Education$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Pre-Tech Workshop A$es$, $es$https://meet.google.com/edu-gr8-mara$es$, $es$Technical Drawing: Isometric Projections$es$, array[$es$T-Square$es$, $es$Drawing Board$es$, $es$Set Squares$es$]::text[], null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m2$es$, 8, $es$Mara$es$, $es$Monday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Algebraic Expressions & Factorization$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m3$es$, 8, $es$Mara$es$, $es$Monday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Integrated Science$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$Senior Chemistry Lab$es$, null, $es$Acids, Bases, and Universal Indicators$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m4$es$, 8, $es$Mara$es$, $es$Monday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Critical Essay Analysis & Argumentative Structure$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m5$es$, 8, $es$Mara$es$, $es$Monday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$African Early Civilizations: Egypt and Mali$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m6$es$, 8, $es$Mara$es$, $es$Monday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Uchambuzi wa Ushairi: Mashairi ya Kisasa$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m7$es$, 8, $es$Mara$es$, $es$Monday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Agri Laboratory$es$, null, $es$Soil Testing: pH Levels and Nitrogen Content$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-m8$es$, 8, $es$Mara$es$, $es$Monday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Physical and Health Education$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Basketball Court$es$, null, $es$Tactical Formations and Defensive Rebounding$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t1$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Integrated Science$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$Senior Physics Lab$es$, null, $es$Electrical Circuits: Series vs Parallel Resistance$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t2$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Linear Inequalities in One Unknown$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t3$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Pretechnical Education$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Computer Lab B$es$, null, $es$Computer Hardware Components & Motherboard Architecture$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t4$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Comprehension: Scientific Technological Innovations$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t5$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Sarufi: Ngeli za Nomino na Upatanisho wa Kisarufi$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t6$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Design Studio$es$, null, $es$Graphic Design: Poster Typography and Visual Layout$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t7$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Religious Education$es$, $es$Pastor James$es$, $es$pastor.james@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Christian / Islamic Perspectives on Bioethics and Health$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-t8$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Regional Economic Blocs: EAC and COMESA$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w1$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Pythagoras Theorem in Real-Life Surveying$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w2$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Integrated Science$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$Senior Biology Lab$es$, null, $es$Cell Division: Mitosis and Meiosis Under Microscope$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w3$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Public Speaking: Parliamentary Debate Motions$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w4$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Pretechnical Education$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Pre-Tech Workshop A$es$, null, $es$Woodwork Joinery: Mortise and Tenon Joints$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w5$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Environmental Conservation & Climate Change Mitigation$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w6$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Uandishi Bunifu: Tahariri ya Gazeti$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w7$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Poultry Farm Bay$es$, null, $es$Poultry Management: Vaccination and Brooding Cycles$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-w8$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Music Auditorium$es$, null, $es$Ensemble Performance & Digital Audio Workstations (DAW)$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th1$es$, 8, $es$Mara$es$, $es$Thursday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Integrated Science$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$Senior Lab 2$es$, null, $es$Force, Pressure, and Hydraulic Systems$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th2$es$, 8, $es$Mara$es$, $es$Thursday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Commercial Arithmetic: Profit, Loss & Compound Interest$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th3$es$, 8, $es$Mara$es$, $es$Thursday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Pretechnical Education$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Computer Lab A$es$, null, $es$Introduction to Python Programming: Loops and Conditionals$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th4$es$, 8, $es$Mara$es$, $es$Thursday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Fasihi Simulizi: Miviga na Ulumbi$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th5$es$, 8, $es$Mara$es$, $es$Thursday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Direct and Indirect Speech in Dialogue$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th6$es$, 8, $es$Mara$es$, $es$Thursday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Religious Education$es$, $es$Pastor James$es$, $es$pastor.james@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Youth Leadership & Social Justice$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th7$es$, 8, $es$Mara$es$, $es$Thursday$es$, 7, $es$13:20$es$, $es$14:00$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$The Constitution of Kenya 2010: Bill of Rights$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-th8$es$, 8, $es$Mara$es$, $es$Thursday$es$, 8, $es$14:00$es$, $es$14:40$es$, $es$Physical and Health Education$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Volleyball Court$es$, null, $es$Overhead Serving and Setting Precision$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f1$es$, 8, $es$Mara$es$, $es$Friday$es$, 1, $es$08:00$es$, $es$08:40$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Coordinate Geometry: Plotting Straight Lines$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f2$es$, 8, $es$Mara$es$, $es$Friday$es$, 2, $es$08:40$es$, $es$09:20$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Comprehension & Vocabulary Masterclass$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f3$es$, 8, $es$Mara$es$, $es$Friday$es$, 3, $es$09:40$es$, $es$10:20$es$, $es$Integrated Science$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$Senior Lab 1$es$, null, $es$Weekly Science Practical & Lab Write-Up$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f4$es$, 8, $es$Mara$es$, $es$Friday$es$, 4, $es$10:20$es$, $es$11:00$es$, $es$Pretechnical Education$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Pre-Tech Workshop B$es$, null, $es$Electrical Safety & Soldering Practice$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f5$es$, 8, $es$Mara$es$, $es$Friday$es$, 5, $es$11:00$es$, $es$11:40$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Majadiliano ya Vikundi: Utunzaji wa Mazingira$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f6$es$, 8, $es$Mara$es$, $es$Friday$es$, 6, $es$11:40$es$, $es$12:20$es$, $es$Agriculture and Nutrition$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Agri Garden$es$, null, $es$Harvesting & Farm Produce Post-Harvest Handling$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f7$es$, 8, $es$Mara$es$, $es$Friday$es$, 7, $es$12:30$es$, $es$13:10$es$, $es$Creative Arts$es$, $es$Ms. Achieng$es$, $es$achieng@edusmart.ac.ke$es$, $es$Art Studio$es$, null, $es$Sculptural Exhibition & Portfolio Review$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-f8$es$, 8, $es$Mara$es$, $es$Friday$es$, 8, $es$14:10$es$, $es$14:50$es$, $es$Physical and Health Education$es$, $es$Coach Benjamin Omwenga$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Main Sports Complex$es$, null, $es$House Athletic League & Fitness Assessment$es$, null, null, $es$tenant-riara$es$, null, null);
insert into "edusmart"."timetable" ("id", "grade", "stream", "day_of_week", "period", "start_time", "end_time", "subject", "teacher_name", "teacher_email", "room_name", "room_or_meet_link", "strand_topic", "materials_needed", "competencies", "school_id", "is_remedial", "notes") values
  ($es$tt-8m-f9$es$, 8, $es$Mara$es$, $es$Friday$es$, 9, $es$14:50$es$, $es$15:30$es$, $es$Social Studies$es$, $es$Mrs. Wanjiru$es$, $es$wanjiru@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Current Affairs & Civics Colloquium$es$, null, null, $es$tenant-riara$es$, null, null),
  ($es$tt-8m-rem-mon-p10$es$, 8, $es$Mara$es$, $es$Monday$es$, 10, $es$07:00$es$, $es$07:50$es$, $es$Mathematics$es$, $es$Mr. David Kiprono$es$, $es$mr.kiprono@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Early Morning Remedial: Algebraic Factorization Drill$es$, null, null, $es$tenant-riara$es$, true, $es$Allocated by Dean of Studies for Grade 8 Mara mathematics acceleration$es$),
  ($es$tt-8m-rem-wed-p10$es$, 8, $es$Mara$es$, $es$Wednesday$es$, 10, $es$07:00$es$, $es$07:50$es$, $es$Integrated Science$es$, $es$Dr. Arthur Mwangi$es$, $es$headteacher@edusmart.ac.ke$es$, $es$Senior Chemistry Lab$es$, null, $es$Early Morning Remedial: Acids & Bases Practical Revision$es$, null, null, $es$tenant-riara$es$, true, $es$Allocated by Deputy Headteacher for STEM formative strengthening$es$),
  ($es$tt-8m-rem-fri-p10$es$, 8, $es$Mara$es$, $es$Friday$es$, 10, $es$07:00$es$, $es$07:50$es$, $es$Pretechnical Education$es$, $es$Mr. Peter Mutua$es$, $es$peter.mutua@edusmart.ac.ke$es$, $es$Pre-Tech Workshop A$es$, null, $es$Early Morning Remedial: Isometric Projections Coaching$es$, null, null, $es$tenant-riara$es$, true, $es$Dean of Studies approved remedial clinic$es$),
  ($es$tt-8m-rem-tue-p11$es$, 8, $es$Mara$es$, $es$Tuesday$es$, 11, $es$15:45$es$, $es$16:45$es$, $es$English$es$, $es$Mrs. Florence Akinyi$es$, $es$florence.akinyi@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Late Evening Remedial: Argumentative Essay Clinic$es$, null, null, $es$tenant-riara$es$, true, $es$Allocated by Deputy Headteacher for language arts remediation$es$),
  ($es$tt-8m-rem-thu-p11$es$, 8, $es$Mara$es$, $es$Thursday$es$, 11, $es$15:45$es$, $es$16:45$es$, $es$Kiswahili$es$, $es$Mwalimu Omwamba$es$, $es$omwamba@edusmart.ac.ke$es$, $es$Classroom 8-Mara$es$, null, $es$Late Evening Remedial: Sarufi & Uchambuzi wa Fasihi$es$, null, null, $es$tenant-riara$es$, true, $es$Allocated by Dean of Studies for language mastery$es$);
create index "timetable_school_id_idx" on "edusmart"."timetable" ("school_id");
alter table "edusmart"."timetable" enable row level security;

-- src/data/initialData.ts :: INITIAL_REPORT_CARDS (2 rows)
drop table if exists "edusmart"."report_cards" cascade;
create table "edusmart"."report_cards" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "term" text not null,
  "academic_year" bigint not null,
  "subjects" jsonb not null,
  "overall_average" numeric not null,
  "overall_rubric" text not null,
  "stream_position" bigint not null,
  "total_students_in_stream" bigint not null,
  "class_teacher_remarks" text not null,
  "head_teacher_remarks" text not null,
  "attendance_days" bigint not null,
  "total_school_days" bigint not null,
  "next_term_begins" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."report_cards" is $es$School data from src/data/initialData.ts export INITIAL_REPORT_CARDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."report_cards" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "term", "academic_year", "subjects", "overall_average", "overall_rubric", "stream_position", "total_students_in_stream", "class_teacher_remarks", "head_teacher_remarks", "attendance_days", "total_school_days", "next_term_begins", "school_id") values
  ($es$rep-brian-term1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, $es$Term 1$es$, 2026, $es$[{"subject":"Mathematics","openerScore":28,"midTermScore":29,"endTermScore":38,"total":95,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Exceptional mathematical grasp in Fractions and Decimals.","teacherName":"Mr. David Kiprono"},{"subject":"English","openerScore":25,"midTermScore":27,"endTermScore":36,"total":88,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Fluent expressive reader with rich creative vocabulary.","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","openerScore":24,"midTermScore":26,"endTermScore":35,"total":85,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Umahiri mzuri katika Insha na Sarufi.","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","openerScore":26,"midTermScore":28,"endTermScore":37,"total":91,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Inquisitive scientific thinker, excellent lab diagrams.","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","openerScore":23,"midTermScore":25,"endTermScore":34,"total":82,"gradeLetter":"A","rubricLevel":"Meeting Expectations","remarks":"Active in garden projects and nutritional budgeting.","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","openerScore":24,"midTermScore":26,"endTermScore":34,"total":84,"gradeLetter":"A","rubricLevel":"Meeting Expectations","remarks":"Sound knowledge of Kenyan physical features and history.","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","openerScore":27,"midTermScore":28,"endTermScore":36,"total":91,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Exemplary moral character and scripture synthesis.","teacherName":"Pastor James"},{"subject":"Creative Arts","openerScore":25,"midTermScore":26,"endTermScore":35,"total":86,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Skilled in watercolor blending and rhythmic arts.","teacherName":"Ms. Achieng"}]$es$::jsonb, 87.8, $es$Exceeding Expectations$es$, 1, 42, $es$Brian is an outstanding, disciplined pupil who exhibits stellar leadership as Class Monitor. Excellent Term 1 performance.$es$, $es$Splendid results! Keep up the brilliant standard of academic excellence and good manners.$es$, 68, 70, $es$2026-05-04$es$, $es$tenant-riara$es$),
  ($es$rep-amina-term1$es$, $es$usr-stu-amina$es$, $es$Amina Hassan$es$, $es$ADM/2023/0413$es$, 4, $es$Dove$es$, $es$Term 1$es$, 2026, $es$[{"subject":"Mathematics","openerScore":24,"midTermScore":26,"endTermScore":34,"total":84,"gradeLetter":"A","rubricLevel":"Meeting Expectations","remarks":"Good accuracy in computation; continue practicing word sums.","teacherName":"Mr. David Kiprono"},{"subject":"English","openerScore":27,"midTermScore":28,"endTermScore":37,"total":92,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Top orator in debates with impeccable comprehension.","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","openerScore":27,"midTermScore":28,"endTermScore":38,"total":93,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Kazi safi sana ya ushairi na utungaji.","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","openerScore":24,"midTermScore":25,"endTermScore":33,"total":82,"gradeLetter":"A","rubricLevel":"Meeting Expectations","remarks":"Strong grasp of environmental conservation.","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","openerScore":25,"midTermScore":26,"endTermScore":35,"total":86,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Passionate in kitchen gardening projects.","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","openerScore":26,"midTermScore":27,"endTermScore":35,"total":88,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Deep appreciation of national cohesion.","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","openerScore":28,"midTermScore":29,"endTermScore":38,"total":95,"gradeLetter":"A","rubricLevel":"Exceeding Expectations","remarks":"Outstanding diligence and ethical discussions.","teacherName":"Pastor James"},{"subject":"Creative Arts","openerScore":24,"midTermScore":25,"endTermScore":33,"total":82,"gradeLetter":"A","rubricLevel":"Meeting Expectations","remarks":"Creative in beadwork and fabric decorations.","teacherName":"Ms. Achieng"}]$es$::jsonb, 87.75, $es$Exceeding Expectations$es$, 2, 42, $es$Amina is a respectful, hardworking and consistent pupil. Excellent contribution to class projects.$es$, $es$Very commendable accomplishment. Congratulations on your great Term 1 mark.$es$, 70, 70, $es$2026-05-04$es$, $es$tenant-riara$es$);
create index "report_cards_school_id_idx" on "edusmart"."report_cards" ("school_id");
alter table "edusmart"."report_cards" enable row level security;

-- src/data/initialData.ts :: INITIAL_CHAT_MESSAGES (4 rows)
drop table if exists "edusmart"."chat_messages" cascade;
create table "edusmart"."chat_messages" (
  "id" text not null,
  "sender_id" text not null,
  "sender_name" text not null,
  "sender_role" text not null,
  "grade" bigint not null,
  "stream" text,
  "message" text not null,
  "timestamp" text not null,
  "is_direct" boolean not null,
  "school_id" text not null,
  "recipient_id" text,
  "recipient_name" text,
  primary key ("id")
);
comment on table "edusmart"."chat_messages" is $es$School data from src/data/initialData.ts export INITIAL_CHAT_MESSAGES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."chat_messages" ("id", "sender_id", "sender_name", "sender_role", "grade", "stream", "message", "timestamp", "is_direct", "school_id", "recipient_id", "recipient_name") values
  ($es$msg-1$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$class_teacher$es$, 4, $es$Dove$es$, $es$Good morning Grade 4 Dove scholars! Please ensure you have reviewed the Fractions notes before our 10:00 AM Google Meet session.$es$, $es$08:15 AM$es$, false, $es$tenant-riara$es$, null, null),
  ($es$msg-2$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$student$es$, 4, $es$Dove$es$, $es$Good morning Teacher Kiprono. We have reviewed Topic 2 and attempted the mental quiz.$es$, $es$08:22 AM$es$, false, $es$tenant-riara$es$, null, null),
  ($es$msg-3$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$student$es$, 4, null, $es$Teacher Kiprono, on Question 4 of the Fractions worksheet, when simplifying 6/8 do we divide by 2?$es$, $es$09:05 AM$es$, true, $es$tenant-riara$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$),
  ($es$msg-4$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, $es$class_teacher$es$, 4, null, $es$Yes Brian! 6 divided by 2 is 3, and 8 divided by 2 is 4, which gives 3/4. Spot on!$es$, $es$09:12 AM$es$, true, $es$tenant-riara$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$);
create index "chat_messages_school_id_idx" on "edusmart"."chat_messages" ("school_id");
alter table "edusmart"."chat_messages" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_BOOKS (9 rows)
drop table if exists "edusmart"."library_books" cascade;
create table "edusmart"."library_books" (
  "id" text not null,
  "isbn" text not null,
  "title" text not null,
  "author" text not null,
  "publisher" text not null,
  "category" text not null,
  "grade" bigint,
  "subject" text,
  "copies_available" bigint not null,
  "total_copies" bigint not null,
  "location_shelf" text not null,
  "acquisition_type" text not null,
  "donor_name" text not null,
  "accession_prefix" text not null,
  "unique_copy_ids" text[] not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_books" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_BOOKS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_books" ("id", "isbn", "title", "author", "publisher", "category", "grade", "subject", "copies_available", "total_copies", "location_shelf", "acquisition_type", "donor_name", "accession_prefix", "unique_copy_ids", "school_id") values
  ($es$bk-cbc-math-4$es$, $es$978-9966-25-104-1$es$, $es$KLB Top Scholar Mathematics Learner's Book Grade 4$es$, $es$Kenya Literature Bureau (KLB)$es$, $es$KLB Publishing$es$, $es$CBC Textbook$es$, 4, $es$Mathematics$es$, 42, 45, $es$Shelf M-04A$es$, $es$Stocked$es$, $es$Ministry of Education Capitation Grant$es$, $es$ACC-KLB-M4$es$, array[$es$ACC-KLB-M4-001$es$, $es$ACC-KLB-M4-002$es$, $es$ACC-KLB-M4-003$es$, $es$ACC-KLB-M4-004$es$, $es$ACC-KLB-M4-005$es$, $es$ACC-KLB-M4-006$es$, $es$ACC-KLB-M4-007$es$, $es$ACC-KLB-M4-008$es$, $es$ACC-KLB-M4-009$es$, $es$ACC-KLB-M4-010$es$, $es$ACC-KLB-M4-011$es$, $es$ACC-KLB-M4-012$es$, $es$ACC-KLB-M4-013$es$, $es$ACC-KLB-M4-014$es$, $es$ACC-KLB-M4-015$es$, $es$ACC-KLB-M4-016$es$, $es$ACC-KLB-M4-017$es$, $es$ACC-KLB-M4-018$es$, $es$ACC-KLB-M4-019$es$, $es$ACC-KLB-M4-020$es$, $es$ACC-KLB-M4-021$es$, $es$ACC-KLB-M4-022$es$, $es$ACC-KLB-M4-023$es$, $es$ACC-KLB-M4-024$es$, $es$ACC-KLB-M4-025$es$, $es$ACC-KLB-M4-026$es$, $es$ACC-KLB-M4-027$es$, $es$ACC-KLB-M4-028$es$, $es$ACC-KLB-M4-029$es$, $es$ACC-KLB-M4-030$es$, $es$ACC-KLB-M4-031$es$, $es$ACC-KLB-M4-032$es$, $es$ACC-KLB-M4-033$es$, $es$ACC-KLB-M4-034$es$, $es$ACC-KLB-M4-035$es$, $es$ACC-KLB-M4-036$es$, $es$ACC-KLB-M4-037$es$, $es$ACC-KLB-M4-038$es$, $es$ACC-KLB-M4-039$es$, $es$ACC-KLB-M4-040$es$, $es$ACC-KLB-M4-041$es$, $es$ACC-KLB-M4-042$es$, $es$ACC-KLB-M4-043$es$, $es$ACC-KLB-M4-044$es$, $es$ACC-KLB-M4-045$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-cbc-sci-4$es$, $es$978-9966-36-882-3$es$, $es$Spark Integrated Science Learner's Book Grade 4$es$, $es$Oxford University Press East Africa$es$, $es$Oxford EA$es$, $es$CBC Textbook$es$, 4, $es$Integrated Science$es$, 38, 40, $es$Shelf S-04B$es$, $es$Donated$es$, $es$USAID / STEM Africa Foundation$es$, $es$DON-OUP-SCI4$es$, array[$es$DON-OUP-SCI4-001$es$, $es$DON-OUP-SCI4-002$es$, $es$DON-OUP-SCI4-003$es$, $es$DON-OUP-SCI4-004$es$, $es$DON-OUP-SCI4-005$es$, $es$DON-OUP-SCI4-006$es$, $es$DON-OUP-SCI4-007$es$, $es$DON-OUP-SCI4-008$es$, $es$DON-OUP-SCI4-009$es$, $es$DON-OUP-SCI4-010$es$, $es$DON-OUP-SCI4-011$es$, $es$DON-OUP-SCI4-012$es$, $es$DON-OUP-SCI4-013$es$, $es$DON-OUP-SCI4-014$es$, $es$DON-OUP-SCI4-015$es$, $es$DON-OUP-SCI4-016$es$, $es$DON-OUP-SCI4-017$es$, $es$DON-OUP-SCI4-018$es$, $es$DON-OUP-SCI4-019$es$, $es$DON-OUP-SCI4-020$es$, $es$DON-OUP-SCI4-021$es$, $es$DON-OUP-SCI4-022$es$, $es$DON-OUP-SCI4-023$es$, $es$DON-OUP-SCI4-024$es$, $es$DON-OUP-SCI4-025$es$, $es$DON-OUP-SCI4-026$es$, $es$DON-OUP-SCI4-027$es$, $es$DON-OUP-SCI4-028$es$, $es$DON-OUP-SCI4-029$es$, $es$DON-OUP-SCI4-030$es$, $es$DON-OUP-SCI4-031$es$, $es$DON-OUP-SCI4-032$es$, $es$DON-OUP-SCI4-033$es$, $es$DON-OUP-SCI4-034$es$, $es$DON-OUP-SCI4-035$es$, $es$DON-OUP-SCI4-036$es$, $es$DON-OUP-SCI4-037$es$, $es$DON-OUP-SCI4-038$es$, $es$DON-OUP-SCI4-039$es$, $es$DON-OUP-SCI4-040$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-cbc-agri-4$es$, $es$978-9966-10-551-2$es$, $es$Spotlight Agriculture & Nutrition Grade 4$es$, $es$Spotlight Publishers$es$, $es$Spotlight EA$es$, $es$CBC Textbook$es$, 4, $es$Agriculture and Nutrition$es$, 35, 35, $es$Shelf A-04C$es$, $es$Stocked$es$, $es$School Board of Management (BOM)$es$, $es$ACC-SPT-AGR4$es$, array[$es$ACC-SPT-AGR4-001$es$, $es$ACC-SPT-AGR4-002$es$, $es$ACC-SPT-AGR4-003$es$, $es$ACC-SPT-AGR4-004$es$, $es$ACC-SPT-AGR4-005$es$, $es$ACC-SPT-AGR4-006$es$, $es$ACC-SPT-AGR4-007$es$, $es$ACC-SPT-AGR4-008$es$, $es$ACC-SPT-AGR4-009$es$, $es$ACC-SPT-AGR4-010$es$, $es$ACC-SPT-AGR4-011$es$, $es$ACC-SPT-AGR4-012$es$, $es$ACC-SPT-AGR4-013$es$, $es$ACC-SPT-AGR4-014$es$, $es$ACC-SPT-AGR4-015$es$, $es$ACC-SPT-AGR4-016$es$, $es$ACC-SPT-AGR4-017$es$, $es$ACC-SPT-AGR4-018$es$, $es$ACC-SPT-AGR4-019$es$, $es$ACC-SPT-AGR4-020$es$, $es$ACC-SPT-AGR4-021$es$, $es$ACC-SPT-AGR4-022$es$, $es$ACC-SPT-AGR4-023$es$, $es$ACC-SPT-AGR4-024$es$, $es$ACC-SPT-AGR4-025$es$, $es$ACC-SPT-AGR4-026$es$, $es$ACC-SPT-AGR4-027$es$, $es$ACC-SPT-AGR4-028$es$, $es$ACC-SPT-AGR4-029$es$, $es$ACC-SPT-AGR4-030$es$, $es$ACC-SPT-AGR4-031$es$, $es$ACC-SPT-AGR4-032$es$, $es$ACC-SPT-AGR4-033$es$, $es$ACC-SPT-AGR4-034$es$, $es$ACC-SPT-AGR4-035$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-cbc-eng-8$es$, $es$978-9966-44-902-1$es$, $es$Junior Secondary English Course Grade 8$es$, $es$Longhorn Publishers$es$, $es$Longhorn Kenya$es$, $es$CBC Textbook$es$, 8, $es$English$es$, 28, 30, $es$Shelf E-08A$es$, $es$Stocked$es$, $es$Government Free Day Secondary Education (FDSE)$es$, $es$ACC-LGH-ENG8$es$, array[$es$ACC-LGH-ENG8-001$es$, $es$ACC-LGH-ENG8-002$es$, $es$ACC-LGH-ENG8-003$es$, $es$ACC-LGH-ENG8-004$es$, $es$ACC-LGH-ENG8-005$es$, $es$ACC-LGH-ENG8-006$es$, $es$ACC-LGH-ENG8-007$es$, $es$ACC-LGH-ENG8-008$es$, $es$ACC-LGH-ENG8-009$es$, $es$ACC-LGH-ENG8-010$es$, $es$ACC-LGH-ENG8-011$es$, $es$ACC-LGH-ENG8-012$es$, $es$ACC-LGH-ENG8-013$es$, $es$ACC-LGH-ENG8-014$es$, $es$ACC-LGH-ENG8-015$es$, $es$ACC-LGH-ENG8-016$es$, $es$ACC-LGH-ENG8-017$es$, $es$ACC-LGH-ENG8-018$es$, $es$ACC-LGH-ENG8-019$es$, $es$ACC-LGH-ENG8-020$es$, $es$ACC-LGH-ENG8-021$es$, $es$ACC-LGH-ENG8-022$es$, $es$ACC-LGH-ENG8-023$es$, $es$ACC-LGH-ENG8-024$es$, $es$ACC-LGH-ENG8-025$es$, $es$ACC-LGH-ENG8-026$es$, $es$ACC-LGH-ENG8-027$es$, $es$ACC-LGH-ENG8-028$es$, $es$ACC-LGH-ENG8-029$es$, $es$ACC-LGH-ENG8-030$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-cbc-pretech-8$es$, $es$978-9966-55-110-9$es$, $es$Pre-Technical Studies Learner's Guide Grade 8$es$, $es$Moran Publishers$es$, $es$Moran EA$es$, $es$CBC Textbook$es$, 8, $es$Pretechnical Education$es$, 22, 25, $es$Shelf P-08B$es$, $es$Stocked$es$, $es$Junior Secondary Capitation$es$, $es$ACC-MOR-PT8$es$, array[$es$ACC-MOR-PT8-001$es$, $es$ACC-MOR-PT8-002$es$, $es$ACC-MOR-PT8-003$es$, $es$ACC-MOR-PT8-004$es$, $es$ACC-MOR-PT8-005$es$, $es$ACC-MOR-PT8-006$es$, $es$ACC-MOR-PT8-007$es$, $es$ACC-MOR-PT8-008$es$, $es$ACC-MOR-PT8-009$es$, $es$ACC-MOR-PT8-010$es$, $es$ACC-MOR-PT8-011$es$, $es$ACC-MOR-PT8-012$es$, $es$ACC-MOR-PT8-013$es$, $es$ACC-MOR-PT8-014$es$, $es$ACC-MOR-PT8-015$es$, $es$ACC-MOR-PT8-016$es$, $es$ACC-MOR-PT8-017$es$, $es$ACC-MOR-PT8-018$es$, $es$ACC-MOR-PT8-019$es$, $es$ACC-MOR-PT8-020$es$, $es$ACC-MOR-PT8-021$es$, $es$ACC-MOR-PT8-022$es$, $es$ACC-MOR-PT8-023$es$, $es$ACC-MOR-PT8-024$es$, $es$ACC-MOR-PT8-025$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-story-chike$es$, $es$978-0435-900-24-3$es$, $es$Chike and the River$es$, $es$Chinua Achebe$es$, $es$Heinemann African Writers$es$, $es$Fiction Storybook$es$, null, null, 14, 15, $es$Shelf FIC-ACH$es$, $es$Donated$es$, $es$Rotary Club of Nairobi Literacy Drive$es$, $es$DON-HAF-CHK$es$, array[$es$DON-HAF-CHK-001$es$, $es$DON-HAF-CHK-002$es$, $es$DON-HAF-CHK-003$es$, $es$DON-HAF-CHK-004$es$, $es$DON-HAF-CHK-005$es$, $es$DON-HAF-CHK-006$es$, $es$DON-HAF-CHK-007$es$, $es$DON-HAF-CHK-008$es$, $es$DON-HAF-CHK-009$es$, $es$DON-HAF-CHK-010$es$, $es$DON-HAF-CHK-011$es$, $es$DON-HAF-CHK-012$es$, $es$DON-HAF-CHK-013$es$, $es$DON-HAF-CHK-014$es$, $es$DON-HAF-CHK-015$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-story-weep$es$, $es$978-0143-106-99-9$es$, $es$Weep Not, Child$es$, $es$Ngũgĩ wa Thiong'o$es$, $es$Penguin Classics$es$, $es$Supplementary Reader$es$, null, null, 11, 12, $es$Shelf LIT-NGU$es$, $es$Donated$es$, $es$Alumni Association Class of 2018$es$, $es$DON-PEN-WNC$es$, array[$es$DON-PEN-WNC-001$es$, $es$DON-PEN-WNC-002$es$, $es$DON-PEN-WNC-003$es$, $es$DON-PEN-WNC-004$es$, $es$DON-PEN-WNC-005$es$, $es$DON-PEN-WNC-006$es$, $es$DON-PEN-WNC-007$es$, $es$DON-PEN-WNC-008$es$, $es$DON-PEN-WNC-009$es$, $es$DON-PEN-WNC-010$es$, $es$DON-PEN-WNC-011$es$, $es$DON-PEN-WNC-012$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-tusome-eng-4$es$, $es$978-9966-22-819-7$es$, $es$Tusome Early Literacy Reader Grade 4$es$, $es$Ministry of Education & KICD$es$, $es$KICD & USAID Kenya$es$, $es$Supplementary Reader$es$, 4, $es$English$es$, 48, 50, $es$Shelf TUS-04$es$, $es$Donated$es$, $es$USAID & KICD National Reading Programme$es$, $es$DON-TUS-ENG4$es$, array[$es$DON-TUS-ENG4-001$es$, $es$DON-TUS-ENG4-002$es$, $es$DON-TUS-ENG4-003$es$, $es$DON-TUS-ENG4-004$es$, $es$DON-TUS-ENG4-005$es$, $es$DON-TUS-ENG4-006$es$, $es$DON-TUS-ENG4-007$es$, $es$DON-TUS-ENG4-008$es$, $es$DON-TUS-ENG4-009$es$, $es$DON-TUS-ENG4-010$es$, $es$DON-TUS-ENG4-011$es$, $es$DON-TUS-ENG4-012$es$, $es$DON-TUS-ENG4-013$es$, $es$DON-TUS-ENG4-014$es$, $es$DON-TUS-ENG4-015$es$, $es$DON-TUS-ENG4-016$es$, $es$DON-TUS-ENG4-017$es$, $es$DON-TUS-ENG4-018$es$, $es$DON-TUS-ENG4-019$es$, $es$DON-TUS-ENG4-020$es$, $es$DON-TUS-ENG4-021$es$, $es$DON-TUS-ENG4-022$es$, $es$DON-TUS-ENG4-023$es$, $es$DON-TUS-ENG4-024$es$, $es$DON-TUS-ENG4-025$es$, $es$DON-TUS-ENG4-026$es$, $es$DON-TUS-ENG4-027$es$, $es$DON-TUS-ENG4-028$es$, $es$DON-TUS-ENG4-029$es$, $es$DON-TUS-ENG4-030$es$, $es$DON-TUS-ENG4-031$es$, $es$DON-TUS-ENG4-032$es$, $es$DON-TUS-ENG4-033$es$, $es$DON-TUS-ENG4-034$es$, $es$DON-TUS-ENG4-035$es$, $es$DON-TUS-ENG4-036$es$, $es$DON-TUS-ENG4-037$es$, $es$DON-TUS-ENG4-038$es$, $es$DON-TUS-ENG4-039$es$, $es$DON-TUS-ENG4-040$es$, $es$DON-TUS-ENG4-041$es$, $es$DON-TUS-ENG4-042$es$, $es$DON-TUS-ENG4-043$es$, $es$DON-TUS-ENG4-044$es$, $es$DON-TUS-ENG4-045$es$, $es$DON-TUS-ENG4-046$es$, $es$DON-TUS-ENG4-047$es$, $es$DON-TUS-ENG4-048$es$, $es$DON-TUS-ENG4-049$es$, $es$DON-TUS-ENG4-050$es$]::text[], $es$tenant-riara$es$),
  ($es$bk-oxf-atlas$es$, $es$978-0195-738-90-2$es$, $es$Oxford Primary Illustrated CBC Atlas for Kenya$es$, $es$Oxford Cartographic Team$es$, $es$Oxford EA$es$, $es$Encyclopedia$es$, 5, $es$Social Studies$es$, 20, 20, $es$Shelf REF-ATL$es$, $es$Stocked$es$, $es$School Library Development Budget$es$, $es$ACC-OUP-ATL5$es$, array[$es$ACC-OUP-ATL5-001$es$, $es$ACC-OUP-ATL5-002$es$, $es$ACC-OUP-ATL5-003$es$, $es$ACC-OUP-ATL5-004$es$, $es$ACC-OUP-ATL5-005$es$, $es$ACC-OUP-ATL5-006$es$, $es$ACC-OUP-ATL5-007$es$, $es$ACC-OUP-ATL5-008$es$, $es$ACC-OUP-ATL5-009$es$, $es$ACC-OUP-ATL5-010$es$, $es$ACC-OUP-ATL5-011$es$, $es$ACC-OUP-ATL5-012$es$, $es$ACC-OUP-ATL5-013$es$, $es$ACC-OUP-ATL5-014$es$, $es$ACC-OUP-ATL5-015$es$, $es$ACC-OUP-ATL5-016$es$, $es$ACC-OUP-ATL5-017$es$, $es$ACC-OUP-ATL5-018$es$, $es$ACC-OUP-ATL5-019$es$, $es$ACC-OUP-ATL5-020$es$]::text[], $es$tenant-riara$es$);
create index "library_books_school_id_idx" on "edusmart"."library_books" ("school_id");
alter table "edusmart"."library_books" enable row level security;

-- src/data/initialData.ts :: INITIAL_BORROW_RECORDS (5 rows)
drop table if exists "edusmart"."borrow_records" cascade;
create table "edusmart"."borrow_records" (
  "id" text not null,
  "book_id" text not null,
  "book_title" text not null,
  "book_copy_id" text not null,
  "publisher" text not null,
  "acquisition_type" text not null,
  "borrower_id" text not null,
  "borrower_name" text not null,
  "borrower_role" text not null,
  "grade" bigint,
  "stream" text,
  "borrowed_date" text not null,
  "due_date" text not null,
  "status" text not null,
  "remarks" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."borrow_records" is $es$School data from src/data/initialData.ts export INITIAL_BORROW_RECORDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."borrow_records" ("id", "book_id", "book_title", "book_copy_id", "publisher", "acquisition_type", "borrower_id", "borrower_name", "borrower_role", "grade", "stream", "borrowed_date", "due_date", "status", "remarks", "school_id") values
  ($es$bor-1$es$, $es$bk-cbc-math-4$es$, $es$KLB Top Scholar Mathematics Learner's Book Grade 4$es$, $es$ACC-KLB-M4-001$es$, $es$KLB Publishing$es$, $es$Stocked$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$student$es$, 4, $es$Dove$es$, $es$2026-09-24$es$, $es$2026-10-08$es$, $es$active$es$, $es$Fractions study guide assigned by Mr. Kiprono · Copy 001$es$, $es$tenant-riara$es$),
  ($es$bor-1b$es$, $es$bk-cbc-math-4$es$, $es$KLB Top Scholar Mathematics Learner's Book Grade 4$es$, $es$ACC-KLB-M4-002$es$, $es$KLB Publishing$es$, $es$Stocked$es$, $es$usr-stu-faith$es$, $es$Faith Chebet$es$, $es$student$es$, 4, $es$Dove$es$, $es$2026-09-25$es$, $es$2026-10-09$es$, $es$active$es$, $es$Numeracy practicum exercises · Copy 002$es$, $es$tenant-riara$es$),
  ($es$bor-2$es$, $es$bk-cbc-sci-4$es$, $es$Spark Integrated Science Learner's Book Grade 4$es$, $es$DON-OUP-SCI4-001$es$, $es$Oxford EA$es$, $es$Donated$es$, $es$usr-stu-amina$es$, $es$Amina Hassan$es$, $es$student$es$, 4, $es$Dove$es$, $es$2026-09-20$es$, $es$2026-10-04$es$, $es$active$es$, $es$Donated STEM copy · Copy 001$es$, $es$tenant-riara$es$),
  ($es$bor-3$es$, $es$bk-story-chike$es$, $es$Chike and the River$es$, $es$DON-HAF-CHK-001$es$, $es$Heinemann African Writers$es$, $es$Donated$es$, $es$usr-stu-kelvin$es$, $es$Kelvin Kiprop$es$, $es$student$es$, 4, $es$Dove$es$, $es$2026-09-15$es$, $es$2026-09-29$es$, $es$overdue$es$, $es$First reminder sent · Copy 001$es$, $es$tenant-riara$es$),
  ($es$bor-4$es$, $es$bk-cbc-pretech-8$es$, $es$Pre-Technical Studies Learner's Guide Grade 8$es$, $es$ACC-MOR-PT8-001$es$, $es$Moran EA$es$, $es$Stocked$es$, $es$usr-teach-mutua$es$, $es$Mr. Peter Mutua$es$, $es$teacher$es$, null, null, $es$2026-09-22$es$, $es$2026-10-22$es$, $es$active$es$, $es$Lesson preparation & workshop safety · Copy 001$es$, $es$tenant-riara$es$);
create index "borrow_records_school_id_idx" on "edusmart"."borrow_records" ("school_id");
alter table "edusmart"."borrow_records" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_RESERVATIONS (2 rows)
drop table if exists "edusmart"."library_reservations" cascade;
create table "edusmart"."library_reservations" (
  "id" text not null,
  "book_id" text not null,
  "book_title" text not null,
  "borrower_id" text not null,
  "borrower_name" text not null,
  "borrower_role" text not null,
  "grade" bigint,
  "stream" text,
  "reservation_date" text not null,
  "expiry_date" text not null,
  "status" text not null,
  "notes" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_reservations" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_RESERVATIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_reservations" ("id", "book_id", "book_title", "borrower_id", "borrower_name", "borrower_role", "grade", "stream", "reservation_date", "expiry_date", "status", "notes", "school_id") values
  ($es$res-1$es$, $es$bk-cbc-math-4$es$, $es$KLB Top Scholar Mathematics Learner's Book Grade 4$es$, $es$usr-stu-wanjiku-7$es$, $es$Grace Wanjiku$es$, $es$student$es$, 7, $es$Athi$es$, $es$2026-10-02$es$, $es$2026-10-09$es$, $es$pending$es$, $es$Requested for homework catch-up$es$, $es$tenant-riara$es$),
  ($es$res-2$es$, $es$bk-enc-brit$es$, $es$Oxford Children's Illustrated Science Encyclopedia$es$, $es$usr-teach-mwangi$es$, $es$Mr. David Kiprono$es$, $es$teacher$es$, null, null, $es$2026-10-01$es$, $es$2026-10-08$es$, $es$ready_for_pickup$es$, $es$Reference copy reserved at circulation desk$es$, $es$tenant-riara$es$);
create index "library_reservations_school_id_idx" on "edusmart"."library_reservations" ("school_id");
alter table "edusmart"."library_reservations" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_FINES (2 rows)
drop table if exists "edusmart"."library_fines" cascade;
create table "edusmart"."library_fines" (
  "id" text not null,
  "borrow_record_id" text not null,
  "book_title" text not null,
  "borrower_id" text not null,
  "borrower_name" text not null,
  "borrower_role" text not null,
  "days_overdue" bigint not null,
  "fine_amount" bigint not null,
  "amount_paid" bigint not null,
  "status" text not null,
  "date_issued" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_fines" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_FINES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_fines" ("id", "borrow_record_id", "book_title", "borrower_id", "borrower_name", "borrower_role", "days_overdue", "fine_amount", "amount_paid", "status", "date_issued", "school_id") values
  ($es$fine-1$es$, $es$bor-3$es$, $es$Chike and the River$es$, $es$usr-stu-kelvin$es$, $es$Kelvin Kiprop$es$, $es$student$es$, 5, 50, 0, $es$unpaid$es$, $es$2026-09-30$es$, $es$tenant-riara$es$),
  ($es$fine-2$es$, $es$bor-old-1$es$, $es$Weep Not, Child$es$, $es$usr-stu-otieno-4$es$, $es$Brian Otieno$es$, $es$student$es$, 2, 20, 20, $es$paid$es$, $es$2026-09-18$es$, $es$tenant-riara$es$);
create index "library_fines_school_id_idx" on "edusmart"."library_fines" ("school_id");
alter table "edusmart"."library_fines" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_ACQUISITIONS (2 rows)
drop table if exists "edusmart"."library_acquisitions" cascade;
create table "edusmart"."library_acquisitions" (
  "id" text not null,
  "title" text not null,
  "author" text not null,
  "isbn" text not null,
  "publisher" text not null,
  "quantity" bigint not null,
  "unit_cost" bigint not null,
  "total_cost" bigint not null,
  "supplier" text not null,
  "request_date" text not null,
  "status" text not null,
  "requested_by" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_acquisitions" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_ACQUISITIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_acquisitions" ("id", "title", "author", "isbn", "publisher", "quantity", "unit_cost", "total_cost", "supplier", "request_date", "status", "requested_by", "school_id") values
  ($es$acq-1$es$, $es$Oxford Primary Science Atlas 2026 Edition$es$, $es$Oxford Cartography Team$es$, $es$978-0-19-843210-9$es$, $es$Oxford University Press$es$, 40, 850, 34000, $es$Text Book Centre Ltd$es$, $es$2026-09-15$es$, $es$received$es$, $es$Madame Rose (HOD Sciences)$es$, $es$tenant-riara$es$),
  ($es$acq-2$es$, $es$Kenya National CBC Performing Arts Compendium$es$, $es$Kenya Institute of Curriculum Development (KICD)$es$, $es$978-9966-25-119-0$es$, $es$KICD Press$es$, 25, 1100, 27500, $es$KLB Bookshop$es$, $es$2026-09-28$es$, $es$ordered$es$, $es$Madame Grace Achieng$es$, $es$tenant-riara$es$);
create index "library_acquisitions_school_id_idx" on "edusmart"."library_acquisitions" ("school_id");
alter table "edusmart"."library_acquisitions" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_SHELVES (4 rows)
drop table if exists "edusmart"."library_shelves" cascade;
create table "edusmart"."library_shelves" (
  "id" text not null,
  "code" text not null,
  "section_name" text not null,
  "floor" text not null,
  "aisle" text not null,
  "dewey_range" text not null,
  "capacity" bigint not null,
  "current_count" bigint not null,
  "category_specialization" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_shelves" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_SHELVES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_shelves" ("id", "code", "section_name", "floor", "aisle", "dewey_range", "capacity", "current_count", "category_specialization", "school_id") values
  ($es$shelf-01$es$, $es$SEC-A-01$es$, $es$CBC Primary Mathematics & Numeracy$es$, $es$Ground Floor$es$, $es$Aisle 1 - East Wing$es$, $es$510.1 - 519.9$es$, 250, 210, $es$CBC Mathematics Grades 1-6$es$, $es$tenant-riara$es$),
  ($es$shelf-02$es$, $es$SEC-A-02$es$, $es$Integrated & Applied Science Wing$es$, $es$Ground Floor$es$, $es$Aisle 2 - East Wing$es$, $es$500.0 - 599.9$es$, 300, 265, $es$Science & Pre-Technical Studies$es$, $es$tenant-riara$es$),
  ($es$shelf-03$es$, $es$SEC-B-01$es$, $es$African Writers Series & Fiction$es$, $es$1st Floor$es$, $es$Aisle 3 - Literature Hall$es$, $es$823.9 - 896.3$es$, 350, 320, $es$African Literature & Children Fiction$es$, $es$tenant-riara$es$),
  ($es$shelf-04$es$, $es$SEC-REF-01$es$, $es$Encyclopedias & Teacher Reference Hub$es$, $es$1st Floor$es$, $es$Quiet Reference Bay$es$, $es$030.0 - 099.9$es$, 150, 110, $es$Non-Circulating Reference$es$, $es$tenant-riara$es$);
create index "library_shelves_school_id_idx" on "edusmart"."library_shelves" ("school_id");
alter table "edusmart"."library_shelves" enable row level security;

-- src/data/initialData.ts :: INITIAL_DIGITAL_LIBRARY_ITEMS (3 rows)
drop table if exists "edusmart"."digital_library_items" cascade;
create table "edusmart"."digital_library_items" (
  "id" text not null,
  "title" text not null,
  "author" text not null,
  "file_type" text not null,
  "file_size" text not null,
  "category" text not null,
  "grade_level" bigint not null,
  "access_level" text not null,
  "download_count" bigint not null,
  "read_url" text not null,
  "cover_color" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."digital_library_items" is $es$School data from src/data/initialData.ts export INITIAL_DIGITAL_LIBRARY_ITEMS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."digital_library_items" ("id", "title", "author", "file_type", "file_size", "category", "grade_level", "access_level", "download_count", "read_url", "cover_color", "school_id") values
  ($es$dig-1$es$, $es$Kenya National Geographic & Biodiversity Digital Compendium$es$, $es$Kenya Wildlife Service & KICD$es$, $es$PDF$es$, $es$14.8 MB$es$, $es$Environmental & Agriculture$es$, 4, $es$all$es$, 184, $es$#$es$, $es$from-emerald-700 to-teal-900$es$, $es$tenant-riara$es$),
  ($es$dig-2$es$, $es$Young Inventors: Electronics & Scratch Coding Illustrated$es$, $es$Tech4Kids Africa$es$, $es$EPUB$es$, $es$8.2 MB$es$, $es$STEM & Robotics$es$, 5, $es$all$es$, 242, $es$#$es$, $es$from-blue-700 to-indigo-900$es$, $es$tenant-riara$es$),
  ($es$dig-3$es$, $es$Audiobook: Folk Tales from the Great Rift Valley$es$, $es$Narrated by Wanja Kimani$es$, $es$Audiobook$es$, $es$42.5 MB$es$, $es$Indigenous Knowledge & Stories$es$, 3, $es$all$es$, 310, $es$#$es$, $es$from-amber-700 to-orange-900$es$, $es$tenant-riara$es$);
create index "digital_library_items_school_id_idx" on "edusmart"."digital_library_items" ("school_id");
alter table "edusmart"."digital_library_items" enable row level security;

-- src/data/initialData.ts :: INITIAL_READING_PROGRAMME_MEMBERS (3 rows)
drop table if exists "edusmart"."reading_programme_members" cascade;
create table "edusmart"."reading_programme_members" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "current_level" text not null,
  "books_read_this_term" bigint not null,
  "target_books" bigint not null,
  "points_earned" bigint not null,
  "badges" text[] not null,
  "last_book_reviewed" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."reading_programme_members" is $es$School data from src/data/initialData.ts export INITIAL_READING_PROGRAMME_MEMBERS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."reading_programme_members" ("id", "student_id", "student_name", "grade", "stream", "current_level", "books_read_this_term", "target_books", "points_earned", "badges", "last_book_reviewed", "school_id") values
  ($es$rpm-1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Dove$es$, $es$Gold Reader$es$, 14, 15, 280, array[$es$Bookworm 2026$es$, $es$Science Explorer$es$, $es$Folktale Master$es$]::text[], $es$Chike and the River (Rated 5/5)$es$, $es$tenant-riara$es$),
  ($es$rpm-2$es$, $es$usr-stu-wanjiku-7$es$, $es$Grace Wanjiku$es$, 7, $es$Athi$es$, $es$Platinum Scholar$es$, 22, 20, 450, array[$es$Literature Laureate$es$, $es$Speed Reader$es$, $es$Debate Scholar$es$]::text[], $es$Weep Not, Child (Critical essay submitted)$es$, $es$tenant-riara$es$),
  ($es$rpm-3$es$, $es$usr-stu-kelvin$es$, $es$Kelvin Kiprop$es$, 4, $es$Dove$es$, $es$Silver Reader$es$, 8, 12, 160, array[$es$Rising Reader$es$]::text[], $es$The Magic Fish$es$, $es$tenant-riara$es$);
create index "reading_programme_members_school_id_idx" on "edusmart"."reading_programme_members" ("school_id");
alter table "edusmart"."reading_programme_members" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_ATTENDANCE (3 rows)
drop table if exists "edusmart"."library_attendance" cascade;
create table "edusmart"."library_attendance" (
  "id" text not null,
  "learner_or_staff_id" text not null,
  "name" text not null,
  "role" text not null,
  "grade" bigint,
  "stream" text,
  "entry_time" text not null,
  "exit_time" text,
  "purpose" text not null,
  "date" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_attendance" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_ATTENDANCE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_attendance" ("id", "learner_or_staff_id", "name", "role", "grade", "stream", "entry_time", "exit_time", "purpose", "date", "school_id") values
  ($es$att-lib-1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$student$es$, 4, $es$Dove$es$, $es$08:15 AM$es$, $es$08:55 AM$es$, $es$Class Session$es$, $es$2026-10-04$es$, $es$tenant-riara$es$),
  ($es$att-lib-2$es$, $es$usr-stu-wanjiku-7$es$, $es$Grace Wanjiku$es$, $es$student$es$, 7, $es$Athi$es$, $es$01:10 PM$es$, $es$01:45 PM$es$, $es$Computer / Research$es$, $es$2026-10-04$es$, $es$tenant-riara$es$),
  ($es$att-lib-3$es$, $es$usr-teach-mutua$es$, $es$Mr. Peter Mutua$es$, $es$teacher$es$, null, null, $es$03:30 PM$es$, null, $es$Borrowing / Return$es$, $es$2026-10-04$es$, $es$tenant-riara$es$);
create index "library_attendance_school_id_idx" on "edusmart"."library_attendance" ("school_id");
alter table "edusmart"."library_attendance" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_TIMETABLE (3 rows)
drop table if exists "edusmart"."library_timetable" cascade;
create table "edusmart"."library_timetable" (
  "id" text not null,
  "day_of_week" text not null,
  "start_time" text not null,
  "end_time" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "teacher_in_charge" text not null,
  "session_type" text not null,
  "venue" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_timetable" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_TIMETABLE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_timetable" ("id", "day_of_week", "start_time", "end_time", "grade", "stream", "teacher_in_charge", "session_type", "venue", "school_id") values
  ($es$slot-1$es$, $es$Monday$es$, $es$08:20 AM$es$, $es$09:00 AM$es$, 4, $es$Grade 4 Dove$es$, $es$Mr. David Kiprono$es$, $es$Library Reading Period$es$, $es$Main Library Reading Hall$es$, $es$tenant-riara$es$),
  ($es$slot-2$es$, $es$Tuesday$es$, $es$10:40 AM$es$, $es$11:20 AM$es$, 7, $es$Grade 7 Athi$es$, $es$Madame Grace Achieng$es$, $es$Research & Digital Literacy$es$, $es$Digital Research Suite$es$, $es$tenant-riara$es$),
  ($es$slot-3$es$, $es$Wednesday$es$, $es$02:00 PM$es$, $es$02:40 PM$es$, 5, $es$Grade 5 Eagle$es$, $es$Mr. Peter Mutua$es$, $es$Library Reading Period$es$, $es$Main Library Reading Hall$es$, $es$tenant-riara$es$);
create index "library_timetable_school_id_idx" on "edusmart"."library_timetable" ("school_id");
alter table "edusmart"."library_timetable" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_EVENTS (2 rows)
drop table if exists "edusmart"."library_events" cascade;
create table "edusmart"."library_events" (
  "id" text not null,
  "title" text not null,
  "type" text not null,
  "date" text not null,
  "time" text not null,
  "venue" text not null,
  "target_audience" text not null,
  "coordinator" text not null,
  "status" text not null,
  "description" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_events" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_EVENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_events" ("id", "title", "type", "date", "time", "venue", "target_audience", "coordinator", "status", "description", "school_id") values
  ($es$evt-1$es$, $es$National Literacy Week & Book Fair$es$, $es$Book Fair$es$, $es$2026-10-20$es$, $es$09:00 AM - 04:00 PM$es$, $es$Main School Auditorium & Library Lawns$es$, $es$All Learners, Teachers & Parents$es$, $es$School Librarian & Language Dept$es$, $es$Upcoming$es$, $es$Book publisher exhibits, discounts, storytelling sessions, and reading marathon challenge.$es$, $es$tenant-riara$es$),
  ($es$evt-2$es$, $es$Renowned Author Visit: Storytelling Workshop$es$, $es$Author Visit$es$, $es$2026-11-05$es$, $es$11:00 AM - 01:00 PM$es$, $es$Library Amphitheatre$es$, $es$Grades 4 - 8 Learners$es$, $es$Madame Grace Achieng$es$, $es$Upcoming$es$, $es$Interactive creative writing workshop and book signing session with acclaimed children author.$es$, $es$tenant-riara$es$);
create index "library_events_school_id_idx" on "edusmart"."library_events" ("school_id");
alter table "edusmart"."library_events" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_POLICIES (4 rows)
drop table if exists "edusmart"."library_policies" cascade;
create table "edusmart"."library_policies" (
  "id" text not null,
  "policy_name" text not null,
  "category" text not null,
  "value" text not null,
  "description" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_policies" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_POLICIES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_policies" ("id", "policy_name", "category", "value", "description", "school_id") values
  ($es$pol-1$es$, $es$Student Borrowing Limit$es$, $es$Lending$es$, $es$3 Books / 14 Days$es$, $es$Primary and Junior Secondary students can borrow up to 3 physical titles concurrently for two weeks.$es$, $es$tenant-riara$es$),
  ($es$pol-2$es$, $es$Academic Department Quota$es$, $es$Lending$es$, $es$8 Books / Full Term$es$, $es$Teachers and subject leads can check out curriculum sets and teacher guides for the entire academic term.$es$, $es$tenant-riara$es$),
  ($es$pol-3$es$, $es$Overdue Penalty Structure$es$, $es$Fines$es$, $es$KES 10 per day$es$, $es$Overdue charges accrue daily per volume following a 48-hour grace period.$es$, $es$tenant-riara$es$),
  ($es$pol-4$es$, $es$Digital Device & Reading Bay Conduct$es$, $es$Conduct$es$, $es$Strict Silence & No Food$es$, $es$Headphones required in the digital audio suite; zero food or open beverage containers permitted.$es$, $es$tenant-riara$es$);
create index "library_policies_school_id_idx" on "edusmart"."library_policies" ("school_id");
alter table "edusmart"."library_policies" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_AUDIT_LOGS (3 rows)
drop table if exists "edusmart"."library_audit_logs" cascade;
create table "edusmart"."library_audit_logs" (
  "id" text not null,
  "action" text not null,
  "performed_by" text not null,
  "role" text not null,
  "timestamp" text not null,
  "details" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_audit_logs" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_AUDIT_LOGS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_audit_logs" ("id", "action", "performed_by", "role", "timestamp", "details", "school_id") values
  ($es$aud-1$es$, $es$Book Circulation Issued$es$, $es$Librarian (Mrs. Jane Wambua)$es$, $es$librarian$es$, $es$2026-10-04T08:16:00Z$es$, $es$Issued KLB Mathematics Grade 4 to Brian Otieno (ADM/2026/0401)$es$, $es$tenant-riara$es$),
  ($es$aud-2$es$, $es$Catalogue Stock Added$es$, $es$Librarian (Mrs. Jane Wambua)$es$, $es$librarian$es$, $es$2026-10-03T14:20:00Z$es$, $es$Added 40 copies of Oxford Primary Science Atlas 2026 Edition (SEC-A-02)$es$, $es$tenant-riara$es$),
  ($es$aud-3$es$, $es$Overdue Reminder Dispatched$es$, $es$System Automation$es$, $es$system$es$, $es$2026-10-02T07:00:00Z$es$, $es$Sent overdue SMS and portal alert to Parent of Kelvin Kiprop$es$, $es$tenant-riara$es$);
create index "library_audit_logs_school_id_idx" on "edusmart"."library_audit_logs" ("school_id");
alter table "edusmart"."library_audit_logs" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_ROOMS (5 rows)
drop table if exists "edusmart"."library_rooms" cascade;
create table "edusmart"."library_rooms" (
  "id" text not null,
  "name" text not null,
  "type" text not null,
  "capacity" bigint not null,
  "location" text not null,
  "features" text[] not null,
  "description" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_rooms" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_ROOMS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_rooms" ("id", "name", "type", "capacity", "location", "features", "description", "school_id") values
  ($es$room-main-hall$es$, $es$Main Library Reading Hall$es$, $es$Reading & Silent Study Hall$es$, 80, $es$Central Library, Ground Floor$es$, array[$es$CBC Reference Stacks$es$, $es$Individual Carrels$es$, $es$Reading Tables$es$, $es$Librarian Desk$es$]::text[], $es$Spacious silent reading hall for whole-class reading, reference research, and quiet individual study.$es$, $es$tenant-riara$es$),
  ($es$room-digital-suite$es$, $es$Digital Research & Audio-Visual Suite$es$, $es$Digital Literacy & AV Lab$es$, 40, $es$East Wing, 1st Floor$es$, array[$es$Interactive Smart Screen$es$, $es$High-Speed CBC Tablets$es$, $es$Audio Headsets$es$, $es$Ceiling Projector$es$]::text[], $es$Equipped with digital learning workstations, multimedia projection, and online research tools.$es$, $es$tenant-riara$es$),
  ($es$room-discussion-a$es$, $es$CBC Discussion & Group Seminar Room A$es$, $es$Collaborative Seminar Room$es$, 25, $es$West Wing, 1st Floor$es$, array[$es$Magnetic Whiteboards$es$, $es$Modular Group Seating$es$, $es$Presentation Monitor$es$, $es$Makerspace Kit$es$]::text[], $es$Designed for collaborative group work, debate preparation, and CBC strand syndicate sessions.$es$, $es$tenant-riara$es$),
  ($es$room-discussion-b$es$, $es$CBC Discussion & Group Seminar Room B$es$, $es$Collaborative Seminar Room$es$, 25, $es$West Wing, 1st Floor$es$, array[$es$Magnetic Whiteboards$es$, $es$Modular Group Seating$es$, $es$Presentation Monitor$es$]::text[], $es$Ideal for subject remedial groups, CBC assessment research, and teacher-led symposiums.$es$, $es$tenant-riara$es$),
  ($es$room-archive-special$es$, $es$Special Collections & Quiet Study Alcove$es$, $es$Special Collections Room$es$, 15, $es$Mezzanine Level$es$, array[$es$Rare CBC Manuscripts$es$, $es$Historical Archives$es$, $es$Sound-dampened Walls$es$]::text[], $es$Intimate quiet alcove for focused revision, teacher planning, and advanced research.$es$, $es$tenant-riara$es$);
create index "library_rooms_school_id_idx" on "edusmart"."library_rooms" ("school_id");
alter table "edusmart"."library_rooms" enable row level security;

-- src/data/initialData.ts :: INITIAL_LIBRARY_ROOM_BOOKINGS (2 rows)
drop table if exists "edusmart"."library_room_bookings" cascade;
create table "edusmart"."library_room_bookings" (
  "id" text not null,
  "booking_ref" text not null,
  "room_id" text not null,
  "room_name" text not null,
  "room_capacity" bigint not null,
  "date" text not null,
  "day_of_week" text not null,
  "start_time" text not null,
  "end_time" text not null,
  "period_label" text not null,
  "booked_by_user_id" text not null,
  "booked_by_name" text not null,
  "booked_by_role" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "subject" text not null,
  "purpose" text not null,
  "learners_count" bigint not null,
  "equipment_needed" text[] not null,
  "status" text not null,
  "created_at" text not null,
  "notes" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."library_room_bookings" is $es$School data from src/data/initialData.ts export INITIAL_LIBRARY_ROOM_BOOKINGS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."library_room_bookings" ("id", "booking_ref", "room_id", "room_name", "room_capacity", "date", "day_of_week", "start_time", "end_time", "period_label", "booked_by_user_id", "booked_by_name", "booked_by_role", "grade", "stream", "subject", "purpose", "learners_count", "equipment_needed", "status", "created_at", "notes", "school_id") values
  ($es$lrb-101$es$, $es$LRB-2026-101$es$, $es$room-digital-suite$es$, $es$Digital Research & Audio-Visual Suite$es$, 40, $es$2026-10-15$es$, $es$Thursday$es$, $es$09:20 AM$es$, $es$10:00 AM$es$, $es$Period 3 (STEM & Numeracy)$es$, $es$usr-tea-kiprono$es$, $es$Mr. David Kiprono$es$, $es$subject_teacher$es$, 4, $es$Grade 4 Dove$es$, $es$Science & Technology$es$, $es$CBC Digital Research: Plant Living Organisms & Microscopic Imaging$es$, 36, array[$es$Interactive Smart Screen$es$, $es$High-Speed CBC Tablets$es$, $es$Ceiling Projector$es$]::text[], $es$confirmed$es$, $es$2026-10-08T09:00:00Z$es$, $es$Learners will use virtual lab simulations for CBC Grade 4 Strand 2.$es$, $es$tenant-riara$es$),
  ($es$lrb-102$es$, $es$LRB-2026-102$es$, $es$room-discussion-a$es$, $es$CBC Discussion & Group Seminar Room A$es$, 25, $es$2026-10-16$es$, $es$Friday$es$, $es$11:50 AM$es$, $es$12:30 PM$es$, $es$Period 6 (Creative & Practical)$es$, $es$usr-lib-esther$es$, $es$Mrs. Esther Kamau$es$, $es$librarian$es$, 6, $es$Grade 6 Falcon$es$, $es$English & Literature$es$, $es$Junior Readers Book Club & Creative Storytelling Circle$es$, 22, array[$es$Magnetic Whiteboards$es$, $es$Modular Group Seating$es$]::text[], $es$confirmed$es$, $es$2026-10-08T11:30:00Z$es$, $es$Reviewing "The River and the Source" excerpts.$es$, $es$tenant-riara$es$);
create index "library_room_bookings_school_id_idx" on "edusmart"."library_room_bookings" ("school_id");
alter table "edusmart"."library_room_bookings" enable row level security;

-- src/data/initialData.ts :: INITIAL_NOTIFICATIONS (12 rows)
drop table if exists "edusmart"."notifications" cascade;
create table "edusmart"."notifications" (
  "id" text not null,
  "title" text not null,
  "message" text not null,
  "category" text not null,
  "target_grade" bigint,
  "urgency" text not null,
  "link_tab" text,
  "created_at" text not null,
  "read_by_user_ids" jsonb not null,
  "school_id" text not null,
  "target_role" text,
  primary key ("id")
);
comment on table "edusmart"."notifications" is $es$School data from src/data/initialData.ts export INITIAL_NOTIFICATIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."notifications" ("id", "title", "message", "category", "target_grade", "urgency", "link_tab", "created_at", "read_by_user_ids", "school_id", "target_role") values
  ($es$notif-asgn-gr4$es$, $es$Upcoming Assignment: Mathematics Fractions$es$, $es$Equivalent Fractions Worksheet #2 is due tomorrow at 5:00 PM. Submit early for teacher review.$es$, $es$assignment$es$, 4, $es$high$es$, $es$assignments$es$, $es$2026-10-01T06:30:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, null),
  ($es$notif-grd-gr4$es$, $es$New Quiz Result Recorded$es$, $es$Your Fractions & Decimals topical assessment has been marked: 80% (PASS). Check your performance charts!$es$, $es$grade$es$, 4, $es$normal$es$, $es$quiz_results$es$, $es$2026-09-30T14:15:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, null),
  ($es$notif-ann-school$es$, $es$Official Directive: Term 3 Mid-Term Clinic$es$, $es$Academic clinic and consultative meetings will take place on Friday, Oct 16th. Attendance is mandatory for all academic department staff and parents.$es$, $es$announcement$es$, null, $es$high$es$, null, $es$2026-09-30T09:00:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$all$es$),
  ($es$notif-prt-homework$es$, $es$Learner Academic Milestone: Brian Otieno$es$, $es$Brian has completed 4/5 continuous assessment units for Term 3. Mathematics Grade 4 assignment is due tomorrow.$es$, $es$assignment$es$, null, $es$normal$es$, $es$performance$es$, $es$2026-10-01T07:00:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$parent$es$),
  ($es$notif-prt-gate$es$, $es$Campus Gate Departure Pass Approved$es$, $es$Security Pass #GP-2026-0412 has been validated for Brian Otieno with guardian collection authorized at 12:30 PM.$es$, $es$safety$es$, null, $es$urgent$es$, $es$gate_passes$es$, $es$2026-09-29T10:30:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$parent$es$),
  ($es$notif-tch-submissions$es$, $es$Student Submissions Awaiting Grading$es$, $es$28 learners in Grade 4 Dove have submitted the Agriculture & Nutrition crop harvesting project.$es$, $es$assignment$es$, null, $es$normal$es$, $es$assignments$es$, $es$2026-10-01T06:00:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$teacher$es$),
  ($es$notif-clt-attendance$es$, $es$Daily Class Register Prompt$es$, $es$Please complete and lock the morning attendance register for Grade 4 Dove before 09:00 AM.$es$, $es$system$es$, null, $es$high$es$, $es$class_register$es$, $es$2026-10-01T05:30:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$class_teacher$es$),
  ($es$notif-hod-curriculum$es$, $es$Departmental Schemes of Work Audit$es$, $es$Sciences & Mathematics department syllabus tracking indicates 92% completion across Grade 1 to 9.$es$, $es$announcement$es$, null, $es$normal$es$, $es$syllabus$es$, $es$2026-09-30T11:00:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$hod$es$),
  ($es$notif-dep-ops$es$, $es$Campus Security Alert: 2 Active Pass Outs$es$, $es$Two learners are currently off-campus under authorized medical pass-outs. Return expected before 4:00 PM.$es$, $es$safety$es$, null, $es$high$es$, $es$operations$es$, $es$2026-10-01T06:45:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$deputy_head$es$),
  ($es$notif-dean-exams$es$, $es$Grade 6 KPSEA Simulation Exam Timetable Finalized$es$, $es$Assessment papers for KNEC simulation week have been approved and scheduled for printing.$es$, $es$grade$es$, null, $es$high$es$, $es$assessments$es$, $es$2026-09-29T16:00:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$dean_of_studies$es$),
  ($es$notif-lib-overdue$es$, $es$Library Circulation: 1 Overdue Loan$es$, $es$Book "Chike and the River" (Borrower: Kelvin Kiprop) is 2 days overdue. Auto-reminder sent.$es$, $es$system$es$, null, $es$normal$es$, $es$circulation$es$, $es$2026-09-30T08:15:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$librarian$es$),
  ($es$notif-adm-head$es$, $es$Term 3 Board of Management Dossier Ready$es$, $es$Enrollment analytics and CBC competency reports for the upcoming executive meeting are ready for download.$es$, $es$announcement$es$, null, $es$normal$es$, $es$bom_report$es$, $es$2026-09-28T10:00:00Z$es$, $es$[]$es$::jsonb, $es$tenant-riara$es$, $es$head_teacher$es$);
create index "notifications_school_id_idx" on "edusmart"."notifications" ("school_id");
alter table "edusmart"."notifications" enable row level security;

-- src/data/initialData.ts :: INITIAL_BADGES (8 rows)
drop table if exists "edusmart"."badges" cascade;
create table "edusmart"."badges" (
  "id" text not null,
  "title" text not null,
  "description" text not null,
  "category" text not null,
  "icon_name" text not null,
  "xp_points" bigint not null,
  "date_unlocked" text,
  "unlocked" boolean not null,
  "activity_criteria" text not null,
  "current_progress" bigint not null,
  "target_progress" bigint not null,
  "progress_metric" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."badges" is $es$School data from src/data/initialData.ts export INITIAL_BADGES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."badges" ("id", "title", "description", "category", "icon_name", "xp_points", "date_unlocked", "unlocked", "activity_criteria", "current_progress", "target_progress", "progress_metric", "school_id") values
  ($es$bdg-top-scorer$es$, $es$Top Scorer$es$, $es$Score 100% or achieve top-tier distinction on a curriculum topical assessment quiz.$es$, $es$academic$es$, $es$Trophy$es$, 150, $es$2026-09-30$es$, true, $es$Score 100% on any topical assessment quiz$es$, 1, 1, $es$perfect quiz$es$, $es$tenant-riara$es$),
  ($es$bdg-perfect-attendance$es$, $es$Perfect Attendance$es$, $es$Maintain 100% on-time daily attendance during active term with zero unauthorized gate departures.$es$, $es$attendance$es$, $es$Clock$es$, 100, $es$2026-10-01$es$, true, $es$100% roll-call attendance rate verified across term$es$, 100, 100, $es$%$es$, $es$tenant-riara$es$),
  ($es$bdg-resource-explorer$es$, $es$Resource Explorer$es$, $es$Actively explore curriculum digital assets: read comprehensive notes, listen to teacher audios, and study diagrams.$es$, $es$academic$es$, $es$BookOpen$es$, 120, $es$2026-09-28$es$, true, $es$Study 3 or more CBC curriculum resources (notes, audios, or videos)$es$, 3, 3, $es$resources studied$es$, $es$tenant-riara$es$),
  ($es$bdg-portfolio-artisan$es$, $es$Portfolio Artisan$es$, $es$Upload authentic practical work, science experiments, or creative art evidence to personal CBC E-Portfolio.$es$, $es$practical$es$, $es$Sparkles$es$, 130, $es$2026-09-27$es$, true, $es$Submit 1 or more practical projects to E-Portfolio$es$, 2, 1, $es$projects uploaded$es$, $es$tenant-riara$es$),
  ($es$bdg-digital-citizen$es$, $es$Digital Citizen$es$, $es$Demonstrate exemplary online citizenship with zero disciplinary flags and verified curriculum research.$es$, $es$digital$es$, $es$ShieldCheck$es$, 110, $es$2026-09-29$es$, true, $es$Complete 3 safe curriculum inquiries with clean audit log$es$, 3, 3, $es$clean searches$es$, $es$tenant-riara$es$),
  ($es$bdg-math-whiz$es$, $es$Fractions & Math Whiz$es$, $es$Demonstrated mastery in decimals conversion, fraction operations, and place value reasoning.$es$, $es$academic$es$, $es$Award$es$, 100, $es$2026-09-30$es$, true, $es$Complete Math topical quiz with score >= 80%$es$, 100, 80, $es$% score$es$, $es$tenant-riara$es$),
  ($es$bdg-quick-thinker$es$, $es$Quick Thinker$es$, $es$Complete a timed topical quiz in under half of the allotted time limit with a passing mark.$es$, $es$academic$es$, $es$Zap$es$, 90, null, false, $es$Submit a quiz in under 5 minutes with passing score$es$, 0, 1, $es$timed challenge$es$, $es$tenant-riara$es$),
  ($es$bdg-curious-scientist$es$, $es$Curious Scientist$es$, $es$Complete hands-on investigations in states of matter, plant seed germination, and soil conservation.$es$, $es$academic$es$, $es$Star$es$, 115, null, false, $es$Explore 2 Science video lectures and 2 topical notes$es$, 1, 4, $es$science modules$es$, $es$tenant-riara$es$);
create index "badges_school_id_idx" on "edusmart"."badges" ("school_id");
alter table "edusmart"."badges" enable row level security;

-- src/data/initialData.ts :: INITIAL_PORTFOLIO_ITEMS (3 rows)
drop table if exists "edusmart"."portfolio_items" cascade;
create table "edusmart"."portfolio_items" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "description" text not null,
  "learning_strand" text not null,
  "category" text not null,
  "evidence_url" text not null,
  "reflection" text not null,
  "teacher_feedback" text not null,
  "competency_level" text not null,
  "awarded_points" bigint not null,
  "created_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."portfolio_items" is $es$School data from src/data/initialData.ts export INITIAL_PORTFOLIO_ITEMS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."portfolio_items" ("id", "student_id", "student_name", "grade", "subject", "title", "description", "learning_strand", "category", "evidence_url", "reflection", "teacher_feedback", "competency_level", "awarded_points", "created_at", "school_id") values
  ($es$port-1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Creative Arts$es$, $es$Indigenous Sisal & Reeds Weaving Basket$es$, $es$Constructed a traditional circular storage basket using dyed sisal fibers and dry reed strands found in local environment.$es$, $es$Craft & Indigenous Material Manipulation$es$, $es$Creative Arts & Craft$es$, $es$https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80$es$, $es$I learned how to cross the warp and weft strands evenly so that the basket holds grains without spilling. It required patience and strong finger grip.$es$, $es$Exemplary craftsmanship. Shows deep mastery of geometric symmetry and indigenous Kenyan craft techniques.$es$, $es$Exceeding Expectations$es$, 50, $es$2026-09-26$es$, $es$tenant-riara$es$),
  ($es$port-2$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Integrated Science$es$, $es$Multi-Layer Soil & Sand Water Filtration Unit$es$, $es$Designed and tested a mechanical water purifier using coarse gravel, fine sand, and activated charcoal layers inside a recycled container.$es$, $es$Environmental Conservation & Living Things$es$, $es$Experiment & Science$es$, $es$https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500&auto=format&fit=crop&q=80$es$, $es$Filtered muddy rainwater from the school garden. The first output was slightly cloudy, but running it twice made it clear. Charcoal removed the odor.$es$, $es$Outstanding scientific inquiry. Brian formulated a clear hypothesis and recorded accurate flow-rate observations.$es$, $es$Exceeding Expectations$es$, 60, $es$2026-09-29$es$, $es$tenant-riara$es$),
  ($es$port-3$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Agriculture and Nutrition$es$, $es$Sukuma Wiki Container Garden Growth Log$es$, $es$Planted collard greens in an upcycled sack filled with composted topsoil. Logged daily watering and weekly leaf growth.$es$, $es$Crop Production & Food Security$es$, $es$Project & Model$es$, $es$https://images.unsplash.com/photo-1592417817098-8f3d69103a89?w=500&auto=format&fit=crop&q=80$es$, $es$Practiced vertical gardening because it saves space. Mulching with dry grass helped keep the soil moist during hot afternoons.$es$, $es$Very neat observational drawings and accurate growth measurements over 3 weeks.$es$, $es$Meeting Expectations$es$, 45, $es$2026-09-22$es$, $es$tenant-riara$es$);
create index "portfolio_items_school_id_idx" on "edusmart"."portfolio_items" ("school_id");
alter table "edusmart"."portfolio_items" enable row level security;

-- src/data/initialData.ts :: INITIAL_PERIODIC_REPORTS (4 rows)
drop table if exists "edusmart"."periodic_reports" cascade;
create table "edusmart"."periodic_reports" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "grade" bigint not null,
  "period_type" text not null,
  "period_label" text not null,
  "academic_mean" numeric not null,
  "attendance_rate" numeric not null,
  "quizzes_completed" bigint not null,
  "assignments_turned_in" bigint not null,
  "badges_earned" bigint not null,
  "core_competencies" jsonb not null,
  "key_strengths" text[] not null,
  "support_recommendations" text[] not null,
  "teacher_remarks" text not null,
  "generated_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."periodic_reports" is $es$School data from src/data/initialData.ts export INITIAL_PERIODIC_REPORTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."periodic_reports" ("id", "student_id", "student_name", "grade", "period_type", "period_label", "academic_mean", "attendance_rate", "quizzes_completed", "assignments_turned_in", "badges_earned", "core_competencies", "key_strengths", "support_recommendations", "teacher_remarks", "generated_at", "school_id") values
  ($es$rep-wk-5$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Weekly$es$, $es$Term 3 · Week 5 (Sep 28 - Oct 02, 2026)$es$, 82, 100, 2, 1, 2, $es$[{"name":"Critical Thinking & Problem Solving","level":"Exceeding","notes":"Demonstrated in Fractions subtraction and water filtration model."},{"name":"Digital Literacy","level":"Exceeding","notes":"Consistently navigates topical notes and interactive quizzes independently."},{"name":"Self-Efficacy & Collaboration","level":"Meeting","notes":"Active participation in group discussions during class teacher register review."}]$es$::jsonb, array[$es$Mastered equivalent fractions conversion$es$, $es$Prompt assignment completion with zero lateness$es$, $es$Flawless weekly attendance$es$]::text[], array[$es$Explore extension decimal word problems$es$, $es$Read 2 supplementary readers from the library$es$]::text[], $es$A stellar week of active participation and conceptual breakthroughs. Keep up the high standard.$es$, $es$2026-10-01$es$, $es$tenant-riara$es$),
  ($es$rep-mth-sep$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Monthly$es$, $es$Monthly Progress Digest · September 2026$es$, 81, 98, 6, 4, 4, $es$[{"name":"Communication & Collaboration","level":"Meeting","notes":"Listens respectfully and presents portfolio reflections clearly."},{"name":"Creativity & Imagination","level":"Exceeding","notes":"Produced exceptional basket weaving artifact in Creative Arts."},{"name":"Citizenship","level":"Exceeding","notes":"Strict adherence to campus gate safety and clean classroom principles."}]$es$::jsonb, array[$es$Steady upward trajectory across all 8 Primary learning areas$es$, $es$Rich multi-media portfolio with 3 verified projects$es$, $es$Strong numeracy and spatial reasoning$es$]::text[], array[$es$Encouraged to borrow more English fiction from Mrs. Kamau in the library$es$, $es$Maintain steady practice on pre-algebraic balance puzzles$es$]::text[], $es$Brian has consolidated his position in the top decile of Grade 4 Dove. Highly recommended for academic mentorship honors.$es$, $es$2026-09-30$es$, $es$tenant-riara$es$),
  ($es$rep-trm-3$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Termly$es$, $es$Term 3 Comprehensive CBC Dossier (2026)$es$, 82.5, 98.5, 14, 8, 5, $es$[{"name":"Critical Thinking","level":"Exceeding","notes":"Analyzes multi-step mathematical problems logically."},{"name":"Learning to Learn","level":"Exceeding","notes":"Uses EduSmart AI Tutor constructively to understand incorrect attempts."},{"name":"Environmental Responsibility","level":"Exceeding","notes":"Led sack-gardening and water conservation experiments."}]$es$::jsonb, array[$es$Overall Mean of 82.5% (Exceeding Expectations)$es$, $es$No disciplinary incidents logged this academic term$es$, $es$Consistent e-portfolio submissions across Sciences and Arts$es$]::text[], array[$es$Prepare for Junior School Grade 5 foundational transition challenges$es$, $es$Continue active reading program during school holidays$es$]::text[], $es$Exemplary academic and moral fortitude. A credit to Grade 4 Dove and the school community.$es$, $es$2026-09-30$es$, $es$tenant-riara$es$),
  ($es$rep-ann-2026$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, 4, $es$Annually$es$, $es$Annual Summative Academic Dossier · 2026 Year in Review$es$, 83.2, 99.1, 38, 24, 5, $es$[{"name":"Holistic Competency Achievement","level":"Exceeding","notes":"Satisfies all KICD Grade 4 curriculum strand milestones with distinction."},{"name":"Social & Emotional Wellbeing","level":"Exceeding","notes":"Shows empathy, peer leadership, and respectful communication."}]$es$::jsonb, array[$es$Consistently ranked top 3 in stream throughout Terms 1, 2, and 3$es$, $es$Earned 5 CBC Competency Badges with 500+ XP Points$es$, $es$Full compliance with campus security and digital safe search standards$es$]::text[], array[$es$Clear for promotion to Grade 5 with honors commendation$es$]::text[], $es$A stellar academic year. Brian has proven his capability across both academic theories and practical competencies.$es$, $es$2026-09-30$es$, $es$tenant-riara$es$);
create index "periodic_reports_school_id_idx" on "edusmart"."periodic_reports" ("school_id");
alter table "edusmart"."periodic_reports" enable row level security;

-- src/data/initialData.ts :: INITIAL_EXTERNAL_TOOLS (7 rows)
drop table if exists "edusmart"."external_tools" cascade;
create table "edusmart"."external_tools" (
  "id" text not null,
  "name" text not null,
  "category" text not null,
  "icon" text not null,
  "description" text not null,
  "url" text not null,
  "code" text,
  "badge" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."external_tools" is $es$School data from src/data/initialData.ts export INITIAL_EXTERNAL_TOOLS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."external_tools" ("id", "name", "category", "icon", "description", "url", "code", "badge", "school_id") values
  ($es$ext-meet$es$, $es$Google Meet$es$, $es$virtual_class$es$, $es$Video$es$, $es$Official CBC live interactive audio-video classrooms with scheduled meeting codes.$es$, $es$https://meet.google.com/lookup/edusmart-gr4-dove$es$, $es$edusmart-gr4-dove$es$, $es$Live Classroom$es$, $es$tenant-riara$es$),
  ($es$ext-zoom$es$, $es$Zoom Education$es$, $es$virtual_class$es$, $es$Video$es$, $es$High-definition webinars, parent-teacher conferences, and joint inter-school lectures.$es$, $es$https://zoom.us/j/98471203941$es$, $es$984 7120 3941$es$, $es$Conferences$es$, $es$tenant-riara$es$),
  ($es$ext-classroom$es$, $es$Google Classroom$es$, $es$classroom$es$, $es$School$es$, $es$Coursework submission hub, rubrics sharing, and cloud assignment drive integration.$es$, $es$https://classroom.google.com/c/MzkwODEy$es$, $es$c-gr4-dov$es$, $es$Homework Sync$es$, $es$tenant-riara$es$),
  ($es$ext-forms$es$, $es$Google Forms$es$, $es$assessment$es$, $es$FileText$es$, $es$Formative surveys, student reflection slips, and termly parent feedback questionnaires.$es$, $es$https://docs.google.com/forms/d/e/edusmart-cbc-feedback/viewform$es$, null, $es$Surveys$es$, $es$tenant-riara$es$),
  ($es$ext-kahoot$es$, $es$Kahoot!$es$, $es$assessment$es$, $es$Sparkles$es$, $es$Gamified live competitive trivia challenges for revision and energetic classroom wrap-ups.$es$, $es$https://kahoot.it/?pin=491028$es$, $es$PIN: 491 028$es$, $es$Gamified Trivia$es$, $es$tenant-riara$es$),
  ($es$ext-quizizz$es$, $es$Quizizz$es$, $es$assessment$es$, $es$Award$es$, $es$Self-paced gamified flashcard mastery challenges and asynchronous test drills.$es$, $es$https://quizizz.com/join?gc=829103$es$, $es$CODE: 829 103$es$, $es$Self-Paced Game$es$, $es$tenant-riara$es$),
  ($es$ext-online-library$es$, $es$KICD Digital Library & E-Readers$es$, $es$library$es$, $es$BookOpen$es$, $es$Kenya Institute of Curriculum Development approved digital textbooks and storybooks.$es$, $es$https://kicd.ac.ke/curriculum-materials$es$, null, $es$Approved E-Books$es$, $es$tenant-riara$es$);
create index "external_tools_school_id_idx" on "edusmart"."external_tools" ("school_id");
alter table "edusmart"."external_tools" enable row level security;

-- src/data/initialData.ts :: INITIAL_SEARCH_AUDIT_LOGS (3 rows)
drop table if exists "edusmart"."search_audit_logs" cascade;
create table "edusmart"."search_audit_logs" (
  "id" text not null,
  "user_id" text not null,
  "user_name" text not null,
  "user_role" text not null,
  "grade" bigint not null,
  "search_query" text not null,
  "timestamp" text not null,
  "status" text not null,
  "educational_topic_found" text not null,
  "school_id" text not null,
  "filter_reason" text,
  primary key ("id")
);
comment on table "edusmart"."search_audit_logs" is $es$School data from src/data/initialData.ts export INITIAL_SEARCH_AUDIT_LOGS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."search_audit_logs" ("id", "user_id", "user_name", "user_role", "grade", "search_query", "timestamp", "status", "educational_topic_found", "school_id", "filter_reason") values
  ($es$sch-1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$student$es$, 4, $es$how do plants absorb water in dry areas$es$, $es$2026-10-01T06:15:00Z$es$, $es$safe$es$, $es$Agriculture: Soil Moisture & Crop Adaptations$es$, $es$tenant-riara$es$, null),
  ($es$sch-2$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$student$es$, 4, $es$simplifying fractions with unlike denominators$es$, $es$2026-09-30T15:20:00Z$es$, $es$safe$es$, $es$Mathematics: Fractions Operations$es$, $es$tenant-riara$es$, null),
  ($es$sch-3$es$, $es$usr-stu-kelvin$es$, $es$Kelvin Kiprop$es$, $es$student$es$, 4, $es$unsupervised online action games free play$es$, $es$2026-09-29T11:45:00Z$es$, $es$guided_redirection$es$, $es$Redirected to: EduSmart Gamified CBC Math Challenges & Kahoot$es$, $es$tenant-riara$es$, $es$Non-curriculum leisure search during academic hours$es$);
create index "search_audit_logs_school_id_idx" on "edusmart"."search_audit_logs" ("school_id");
alter table "edusmart"."search_audit_logs" enable row level security;

-- src/data/initialData.ts :: INITIAL_CALENDAR_EVENTS (12 rows)
drop table if exists "edusmart"."calendar_events" cascade;
create table "edusmart"."calendar_events" (
  "id" text not null,
  "title" text not null,
  "description" text not null,
  "category" text not null,
  "term" bigint not null,
  "academic_year" bigint not null,
  "start_date" text not null,
  "end_date" text not null,
  "start_time" text not null,
  "end_time" text not null,
  "target_audience" text not null,
  "venue" text not null,
  "is_important" boolean not null,
  "status" text not null,
  "updated_by" text not null,
  "updated_at" text not null,
  "author_role" text not null,
  "author_name" text not null,
  "school_id" text not null,
  "ticket_type" text,
  "ticket_price" bigint,
  "ticket_currency" text,
  "total_capacity" bigint,
  "tickets_sold" bigint,
  "ticket_perks" text[],
  primary key ("id")
);
comment on table "edusmart"."calendar_events" is $es$School data from src/data/initialData.ts export INITIAL_CALENDAR_EVENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."calendar_events" ("id", "title", "description", "category", "term", "academic_year", "start_date", "end_date", "start_time", "end_time", "target_audience", "venue", "is_important", "status", "updated_by", "updated_at", "author_role", "author_name", "school_id", "ticket_type", "ticket_price", "ticket_currency", "total_capacity", "tickets_sold", "ticket_perks") values
  ($es$cal-1$es$, $es$Term 1 2026 Official Opening Day$es$, $es$School reopens for all Primary (Grades 1-6) and Junior School (Grades 7-9) learners. Assembly at 7:45 AM.$es$, $es$term_dates$es$, 1, 2026, $es$2026-01-06$es$, $es$2026-01-06$es$, $es$07:30$es$, $es$16:00$es$, $es$All School$es$, $es$Main School Assembly Quadrangle$es$, true, $es$completed$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-01-05$es$, $es$head_teacher$es$, $es$Dr. Arthur Kiprotich (Head Teacher)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-2$es$, $es$Term 1 Mid-Term Continuous Assessment Tests (CATs)$es$, $es$Mid-term formative CBC evaluation across all learning areas. Timetable issued to class teachers.$es$, $es$exams$es$, 1, 2026, $es$2026-02-16$es$, $es$2026-02-19$es$, $es$08:00$es$, $es$15:30$es$, $es$All School$es$, $es$Grade Classrooms & CBC Labs$es$, true, $es$completed$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-02-10$es$, $es$dean_of_studies$es$, $es$Mr. David Mutua (Dean of Studies)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-3$es$, $es$Term 1 Mid-Term Recess Break$es$, $es$Official Ministry of Education 4-day mid-term recess break for all students and teaching staff.$es$, $es$holiday$es$, 1, 2026, $es$2026-02-20$es$, $es$2026-02-23$es$, $es$00:00$es$, $es$23:59$es$, $es$All School$es$, $es$Campus Closed$es$, false, $es$completed$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-02-18$es$, $es$deputy_head$es$, $es$Mrs. Beatrice Wanjiku (Deputy Head)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-4$es$, $es$Annual Inter-House Athletics & CBC Talent Gala$es$, $es$Inter-house track and field sports day, gymnastics showcase, and traditional arts competition. Food stalls & live band.$es$, $es$co_curricular$es$, 1, 2026, $es$2026-03-12$es$, $es$2026-03-13$es$, $es$08:30$es$, $es$17:00$es$, $es$All School$es$, $es$School Sports Pavilion & Grounds$es$, true, $es$completed$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-03-05$es$, $es$deputy_head$es$, $es$Mrs. Beatrice Wanjiku (Deputy Head)$es$, $es$tenant-riara$es$, $es$paid$es$, 500, $es$KES$es$, 500, 420, array[$es$Pavilion Seating$es$, $es$Sports Gala Programme$es$, $es$Refreshments Voucher$es$]::text[]),
  ($es$cal-5$es$, $es$Term 1 End-of-Term Summative Evaluations$es$, $es$School-wide end-of-term examinations and practical assessments for Grade 1 through Grade 9.$es$, $es$exams$es$, 1, 2026, $es$2026-03-23$es$, $es$2026-03-27$es$, $es$08:00$es$, $es$15:30$es$, $es$All School$es$, $es$Examination Rooms & Science Labs$es$, true, $es$ongoing$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-03-18$es$, $es$dean_of_studies$es$, $es$Mr. David Mutua (Dean of Studies)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-6$es$, $es$Parent-Teacher Consultation & Academic Clinic$es$, $es$One-on-one parent conferencing with subject teachers and class tutors. Collection of Term 1 progress dossiers.$es$, $es$parents$es$, 1, 2026, $es$2026-04-01$es$, $es$2026-04-01$es$, $es$08:30$es$, $es$16:00$es$, $es$Parents$es$, $es$School Multipurpose Hall$es$, true, $es$upcoming$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-03-25$es$, $es$school_admin_staff$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-7$es$, $es$Term 1 Official Closing Day & Vacation Commences$es$, $es$Release of learners for 3-week April vacation. Termly report cards available on parent portal.$es$, $es$term_dates$es$, 1, 2026, $es$2026-04-03$es$, $es$2026-04-03$es$, $es$08:00$es$, $es$12:30$es$, $es$All School$es$, $es$Assembly Ground$es$, true, $es$upcoming$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-03-25$es$, $es$head_teacher$es$, $es$Dr. Arthur Kiprotich (Head Teacher)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-8$es$, $es$Term 2 2026 Opening Day (14 Weeks)$es$, $es$Commencement of Term 2 academic session. All boarders and day scholars report by 7:30 AM.$es$, $es$term_dates$es$, 2, 2026, $es$2026-04-27$es$, $es$2026-04-27$es$, $es$07:30$es$, $es$16:00$es$, $es$All School$es$, $es$Main Campus$es$, true, $es$upcoming$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$2026-03-25$es$, $es$school_admin_staff$es$, $es$Mrs. Sarah Cherono (Registrar)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-9$es$, $es$Annual CBC Science Fair & Robotics Expo 2026$es$, $es$Interactive exhibition of STEM prototypes, coding projects, hydroponics displays, and robotics showdown by Grades 4 to 9 learners.$es$, $es$academic$es$, 2, 2026, $es$2026-05-15$es$, $es$2026-05-16$es$, $es$09:00$es$, $es$16:30$es$, $es$All School$es$, $es$Science Complex & Innovation Atrium$es$, true, $es$upcoming$es$, $es$Mr. David Mutua (Dean of Studies)$es$, $es$2026-03-29$es$, $es$dean_of_studies$es$, $es$Mr. David Mutua (Dean of Studies)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-10$es$, $es$Annual School Musical & Drama Gala: "Echoes of the Savannah"$es$, $es$Spectacular evening theatrical performance by the EduSmart Drama & Music Ensemble. Featuring traditional instrumentalists, choir, and orchestra.$es$, $es$co_curricular$es$, 2, 2026, $es$2026-05-29$es$, $es$2026-05-29$es$, $es$18:00$es$, $es$21:30$es$, $es$Parents$es$, $es$Main School Auditorium & Stage$es$, true, $es$upcoming$es$, $es$Dr. Arthur Kiprotich (Head Teacher)$es$, $es$2026-03-29$es$, $es$head_teacher$es$, $es$Dr. Arthur Kiprotich (Head Teacher)$es$, $es$tenant-riara$es$, $es$paid$es$, 750, $es$KES$es$, 350, 210, array[$es$Reserved Auditorium Seat$es$, $es$Full Musical Playbill Booklet$es$, $es$Evening Cocktail & Hors d'oeuvres$es$]::text[]),
  ($es$cal-11$es$, $es$Founders' Day & Alumni Benefit Gala Dinner$es$, $es$Black-tie dinner celebrating EduSmart 15-year excellence milestone. Fundraiser for the Digital Library & CBC STEM Scholarship Fund.$es$, $es$special_event$es$, 2, 2026, $es$2026-06-19$es$, $es$2026-06-19$es$, $es$18:30$es$, $es$22:30$es$, $es$Public & Community$es$, $es$Grand Safari Ballroom & Lawn$es$, true, $es$upcoming$es$, $es$Mrs. Beatrice Wanjiku (Deputy Head)$es$, $es$2026-03-30$es$, $es$deputy_head$es$, $es$Mrs. Beatrice Wanjiku (Deputy Head)$es$, $es$tenant-riara$es$, null, null, null, null, null, null),
  ($es$cal-12$es$, $es$Inter-Clubs Scouting & Outdoor Camporee$es$, $es$3-day outdoor skills, pioneering craft, environmental conservation badges, and campfire jamboree.$es$, $es$co_curricular$es$, 2, 2026, $es$2026-07-10$es$, $es$2026-07-12$es$, $es$08:00$es$, $es$17:00$es$, $es$All School$es$, $es$Oloolua Forest Camp Grounds$es$, false, $es$upcoming$es$, $es$Coach Benjamin Omwenga$es$, $es$2026-04-02$es$, $es$deputy_head$es$, $es$Mrs. Beatrice Wanjiku (Deputy Head)$es$, $es$tenant-riara$es$, $es$free$es$, 0, $es$KES$es$, 300, 145, array[$es$Official Camporee Scarf$es$, $es$Merit Badge Assessment Slip$es$]::text[]);
create index "calendar_events_school_id_idx" on "edusmart"."calendar_events" ("school_id");
alter table "edusmart"."calendar_events" enable row level security;

-- src/data/initialData.ts :: INITIAL_EVENT_TICKETS (3 rows)
drop table if exists "edusmart"."event_tickets" cascade;
create table "edusmart"."event_tickets" (
  "id" text not null,
  "ticket_code" text not null,
  "event_id" text not null,
  "event_title" text not null,
  "event_date" text not null,
  "event_venue" text not null,
  "purchaser_name" text not null,
  "purchaser_email" text,
  "purchaser_phone" text,
  "purchaser_role" text not null,
  "quantity" bigint not null,
  "ticket_type" text not null,
  "unit_price" bigint not null,
  "total_amount" bigint not null,
  "currency" text not null,
  "payment_status" text not null,
  "payment_method" text not null,
  "mpesa_reference" text,
  "purchased_at" text not null,
  "notes" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."event_tickets" is $es$School data from src/data/initialData.ts export INITIAL_EVENT_TICKETS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."event_tickets" ("id", "ticket_code", "event_id", "event_title", "event_date", "event_venue", "purchaser_name", "purchaser_email", "purchaser_phone", "purchaser_role", "quantity", "ticket_type", "unit_price", "total_amount", "currency", "payment_status", "payment_method", "mpesa_reference", "purchased_at", "notes", "school_id") values
  ($es$tkt-init-01$es$, $es$TKT-2026-8492$es$, $es$cal-10$es$, $es$Annual School Musical & Drama Gala: "Echoes of the Savannah"$es$, $es$2026-05-29$es$, $es$Main School Auditorium & Stage$es$, $es$Grace Otieno (Parent)$es$, $es$parent.otieno@edusmart.ac.ke$es$, $es$+254 722 123 456$es$, $es$parent$es$, 2, $es$paid$es$, 750, 1500, $es$KES$es$, $es$completed$es$, $es$M-Pesa Express$es$, $es$QHG829XLP4$es$, $es$2026-03-30 14:20$es$, $es$2 Reserved Seats (Rows C12-C13). Refreshment vouchers issued.$es$, $es$tenant-riara$es$),
  ($es$tkt-init-02$es$, $es$TKT-2026-3108$es$, $es$cal-4$es$, $es$Annual Inter-House Athletics & CBC Talent Gala$es$, $es$2026-03-12$es$, $es$School Sports Pavilion & Grounds$es$, $es$Grace Otieno (Parent)$es$, $es$parent.otieno@edusmart.ac.ke$es$, $es$+254 722 123 456$es$, $es$parent$es$, 1, $es$paid$es$, 500, 500, $es$KES$es$, $es$completed$es$, $es$M-Pesa Express$es$, $es$RB7392MNQ1$es$, $es$2026-03-10 09:45$es$, $es$Pass for 1 attendee + Sports Gala Programme$es$, $es$tenant-riara$es$),
  ($es$tkt-init-03$es$, $es$TKT-2026-1044$es$, $es$cal-12$es$, $es$Inter-Clubs Scouting & Outdoor Camporee$es$, $es$2026-07-10$es$, $es$Oloolua Forest Camp Grounds$es$, $es$Brian Otieno (Student)$es$, null, null, $es$student$es$, 1, $es$free$es$, 0, 0, $es$KES$es$, $es$free_granted$es$, $es$Free Pass Voucher$es$, null, $es$2026-04-03 11:15$es$, $es$Complimentary Scout admission pass$es$, $es$tenant-riara$es$);
create index "event_tickets_school_id_idx" on "edusmart"."event_tickets" ("school_id");
alter table "edusmart"."event_tickets" enable row level security;

-- src/data/initialData.ts :: INITIAL_ASSESSMENT_RECORDS (7 rows)
drop table if exists "edusmart"."assessment_records" cascade;
create table "edusmart"."assessment_records" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "term" bigint not null,
  "academic_year" bigint not null,
  "assessment_cycle" text not null,
  "subject_results" jsonb not null,
  "total_score" bigint not null,
  "average_score" numeric not null,
  "total_cbc_points" bigint not null,
  "average_cbc_points" numeric not null,
  "overall_attainment_level" text not null,
  "rank_in_stream" bigint not null,
  "total_in_stream" bigint not null,
  "dean_published" boolean not null,
  "published_at" text not null,
  "published_by" text not null,
  "class_teacher_remarks" text not null,
  "dean_remarks" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."assessment_records" is $es$School data from src/data/initialData.ts export INITIAL_ASSESSMENT_RECORDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."assessment_records" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "term", "academic_year", "assessment_cycle", "subject_results", "total_score", "average_score", "total_cbc_points", "average_cbc_points", "overall_attainment_level", "rank_in_stream", "total_in_stream", "dean_published", "published_at", "published_by", "class_teacher_remarks", "dean_remarks", "school_id") values
  ($es$asmt-brian-midterm-t1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, 1, 2026, $es$Mid-Term Evaluation$es$, $es$[{"subject":"Mathematics","score":94,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Superb grasp of fractions and decimals","teacherName":"Mr. David Kiprono"},{"subject":"English","score":88,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Expressive vocabulary and fluent reading","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":85,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Umahiri mzuri wa sarufi na kuandika insha","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":92,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Inquisitive scientific thinker, neat diagrams","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","score":84,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Active engagement in school farm projects","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","score":82,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Sound knowledge of Kenyan communities","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","score":90,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Strong moral reflection and active discussions","teacherName":"Pastor James"},{"subject":"Creative Arts","score":86,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Talented visual arts sketching and rhythmics","teacherName":"Ms. Achieng"}]$es$::jsonb, 701, 87.6, 32, 4, $es$Exceeding Expectations$es$, 1, 42, true, $es$2026-03-01 10:00$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Brian maintains exemplary standards in both core competencies and discipline.$es$, $es$Certified and endorsed by Dean of Studies Directorate.$es$, $es$tenant-riara$es$),
  ($es$asmt-brian-cat1-t1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, 1, 2026, $es$CAT 1$es$, $es$[{"subject":"Mathematics","score":90,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Very accurate in multiplication tables","teacherName":"Mr. David Kiprono"},{"subject":"English","score":86,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Well-structured narrative writing","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":82,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Lugha sanifu na matamshi bora","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":89,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Understands human body systems well","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","score":80,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Good plant preservation skills","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","score":79,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Solid understanding of local geography","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","score":88,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Respectful and diligent pupil","teacherName":"Pastor James"},{"subject":"Creative Arts","score":84,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Creative color harmony","teacherName":"Ms. Achieng"}]$es$::jsonb, 678, 84.8, 31, 3.9, $es$Exceeding Expectations$es$, 1, 42, true, $es$2026-02-05 14:00$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Outstanding start to Term 1 assessments.$es$, $es$Approved for official progress tracking.$es$, $es$tenant-riara$es$),
  ($es$asmt-brian-endterm-t1$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, 1, 2026, $es$End-Term Summative$es$, $es$[{"subject":"Mathematics","score":95,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Distinction in arithmetic problem-solving","teacherName":"Mr. David Kiprono"},{"subject":"English","score":89,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Exemplary essay and comprehension","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":87,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Kusoma na kuandika kwa ufasaha","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":93,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Practical experiment work was stellar","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","score":85,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Exceptional kitchen garden practical","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","score":86,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Critical thinking in civic awareness","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","score":92,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Exemplary moral fortitude","teacherName":"Pastor James"},{"subject":"Creative Arts","score":88,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Creative pottery and painting design","teacherName":"Ms. Achieng"}]$es$::jsonb, 715, 89.4, 32, 4, $es$Exceeding Expectations$es$, 1, 42, true, $es$2026-03-28 16:30$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Outstanding term achievement. Brian has exceeded expectations in all learning areas.$es$, $es$Officially published and archived for Grade 4 cohort.$es$, $es$tenant-riara$es$),
  ($es$asmt-amina-midterm-t1$es$, $es$usr-stu-amina$es$, $es$Amina Hassan$es$, $es$ADM/2023/0413$es$, 4, $es$Dove$es$, 1, 2026, $es$Mid-Term Evaluation$es$, $es$[{"subject":"Mathematics","score":88,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Solid mental calculation skills","teacherName":"Mr. David Kiprono"},{"subject":"English","score":92,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Outstanding reading comprehension","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":90,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Ufasaha wa hali ya juu katika lugha","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":86,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Well organized scientific records","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","score":81,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Knows nutritional values very well","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","score":87,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Active participation in history topics","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","score":94,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Exceptional Islamic religious study mastery","teacherName":"Ustadh Ali"},{"subject":"Creative Arts","score":85,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Creative fabric patterns and singing","teacherName":"Ms. Achieng"}]$es$::jsonb, 703, 87.9, 32, 4, $es$Exceeding Expectations$es$, 2, 42, true, $es$2026-03-01 10:00$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Amina demonstrates high intellectual curiosity and exemplary manners.$es$, $es$Certified and endorsed by Dean of Studies Directorate.$es$, $es$tenant-riara$es$),
  ($es$asmt-faith-midterm-t1$es$, $es$usr-stu-faith$es$, $es$Faith Ndunge$es$, $es$ADM/2023/0415$es$, 4, $es$Dove$es$, 1, 2026, $es$Mid-Term Evaluation$es$, $es$[{"subject":"Mathematics","score":76,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Good effort, needs practice on division","teacherName":"Mr. David Kiprono"},{"subject":"English","score":82,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Good spelling and grammar","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":78,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Kazi nzuri, ongeza juhudi katika ushairi","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":79,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Good understanding of habitats","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","score":75,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Keen on poultry farming projects","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","score":77,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Shows good interest in heritage","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","score":83,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Very attentive in CRE classes","teacherName":"Pastor James"},{"subject":"Creative Arts","score":80,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Enthusiastic dancer and vocalist","teacherName":"Ms. Achieng"}]$es$::jsonb, 630, 78.8, 27, 3.4, $es$Meeting Expectations$es$, 8, 42, true, $es$2026-03-01 10:00$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Faith is making steady, commendable progress across all subjects.$es$, $es$Certified and endorsed by Dean of Studies Directorate.$es$, $es$tenant-riara$es$),
  ($es$asmt-peter-midterm-t1$es$, $es$usr-stu-peter$es$, $es$Peter Kamau$es$, $es$ADM/2023/0416$es$, 4, $es$Dove$es$, 1, 2026, $es$Mid-Term Evaluation$es$, $es$[{"subject":"Mathematics","score":80,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Great improvement in geometric shapes","teacherName":"Mr. David Kiprono"},{"subject":"English","score":78,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Good comprehension reading","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":74,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Anasoma vizuri, azidishe mazoezi ya insha","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":83,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Very keen in practical science lessons","teacherName":"Mr. David Kiprono"},{"subject":"Agriculture and Nutrition","score":85,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Outstanding vegetable weeding and caring","teacherName":"Mr. Peter Mutua"},{"subject":"Social Studies","score":76,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Understands leadership in county structures","teacherName":"Mrs. Wanjiru"},{"subject":"Religious Education","score":82,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Consistent ethical reflection","teacherName":"Pastor James"},{"subject":"Creative Arts","score":88,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Exceptional craftsmanship in modeling clay","teacherName":"Ms. Achieng"}]$es$::jsonb, 646, 80.8, 29, 3.6, $es$Exceeding Expectations$es$, 6, 42, true, $es$2026-03-01 10:00$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Peter is disciplined and very active in hands-on activities.$es$, $es$Certified and endorsed by Dean of Studies Directorate.$es$, $es$tenant-riara$es$),
  ($es$asmt-kevin-midterm-t1$es$, $es$usr-stu-kevin$es$, $es$Kevin Mutua$es$, $es$ADM/2021/0189$es$, 8, $es$Mara$es$, 1, 2026, $es$Mid-Term Evaluation$es$, $es$[{"subject":"Mathematics","score":82,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Strong algebraic reasoning","teacherName":"Mr. David Kiprono"},{"subject":"English","score":85,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Critical essay writing distinction","teacherName":"Mrs. Florence Akinyi"},{"subject":"Kiswahili","score":80,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Uchambuzi mzuri wa tamthilia na fasihi","teacherName":"Mwalimu Omwamba"},{"subject":"Integrated Science","score":88,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Outstanding physics and chemistry lab practicals","teacherName":"Dr. Mercy Mwangi"},{"subject":"Social Studies","score":81,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Well-researched African governance topic","teacherName":"Mr. Peter Ochieng"},{"subject":"Agriculture","score":79,"attainmentLevel":"Meeting Expectations","cbcPoints":3,"remarks":"Demonstrates modern livestock keeping skills","teacherName":"Mr. Peter Mutua"},{"subject":"Pre-Technical Studies","score":86,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Technical drawing precision and circuit testing","teacherName":"Eng. Kamau"},{"subject":"Business Studies","score":84,"attainmentLevel":"Exceeding Expectations","cbcPoints":4,"remarks":"Sound financial accounting and enterprise ideas","teacherName":"Mrs. Chebet"}]$es$::jsonb, 665, 83.1, 31, 3.9, $es$Exceeding Expectations$es$, 3, 38, true, $es$2026-03-01 10:00$es$, $es$Ms. Beatrice Wanjiku (Dean of Studies)$es$, $es$Kevin is focused, articulate, and well-prepared for KPSEA senior transition.$es$, $es$Certified and endorsed by Dean of Studies Directorate.$es$, $es$tenant-riara$es$);
create index "assessment_records_school_id_idx" on "edusmart"."assessment_records" ("school_id");
alter table "edusmart"."assessment_records" enable row level security;

-- src/data/initialData.ts :: INITIAL_TEACHER_UPLOAD_ASSIGNMENTS (4 rows)
drop table if exists "edusmart"."teacher_upload_assignments" cascade;
create table "edusmart"."teacher_upload_assignments" (
  "id" text not null,
  "teacher_id" text not null,
  "teacher_name" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "subject" text not null,
  "assessment_cycle" text not null,
  "term" bigint not null,
  "academic_year" bigint not null,
  "assigned_by" text not null,
  "assigned_by_role" text not null,
  "assigned_date" text not null,
  "due_date" text not null,
  "status" text not null,
  "instructions" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."teacher_upload_assignments" is $es$School data from src/data/initialData.ts export INITIAL_TEACHER_UPLOAD_ASSIGNMENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."teacher_upload_assignments" ("id", "teacher_id", "teacher_name", "grade", "stream", "subject", "assessment_cycle", "term", "academic_year", "assigned_by", "assigned_by_role", "assigned_date", "due_date", "status", "instructions", "school_id") values
  ($es$asgn-01$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, 4, $es$Dove$es$, $es$Mathematics$es$, $es$Continuous Assessment (CATs)$es$, 1, 2026, $es$Ms. Beatrice Wanjiku$es$, $es$dean_of_studies$es$, $es$2026-02-10$es$, $es$2026-02-25$es$, $es$submitted$es$, $es$Upload CAT 1 and CAT 2 strand results for Grade 4 Dove. Verify attainment levels (EE, ME, AE, BE) before submitting.$es$, $es$tenant-riara$es$),
  ($es$asgn-02$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, 4, $es$Dove$es$, $es$Integrated Science$es$, $es$Mid-Term Evaluation$es$, 1, 2026, $es$Ms. Beatrice Wanjiku$es$, $es$dean_of_studies$es$, $es$2026-02-15$es$, $es$2026-03-01$es$, $es$published$es$, $es$Enter practical experiment rubrics and formative written evaluation marks for whole class.$es$, $es$tenant-riara$es$),
  ($es$asgn-03$es$, $es$usr-teach-akinyi$es$, $es$Mrs. Florence Akinyi$es$, 8, $es$Mara$es$, $es$English$es$, $es$Mid-Term Evaluation$es$, 1, 2026, $es$Mrs. Beatrice Wanjiku$es$, $es$deputy_head$es$, $es$2026-02-15$es$, $es$2026-03-01$es$, $es$published$es$, $es$Compile oral literature, reading comprehension, and grammar attainment scores.$es$, $es$tenant-riara$es$),
  ($es$asgn-04$es$, $es$usr-teach-kiprono$es$, $es$Mr. David Kiprono$es$, 4, $es$all$es$, $es$Mathematics$es$, $es$End-Term Summative$es$, 1, 2026, $es$Ms. Beatrice Wanjiku$es$, $es$dean_of_studies$es$, $es$2026-03-20$es$, $es$2026-04-05$es$, $es$in_progress$es$, $es$Compile whole-grade summative marks across Dove, Eagle, Hawk streams for Term 1 closing.$es$, $es$tenant-riara$es$);
create index "teacher_upload_assignments_school_id_idx" on "edusmart"."teacher_upload_assignments" ("school_id");
alter table "edusmart"."teacher_upload_assignments" enable row level security;

-- src/data/initialData.ts :: INITIAL_PARENT_COMMUNICATIONS (4 rows)
drop table if exists "edusmart"."parent_communications" cascade;
create table "edusmart"."parent_communications" (
  "id" text not null,
  "title" text not null,
  "message" text not null,
  "channel" text not null,
  "target_audience" text not null,
  "sent_by" text not null,
  "sender_role" text not null,
  "date_sent" text not null,
  "recipient_count" bigint not null,
  "delivery_status" text not null,
  "category" text not null,
  "school_id" text not null,
  "target_grade" bigint,
  primary key ("id")
);
comment on table "edusmart"."parent_communications" is $es$School data from src/data/initialData.ts export INITIAL_PARENT_COMMUNICATIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."parent_communications" ("id", "title", "message", "channel", "target_audience", "sent_by", "sender_role", "date_sent", "recipient_count", "delivery_status", "category", "school_id", "target_grade") values
  ($es$pcom-1$es$, $es$Term 1 Academic Clinic & Parent Consultation Notice$es$, $es$Dear Parents & Guardians, You are cordially invited to the Term 1 Academic Clinic on Wednesday, April 1, 2026, from 8:30 AM to 3:30 PM. Class teachers and subject specialists will be available for individual progress consultations.$es$, $es$Portal Circular$es$, $es$All Parents$es$, $es$Mrs. Sarah Cherono$es$, $es$School Administration & Registrar$es$, $es$2026-03-28 09:15 AM$es$, 680, $es$Delivered$es$, $es$Academic Clinic$es$, $es$tenant-riara$es$, null),
  ($es$pcom-2$es$, $es$Grade 6 & Grade 9 KPSEA / KJSEA Registration Verification$es$, $es$Important reminder for Grade 6 and Grade 9 parents: kindly verify your learner NEMIS/assessment details and birth certificate numbers with the School Registrar before Friday, April 3.$es$, $es$SMS$es$, $es$Specific Grade$es$, $es$Mrs. Sarah Cherono$es$, $es$School Administration & Registrar$es$, $es$2026-03-26 11:30 AM$es$, 165, $es$Delivered$es$, $es$General Notice$es$, $es$tenant-riara$es$, 6),
  ($es$pcom-3$es$, $es$Term 1 Fee Clearance & Term 2 Pre-Invoicing Advisory$es$, $es$Dear Esteemed Parents, thank you for your ongoing partnership. Kindly ensure any outstanding termly activity and meals balance is cleared by March 31. Term 2 fee statements are now accessible on the parent portal.$es$, $es$Email$es$, $es$All Parents$es$, $es$Mrs. Sarah Cherono$es$, $es$School Administration & Registrar$es$, $es$2026-03-24 02:45 PM$es$, 680, $es$Delivered$es$, $es$Fee Advisory$es$, $es$tenant-riara$es$, null),
  ($es$pcom-4$es$, $es$Annual Co-Curricular Gala Transport & Uniform Protocol$es$, $es$Learners taking part in the Athletics Gala are requested to report in their official house sports colors. School bus pick-up routes will operate 30 minutes earlier at 6:15 AM.$es$, $es$Portal Circular$es$, $es$All Parents$es$, $es$Mrs. Sarah Cherono$es$, $es$School Administration & Registrar$es$, $es$2026-03-10 08:00 AM$es$, 680, $es$Delivered$es$, $es$School Event$es$, $es$tenant-riara$es$, null);
create index "parent_communications_school_id_idx" on "edusmart"."parent_communications" ("school_id");
alter table "edusmart"."parent_communications" enable row level security;

-- src/data/initialData.ts :: INITIAL_EXAM_TIMETABLE (6 rows)
drop table if exists "edusmart"."exam_timetable" cascade;
create table "edusmart"."exam_timetable" (
  "id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "exam_type" text not null,
  "exam_date" text not null,
  "start_time" text not null,
  "end_time" text not null,
  "duration_minutes" bigint not null,
  "room" text not null,
  "invigilator_name" text not null,
  "instructions" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."exam_timetable" is $es$School data from src/data/initialData.ts export INITIAL_EXAM_TIMETABLE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."exam_timetable" ("id", "grade", "subject", "exam_type", "exam_date", "start_time", "end_time", "duration_minutes", "room", "invigilator_name", "instructions", "school_id") values
  ($es$ett-1$es$, 4, $es$Mathematics$es$, $es$End-Term Summative$es$, $es$2026-03-23$es$, $es$08:30 AM$es$, $es$10:00 AM$es$, 90, $es$Hall A (Falcon & Dove)$es$, $es$Mr. David Kiprono$es$, $es$Bring mathematical sets, 30cm ruler, pencils, and erasers. No electronic calculators permitted.$es$, $es$tenant-riara$es$),
  ($es$ett-2$es$, 4, $es$English$es$, $es$End-Term Summative$es$, $es$2026-03-23$es$, $es$11:00 AM$es$, $es$12:30 PM$es$, 90, $es$Hall A (Falcon & Dove)$es$, $es$Mrs. Joyce Waweru$es$, $es$Section A: Reading Comprehension & Grammar; Section B: Composition Writing.$es$, $es$tenant-riara$es$),
  ($es$ett-3$es$, 4, $es$Integrated Science$es$, $es$End-Term Summative$es$, $es$2026-03-24$es$, $es$08:30 AM$es$, $es$10:00 AM$es$, 90, $es$Hall A (Falcon & Dove)$es$, $es$Mr. Charles Omondi$es$, $es$Includes practical laboratory observation items and environmental science diagrams.$es$, $es$tenant-riara$es$),
  ($es$ett-4$es$, 4, $es$Kiswahili$es$, $es$End-Term Summative$es$, $es$2026-03-24$es$, $es$11:00 AM$es$, $es$12:30 PM$es$, 90, $es$Hall A (Falcon & Dove)$es$, $es$Mr. Peter Mutua$es$, $es$Karatasi ya 1: Lugha na Ufahamu; Karatasi ya 2: Insha.$es$, $es$tenant-riara$es$),
  ($es$ett-5$es$, 8, $es$Mathematics$es$, $es$End-Term Summative$es$, $es$2026-03-23$es$, $es$08:00 AM$es$, $es$10:00 AM$es$, 120, $es$Junior Lab Block 2 (Mara & Athi)$es$, $es$Dr. Mercy Mwangi$es$, $es$Mathematical tables provided. Ensure complete step-by-step working is shown.$es$, $es$tenant-riara$es$),
  ($es$ett-6$es$, 8, $es$Integrated Science$es$, $es$End-Term Summative$es$, $es$2026-03-24$es$, $es$08:00 AM$es$, $es$10:00 AM$es$, 120, $es$Junior Science Lab 1$es$, $es$Mr. Peter Ochieng$es$, $es$Chemistry and Physics sections require protective lab coats.$es$, $es$tenant-riara$es$);
create index "exam_timetable_school_id_idx" on "edusmart"."exam_timetable" ("school_id");
alter table "edusmart"."exam_timetable" enable row level security;

-- src/data/initialData.ts :: INITIAL_SANATORIUM_RECORDS (5 rows)
drop table if exists "edusmart"."sanatorium_records" cascade;
create table "edusmart"."sanatorium_records" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "parent_name" text not null,
  "parent_phone" text not null,
  "nurse_in_charge" text not null,
  "nurse_license_no" text not null,
  "nurse_staff_no" text not null,
  "date" text not null,
  "arrival_time" text not null,
  "departure_time" text not null,
  "visit_reason" text not null,
  "symptoms" text[] not null,
  "vital_signs" jsonb not null,
  "treatment_administered" text not null,
  "disposition" text not null,
  "bed_number" text,
  "recommendations" text not null,
  "activity_restrictions" text not null,
  "follow_up_plan" text not null,
  "parent_notified" boolean not null,
  "parent_notification_notes" text not null,
  "gate_pass_id" text,
  "recorded_at" text not null,
  "recorded_by" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."sanatorium_records" is $es$School data from src/data/initialData.ts export INITIAL_SANATORIUM_RECORDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."sanatorium_records" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "parent_name", "parent_phone", "nurse_in_charge", "nurse_license_no", "nurse_staff_no", "date", "arrival_time", "departure_time", "visit_reason", "symptoms", "vital_signs", "treatment_administered", "disposition", "bed_number", "recommendations", "activity_restrictions", "follow_up_plan", "parent_notified", "parent_notification_notes", "gate_pass_id", "recorded_at", "recorded_by", "school_id") values
  ($es$san-1$es$, $es$usr-stu-sharon$es$, $es$Sharon Cherono$es$, $es$ADM/2021/0812$es$, 8, $es$Mara$es$, $es$Grace Cherono (Mother)$es$, $es$+254 711 445 892$es$, $es$Sister Grace Wambui, RN$es$, $es$NCK/RN-58921$es$, $es$SAN/002$es$, $es$2026-10-02$es$, $es$10:15 AM$es$, $es$11:45 AM$es$, $es$High febrile illness with chills, dizziness, and body weakness$es$, array[$es$High Fever$es$, $es$Headache$es$, $es$Chills$es$, $es$Nausea$es$]::text[], $es${"temperature":38.8,"pulseRate":94,"bloodPressure":"110/72","respiratoryRate":20}$es$::jsonb, $es$Paracetamol 500mg oral stat, cold sponge compression applied to forehead and axillae, oral rehydration solution (ORS) 300ml administered.$es$, $es$signed_out_to_parent$es$, $es$Observation Bed #01$es$, $es$Patient has high-grade fever unresponsive to mild antipyretics. Signed out to mother Grace Cherono for full laboratory malaria and typhoid diagnostic workup at Nairobi Hospital. 3 days medical leave recommended.$es$, $es$Complete bed rest; exempt from physical education, practicals, and evening preps until Monday.$es$, $es$Parent to present medical discharge summary upon return to school.$es$, true, $es$Mother contacted at 10:40 AM; arrived at campus gate at 11:30 AM. Gate Pass #GP-8M-3310 dispatched.$es$, $es$gep-2$es$, $es$2026-10-02T10:15:00$es$, $es$Sister Grace Wambui, RN$es$, $es$tenant-riara$es$),
  ($es$san-2$es$, $es$usr-stu-kelvin$es$, $es$Kelvin Kiprop$es$, $es$ADM/2023/0414$es$, 4, $es$Dove$es$, $es$Dr. Joseph Kiprop (Father)$es$, $es$+254 722 891 042$es$, $es$Sister Grace Wambui, RN$es$, $es$NCK/RN-58921$es$, $es$SAN/002$es$, $es$2026-10-02$es$, $es$08:45 AM$es$, $es$09:30 AM$es$, $es$Sports abrasion on right knee and contusion sustained during morning physical warm-up$es$, array[$es$Superficial laceration$es$, $es$Mild knee swelling$es$, $es$Localized pain$es$]::text[], $es${"temperature":36.8,"pulseRate":78,"bloodPressure":"105/68","respiratoryRate":18}$es$::jsonb, $es$Antiseptic cleaning with saline, povidone-iodine dressing applied, sterile gauze bandage wrapped. Cold ice compression applied for 15 minutes.$es$, $es$treated_returned_to_class$es$, null, $es$Wound is clean and sterile dressing is intact. Keep dressing dry. Safe to attend all academic lessons. Excused from high-impact running and football for 48 hours.$es$, $es$No field sports or running until wound re-evaluated on Monday.$es$, $es$Report back to sanatorium on Monday 08:30 AM for dressing review.$es$, true, $es$SMS notification sent via EduSmart clinic gateway confirming minor knee dressing.$es$, null, $es$2026-10-02T08:45:00$es$, $es$Sister Grace Wambui, RN$es$, $es$tenant-riara$es$),
  ($es$san-3$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, $es$Mary Otieno (Mother)$es$, $es$+254 722 345 678$es$, $es$Nurse David Ochieng, KRCHN$es$, $es$NCK/RN-61402$es$, $es$SAN/005$es$, $es$2026-10-03$es$, $es$09:10 AM$es$, $es$10:20 AM$es$, $es$Acute bronchial spasm / exercise-induced asthma tightness after morning sprint drill$es$, array[$es$Wheezing$es$, $es$Shortness of breath$es$, $es$Chest tightness$es$]::text[], $es${"temperature":36.6,"pulseRate":86,"bloodPressure":"108/70","respiratoryRate":24}$es$::jsonb, $es$Salbutamol 100mcg (2 puffs via spacer device). Patient positioned upright in high Fowler's. Peak flow measured at 280 L/min. Observed for 45 minutes until chest sounds cleared bilaterally.$es$, $es$treated_returned_to_class$es$, null, $es$Bronchial spasm resolved; respiratory sounds clear bilaterally. Student carrying prescribed inhaler in school bag. Class teacher alerted to monitor during outdoor activities.$es$, $es$Avoid cold morning outdoor activities and dusty field areas for remainder of day.$es$, $es$Return immediately if wheeze recurs; check-in before departure at 3:30 PM.$es$, true, $es$Parent informed via call; inhaler refill confirmed at home.$es$, null, $es$2026-10-03T09:10:00$es$, $es$Nurse David Ochieng, KRCHN$es$, $es$tenant-riara$es$),
  ($es$san-4$es$, $es$usr-stu-faith$es$, $es$Faith Wanjiru$es$, $es$ADM/2021/0811$es$, 8, $es$Mara$es$, $es$James Wanjiru (Father)$es$, $es$+254 720 112 233$es$, $es$Sister Grace Wambui, RN$es$, $es$NCK/RN-58921$es$, $es$SAN/002$es$, $es$2026-10-03$es$, $es$11:00 AM$es$, $es$01:30 PM$es$, $es$Throbbing frontal migraine and visual photophobia following computer lab session$es$, array[$es$Severe headache$es$, $es$Photophobia$es$, $es$Mild nausea$es$]::text[], $es${"temperature":37.1,"pulseRate":82,"bloodPressure":"118/76","respiratoryRate":18}$es$::jsonb, $es$Ibuprofen 400mg with light snack and warm chamomile tea. Admitted to quiet dark recovery bay on Observation Bed #02.$es$, $es$admitted_observation_bay$es$, $es$Observation Bed #02$es$, $es$Learner placed under dark-room rest protocol. Avoid screen exposure, fluorescent lights, and loud noise. Re-evaluate after 90 minutes of sleep before clearing to return to dorm/class.$es$, $es$Excused from afternoon computer practicals and physical education.$es$, $es$Check blood pressure and headache pain score at 1:30 PM.$es$, true, $es$Father notified that Faith is resting comfortably in sanatorium observation room.$es$, null, $es$2026-10-03T11:00:00$es$, $es$Sister Grace Wambui, RN$es$, $es$tenant-riara$es$),
  ($es$san-5$es$, $es$usr-stu-amina$es$, $es$Amina Hassan$es$, $es$ADM/2023/0413$es$, 4, $es$Dove$es$, $es$Hassan Ali (Father)$es$, $es$+254 721 889 001$es$, $es$Sister Grace Wambui, RN$es$, $es$NCK/RN-58921$es$, $es$SAN/002$es$, $es$2026-10-01$es$, $es$01:20 PM$es$, $es$02:15 PM$es$, $es$Episodic stomach cramps and abdominal bloating after lunchtime meal$es$, array[$es$Abdominal pain$es$, $es$Bloating$es$]::text[], $es${"temperature":36.9,"pulseRate":76,"bloodPressure":"102/66","respiratoryRate":18}$es$::jsonb, $es$Oral Hyoscine Butylbromide 10mg stat, warm water compress to epigastrium, rested 40 minutes in observation lounge.$es$, $es$treated_returned_to_class$es$, null, $es$Abdominal cramps subsided completely. Advised to stay well hydrated and avoid spicy/oily cafeteria items for 24 hours.$es$, $es$Normal classroom activity resumed.$es$, $es$Report back if cramps recur during evening prep.$es$, false, $es$Mild cramp, fully resolved; routine notification on weekly health summary.$es$, null, $es$2026-10-01T01:20:00$es$, $es$Sister Grace Wambui, RN$es$, $es$tenant-riara$es$);
create index "sanatorium_records_school_id_idx" on "edusmart"."sanatorium_records" ("school_id");
alter table "edusmart"."sanatorium_records" enable row level security;

-- src/data/initialData.ts :: INITIAL_SCHOOL_BUSES (3 rows)
drop table if exists "edusmart"."school_buses" cascade;
create table "edusmart"."school_buses" (
  "id" text not null,
  "registration_number" text not null,
  "bus_number" text not null,
  "model" text not null,
  "capacity" bigint not null,
  "current_occupancy" bigint not null,
  "driver_name" text not null,
  "driver_phone" text not null,
  "assistant_name" text not null,
  "assistant_phone" text not null,
  "assigned_route_id" text not null,
  "assigned_route_name" text not null,
  "insurance_expiry" text not null,
  "inspection_status" text not null,
  "speed_governor_status" text not null,
  "gps_tracking_status" text not null,
  "current_location" text not null,
  "emergency_contact" text not null,
  "last_service_date" text not null,
  "next_service_due" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."school_buses" is $es$School data from src/data/initialData.ts export INITIAL_SCHOOL_BUSES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."school_buses" ("id", "registration_number", "bus_number", "model", "capacity", "current_occupancy", "driver_name", "driver_phone", "assistant_name", "assistant_phone", "assigned_route_id", "assigned_route_name", "insurance_expiry", "inspection_status", "speed_governor_status", "gps_tracking_status", "current_location", "emergency_contact", "last_service_date", "next_service_due", "school_id") values
  ($es$bus-01$es$, $es$KDG 218M$es$, $es$Bus 01$es$, $es$Isuzu FRR 33-Seater School Coach$es$, 33, 28, $es$Mr. Josephat Kipkoech$es$, $es$+254 712 345 678$es$, $es$Ms. Mary Wambui$es$, $es$+254 723 456 789$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga$es$, $es$2027-02-28$es$, $es$Valid / Compliant$es$, $es$Certified & Calibrated (80 km/h)$es$, $es$Active & Transmitting$es$, $es$Campus Main Gate Bus Bay (Parked)$es$, $es$+254 722 000 119$es$, $es$2026-09-15$es$, $es$2026-12-15$es$, $es$tenant-riara$es$),
  ($es$bus-02$es$, $es$KDM 490T$es$, $es$Bus 02$es$, $es$Mitsubishi Rosa 29-Seater Executive$es$, 29, 24, $es$Mr. Peter Njoroge$es$, $es$+254 721 889 900$es$, $es$Mrs. Eunice Akinyi$es$, $es$+254 733 445 566$es$, $es$route-02$es$, $es$Route 02 – Ngong Road & South C$es$, $es$2027-04-15$es$, $es$Valid / Compliant$es$, $es$Certified & Calibrated (80 km/h)$es$, $es$Active & Transmitting$es$, $es$Prestige Plaza Ngong Rd (En Route)$es$, $es$+254 722 000 119$es$, $es$2026-08-20$es$, $es$2026-11-20$es$, $es$tenant-riara$es$),
  ($es$bus-03$es$, $es$KDB 112W$es$, $es$Bus 03$es$, $es$Toyota Coaster 25-Seater Shuttle$es$, 25, 19, $es$Mr. Patrick Mutiso$es$, $es$+254 710 654 321$es$, $es$Ms. Beatrice Chepngetich$es$, $es$+254 728 776 543$es$, $es$route-03$es$, $es$Route 03 – Thika Highway & Garden City$es$, $es$2027-01-30$es$, $es$Valid / Compliant$es$, $es$Certified & Calibrated (80 km/h)$es$, $es$Active & Transmitting$es$, $es$Campus West Parking Bay$es$, $es$+254 722 000 119$es$, $es$2026-09-02$es$, $es$2026-12-02$es$, $es$tenant-riara$es$);
create index "school_buses_school_id_idx" on "edusmart"."school_buses" ("school_id");
alter table "edusmart"."school_buses" enable row level security;

-- src/data/initialData.ts :: INITIAL_TRANSPORT_ROUTES (3 rows)
drop table if exists "edusmart"."transport_routes" cascade;
create table "edusmart"."transport_routes" (
  "id" text not null,
  "route_number" text not null,
  "name" text not null,
  "description" text not null,
  "bus_plate" text not null,
  "bus_number" text not null,
  "driver_name" text not null,
  "driver_phone" text not null,
  "assistant_name" text not null,
  "assistant_phone" text not null,
  "morning_start_time" text not null,
  "morning_school_arrival_time" text not null,
  "afternoon_departure_time" text not null,
  "afternoon_end_time" text not null,
  "term_fee" bigint not null,
  "status" text not null,
  "stops" jsonb not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."transport_routes" is $es$School data from src/data/initialData.ts export INITIAL_TRANSPORT_ROUTES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."transport_routes" ("id", "route_number", "name", "description", "bus_plate", "bus_number", "driver_name", "driver_phone", "assistant_name", "assistant_phone", "morning_start_time", "morning_school_arrival_time", "afternoon_departure_time", "afternoon_end_time", "term_fee", "status", "stops", "school_id") values
  ($es$route-01$es$, $es$Route 01$es$, $es$Kiambu Road & Muthaiga Express$es$, $es$Serving Fourways Junction, Ridgeways, CID HQ, Muthaiga Roundabout and Campus.$es$, $es$KDG 218M$es$, $es$Bus 01$es$, $es$Mr. Josephat Kipkoech$es$, $es$+254 712 345 678$es$, $es$Ms. Mary Wambui$es$, $es$+254 723 456 789$es$, $es$06:20 AM$es$, $es$07:35 AM$es$, $es$03:45 PM$es$, $es$05:10 PM$es$, 18500, $es$Active$es$, $es$[{"id":"stop-101","stopName":"Fourways Junction Estate Gate","landmark":"Near Shell Kiambu Road","morningPickupTime":"06:25 AM","afternoonDropoffTime":"04:15 PM","studentCount":8},{"id":"stop-102","stopName":"Ridgeways Mall Total Station","landmark":"Opposite Ridgeways Baptist","morningPickupTime":"06:40 AM","afternoonDropoffTime":"04:30 PM","studentCount":11},{"id":"stop-103","stopName":"DCI Headquarters Mazingira Complex","landmark":"Main Service Lane","morningPickupTime":"06:55 AM","afternoonDropoffTime":"04:45 PM","studentCount":5},{"id":"stop-104","stopName":"Muthaiga Roundabout Pedestrian Footbridge","landmark":"Near Gertrude Children Hospital","morningPickupTime":"07:15 AM","afternoonDropoffTime":"05:00 PM","studentCount":4}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$route-02$es$, $es$Route 02$es$, $es$Ngong Road & South C Shuttle$es$, $es$Serving Junction Mall, Adams Arcade, Prestige Plaza, Nyayo Highrise and South C.$es$, $es$KDM 490T$es$, $es$Bus 02$es$, $es$Mr. Peter Njoroge$es$, $es$+254 721 889 900$es$, $es$Mrs. Eunice Akinyi$es$, $es$+254 733 445 566$es$, $es$06:15 AM$es$, $es$07:40 AM$es$, $es$03:45 PM$es$, $es$05:20 PM$es$, 19500, $es$Active$es$, $es$[{"id":"stop-201","stopName":"The Junction Mall Shell","landmark":"Ngong Road entrance","morningPickupTime":"06:20 AM","afternoonDropoffTime":"04:20 PM","studentCount":7},{"id":"stop-202","stopName":"Adams Arcade Market","landmark":"Near Elgeyo Marakwet Rd junction","morningPickupTime":"06:38 AM","afternoonDropoffTime":"04:35 PM","studentCount":9},{"id":"stop-203","stopName":"Prestige Plaza Rubis","landmark":"Opposite China Centre","morningPickupTime":"06:52 AM","afternoonDropoffTime":"04:50 PM","studentCount":5},{"id":"stop-204","stopName":"South C Bellevue Total Station","landmark":"Mombasa Road slipway","morningPickupTime":"07:15 AM","afternoonDropoffTime":"05:10 PM","studentCount":3}]$es$::jsonb, $es$tenant-riara$es$),
  ($es$route-03$es$, $es$Route 03$es$, $es$Thika Superhighway & Roysambu Circuit$es$, $es$Serving TRM Mall, Garden City, Safari Park Hotel, Allsops and Pangani.$es$, $es$KDB 112W$es$, $es$Bus 03$es$, $es$Mr. Patrick Mutiso$es$, $es$+254 710 654 321$es$, $es$Ms. Beatrice Chepngetich$es$, $es$+254 728 776 543$es$, $es$06:25 AM$es$, $es$07:35 AM$es$, $es$03:45 PM$es$, $es$05:00 PM$es$, 17000, $es$Active$es$, $es$[{"id":"stop-301","stopName":"TRM Mall Service Lane","landmark":"Thika Road Mall Gate 2","morningPickupTime":"06:30 AM","afternoonDropoffTime":"04:25 PM","studentCount":6},{"id":"stop-302","stopName":"Safari Park Hotel Stage","landmark":"Near USIU Road turnoff","morningPickupTime":"06:45 AM","afternoonDropoffTime":"04:40 PM","studentCount":5},{"id":"stop-303","stopName":"Garden City Mall Overpass","landmark":"Near Will Mary stage","morningPickupTime":"07:00 AM","afternoonDropoffTime":"04:55 PM","studentCount":8}]$es$::jsonb, $es$tenant-riara$es$);
create index "transport_routes_school_id_idx" on "edusmart"."transport_routes" ("school_id");
alter table "edusmart"."transport_routes" enable row level security;

-- src/data/initialData.ts :: INITIAL_STUDENT_TRANSPORT_PROFILES (6 rows)
drop table if exists "edusmart"."student_transport_profiles" cascade;
create table "edusmart"."student_transport_profiles" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "parent_name" text not null,
  "parent_phone" text not null,
  "route_id" text not null,
  "route_name" text not null,
  "bus_plate" text not null,
  "bus_number" text not null,
  "seat_number" text not null,
  "pickup_stop" text not null,
  "dropoff_stop" text not null,
  "morning_pickup_time" text not null,
  "afternoon_dropoff_time" text not null,
  "transport_status" text not null,
  "special_instructions" text not null,
  "authorized_collector" text not null,
  "fee_status" text not null,
  "term_fee" bigint not null,
  "balance" bigint not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."student_transport_profiles" is $es$School data from src/data/initialData.ts export INITIAL_STUDENT_TRANSPORT_PROFILES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."student_transport_profiles" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "parent_name", "parent_phone", "route_id", "route_name", "bus_plate", "bus_number", "seat_number", "pickup_stop", "dropoff_stop", "morning_pickup_time", "afternoon_dropoff_time", "transport_status", "special_instructions", "authorized_collector", "fee_status", "term_fee", "balance", "school_id") values
  ($es$stp-1$es$, $es$stu-otieno-4$es$, $es$Brian Otieno$es$, $es$ADM/2026/0401$es$, 4, $es$Dove$es$, $es$Mr. David Otieno$es$, $es$+254 722 112 233$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga Express$es$, $es$KDG 218M$es$, $es$Bus 01$es$, $es$Seat 14A$es$, $es$Ridgeways Mall Total Station$es$, $es$Ridgeways Mall Total Station$es$, $es$06:40 AM$es$, $es$04:30 PM$es$, $es$Active$es$, $es$Carries emergency salbutamol inhaler in school bag side pouch.$es$, $es$Mr. David Otieno (Father) or Mrs. Hellen Otieno (Mother)$es$, $es$Paid$es$, 18500, 0, $es$tenant-riara$es$),
  ($es$stp-2$es$, $es$stu-chebet-5$es$, $es$Faith Chebet$es$, $es$ADM/2026/0501$es$, 5, $es$Eagle$es$, $es$Mrs. Caroline Chebet$es$, $es$+254 722 998 877$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga Express$es$, $es$KDG 218M$es$, $es$Bus 01$es$, $es$Seat 08B$es$, $es$Fourways Junction Estate Gate$es$, $es$Fourways Junction Estate Gate$es$, $es$06:25 AM$es$, $es$04:15 PM$es$, $es$Active$es$, $es$Front seats preferred due to mild motion sensitivity.$es$, $es$Mrs. Caroline Chebet or driver verification passcode.$es$, $es$Paid$es$, 18500, 0, $es$tenant-riara$es$),
  ($es$stp-3$es$, $es$stu-kip-7$es$, $es$Emmanuel Kiprono$es$, $es$ADM/2026/0701$es$, 7, $es$Mara$es$, $es$Mr. Daniel Kiprono$es$, $es$+254 721 554 433$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga Express$es$, $es$KDG 218M$es$, $es$Bus 01$es$, $es$Seat 22C$es$, $es$DCI Headquarters Mazingira Complex$es$, $es$DCI Headquarters Mazingira Complex$es$, $es$06:55 AM$es$, $es$04:45 PM$es$, $es$Active$es$, $es$Junior School science project carrier; leaves with bag compartment access.$es$, $es$Self collection authorized (Grade 7 student identification card verified)$es$, $es$Paid$es$, 18500, 0, $es$tenant-riara$es$),
  ($es$stp-4$es$, $es$stu-wanjiku-8$es$, $es$Grace Wanjiku$es$, $es$ADM/2026/0801$es$, 8, $es$Chania$es$, $es$Mrs. Alice Wanjiku$es$, $es$+254 720 334 455$es$, $es$route-02$es$, $es$Route 02 – Ngong Road & South C Shuttle$es$, $es$KDM 490T$es$, $es$Bus 02$es$, $es$Seat 10A$es$, $es$Adams Arcade Market$es$, $es$Adams Arcade Market$es$, $es$06:38 AM$es$, $es$04:35 PM$es$, $es$Active$es$, $es$Junior school peer mentor; assists with Grade 1 & 2 learners boarding.$es$, $es$Mrs. Alice Wanjiku (Mother)$es$, $es$Paid$es$, 19500, 0, $es$tenant-riara$es$),
  ($es$stp-5$es$, $es$stu-mutua-4$es$, $es$Kevin Mutua$es$, $es$ADM/2026/0402$es$, 4, $es$Dove$es$, $es$Mr. James Mutua$es$, $es$+254 724 667 788$es$, $es$route-02$es$, $es$Route 02 – Ngong Road & South C Shuttle$es$, $es$KDM 490T$es$, $es$Bus 02$es$, $es$Seat 18B$es$, $es$The Junction Mall Shell$es$, $es$The Junction Mall Shell$es$, $es$06:20 AM$es$, $es$04:20 PM$es$, $es$Active$es$, $es$Allergies to peanut snacks; monitored by chaperone during snack time.$es$, $es$Mr. James Mutua or Sister Christine Mutua$es$, $es$Partial$es$, 19500, 4500, $es$tenant-riara$es$),
  ($es$stp-6$es$, $es$stu-kamau-6$es$, $es$Stacy Kamau$es$, $es$ADM/2026/0601$es$, 6, $es$Falcon$es$, $es$Dr. Robert Kamau$es$, $es$+254 722 887 766$es$, $es$route-03$es$, $es$Route 03 – Thika Highway & Garden City Circuit$es$, $es$KDB 112W$es$, $es$Bus 03$es$, $es$Seat 05C$es$, $es$Garden City Mall Overpass$es$, $es$Garden City Mall Overpass$es$, $es$07:00 AM$es$, $es$04:55 PM$es$, $es$Active$es$, $es$Student band flute case kept safely under seat.$es$, $es$Dr. Robert Kamau (Father)$es$, $es$Paid$es$, 17000, 0, $es$tenant-riara$es$);
create index "student_transport_profiles_school_id_idx" on "edusmart"."student_transport_profiles" ("school_id");
alter table "edusmart"."student_transport_profiles" enable row level security;

-- src/data/initialData.ts :: INITIAL_TRANSPORT_TRIP_RECORDS (5 rows)
drop table if exists "edusmart"."transport_trip_records" cascade;
create table "edusmart"."transport_trip_records" (
  "id" text not null,
  "date" text not null,
  "trip_type" text not null,
  "route_id" text not null,
  "route_name" text not null,
  "bus_plate" text not null,
  "driver_name" text not null,
  "assistant_name" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "stop_name" text not null,
  "status" text not null,
  "timestamp" text not null,
  "recorded_by" text not null,
  "notes" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."transport_trip_records" is $es$School data from src/data/initialData.ts export INITIAL_TRANSPORT_TRIP_RECORDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."transport_trip_records" ("id", "date", "trip_type", "route_id", "route_name", "bus_plate", "driver_name", "assistant_name", "student_id", "student_name", "grade", "stream", "stop_name", "status", "timestamp", "recorded_by", "notes", "school_id") values
  ($es$ttr-01$es$, $es$2026-10-04$es$, $es$Morning Pickup$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga Express$es$, $es$KDG 218M$es$, $es$Mr. Josephat Kipkoech$es$, $es$Ms. Mary Wambui$es$, $es$stu-otieno-4$es$, $es$Brian Otieno$es$, 4, $es$Dove$es$, $es$Ridgeways Mall Total Station$es$, $es$Boarded$es$, $es$06:42 AM$es$, $es$Ms. Mary Wambui (Chaperone)$es$, $es$Boarded safely; uniform checked and seatbelt buckled.$es$, $es$tenant-riara$es$),
  ($es$ttr-02$es$, $es$2026-10-04$es$, $es$Morning Pickup$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga Express$es$, $es$KDG 218M$es$, $es$Mr. Josephat Kipkoech$es$, $es$Ms. Mary Wambui$es$, $es$stu-chebet-5$es$, $es$Faith Chebet$es$, 5, $es$Eagle$es$, $es$Fourways Junction Estate Gate$es$, $es$Boarded$es$, $es$06:27 AM$es$, $es$Ms. Mary Wambui (Chaperone)$es$, $es$Boarded on schedule.$es$, $es$tenant-riara$es$),
  ($es$ttr-03$es$, $es$2026-10-04$es$, $es$Morning Pickup$es$, $es$route-01$es$, $es$Route 01 – Kiambu Road & Muthaiga Express$es$, $es$KDG 218M$es$, $es$Mr. Josephat Kipkoech$es$, $es$Ms. Mary Wambui$es$, $es$stu-kip-7$es$, $es$Emmanuel Kiprono$es$, 7, $es$Mara$es$, $es$DCI Headquarters Mazingira Complex$es$, $es$Boarded$es$, $es$06:57 AM$es$, $es$Ms. Mary Wambui (Chaperone)$es$, $es$Handed project kit to luggage shelf.$es$, $es$tenant-riara$es$),
  ($es$ttr-04$es$, $es$2026-10-04$es$, $es$Morning Pickup$es$, $es$route-02$es$, $es$Route 02 – Ngong Road & South C Shuttle$es$, $es$KDM 490T$es$, $es$Mr. Peter Njoroge$es$, $es$Mrs. Eunice Akinyi$es$, $es$stu-wanjiku-8$es$, $es$Grace Wanjiku$es$, 8, $es$Chania$es$, $es$Adams Arcade Market$es$, $es$Boarded$es$, $es$06:40 AM$es$, $es$Mrs. Eunice Akinyi (Chaperone)$es$, $es$Onboarded on schedule.$es$, $es$tenant-riara$es$),
  ($es$ttr-05$es$, $es$2026-10-04$es$, $es$Morning Pickup$es$, $es$route-02$es$, $es$Route 02 – Ngong Road & South C Shuttle$es$, $es$KDM 490T$es$, $es$Mr. Peter Njoroge$es$, $es$Mrs. Eunice Akinyi$es$, $es$stu-mutua-4$es$, $es$Kevin Mutua$es$, 4, $es$Dove$es$, $es$The Junction Mall Shell$es$, $es$Boarded$es$, $es$06:22 AM$es$, $es$Mrs. Eunice Akinyi (Chaperone)$es$, $es$Parent escorted to bus steps.$es$, $es$tenant-riara$es$);
create index "transport_trip_records_school_id_idx" on "edusmart"."transport_trip_records" ("school_id");
alter table "edusmart"."transport_trip_records" enable row level security;

-- src/data/initialData.ts :: INITIAL_TRANSPORT_INCIDENTS (2 rows)
drop table if exists "edusmart"."transport_incidents" cascade;
create table "edusmart"."transport_incidents" (
  "id" text not null,
  "date" text not null,
  "time" text not null,
  "bus_plate" text not null,
  "driver_name" text not null,
  "route" text not null,
  "severity" text not null,
  "incident_type" text not null,
  "description" text not null,
  "action_taken" text not null,
  "reported_by" text not null,
  "follow_up_status" text not null,
  "students_involved" text[] not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."transport_incidents" is $es$School data from src/data/initialData.ts export INITIAL_TRANSPORT_INCIDENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."transport_incidents" ("id", "date", "time", "bus_plate", "driver_name", "route", "severity", "incident_type", "description", "action_taken", "reported_by", "follow_up_status", "students_involved", "school_id") values
  ($es$inc-01$es$, $es$2026-10-03$es$, $es$07:10 AM$es$, $es$KDG 218M$es$, $es$Mr. Josephat Kipkoech$es$, $es$Route 01 – Kiambu Road$es$, $es$Low$es$, $es$Traffic Delay$es$, $es$Slow-moving commuter traffic along Muthaiga roundabout due to minor roadworks. Caused a 10-minute delay.$es$, $es$Driver notified school transport supervisor; SMS dispatched to all parents informing them of safe, controlled delay. Bus arrived safely on campus at 07:45 AM.$es$, $es$Mr. Josephat Kipkoech (Lead Driver)$es$, $es$Resolved$es$, array[$es$All Route 01 passengers$es$]::text[], $es$tenant-riara$es$),
  ($es$inc-02$es$, $es$2026-09-28$es$, $es$04:35 PM$es$, $es$KDM 490T$es$, $es$Mr. Peter Njoroge$es$, $es$Route 02 – Ngong Road$es$, $es$Medium$es$, $es$Unauthorized Collector Attempt$es$, $es$An unidentified person claiming to be a neighbour attempted to collect Grade 4 learner without parent written authorization.$es$, $es$Bus chaperone immediately withheld learner, contacted mother Dr. Caroline Chebet by direct call. Mother confirmed neighbour was not authorized. Learner safely retained and handed over to mother at school security office.$es$, $es$Mrs. Eunice Akinyi (Bus Chaperone)$es$, $es$Resolved$es$, array[$es$Kevin Mutua$es$]::text[], $es$tenant-riara$es$);
create index "transport_incidents_school_id_idx" on "edusmart"."transport_incidents" ("school_id");
alter table "edusmart"."transport_incidents" enable row level security;

-- src/data/initialData.ts :: INITIAL_TRANSPORT_ALERTS (3 rows)
drop table if exists "edusmart"."transport_alerts" cascade;
create table "edusmart"."transport_alerts" (
  "id" text not null,
  "timestamp" text not null,
  "route_id" text not null,
  "bus_plate" text not null,
  "type" text not null,
  "title" text not null,
  "message" text not null,
  "target_audience" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."transport_alerts" is $es$School data from src/data/initialData.ts export INITIAL_TRANSPORT_ALERTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."transport_alerts" ("id", "timestamp", "route_id", "bus_plate", "type", "title", "message", "target_audience", "school_id") values
  ($es$alt-01$es$, $es$2026-10-04 07:38 AM$es$, $es$route-01$es$, $es$KDG 218M$es$, $es$arrived_school$es$, $es$Bus 01 Arrived Safely at Campus$es$, $es$All 28 morning commuters on Kiambu Road Express have safely alighted at Campus Bus Bay and reported to morning assembly.$es$, $es$all_parents$es$, $es$tenant-riara$es$),
  ($es$alt-02$es$, $es$2026-10-04 06:42 AM$es$, $es$route-01$es$, $es$KDG 218M$es$, $es$boarded$es$, $es$Student Boarding Confirmed: Brian Otieno$es$, $es$Brian Otieno safely boarded Bus 01 at Ridgeways Mall Total Station with Chaperone Ms. Mary Wambui.$es$, $es$route_parents$es$, $es$tenant-riara$es$),
  ($es$alt-03$es$, $es$2026-10-04 06:18 AM$es$, $es$route-02$es$, $es$KDM 490T$es$, $es$departure$es$, $es$Morning Route 02 Commenced$es$, $es$Bus 02 departed Junction Mall depot on schedule with Driver Peter Njoroge.$es$, $es$route_parents$es$, $es$tenant-riara$es$);
create index "transport_alerts_school_id_idx" on "edusmart"."transport_alerts" ("school_id");
alter table "edusmart"."transport_alerts" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_ACTIVITIES (10 rows)
drop table if exists "edusmart"."co_curricular_activities" cascade;
create table "edusmart"."co_curricular_activities" (
  "id" text not null,
  "name" text not null,
  "category" text not null,
  "type" text not null,
  "description" text not null,
  "patron_name" text not null,
  "patron_phone" text not null,
  "patron_email" text not null,
  "assistant_name" text,
  "venue" text not null,
  "meeting_days" text[] not null,
  "meeting_time" text not null,
  "target_grades" bigint[] not null,
  "max_participants" bigint not null,
  "current_members_count" bigint not null,
  "status" text not null,
  "achievements_count" bigint not null,
  "icon" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_activities" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_ACTIVITIES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_activities" ("id", "name", "category", "type", "description", "patron_name", "patron_phone", "patron_email", "assistant_name", "venue", "meeting_days", "meeting_time", "target_grades", "max_participants", "current_members_count", "status", "achievements_count", "icon", "school_id") values
  ($es$act-football$es$, $es$Simba Football Academy (U-13 & U-11)$es$, $es$Sports$es$, $es$sport$es$, $es$Premier soccer academy focusing on technical ball control, tactical positioning, physical agility, and national tournament fixtures.$es$, $es$Coach Benjamin Omwenga$es$, $es$+254 722 789 012$es$, $es$cocurricular@edusmart.ac.ke$es$, $es$Coach Kevin Baraza$es$, $es$Main Sports Complex & Football Pitch$es$, array[$es$Tuesday$es$, $es$Thursday$es$]::text[], $es$04:00 PM - 05:30 PM$es$, array[3, 4, 5, 6, 7, 8, 9]::bigint[], 40, 32, $es$Active$es$, 5, $es$⚽$es$, $es$tenant-riara$es$),
  ($es$act-basketball$es$, $es$Warriors Basketball Team$es$, $es$Sports$es$, $es$sport$es$, $es$Competitive basketball team focusing on fast breaks, defensive zones, three-point shooting, and inter-school league participation.$es$, $es$Coach Dennis Ochieng$es$, $es$+254 723 889 110$es$, $es$basketball@edusmart.ac.ke$es$, null, $es$Floodlit Outdoor Courts$es$, array[$es$Monday$es$, $es$Wednesday$es$]::text[], $es$04:00 PM - 05:30 PM$es$, array[4, 5, 6, 7, 8, 9]::bigint[], 30, 24, $es$Active$es$, 3, $es$🏀$es$, $es$tenant-riara$es$),
  ($es$act-swimming$es$, $es$Dolphins Swimming Squad$es$, $es$Sports$es$, $es$sport$es$, $es$Year-round competitive swimming squad training in freestyle, backstroke, butterfly, breaststroke, and relay galas.$es$, $es$Coach Sarah Nekesa$es$, $es$+254 711 445 221$es$, $es$swimming@edusmart.ac.ke$es$, null, $es$Semi-Olympic Heated Swimming Pool$es$, array[$es$Tuesday$es$, $es$Friday$es$]::text[], $es$06:30 AM - 07:30 AM & 04:00 PM$es$, array[1, 2, 3, 4, 5, 6, 7, 8, 9]::bigint[], 35, 28, $es$Active$es$, 7, $es$🏊$es$, $es$tenant-riara$es$),
  ($es$act-athletics$es$, $es$Track & Field Athletics Club$es$, $es$Sports$es$, $es$sport$es$, $es$Sprint, middle distance, hurdles, long jump, and relay training geared toward regional track meets and cross country.$es$, $es$Coach Paul Kipchumba$es$, $es$+254 720 119 883$es$, $es$athletics@edusmart.ac.ke$es$, null, $es$Standard 400m Running Track$es$, array[$es$Wednesday$es$, $es$Saturday$es$]::text[], $es$04:00 PM - 05:15 PM$es$, array[4, 5, 6, 7, 8, 9]::bigint[], 45, 36, $es$Active$es$, 4, $es$🏃$es$, $es$tenant-riara$es$),
  ($es$act-debate$es$, $es$Great Debaters & Public Speaking Society$es$, $es$Clubs & Societies$es$, $es$club$es$, $es$Developing eloquent orators, critical thinkers, and parliamentary debaters. Competing in Model UN and Kenya National Debate League.$es$, $es$Madame Grace Achieng$es$, $es$+254 721 345 987$es$, $es$patron@edusmart.ac.ke$es$, $es$Mr. David Kiprono$es$, $es$Junior Secondary Amphitheatre$es$, array[$es$Tuesday$es$, $es$Thursday$es$]::text[], $es$04:00 PM - 05:15 PM$es$, array[4, 5, 6, 7, 8, 9]::bigint[], 35, 28, $es$Active$es$, 6, $es$🎙️$es$, $es$tenant-riara$es$),
  ($es$act-robotics$es$, $es$Robotics, AI & Coding Innovators$es$, $es$STEM & Innovation$es$, $es$club$es$, $es$Hands-on hardware microcontrollers (Arduino, Raspberry Pi), Python coding, autonomous rovers, and Kenya Science & Engineering Fair exhibits.$es$, $es$Mr. Kelvin Muriuki$es$, $es$+254 728 556 771$es$, $es$robotics@edusmart.ac.ke$es$, null, $es$Smart STEM & Innovation Lab$es$, array[$es$Monday$es$, $es$Wednesday$es$]::text[], $es$04:00 PM - 05:30 PM$es$, array[3, 4, 5, 6, 7, 8, 9]::bigint[], 28, 25, $es$Active$es$, 4, $es$🤖$es$, $es$tenant-riara$es$),
  ($es$act-music$es$, $es$Symphony Brass Band & Choral Ensemble$es$, $es$Creative Arts & Music$es$, $es$club$es$, $es$Instrumental mastery in trumpets, saxophones, violins, drums, and choral harmonization. Performs at national ceremonies and festivals.$es$, $es$Mr. Emmanuel Wekesa$es$, $es$+254 725 334 112$es$, $es$music@edusmart.ac.ke$es$, null, $es$Music Auditorium & Rehearsal Suites$es$, array[$es$Monday$es$, $es$Thursday$es$]::text[], $es$04:00 PM - 05:30 PM$es$, array[2, 3, 4, 5, 6, 7, 8, 9]::bigint[], 40, 34, $es$Active$es$, 8, $es$🎺$es$, $es$tenant-riara$es$),
  ($es$act-drama$es$, $es$Creative Drama & Performing Arts Troupe$es$, $es$Creative Arts & Music$es$, $es$club$es$, $es$Stage plays, poetry dramatization, cultural dances, costume design, and voice projection for Kenya National Drama Festival.$es$, $es$Madame Grace Achieng$es$, $es$+254 721 345 987$es$, $es$patron@edusmart.ac.ke$es$, null, $es$Performing Arts Theatre Hall$es$, array[$es$Wednesday$es$, $es$Friday$es$]::text[], $es$04:00 PM - 05:30 PM$es$, array[3, 4, 5, 6, 7, 8, 9]::bigint[], 35, 26, $es$Active$es$, 4, $es$🎭$es$, $es$tenant-riara$es$),
  ($es$act-chess$es$, $es$Grandmasters Chess & Board Strategy Club$es$, $es$Clubs & Societies$es$, $es$club$es$, $es$Analytical tactical openings, endgame tactics, blindfold visualization, and FIDE-rated inter-school chess championships.$es$, $es$Mr. George Odhiambo$es$, $es$+254 719 883 204$es$, $es$chess@edusmart.ac.ke$es$, null, $es$Library East Quiet Study Wing$es$, array[$es$Tuesday$es$, $es$Thursday$es$]::text[], $es$04:00 PM - 05:00 PM$es$, array[1, 2, 3, 4, 5, 6, 7, 8, 9]::bigint[], 30, 22, $es$Active$es$, 3, $es$♟️$es$, $es$tenant-riara$es$),
  ($es$act-scouts$es$, $es$Kenya Scouts & Girl Guides Movement$es$, $es$Leadership & Service$es$, $es$club$es$, $es$Outdoor camping skills, knot tying, first aid emergency response, leadership badges, civic volunteering, and ceremonial drills.$es$, $es$Scouter Evans Macharia$es$, $es$+254 724 661 905$es$, $es$scouts@edusmart.ac.ke$es$, null, $es$School Parade Ground & Pavilion$es$, array[$es$Friday$es$]::text[], $es$03:45 PM - 05:15 PM$es$, array[1, 2, 3, 4, 5, 6, 7, 8, 9]::bigint[], 50, 42, $es$Active$es$, 5, $es$⚜️$es$, $es$tenant-riara$es$);
create index "co_curricular_activities_school_id_idx" on "edusmart"."co_curricular_activities" ("school_id");
alter table "edusmart"."co_curricular_activities" enable row level security;

-- src/data/initialData.ts :: INITIAL_LEARNER_CO_CURRICULAR_PROFILES (6 rows)
drop table if exists "edusmart"."learner_co_curricular_profiles" cascade;
create table "edusmart"."learner_co_curricular_profiles" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "activity_id" text not null,
  "activity_name" text not null,
  "category" text not null,
  "role" text not null,
  "registration_status" text not null,
  "registration_date" text not null,
  "attendance_rate" bigint not null,
  "talent_strengths" text[] not null,
  "competitions_attended" text[] not null,
  "awards_earned" text[] not null,
  "coach_notes" text not null,
  "parent_consent_given" boolean not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."learner_co_curricular_profiles" is $es$School data from src/data/initialData.ts export INITIAL_LEARNER_CO_CURRICULAR_PROFILES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."learner_co_curricular_profiles" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "activity_id", "activity_name", "category", "role", "registration_status", "registration_date", "attendance_rate", "talent_strengths", "competitions_attended", "awards_earned", "coach_notes", "parent_consent_given", "school_id") values
  ($es$lcp-01$es$, $es$stu-otieno-4$es$, $es$Brian Otieno$es$, $es$ADM/2026/0401$es$, 4, $es$Dove$es$, $es$act-football$es$, $es$Simba Football Academy (U-13 & U-11)$es$, $es$Sports$es$, $es$Team Captain$es$, $es$Active$es$, $es$2026-01-12$es$, 96, array[$es$Football$es$, $es$Athletics$es$, $es$Leadership$es$]::text[], array[$es$Nairobi Primary Schools Cup 2026$es$, $es$KASSU Inter-County U-11 Tournament$es$]::text[], array[$es$Top Scorer & Golden Boot (11 Goals)$es$, $es$Most Valuable Player Trophy$es$]::text[], $es$Exceptional pitch awareness, tactical leadership, and disciplined work rate. Inspires team morale during tight fixtures.$es$, true, $es$tenant-riara$es$),
  ($es$lcp-02$es$, $es$stu-chebet-5$es$, $es$Faith Chebet$es$, $es$ADM/2026/0501$es$, 5, $es$Eagle$es$, $es$act-music$es$, $es$Symphony Brass Band & Choral Ensemble$es$, $es$Creative Arts & Music$es$, $es$Member$es$, $es$Active$es$, $es$2026-01-14$es$, 98, array[$es$Music & Instruments$es$, $es$Drama & Acting$es$]::text[], array[$es$Kenya Music Festival Regional Finals 2026$es$, $es$Nairobi Young Instrumentalists Showcase$es$]::text[], array[$es$First Place Trumpet Solo Grade 5 Category (Gold Certificate)$es$, $es$Best Ensemble Harmony Award$es$]::text[], $es$Gifted pitch clarity and remarkable breath control on the Bb trumpet. Dedicated practice discipline.$es$, true, $es$tenant-riara$es$),
  ($es$lcp-03$es$, $es$stu-kip-7$es$, $es$Emmanuel Kiprono$es$, $es$ADM/2026/0701$es$, 7, $es$Mara$es$, $es$act-robotics$es$, $es$Robotics, AI & Coding Innovators$es$, $es$STEM & Innovation$es$, $es$Club President$es$, $es$Active$es$, $es$2026-01-10$es$, 95, array[$es$Robotics & STEM$es$, $es$Leadership$es$]::text[], array[$es$Kenya Science & Engineering Fair (KSEF) 2026$es$, $es$Pan-African Young Coders Hackathon$es$]::text[], array[$es$First Prize Innovation in Agriculture Automation Trophy$es$, $es$Best Code Architecture Certificate$es$]::text[], $es$Superb problem-solving mindset and coding proficiency in Python and Arduino C++. Spearheads club projects with diligence.$es$, true, $es$tenant-riara$es$),
  ($es$lcp-04$es$, $es$stu-wanjiku-8$es$, $es$Grace Wanjiku$es$, $es$ADM/2026/0801$es$, 8, $es$Chania$es$, $es$act-debate$es$, $es$Great Debaters & Public Speaking Society$es$, $es$Clubs & Societies$es$, $es$Secretary$es$, $es$Active$es$, $es$2026-01-15$es$, 96, array[$es$Debate & Public Speaking$es$, $es$Leadership$es$]::text[], array[$es$National Inter-School Parliamentary Debate League$es$, $es$East Africa Model United Nations (EAMUN) 2026$es$]::text[], array[$es$Best Junior Speaker Nairobi Region Award$es$, $es$Distinguished Delegate Trophy$es$]::text[], $es$Articulate delivery, cogent argumentation, and powerful rebuttals. Mentors Grade 4 and 5 debaters during joint practice.$es$, true, $es$tenant-riara$es$),
  ($es$lcp-05$es$, $es$stu-mutua-4$es$, $es$Kevin Mutua$es$, $es$ADM/2026/0402$es$, 4, $es$Dove$es$, $es$act-chess$es$, $es$Grandmasters Chess & Board Strategy Club$es$, $es$Clubs & Societies$es$, $es$Member$es$, $es$Active$es$, $es$2026-01-16$es$, 92, array[$es$Chess$es$, $es$Fine Art$es$]::text[], array[$es$Kenya National Youth Chess Championship 2026$es$, $es$Kasparov Chess Foundation Nairobi Open$es$]::text[], array[$es$Under-10 Category Bronze Medalist (5.5/7 points)$es$]::text[], $es$Sharp tactical vision with the Sicilian Defense. Developing patience in deep endgame calculations.$es$, true, $es$tenant-riara$es$),
  ($es$lcp-06$es$, $es$stu-kamau-6$es$, $es$Stacy Kamau$es$, $es$ADM/2026/0601$es$, 6, $es$Falcon$es$, $es$act-swimming$es$, $es$Dolphins Swimming Squad$es$, $es$Sports$es$, $es$Team Captain$es$, $es$Active$es$, $es$2026-01-12$es$, 97, array[$es$Swimming$es$, $es$Athletics$es$]::text[], array[$es$Kenya Swimming Federation (KSF) Junior Gala$es$, $es$Oshwal Academy Invitational Gala 2026$es$]::text[], array[$es$Gold Medal 50m Butterfly (32.4s)$es$, $es$Gold Medal 100m Freestyle (1m 06s)$es$]::text[], $es$Elite hydrodynamic stroke technique and explosive start off the blocks. Exudes sportsmanship.$es$, true, $es$tenant-riara$es$);
create index "learner_co_curricular_profiles_school_id_idx" on "edusmart"."learner_co_curricular_profiles" ("school_id");
alter table "edusmart"."learner_co_curricular_profiles" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_ATTENDANCE (6 rows)
drop table if exists "edusmart"."co_curricular_attendance" cascade;
create table "edusmart"."co_curricular_attendance" (
  "id" text not null,
  "activity_id" text not null,
  "activity_name" text not null,
  "date" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "status" text not null,
  "recorded_by" text not null,
  "notes" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_attendance" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_ATTENDANCE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_attendance" ("id", "activity_id", "activity_name", "date", "student_id", "student_name", "grade", "stream", "status", "recorded_by", "notes", "school_id") values
  ($es$cca-01$es$, $es$act-football$es$, $es$Simba Football Academy (U-13 & U-11)$es$, $es$2026-10-02$es$, $es$stu-otieno-4$es$, $es$Brian Otieno$es$, 4, $es$Dove$es$, $es$Present$es$, $es$Coach Benjamin Omwenga$es$, $es$Led warmups and finished set-piece drills.$es$, $es$tenant-riara$es$),
  ($es$cca-02$es$, $es$act-music$es$, $es$Symphony Brass Band & Choral Ensemble$es$, $es$2026-10-01$es$, $es$stu-chebet-5$es$, $es$Faith Chebet$es$, 5, $es$Eagle$es$, $es$Present$es$, $es$Mr. Emmanuel Wekesa$es$, $es$Mastered fanfare trumpet section bars 24-48.$es$, $es$tenant-riara$es$),
  ($es$cca-03$es$, $es$act-robotics$es$, $es$Robotics, AI & Coding Innovators$es$, $es$2026-09-30$es$, $es$stu-kip-7$es$, $es$Emmanuel Kiprono$es$, 7, $es$Mara$es$, $es$Present$es$, $es$Mr. Kelvin Muriuki$es$, $es$Calibrated ultrasonic sensors on obstacle avoidance chassis.$es$, $es$tenant-riara$es$),
  ($es$cca-04$es$, $es$act-debate$es$, $es$Great Debaters & Public Speaking Society$es$, $es$2026-10-01$es$, $es$stu-wanjiku-8$es$, $es$Grace Wanjiku$es$, 8, $es$Chania$es$, $es$Present$es$, $es$Madame Grace Achieng$es$, $es$Delivered affirmative opening on Climate Policy motion.$es$, $es$tenant-riara$es$),
  ($es$cca-05$es$, $es$act-chess$es$, $es$Grandmasters Chess & Board Strategy Club$es$, $es$2026-10-02$es$, $es$stu-mutua-4$es$, $es$Kevin Mutua$es$, 4, $es$Dove$es$, $es$Present$es$, $es$Mr. George Odhiambo$es$, $es$Won 2 blitz rounds using King Indian Defense.$es$, $es$tenant-riara$es$),
  ($es$cca-06$es$, $es$act-swimming$es$, $es$Dolphins Swimming Squad$es$, $es$2026-10-02$es$, $es$stu-kamau-6$es$, $es$Stacy Kamau$es$, 6, $es$Falcon$es$, $es$Present$es$, $es$Coach Sarah Nekesa$es$, $es$Completed 1,500m threshold endurance set.$es$, $es$tenant-riara$es$);
create index "co_curricular_attendance_school_id_idx" on "edusmart"."co_curricular_attendance" ("school_id");
alter table "edusmart"."co_curricular_attendance" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_COMPETITIONS (4 rows)
drop table if exists "edusmart"."co_curricular_competitions" cascade;
create table "edusmart"."co_curricular_competitions" (
  "id" text not null,
  "title" text not null,
  "activity_id" text not null,
  "activity_name" text not null,
  "category" text not null,
  "date" text not null,
  "venue" text not null,
  "host" text not null,
  "participating_schools" text[] not null,
  "our_position" text not null,
  "score_or_time" text not null,
  "awards" text[] not null,
  "coach_accompanying" text not null,
  "status" text not null,
  "report" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_competitions" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_COMPETITIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_competitions" ("id", "title", "activity_id", "activity_name", "category", "date", "venue", "host", "participating_schools", "our_position", "score_or_time", "awards", "coach_accompanying", "status", "report", "school_id") values
  ($es$comp-01$es$, $es$Nairobi Inter-School Soccer Derby & Cup 2026$es$, $es$act-football$es$, $es$Simba Football Academy (U-13 & U-11)$es$, $es$Sports Competition$es$, $es$2026-09-26$es$, $es$Nyayo National Stadium Annex$es$, $es$Nairobi County Education Directorate$es$, array[$es$EduSmart Academy$es$, $es$St. Austin Academy$es$, $es$Braeburn School$es$, $es$Brookhouse$es$]::text[], $es$Champions (1st Place · Gold Trophy)$es$, $es$Final: 3 - 1 vs St. Austin$es$, array[$es$Gold Trophy$es$, $es$Golden Boot (Brian Otieno)$es$, $es$Best Coach Award$es$]::text[], $es$Coach Benjamin Omwenga$es$, $es$Completed$es$, $es$EduSmart dominated both halves with clinical finishes and disciplined midfield recovery. High commendation from match officials.$es$, $es$tenant-riara$es$),
  ($es$comp-02$es$, $es$Kenya National Music Festival Regional Finals$es$, $es$act-music$es$, $es$Symphony Brass Band & Choral Ensemble$es$, $es$Creative Arts & Music$es$, $es$2026-09-18$es$, $es$Kenya Cultural Centre & National Theatre$es$, $es$Ministry of Education$es$, array[$es$EduSmart Academy$es$, $es$Alliance High$es$, $es$Kenya High$es$, $es$Kianda School$es$]::text[], $es$1st Runners Up (Silver Award)$es$, $es$Adjudicator Score: 94 / 100$es$, array[$es$Silver Plaque$es$, $es$Best Brass Instrumental Solo (Faith Chebet)$es$]::text[], $es$Mr. Emmanuel Wekesa$es$, $es$Completed$es$, $es$Exceptional brass harmonization and precise tempo modulation. Qualified for the National Finals in Mombasa.$es$, $es$tenant-riara$es$),
  ($es$comp-03$es$, $es$East Africa Junior Debating Open Championship$es$, $es$act-debate$es$, $es$Great Debaters & Public Speaking Society$es$, $es$Academic & Speech$es$, $es$2026-10-18$es$, $es$Strathmore University Auditorium$es$, $es$East Africa Debate Council$es$, array[$es$EduSmart Academy$es$, $es$Greensteds$es$, $es$Hillcrest$es$, $es$St. Mary School$es$]::text[], $es$Confirmed Finalist Delegation$es$, $es$Seeded #1 in Nairobi Division$es$, array[$es$Upcoming Event$es$]::text[], $es$Madame Grace Achieng$es$, $es$Upcoming$es$, $es$Team is currently in intensive motion preparation covering Global Trade and Digital AI Governance.$es$, $es$tenant-riara$es$),
  ($es$comp-04$es$, $es$Kenya Science & Engineering Fair (KSEF) Regional Finals$es$, $es$act-robotics$es$, $es$Robotics, AI & Coding Innovators$es$, $es$STEM & Robotics$es$, $es$2026-09-12$es$, $es$University of Nairobi Science Complex$es$, $es$National Commission for Science & Technology (NACOSTI)$es$, array[$es$EduSmart Academy$es$, $es$Mang'u High$es$, $es$Lenana School$es$, $es$Moi Girls$es$]::text[], $es$1st Place (Gold Trophy in Applied Tech)$es$, $es$Score: 96.5% Innovation Index$es$, array[$es$Gold Trophy$es$, $es$Young Innovator of the Year Award$es$]::text[], $es$Mr. Kelvin Muriuki$es$, $es$Completed$es$, $es$Autonomous solar-powered crop hydration rover built by Emmanuel Kiprono and team received unanimous acclaim from university panel.$es$, $es$tenant-riara$es$);
create index "co_curricular_competitions_school_id_idx" on "edusmart"."co_curricular_competitions" ("school_id");
alter table "edusmart"."co_curricular_competitions" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_EQUIPMENT (5 rows)
drop table if exists "edusmart"."co_curricular_equipment" cascade;
create table "edusmart"."co_curricular_equipment" (
  "id" text not null,
  "item_name" text not null,
  "category" text not null,
  "quantity" bigint not null,
  "condition" text not null,
  "assigned_activity" text not null,
  "storage_location" text not null,
  "last_audit_date" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_equipment" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_EQUIPMENT. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_equipment" ("id", "item_name", "category", "quantity", "condition", "assigned_activity", "storage_location", "last_audit_date", "school_id") values
  ($es$eq-01$es$, $es$FIFA Certified Match Footballs (Size 4 & 5)$es$, $es$Sports$es$, 24, $es$New / Excellent$es$, $es$Simba Football Academy$es$, $es$Sports Pavilion Store A$es$, $es$2026-09-28$es$, $es$tenant-riara$es$),
  ($es$eq-02$es$, $es$Spalding Official Outdoor Basketballs$es$, $es$Sports$es$, 16, $es$Good$es$, $es$Warriors Basketball Team$es$, $es$Court Pavilion Store$es$, $es$2026-09-28$es$, $es$tenant-riara$es$),
  ($es$eq-03$es$, $es$Yamaha YTR-2330 Bb Standard Trumpets$es$, $es$Music$es$, 8, $es$New / Excellent$es$, $es$Symphony Brass Band$es$, $es$Music Suite Instrument Vault$es$, $es$2026-10-01$es$, $es$tenant-riara$es$),
  ($es$eq-04$es$, $es$Tournament Weighted Chess Boards & Digital DGT Timers$es$, $es$Clubs$es$, 18, $es$Good$es$, $es$Grandmasters Chess Club$es$, $es$Library East Archive$es$, $es$2026-09-25$es$, $es$tenant-riara$es$),
  ($es$eq-05$es$, $es$Arduino Mega & IoT Sensor Robotics Starter Kits$es$, $es$STEM$es$, 20, $es$New / Excellent$es$, $es$Robotics Innovators$es$, $es$STEM Lab Locker 04$es$, $es$2026-10-02$es$, $es$tenant-riara$es$);
create index "co_curricular_equipment_school_id_idx" on "edusmart"."co_curricular_equipment" ("school_id");
alter table "edusmart"."co_curricular_equipment" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_TRIPS (3 rows)
drop table if exists "edusmart"."co_curricular_trips" cascade;
create table "edusmart"."co_curricular_trips" (
  "id" text not null,
  "activity_id" text not null,
  "activity_name" text not null,
  "destination" text not null,
  "date" text not null,
  "departure_time" text not null,
  "return_time" text not null,
  "purpose" text not null,
  "bus_allocated" text not null,
  "driver_name" text not null,
  "accompanying_staff" text[] not null,
  "participant_learner_ids" text[] not null,
  "parent_consent_required" boolean not null,
  "status" text not null,
  "emergency_contact" text not null,
  "estimated_cost_per_learner" bigint not null,
  "report" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_trips" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_TRIPS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_trips" ("id", "activity_id", "activity_name", "destination", "date", "departure_time", "return_time", "purpose", "bus_allocated", "driver_name", "accompanying_staff", "participant_learner_ids", "parent_consent_required", "status", "emergency_contact", "estimated_cost_per_learner", "report", "school_id") values
  ($es$trip-01$es$, $es$act-debate$es$, $es$Great Debaters & Public Speaking Society$es$, $es$Kenya National Theatre, Nairobi$es$, $es$2026-10-24$es$, $es$07:30 AM$es$, $es$06:00 PM$es$, $es$National Model United Nations & Inter-School Debate Semi-Finals$es$, $es$KDE 301E (Simba 01)$es$, $es$Mr. Josephat Kipkoech$es$, array[$es$Madame Grace Achieng$es$, $es$Mr. David Kiprono$es$]::text[], array[$es$stu-wanjiku-7$es$, $es$stu-kiprono-8$es$, $es$stu-otieno-4$es$]::text[], true, $es$Scheduled$es$, $es$+254 721 345 987 (Madame Grace Achieng)$es$, 1200, $es$Official transport booked with EduSmart fleet. 28 delegate badges reserved.$es$, $es$tenant-riara$es$),
  ($es$trip-02$es$, $es$act-football$es$, $es$Simba Football Academy (U-13 & U-11)$es$, $es$Kasarani International Sports Annex$es$, $es$2026-10-18$es$, $es$08:00 AM$es$, $es$04:30 PM$es$, $es$Nairobi Inter-County Youth Soccer Invitational Cup (Quarter Finals)$es$, $es$KDE 302E (Simba 02)$es$, $es$Mr. Peter Otieno$es$, array[$es$Coach Benjamin Omwenga$es$, $es$Coach Kevin Baraza$es$]::text[], array[$es$stu-otieno-4$es$, $es$stu-kamau-5$es$]::text[], true, $es$Scheduled$es$, $es$+254 722 789 012 (Coach Benjamin Omwenga)$es$, 800, $es$U-13 roster finalized. Medical kit and tournament hydration logistics in place.$es$, $es$tenant-riara$es$),
  ($es$trip-03$es$, $es$act-swimming$es$, $es$Dolphins Swimming Squad$es$, $es$Brookhouse Runda Aquatic Center$es$, $es$2026-09-26$es$, $es$06:30 AM$es$, $es$03:30 PM$es$, $es$Kenya Swimming Federation Junior League Meet$es$, $es$KDE 303E (Simba 03)$es$, $es$Mr. Samuel Mwangi$es$, array[$es$Coach Sarah Nekesa$es$]::text[], array[$es$stu-mutua-3$es$, $es$stu-kamau-5$es$]::text[], true, $es$Completed$es$, $es$+254 711 445 221 (Coach Sarah Nekesa)$es$, 1500, $es$Won 3 gold and 2 silver medals. All swimmers returned safely by 03:20 PM.$es$, $es$tenant-riara$es$);
create index "co_curricular_trips_school_id_idx" on "edusmart"."co_curricular_trips" ("school_id");
alter table "edusmart"."co_curricular_trips" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_ANNOUNCEMENTS (4 rows)
drop table if exists "edusmart"."co_curricular_announcements" cascade;
create table "edusmart"."co_curricular_announcements" (
  "id" text not null,
  "title" text not null,
  "category" text not null,
  "message" text not null,
  "target_audience" text not null,
  "activity_id" text,
  "activity_name" text,
  "date" text not null,
  "author" text not null,
  "priority" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_announcements" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_ANNOUNCEMENTS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_announcements" ("id", "title", "category", "message", "target_audience", "activity_id", "activity_name", "date", "author", "priority", "school_id") values
  ($es$ann-01$es$, $es$Regional Debate Gala - Team Selection Confirmed$es$, $es$Competitions$es$, $es$Congratulations to our 12 delegates selected for the National Model UN semi-finals at Kenya National Theatre. Rehearsals will be held every Tuesday and Thursday.$es$, $es$All$es$, $es$act-debate$es$, $es$Great Debaters Society$es$, $es$2026-10-02$es$, $es$Madame Grace Achieng$es$, $es$High$es$, $es$tenant-riara$es$),
  ($es$ann-02$es$, $es$Term 3 Inter-House Sports Gala & Parent Invitations$es$, $es$Sports$es$, $es$The annual inter-house athletics, swimming, and soccer fixtures will take place on Saturday, October 31st. Parents are cordially invited to cheer the learners.$es$, $es$Parents$es$, null, null, $es$2026-10-01$es$, $es$Coach Benjamin Omwenga$es$, $es$Normal$es$, $es$tenant-riara$es$),
  ($es$ann-03$es$, $es$Robotics Team Qualifies for National NACOSTI Fair$es$, $es$Clubs$es$, $es$The EduSmart Autonomous Crop Rover team scored 96.5% and won 1st place in Applied Technology. National round exhibits scheduled for next month.$es$, $es$All$es$, $es$act-robotics$es$, $es$Robotics Innovators$es$, $es$2026-09-29$es$, $es$Mr. Kelvin Muriuki$es$, $es$High$es$, $es$tenant-riara$es$),
  ($es$ann-04$es$, $es$Medical Slips and Parent Consent for Kasarani Cup$es$, $es$Trips$es$, $es$All parents of U-13 football squad members are requested to digitally sign the consent slip in the Parent Portal by Wednesday, Oct 14th.$es$, $es$Parents$es$, $es$act-football$es$, $es$Simba Football Academy$es$, $es$2026-10-03$es$, $es$Coach Benjamin Omwenga$es$, $es$Urgent$es$, $es$tenant-riara$es$);
create index "co_curricular_announcements_school_id_idx" on "edusmart"."co_curricular_announcements" ("school_id");
alter table "edusmart"."co_curricular_announcements" enable row level security;

-- src/data/initialData.ts :: INITIAL_CO_CURRICULAR_BUDGET (5 rows)
drop table if exists "edusmart"."co_curricular_budget" cascade;
create table "edusmart"."co_curricular_budget" (
  "id" text not null,
  "activity_id" text not null,
  "activity_name" text not null,
  "category" text not null,
  "allocated_amount" bigint not null,
  "spent_amount" bigint not null,
  "term" text not null,
  "academic_year" bigint not null,
  "approved_by" text not null,
  "status" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."co_curricular_budget" is $es$School data from src/data/initialData.ts export INITIAL_CO_CURRICULAR_BUDGET. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."co_curricular_budget" ("id", "activity_id", "activity_name", "category", "allocated_amount", "spent_amount", "term", "academic_year", "approved_by", "status", "school_id") values
  ($es$bud-01$es$, $es$act-football$es$, $es$Simba Football Academy$es$, $es$Uniforms & Kits$es$, 120000, 95000, $es$Term 3$es$, 2026, $es$Dr. Arthur Mwangi (Head Teacher)$es$, $es$Approved$es$, $es$tenant-riara$es$),
  ($es$bud-02$es$, $es$act-debate$es$, $es$Great Debaters Society$es$, $es$Tournaments & Entry$es$, 65000, 42000, $es$Term 3$es$, 2026, $es$Mrs. Lydia Cherono (Deputy Head)$es$, $es$Approved$es$, $es$tenant-riara$es$),
  ($es$bud-03$es$, $es$act-robotics$es$, $es$Robotics Innovators$es$, $es$Equipment$es$, 180000, 165000, $es$Term 3$es$, 2026, $es$Dr. Arthur Mwangi (Head Teacher)$es$, $es$Disbursed$es$, $es$tenant-riara$es$),
  ($es$bud-04$es$, $es$act-music$es$, $es$Symphony Brass Band$es$, $es$Equipment$es$, 150000, 130000, $es$Term 3$es$, 2026, $es$Dr. Arthur Mwangi (Head Teacher)$es$, $es$Approved$es$, $es$tenant-riara$es$),
  ($es$bud-05$es$, $es$act-swimming$es$, $es$Dolphins Swimming Squad$es$, $es$Refreshments & First Aid$es$, 45000, 38000, $es$Term 3$es$, 2026, $es$Mrs. Lydia Cherono (Deputy Head)$es$, $es$Approved$es$, $es$tenant-riara$es$);
create index "co_curricular_budget_school_id_idx" on "edusmart"."co_curricular_budget" ("school_id");
alter table "edusmart"."co_curricular_budget" enable row level security;

-- src/data/initialData.ts :: INITIAL_BELL_SCHEDULE (13 rows)
drop table if exists "edusmart"."bell_schedule" cascade;
create table "edusmart"."bell_schedule" (
  "row_id" bigint generated always as identity,
  "period" bigint not null,
  "label" text not null,
  "start_time" text not null,
  "end_time" text not null,
  "school_id" text not null,
  "is_break" boolean,
  "break_type" text,
  primary key ("row_id")
);
comment on table "edusmart"."bell_schedule" is $es$School data from src/data/initialData.ts export INITIAL_BELL_SCHEDULE. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."bell_schedule" ("period", "label", "start_time", "end_time", "school_id", "is_break", "break_type") values
  (10, $es$Period 10 (Early Morning Remedial - Gr 6–9)$es$, $es$07:00$es$, $es$07:50$es$, $es$tenant-riara$es$, null, null),
  (1, $es$Period 1 (Morning Core)$es$, $es$08:00$es$, $es$08:40$es$, $es$tenant-riara$es$, null, null),
  (2, $es$Period 2 (Core Instruction)$es$, $es$08:40$es$, $es$09:20$es$, $es$tenant-riara$es$, null, null),
  (3, $es$Period 3 (STEM & Numeracy)$es$, $es$09:20$es$, $es$10:00$es$, $es$tenant-riara$es$, null, null),
  (4, $es$Period 4 (Language Arts)$es$, $es$10:00$es$, $es$10:40$es$, $es$tenant-riara$es$, null, null),
  (0, $es$Morning Tea & Health Snack Break$es$, $es$10:40$es$, $es$11:10$es$, $es$tenant-riara$es$, true, $es$morning_tea$es$),
  (5, $es$Period 5 (Social & Applied Sciences)$es$, $es$11:10$es$, $es$11:50$es$, $es$tenant-riara$es$, null, null),
  (6, $es$Period 6 (Creative & Practical)$es$, $es$11:50$es$, $es$12:30$es$, $es$tenant-riara$es$, null, null),
  (7, $es$Period 7 (Science & Pre-Technical)$es$, $es$12:30$es$, $es$13:10$es$, $es$tenant-riara$es$, null, null),
  (0, $es$Midday Lunch & Pastoral Rest$es$, $es$13:10$es$, $es$14:10$es$, $es$tenant-riara$es$, true, $es$lunch$es$),
  (8, $es$Period 8 (Specialist & Lab)$es$, $es$14:10$es$, $es$14:50$es$, $es$tenant-riara$es$, null, null),
  (9, $es$Period 9 (Afternoon Core Study)$es$, $es$14:50$es$, $es$15:30$es$, $es$tenant-riara$es$, null, null),
  (11, $es$Period 11 (Late Evening Remedial - Gr 6–9)$es$, $es$15:45$es$, $es$16:45$es$, $es$tenant-riara$es$, null, null);
create index "bell_schedule_school_id_idx" on "edusmart"."bell_schedule" ("school_id");
alter table "edusmart"."bell_schedule" enable row level security;

-- src/data/initialData.ts :: INITIAL_LUNCH_RECORDS (9 rows)
drop table if exists "edusmart"."lunch_records" cascade;
create table "edusmart"."lunch_records" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "date" text not null,
  "status" text not null,
  "taken_at" text,
  "meal_type" text,
  "dietary_notes" text not null,
  "marked_by" text not null,
  "marked_by_role" text not null,
  "updated_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."lunch_records" is $es$School data from src/data/initialData.ts export INITIAL_LUNCH_RECORDS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."lunch_records" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "date", "status", "taken_at", "meal_type", "dietary_notes", "marked_by", "marked_by_role", "updated_at", "school_id") values
  ($es$lnch-001$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, $es$2026-10-06$es$, $es$taken$es$, $es$12:45 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full meal consumed, hydrated.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:45:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-002$es$, $es$usr-stu-amina$es$, $es$Amina Hassan$es$, $es$ADM/2023/0413$es$, 4, $es$Dove$es$, $es$2026-10-06$es$, $es$special_diet$es$, $es$12:50 PM$es$, $es$Special Medical Diet$es$, $es$Halal preparation, mild seasoning as advised by Sanatorium.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:50:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-003$es$, $es$usr-stu-kevin$es$, $es$Kevin Mutua$es$, $es$ADM/2023/0414$es$, 4, $es$Dove$es$, $es$2026-10-06$es$, $es$taken$es$, $es$12:40 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full meal consumed.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:40:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-004$es$, $es$usr-stu-grace$es$, $es$Grace Njeri$es$, $es$ADM/2023/0415$es$, 4, $es$Dove$es$, $es$2026-10-06$es$, $es$taken$es$, $es$12:44 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full meal consumed.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:44:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-005$es$, $es$usr-stu-emmanuel$es$, $es$Emmanuel Kipchumba$es$, $es$ADM/2023/0416$es$, 4, $es$Dove$es$, $es$2026-10-06$es$, $es$not_taken$es$, null, null, $es$In Sanatorium observation bay during lunchtime.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:55:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-006$es$, $es$usr-stu-faith$es$, $es$Faith Wanjiru$es$, $es$ADM/2021/0819$es$, 8, $es$Mara$es$, $es$2026-10-06$es$, $es$taken$es$, $es$12:35 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full meal consumed, hot soup included.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:35:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-007$es$, $es$usr-stu-peter$es$, $es$Peter Omondi$es$, $es$ADM/2021/0820$es$, 8, $es$Mara$es$, $es$2026-10-06$es$, $es$taken$es$, $es$12:38 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full meal consumed.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-06T12:38:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-008$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, $es$2026-10-05$es$, $es$taken$es$, $es$12:41 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full hot lunch consumed.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-05T12:41:00.000Z$es$, $es$tenant-riara$es$),
  ($es$lnch-009$es$, $es$usr-stu-faith$es$, $es$Faith Wanjiru$es$, $es$ADM/2021/0819$es$, 8, $es$Mara$es$, $es$2026-10-05$es$, $es$taken$es$, $es$12:39 PM$es$, $es$Standard Balanced Hot Meal$es$, $es$Full lunch consumed.$es$, $es$Mr. David Kiprono$es$, $es$Class Teacher$es$, $es$2026-10-05T12:39:00.000Z$es$, $es$tenant-riara$es$);
create index "lunch_records_school_id_idx" on "edusmart"."lunch_records" ("school_id");
alter table "edusmart"."lunch_records" enable row level security;

-- src/data/initialData.ts :: INITIAL_STAFF_DUTY_ROSTER (3 rows)
drop table if exists "edusmart"."staff_duty_roster" cascade;
create table "edusmart"."staff_duty_roster" (
  "id" text not null,
  "week_number" bigint not null,
  "start_date" text not null,
  "end_date" text not null,
  "lead_teacher" text not null,
  "senior_teacher_name" text not null,
  "assistant_teacher" text not null,
  "gate_duty_teacher" text not null,
  "dining_supervision" text not null,
  "focus_theme" text not null,
  "status" text not null,
  "assigned_by" text not null,
  "assigned_at" text not null,
  "notes" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."staff_duty_roster" is $es$School data from src/data/initialData.ts export INITIAL_STAFF_DUTY_ROSTER. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."staff_duty_roster" ("id", "week_number", "start_date", "end_date", "lead_teacher", "senior_teacher_name", "assistant_teacher", "gate_duty_teacher", "dining_supervision", "focus_theme", "status", "assigned_by", "assigned_at", "notes", "school_id") values
  ($es$duty-w5$es$, 5, $es$2026-09-28$es$, $es$2026-10-02$es$, $es$Mr. Peter Ochieng$es$, $es$Mr. Peter Ochieng (Senior Teacher)$es$, $es$Mrs. Mary Wambui$es$, $es$Mr. Peter Mutua$es$, $es$Mr. David Kiprono$es$, $es$Punctuality, Smart Attire & Assembly Decorum$es$, $es$Current$es$, $es$Mrs. Lydia Cherono (Deputy Head)$es$, $es$2026-09-26$es$, $es$Morning gate supervision starting strictly at 6:45 AM. Senior teacher leads Monday assembly.$es$, $es$tenant-riara$es$),
  ($es$duty-w6$es$, 6, $es$2026-10-05$es$, $es$2026-10-09$es$, $es$Mr. Peter Ochieng$es$, $es$Mr. Peter Ochieng (Senior Teacher)$es$, $es$Mr. Charles Omondi$es$, $es$Mrs. Jane Njeri$es$, $es$Mrs. Grace Muthoni$es$, $es$Academic Excellence & Zero Truancy$es$, $es$Upcoming$es$, $es$Mrs. Lydia Cherono (Deputy Head)$es$, $es$2026-10-02$es$, $es$All TODs to synchronize watches and monitor dining hall queues during morning tea and lunch breaks.$es$, $es$tenant-riara$es$),
  ($es$duty-w4$es$, 4, $es$2026-09-21$es$, $es$2026-09-25$es$, $es$Mr. Peter Ochieng$es$, $es$Mr. Peter Ochieng (Senior Teacher)$es$, $es$Mr. David Kiprono$es$, $es$Mr. Vincent Kipruto$es$, $es$Mrs. Mary Wambui$es$, $es$Health & Environmental Sanitation$es$, $es$Completed$es$, $es$Mrs. Lydia Cherono (Deputy Head)$es$, $es$2026-09-19$es$, $es$Handover report filed and commended by Head Teacher.$es$, $es$tenant-riara$es$);
create index "staff_duty_roster_school_id_idx" on "edusmart"."staff_duty_roster" ("school_id");
alter table "edusmart"."staff_duty_roster" enable row level security;

-- src/data/initialData.ts :: INITIAL_DROPOFF_VERIFICATIONS (1 rows)
drop table if exists "edusmart"."dropoff_verifications" cascade;
create table "edusmart"."dropoff_verifications" (
  "id" text not null,
  "student_id" text not null,
  "student_name" text not null,
  "admission_number" text not null,
  "grade" bigint not null,
  "stream" text not null,
  "stop_name" text not null,
  "bus_plate" text not null,
  "bus_number" text not null,
  "parent_name" text not null,
  "parent_phone" text not null,
  "verification_code" text not null,
  "status" text not null,
  "requested_at" text not null,
  "verified_by" text not null,
  "parent_consent_confirmed" boolean not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."dropoff_verifications" is $es$School data from src/data/initialData.ts export INITIAL_DROPOFF_VERIFICATIONS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."dropoff_verifications" ("id", "student_id", "student_name", "admission_number", "grade", "stream", "stop_name", "bus_plate", "bus_number", "parent_name", "parent_phone", "verification_code", "status", "requested_at", "verified_by", "parent_consent_confirmed", "school_id") values
  ($es$tdv-demo-01$es$, $es$usr-stu-brian$es$, $es$Brian Otieno$es$, $es$ADM/2023/0412$es$, 4, $es$Dove$es$, $es$Kilimani Shopping Center Gate$es$, $es$KDG 218M$es$, $es$Bus 01$es$, $es$Mrs. Grace Otieno$es$, $es$+254 722 123 456$es$, $es$8492$es$, $es$pending_code$es$, $es$16:15$es$, $es$Ms. Alice Wanjiru (Bus Chaperone)$es$, false, $es$tenant-riara$es$);
create index "dropoff_verifications_school_id_idx" on "edusmart"."dropoff_verifications" ("school_id");
alter table "edusmart"."dropoff_verifications" enable row level security;

-- src/data/initialData.ts :: INITIAL_LESSON_IMAGES (4 rows)
drop table if exists "edusmart"."lesson_images" cascade;
create table "edusmart"."lesson_images" (
  "id" text not null,
  "topic_id" text not null,
  "grade" bigint not null,
  "subject" text not null,
  "title" text not null,
  "image_url" text not null,
  "caption" text not null,
  "category" text not null,
  "tags" text[] not null,
  "teacher_name" text not null,
  "created_at" text not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."lesson_images" is $es$School data from src/data/initialData.ts export INITIAL_LESSON_IMAGES. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."lesson_images" ("id", "topic_id", "grade", "subject", "title", "image_url", "caption", "category", "tags", "teacher_name", "created_at", "school_id") values
  ($es$img-res-01$es$, $es$top-math-decimals$es$, 4, $es$Mathematics$es$, $es$Visual Representation of Decimal Tenths and Hundredths Grid$es$, $es$https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1000&q=80$es$, $es$10x10 Hundredths Grid: 37 shaded squares represents 37/100 or 0.37.$es$, $es$diagram$es$, array[$es$Fractions$es$, $es$Decimals$es$, $es$Tenths Grid$es$]::text[], $es$Mr. David Kiprono$es$, $es$2026-09-22$es$, $es$tenant-riara$es$),
  ($es$img-res-02$es$, $es$top-sci-digestive$es$, 4, $es$Integrated Science$es$, $es$Human Digestive Tract Organs & Functional Flowchart$es$, $es$https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1000&q=80$es$, $es$Mouth -> Oesophagus -> Stomach -> Small Intestine -> Large Intestine -> Rectum.$es$, $es$diagram$es$, array[$es$Biology$es$, $es$Digestive System$es$, $es$CBC Science$es$]::text[], $es$Mrs. Jane Njeri$es$, $es$2026-09-24$es$, $es$tenant-riara$es$),
  ($es$img-res-03$es$, $es$top-soc-kenya-map$es$, 4, $es$Social Studies$es$, $es$Physical Topography and Rift Valley Drainage Basins of Kenya$es$, $es$https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1000&q=80$es$, $es$Physical features: Great Rift Valley, Mt. Kenya, Aberdares, and Indian Ocean drainage.$es$, $es$illustration$es$, array[$es$Geography$es$, $es$Kenya$es$, $es$Topography$es$]::text[], $es$Mr. Charles Omondi$es$, $es$2026-09-26$es$, $es$tenant-riara$es$),
  ($es$img-res-04$es$, $es$top-agri-soil$es$, 4, $es$Agriculture and Nutrition$es$, $es$Soil Profile Layers: Topsoil, Subsoil and Bedrock Horizons$es$, $es$https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1000&q=80$es$, $es$Horizons O, A (Topsoil), B (Subsoil), and C (Parent rock). Soil conservation and organic humus.$es$, $es$chart$es$, array[$es$Soil$es$, $es$Humus$es$, $es$Agriculture$es$]::text[], $es$Mr. Peter Mutua$es$, $es$2026-09-28$es$, $es$tenant-riara$es$);
create index "lesson_images_school_id_idx" on "edusmart"."lesson_images" ("school_id");
alter table "edusmart"."lesson_images" enable row level security;

-- src/data/initialData.ts :: INITIAL_E_LINKS (7 rows)
drop table if exists "edusmart"."e_links" cascade;
create table "edusmart"."e_links" (
  "id" text not null,
  "title" text not null,
  "url" text not null,
  "description" text not null,
  "category" text not null,
  "grade_level" jsonb not null,
  "subject" text not null,
  "added_by" text not null,
  "added_by_role" text not null,
  "created_at" text not null,
  "clicks_count" bigint not null,
  "school_id" text not null,
  primary key ("id")
);
comment on table "edusmart"."e_links" is $es$School data from src/data/initialData.ts export INITIAL_E_LINKS. school_id is the school. A school customises these rows on its own.$es$;
insert into "edusmart"."e_links" ("id", "title", "url", "description", "category", "grade_level", "subject", "added_by", "added_by_role", "created_at", "clicks_count", "school_id") values
  ($es$elink-vlab$es$, $es$EduSmart Virtual LAB - Interactive CBC Science & Inquiry Laboratory$es$, $es$https://chatgpt.com/s/t_6ac78bfad95c8191841d261117b27e60$es$, $es$Interactive STEM and CBC virtual laboratory: safe digital simulations for chemistry titrations, Ohm electrical circuits, density experiments, compound microscopy, and teacher experiment guides.$es$, $es$Science & STEM$es$, $es$"All Grades"$es$::jsonb, $es$Integrated Science$es$, $es$Mrs. Florence Muthoni (Librarian)$es$, $es$Librarian$es$, $es$2026-10-09$es$, 520, $es$tenant-riara$es$),
  ($es$elink-01$es$, $es$KICD EduTV Kenya Digital Learning Broadcasting Portal$es$, $es$https://www.kicd.ac.ke/edutv$es$, $es$Official Kenya Institute of Curriculum Development (KICD) CBC video lessons, audio archives, and syllabus radio lessons broadcast.$es$, $es$KICD & Open Access$es$, $es$"All Grades"$es$::jsonb, $es$Cross-Curricular$es$, $es$Mrs. Florence Muthoni (Librarian)$es$, $es$Librarian$es$, $es$2026-09-15$es$, 342, $es$tenant-riara$es$),
  ($es$elink-02$es$, $es$Kenya National Library Service (KNLS) Virtual National Library$es$, $es$https://vnl.knls.ac.ke$es$, $es$National digital lending library with over 200,000 Kenyan e-books, CBC supplementary readers, and academic journals.$es$, $es$Digital Library & Research$es$, $es$"All Grades"$es$::jsonb, $es$English$es$, $es$Mrs. Florence Muthoni (Librarian)$es$, $es$Librarian$es$, $es$2026-09-16$es$, 289, $es$tenant-riara$es$),
  ($es$elink-03$es$, $es$PhET Interactive CBC STEM Simulations (Physics & Math)$es$, $es$https://phet.colorado.edu$es$, $es$Interactive STEM laboratory simulations for fraction visualizers, electrical circuits, gravity, and states of matter.$es$, $es$Science & STEM$es$, $es$4$es$::jsonb, $es$Mathematics$es$, $es$Mr. David Kiprono (Subject Teacher)$es$, $es$Teacher$es$, $es$2026-09-18$es$, 415, $es$tenant-riara$es$),
  ($es$elink-04$es$, $es$African Storybook Early Literacy & Indigenous Languages Project$es$, $es$https://www.africanstorybook.org$es$, $es$Open-access illustrated storybooks published in English, Kiswahili, and mother-tongue languages for CBC Grade 1-6 readers.$es$, $es$Literature & Languages$es$, $es$4$es$::jsonb, $es$English$es$, $es$Mrs. Mary Wambui (Subject Teacher)$es$, $es$Teacher$es$, $es$2026-09-20$es$, 198, $es$tenant-riara$es$),
  ($es$elink-05$es$, $es$UNESCO Open Educational Resources (OER) Africa Global Commons$es$, $es$https://www.oerafrica.org$es$, $es$Curated curriculum support materials, pedagogical frameworks, and teacher continuous development modules.$es$, $es$Curriculum & Reference$es$, $es$"All Grades"$es$::jsonb, $es$Cross-Curricular$es$, $es$Mrs. Florence Muthoni (Librarian)$es$, $es$Librarian$es$, $es$2026-09-22$es$, 156, $es$tenant-riara$es$),
  ($es$elink-06$es$, $es$National Geographic Education Interactive World Atlas & Bio-Explorer$es$, $es$https://education.nationalgeographic.org$es$, $es$High-resolution cartography, wildlife habitats, environmental conservation studies, and climate science modules.$es$, $es$Curriculum & Reference$es$, $es$4$es$::jsonb, $es$Social Studies$es$, $es$Mr. Charles Omondi (Subject Teacher)$es$, $es$Teacher$es$, $es$2026-09-25$es$, 227, $es$tenant-riara$es$);
create index "e_links_school_id_idx" on "edusmart"."e_links" ("school_id");
alter table "edusmart"."e_links" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
