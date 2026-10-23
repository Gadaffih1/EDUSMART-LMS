-- EduSmart fresh Supabase schema
-- Landing hero media presets
-- Generated from src/data. Replaces only tables in schema edusmart.
-- Nested objects and mixed lists are jsonb. Plain lists are Postgres arrays.
-- Demo passwords from src/data are included. Row level security is on and has no policies,
-- so the anon API cannot read these tables. The SQL editor and service_role can.
begin;
create schema if not exists "edusmart";
grant usage on schema "edusmart" to postgres, service_role, authenticated, anon;

-- src/data/heroMediaPresets.ts :: HERO_VIDEO_PRESETS (5 rows)
drop table if exists "edusmart"."hero_video_presets" cascade;
create table "edusmart"."hero_video_presets" (
  "id" text not null,
  "label" text not null,
  "duration_label" text not null,
  "duration_seconds" bigint not null,
  "url" text not null,
  "poster" text not null,
  "category" text not null,
  "description" text not null,
  primary key ("id")
);
comment on table "edusmart"."hero_video_presets" is $es$Platform feature pack from src/data/heroMediaPresets.ts export HERO_VIDEO_PRESETS. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."hero_video_presets" ("id", "label", "duration_label", "duration_seconds", "url", "poster", "category", "description") values
  ($es$vid-classroom$es$, $es$Interactive Classroom & Teaching$es$, $es$22 sec$es$, 22, $es$https://assets.mixkit.co/videos/preview/mixkit-students-in-a-classroom-with-their-teacher-41147-large.mp4$es$, $es$/gad@edusmart.jpeg$es$, $es$classroom$es$, $es$Teacher mentoring enthusiastic learners with interactive digital board$es$),
  ($es$vid-science$es$, $es$STEM Science Lab & Microscopy$es$, $es$19 sec$es$, 19, $es$https://assets.mixkit.co/videos/preview/mixkit-girl-looking-through-a-microscope-in-a-laboratory-41144-large.mp4$es$, $es$/src/assets/images/diagram_science_ecosystem_1790859717590.jpg$es$, $es$stem$es$, $es$Learner conducting biology cell examination under optical microscope$es$),
  ($es$vid-library$es$, $es$Digital Library & Research Hub$es$, $es$26 sec$es$, 26, $es$https://assets.mixkit.co/videos/preview/mixkit-young-students-studying-in-a-library-41143-large.mp4$es$, $es$/src/assets/images/edusmart_campus_banner_1790859700873.jpg$es$, $es$library$es$, $es$Students collaborating in modern digital library resource center$es$),
  ($es$vid-cbc-project$es$, $es$CBC Project Discovery & Teamwork$es$, $es$28 sec$es$, 28, $es$https://assets.mixkit.co/videos/preview/mixkit-group-of-students-studying-together-41145-large.mp4$es$, $es$/src/assets/images/diagram_math_geometry_1790859731617.jpg$es$, $es$cbc$es$, $es$Teamwork and group discussion on project-based competency task$es$),
  ($es$vid-robotics$es$, $es$Robotics & Hardware Prototyping$es$, $es$16 sec$es$, 16, $es$https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-person-working-with-electronics-41148-large.mp4$es$, $es$/src/assets/images/diagram_math_geometry_1790859731617.jpg$es$, $es$robotics$es$, $es$Hands-on practical engineering circuit assembly and microcontrollers$es$);
alter table "edusmart"."hero_video_presets" enable row level security;

-- src/data/heroMediaPresets.ts :: HERO_IMAGE_PRESETS (6 rows)
drop table if exists "edusmart"."hero_image_presets" cascade;
create table "edusmart"."hero_image_presets" (
  "id" text not null,
  "label" text not null,
  "url" text not null,
  "description" text not null,
  primary key ("id")
);
comment on table "edusmart"."hero_image_presets" is $es$Platform feature pack from src/data/heroMediaPresets.ts export HERO_IMAGE_PRESETS. Creating a school starts from this pack. The school then customises its own rows.$es$;
insert into "edusmart"."hero_image_presets" ("id", "label", "url", "description") values
  ($es$img-gadaffih-smartboard$es$, $es$Mr. Gadaffih & Interactive Smart Board (Official)$es$, $es$/assets/aistudio/WhatsApp_Image_2026-10-22_at_13.45.08_2f8393b6.jpeg$es$, $es$Teacher Mr. Gadaffih and learners with interactive EduSmart smart board and tablets$es$),
  ($es$img-campus-aerial$es$, $es$Campus Aerial & Grounds$es$, $es$/src/assets/images/edusmart_campus_banner_1790859700873.jpg$es$, $es$Bird-eye view of lush school grounds, administration blocks and sports field$es$),
  ($es$img-science-eco$es$, $es$Science & Ecosystem Lab$es$, $es$/src/assets/images/diagram_science_ecosystem_1790859717590.jpg$es$, $es$Hands-on biological taxonomy, ecology flora and fauna research workbench$es$),
  ($es$img-math-geometry$es$, $es$Mathematics & Spatial Geometry$es$, $es$/src/assets/images/diagram_math_geometry_1790859731617.jpg$es$, $es$CBC junior secondary geometry charts, coordinate planes and solid shapes$es$),
  ($es$img-african-uniforms$es$, $es$African Classroom Uniforms (Unsplash)$es$, $es$https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80$es$, $es$Learners in traditional school uniforms engaging with teacher in classroom$es$),
  ($es$img-digital-classroom$es$, $es$Modern Digital Classroom (Unsplash)$es$, $es$https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80$es$, $es$High-tech smart classroom with laptops and collaborative group seating$es$);
alter table "edusmart"."hero_image_presets" enable row level security;

grant all privileges on all tables in schema "edusmart" to postgres, service_role;
grant all privileges on all sequences in schema "edusmart" to postgres, service_role;
commit;
