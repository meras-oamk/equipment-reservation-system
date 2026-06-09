-- =====================
-- DROP 
-- =====================

DROP TABLE IF EXISTS equipment_logs CASCADE;
DROP TABLE IF EXISTS pending_verifications CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS equipment_units CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS log_action CASCADE;
DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS equipment_condition CASCADE;
DROP TYPE IF EXISTS equipment_status CASCADE;
DROP TYPE IF EXISTS equipment_category CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================
-- ENUMS
-- =====================

CREATE TYPE user_role AS ENUM (
  'student',
  'staff',
  'admin'
);

CREATE TYPE equipment_category AS ENUM (
  'vr_ar',
  'robotics',
  'audio_video',
  'laboratory',
  'computing',
  'iot_embedded'
);

CREATE TYPE equipment_status AS ENUM (
  'available',
  'checked_out',
  'pending_return',
  'maintenance',
  'broken',
  'lost'
);

CREATE TYPE equipment_condition AS ENUM (
  'good',
  'scratched',
  'missing_parts',
  'malfunction',
  'damaged',
  'lost'
);

CREATE TYPE reservation_status AS ENUM (
  'approved',
  'active',
  'pending_return',
  'overdue',
  'completed',
  'cancelled'
);

CREATE TYPE log_action AS ENUM (
  'checkout',
  'return_scan',
  'admin_confirm_return',
  'cancel',
  'maintenance',
  'transfer'
);

-- =====================
-- TABLES
-- =====================

CREATE TABLE pending_verifications (
  email VARCHAR(255) PRIMARY KEY,
	fullname          VARCHAR(255)  NOT NULL,
  password          VARCHAR(255)  NOT NULL, 
  verification_code VARCHAR(6)    NOT NULL,
  expires_at        TIMESTAMP     NOT NULL
);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name    	VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT NOW(),
  updated_at    TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE equipment_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)       NOT NULL,
  category    equipment_category NOT NULL,
  subcategory  VARCHAR(100),
  description TEXT,
  created_at  TIMESTAMP          DEFAULT NOW(),
  updated_at  TIMESTAMP          DEFAULT NOW()
);

CREATE TABLE equipment_units (
  id               SERIAL PRIMARY KEY,
  type_id          INT                 NOT NULL,
  qr_code          VARCHAR(100)        UNIQUE NOT NULL,
  location         VARCHAR(100),
  status           equipment_status    DEFAULT 'available',
  condition        equipment_condition DEFAULT 'good',
  created_at       TIMESTAMP           DEFAULT NOW(),
  updated_at       TIMESTAMP           DEFAULT NOW(),

  CONSTRAINT fk_unit_type
    FOREIGN KEY (type_id)
    REFERENCES equipment_types(id)
    ON DELETE CASCADE
);

CREATE TABLE reservations (
  id            SERIAL PRIMARY KEY,
  user_id       INT                NOT NULL,
  type_id       INT                NOT NULL,
  unit_id       INT,
  start_time    TIMESTAMP          NOT NULL,
  end_time      TIMESTAMP          NOT NULL,
  status        reservation_status DEFAULT 'approved',
  checkout_time TIMESTAMP,
  return_time   TIMESTAMP,
  return_notes  TEXT,
  created_at    TIMESTAMP          DEFAULT NOW(),

  CONSTRAINT fk_res_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_res_type
    FOREIGN KEY (type_id)
    REFERENCES equipment_types(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_res_unit
    FOREIGN KEY (unit_id)
    REFERENCES equipment_units(id)
    ON DELETE SET NULL
);

CREATE TABLE equipment_logs (
  id               SERIAL PRIMARY KEY,
  unit_id          INT                 NOT NULL,
  user_id          INT,
  reservation_id   INT,
  action           log_action          NOT NULL,
  status_before    equipment_status,
  status_after     equipment_status,
  condition_before equipment_condition,
  condition_after  equipment_condition,
  notes            TEXT,
  created_at       TIMESTAMP           DEFAULT NOW(),

  CONSTRAINT fk_log_unit
    FOREIGN KEY (unit_id)
    REFERENCES equipment_units(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_log_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_log_reservation
    FOREIGN KEY (reservation_id)
    REFERENCES reservations(id)
    ON DELETE SET NULL
);
INSERT INTO equipment_types (name, category, subcategory, description, image_url) VALUES

('Microsoft HoloLens 2', 'vr_ar', 'AR Glasses',
'Storage: 64 GB
Details: Features hands-free interaction, spatial mapping, eye tracking, and holographic visualization.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/Microsoft_HoloLens_2_ipiven'),

('Magic Leap 2', 'vr_ar', 'AR Glasses',
'Storage: 256 GB
Details: Features high-resolution displays, eye tracking, hand tracking, spatial computing capabilities, and immersive AR visualization.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/Magic-Leap-2_danvmc'),

('Valve / HTC SteamVR Base Station 2.0', 'vr_ar', 'Base Stations / Sensors',
'Details: High-precision tracking, large play area coverage, support for multiple tracked devices, low-latency performance, SteamVR compatibility.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/HTC_Steam_VR_2.0_i6pruk'),

('HaptX Gloves G1', 'vr_ar', 'Haptic Gloves',
'Details: Force feedback, microfluidic haptics, finger tracking, realistic touch sensation, precise hand motion capture.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/HaptX_gloves_G1_eo8ia9'),

('HTC Vive Tracker 3.0', 'vr_ar', 'Motion Trackers',
'Sensors: SteamVR Lighthouse Tracking Sensors
Details: Enables precise positional tracking of body movements and physical objects within SteamVR environments.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/HTC_VIVETracker_3_gz12xb'),

('Meta Quest Touch Plus Controller', 'vr_ar', 'VR Controllers',
'Details: Inside-out tracking, TruTouch haptic feedback, ergonomic design, wireless operation, precise motion tracking.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/Meta_Quest_touch_plus_sz6gbc'),

('Meta Quest 3', 'vr_ar', 'VR Headset',
'Storage: 128 GB / 512 GB
Details: Features full color passthrough, high-resolution displays, hand tracking, and wireless operation without external sensors.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/Meta_Quest_3_f1jydb'),

('Lenovo Legion Pro 7i', 'vr_ar', 'VR Ready Laptops',
'Details: NVIDIA RTX graphics, Intel Core HX processor, AI-enhanced performance, advanced thermal management, VR-ready capabilities.',
'https://res.cloudinary.com/dadujbhoi/image/upload/f_auto,q_auto/Lenovo_Legion_Pro_7i_wgvwtf');