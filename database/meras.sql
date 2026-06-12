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

CREATE TABLE IF NOT EXISTS system_settings (
  key        VARCHAR(50) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
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

INSERT INTO equipment_types (name, category, subcategory, description, image_url) VALUES
('Valve / HTC SteamVR Base Station 1.0', 'vr_ar', 'Base Stations / Sensors', 'Details: Reliable positional tracking, SteamVR ecosystem support, room-scale coverage, multi-device tracking, low-latency operation.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/HTC_Steam_VR_1.0_sqluvq'),
('OptiTrack (NaturalPoint) PrimeX 13', 'vr_ar', 'Base Stations / Sensors', 'Details: High-resolution tracking, precise marker detection, low-latency performance, large capture volume support, real-time motion capture.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/OptiTrack_PrimeX_13_moimlq'),
('SenseGlove (Netherlands) Nova 2', 'vr_ar', 'Haptic Gloves', 'Details: Force feedback, wireless operation, finger tracking, ergonomic design, enterprise XR compatibility.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/SenseGlove_Nova_2_h34eza'),
('SenseGlove (Netherlands) DK1', 'vr_ar', 'Haptic Gloves', 'Details: Force feedback, hand tracking, object interaction simulation, developer SDK support, VR integration.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/senseglove-dk1_ojkumx'),
('HTC Vive Ultimate Tracker', 'vr_ar', 'Motion Trackers', 'Sensors: Multiple Integrated Cameras + IMU Sensors
Details: For full-body tracking and object tracking without requiring external base stations.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/HTC_ultimate_tracker_bkjlqc'),
('Rokoko (Denmark) Smartsuit Pro II', 'vr_ar', 'Motion Trackers', 'Sensors: 19 Integrated IMU Sensors
Details: Captures full-body movement in real time without external cameras.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Smartsuit_pro_II_vlgkor'),
('Meta Quest Touch Pro Controller', 'vr_ar', 'VR Controllers', 'Details: Self-tracking cameras, TruTouch Pro haptics, stylus support, wireless connectivity, high-precision tracking.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Meta_Quest_Touch_Pro_g5dziw'),
('Valve Index Controllers (Knuckles)', 'vr_ar', 'VR Controllers', 'Details: Finger tracking, grip sensing, SteamVR tracking, ergonomic hand straps, advanced haptic feedback.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Valve_Index_Knucles_vohwdz'),
('Meta Quest 3S', 'vr_ar', 'VR Headset', 'Storage: 128 GB / 256 GB
Details: Features inside-out tracking, wireless operation, mixed reality capabilities, and hand-tracking support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Meta_Quest_3_blfehx'),
('Pico 4 Ultra', 'vr_ar', 'VR Headset', 'Storage: 256 GB
Details: Features full color passthrough, advanced spatial computing capabilities, and wireless operation.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Pico_4_ultra_h8vf4s'),
('Dell Alienware m18 R2', 'vr_ar', 'VR Ready Laptops', 'Details: Large 18-inch display, NVIDIA RTX graphics, Intel Core HX processor, advanced cooling technology, high-performance VR support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Dell_Alienware_m18_R2_tw6tea'),
('DJI Mini 4 Pro', 'robotics', 'Drones', 'Details: Obstacle avoidance, 4K camera.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/DJI_Mini_4_pro_xnkxnf'),
('DJI Mavic 3 Enterprise', 'robotics', 'Drones', 'Details: High-resolution camera, RTK support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/DJI_Mavic_3_Enterprise_kocf8h'),
('LEGO Education SPIKE Prime', 'robotics', 'Educational Robots', 'Details: Programmable hub, sensors, motors, block-based and Python programming.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Lego_spike_prime_otayeg'),
('VEX Robotics V5 Classroom Starter Kit', 'robotics', 'Educational Robots', 'Details: Programmable controller, sensors, modular construction.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/VEX_V5_classroom_starter_kit_a0ygrf'),
('NVIDIA Jetson Orin Nano', 'robotics', 'Embedded Boards', 'Details: GPU acceleration, AI processing.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/NVIDIA_Jetson_Xavier_NX_gacu6h'),
('Arduino Uno R4 WiFi', 'robotics', 'Embedded Boards', 'Details: Wi-Fi connectivity, sensor integration.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Arduino_Uno_R4_Wifi_uxkvxp'),
('Clearpath Robotics TurtleBot 4', 'robotics', 'Mobile Robots', 'Details: ROS2 support, LiDAR, autonomous navigation.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/TurtleBot_4_k4oxyy'),
('Clearpath Robotics Husky A200', 'robotics', 'Mobile Robots', 'Details: All-terrain mobility, GPS support, ROS integration.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Husky_A200_i8kide'),
('BasicMicro RoboClaw 2x15A', 'robotics', 'Motor Controllers', 'Details: Encoder support, PID control.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/RoboClaw_2x15A_zjexgg'),
('Dimension Engineering Sabertooth 2x32', 'robotics', 'Motor Controllers', 'Details: Regenerative braking, dual motor support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Sabertooth_2_x_32_o0xyfw'),
('Dobot Robotics Magician', 'robotics', 'Robot Arms', 'Details: Multi-tool support, programming interface.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Dobot_Magician_lidukh'),
('Universal Robots UR3e', 'robotics', 'Robot Arms', 'Details: Force sensing, precision control.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/UR3e_gh0blj'),
('Intel RealSense D455', 'robotics', 'Sensors', 'Details: RGB-D sensing, depth mapping.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Intel_RealSense_D455_a4agvx'),
('Microsoft Azure Kinect DK', 'robotics', 'Sensors', 'Details: Depth sensing, body tracking.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Azure-Kinect-DK_qbepxz'),
('Sony A7 IV', 'audio_video', 'Cameras', 'Details: 33MP sensor, 4K video recording, image stabilization, fast autofocus, interchangeable lenses.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/sony-a7-iv_pakevw'),
('Canon EOS R6 Mark II', 'audio_video', 'Cameras', 'Details: Full-frame sensor, 4K video, advanced autofocus, image stabilization, low-light performance.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Cannon_EOS_R6_Mark_II_nt9r3l'),
('Elgato Cam Link 4K', 'audio_video', 'Capture Cards', 'Details: 4K input support, plug-and-play operation, low latency.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Elgato_Cam_Link_4K_evgw4l'),
('AVerMedia Live Gamer Ultra 2.1', 'audio_video', 'Capture Cards', 'Details: 4K capture, HDMI 2.1 support, high refresh rates.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/AVerMedia_Live_Gamer_Ultra_2.1_qw34dw'),
('Aputure Amaran 200x S', 'audio_video', 'Lighting Kits', 'Details: Adjustable color temperature, high brightness, wireless control.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Aputure_Amaran_200x_S_dsk47m'),
('Godox SL60IIBi', 'audio_video', 'Lighting Kits', 'Details: Bi-color lighting, quiet cooling system, adjustable brightness.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Godox_SL60IIBi_hihjle'),
('Rode NTG4+', 'audio_video', 'Microphones', 'Details: Directional pickup, rechargeable battery, low-noise recording.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Rode_NTG4_zulkfp'),
('Shure SM7B', 'audio_video', 'Microphones', 'Details: Dynamic microphone, noise rejection, studio-quality audio.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Shure-SM7B_yhtl11'),
('Manfrotto Befree Advanced', 'audio_video', 'Tripods', 'Details: Lightweight design, quick-release system, compact folding.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Manfrotto_Befree_Advanced_jdkndf'),
('Manfrotto 190X', 'audio_video', 'Tripods', 'Details: Adjustable height, sturdy construction, versatile mounting.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Manfrotto_190X_avnvgb'),
('Blackmagic ATEM Mini Pro', 'audio_video', 'Video Switches', 'Details: Multi-camera switching, live streaming, recording support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Blackmagic_ATEM_Television_Studio_HD8_odvic1'),
('Ultimaker S5 i3 MK4', 'laboratory', '3D Printers', 'Details: Dual extrusion, large build volume, network connectivity.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/The_Ultimaker_S5_qnecca'),
('Prusa Research', 'laboratory', '3D Printers', 'Details: Automatic calibration, open-source ecosystem, high print quality.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Prusa_i3_MK4_zng4e8'),
('Olympus CX23', 'laboratory', 'Microscopes', 'Details: LED illumination, ergonomic design, high-quality optics.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Olympus_CX23_jtrrsi'),
('Leica Microsystems DM500', 'laboratory', 'Microscopes', 'Details: Precision optics, LED illumination, durable construction.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Leica_DM500_ambzww'),
('Fluke Fluke', 'laboratory', 'Multimeters', 'Details: True RMS measurements, high accuracy, rugged design.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Fluke_87V_c5n6ya'),
('Fluke 117', 'laboratory', 'Multimeters', 'Details: Non-contact voltage detection, True RMS, portable design', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Fluke_117_skekio'),
('Tektronix TBS1052C', 'laboratory', 'Oscilloscopes', 'Details: 50 MHz bandwidth, waveform analysis, educational interface, USB connectivity.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Tektronix_TBS1052C_bkwhuf'),
('Keysight Technologies DSOX1204G', 'laboratory', 'Oscilloscopes', 'Details: Four channels, built-in waveform generator, automated measurements.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Keysight_DSOX1204G_xv9mjc'),
('Keysight Technologies E36312A', 'laboratory', 'Power Supplies', 'Details: Multiple outputs, remote control, low noise operation.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Keysight_E36312A_ofsqqu'),
('Rigol Technologies DP832A', 'laboratory', 'Power Supplies', 'Details: Triple output, programmable control, overcurrent protection.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Rigol_DP832A_b1dhhi'),
('Keysight Technologies 33500B Series', 'laboratory', 'Signal Generators', 'Details: Arbitrary waveform generation, high signal accuracy, USB connectivity.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Keysight_33500B_Series_x6dtwg'),
('Rigol Technologies DG1022Z', 'laboratory', 'Signal Generators', 'Details: Arbitrary waveforms, frequency sweep, modulation support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Rigol_DG1022Z_qrmwhc'),
('NVIDIA RTX 6000 Ada Generation', 'computing', 'GPUs', 'Details: Large VRAM, ray tracing, AI acceleration.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/NVIDIA_RTX_6000_Ada_dbrr2e'),
('NVIDIA RTX A5000', 'computing', 'GPUs', 'Details: Professional drivers, high-performance rendering, AI support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/NVIDIA_RTX_A5000_kngczx'),
('Dell Latitude 7450', 'computing', 'Laptops', 'Details: Intel Core Ultra processor, lightweight design, long battery life, enterprise security.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Dell_Latitude_7450_yi1wsd'),
('Lenovo ThinkPad T14 Gen 5', 'computing', 'Laptops', 'Details: Durable construction, enterprise security, high-performance computing.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/HP_EliteBook_840_G11_d0anmi'),
('Cisco Catalyst 9300', 'computing', 'Networking Equipment', 'Details: Layer 3 switching, high-speed connectivity, network security.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Cisco_Meraki_MX75_lqzu4a'),
('Ubiquiti UniFi Dream Machine Pro', 'computing', 'Networking Equipment', 'Details: Centralized management, firewall, network monitoring.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Ubiquiti_UniFi_Dream_Machine_Pro_xizcet'),
('Raspberry Pi 5 Starter Kit', 'computing', 'Raspberry Pi Kits', 'Details: GPIO support, Wi-Fi, Bluetooth, accessories included.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Raspberry_Pi_5_Starter_Kit_oxbcxk'),
('Raspberry Pi 4 Model B Kit', 'computing', 'Raspberry Pi Kits', 'Details: Multiple USB ports, Wi-Fi, Linux support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Raspberry_Pi_4_Model_B_Kit_bhrqa1'),
('Apple iPad Pro 13-inch', 'computing', 'Tablets', 'Details: Apple Pencil support, high-resolution display, powerful performance.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Apple_iPad_Pro_13_zkwxad'),
('Samsung Galaxy Tab S9 Ultra', 'computing', 'Tablets', 'Details: Large AMOLED display, S Pen support, multitasking capabilities.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Samsung_Galaxy_Tab_S9_Ultra_jtpqox'),
('Dell Precision 3680', 'computing', 'Workstations', 'Details: Intel Xeon/Core processors, NVIDIA RTX graphics, ISV certifications.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Dell_Precision_3680_ivosl3'),
('HP  Z4 G5 Workstation', 'computing', 'Workstations', 'Details: Expandable architecture, professional GPU support, enterprise reliability.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/HP_Z4_G5_xqnp1i'),
('Digilent Basys 3', 'iot_embedded', 'FPGA Boards', 'Details: Xilinx Artix-7 FPGA, switches, LEDs, educational toolset.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Digilent_Basys_3_zhbl5w'),
('Digilent Nexys A7', 'iot_embedded', 'FPGA Boards', 'Details: Artix-7 FPGA, extensive I/O, hardware debugging support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Digilent_Nexys_A7_zjs4cz'),
('Heltec Automation WiFi LoRa 32 V3', 'iot_embedded', 'LoRa Devices', 'Details: OLED display, LoRa communication, low-power operation.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Heltec_WiFi_LoRa_32_V3_dck0kz'),
('LilyGO TTGO LoRa32 SX1276', 'iot_embedded', 'LoRa Devices', 'Details: LoRa transceiver, Wi-Fi, Bluetooth, battery support.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/TTGO_LoRa32_SX1276_izrhe6'),
('Arduino Uno R4 WiFi', 'iot_embedded', 'Microcontrollers', 'Details: Built-in Wi-Fi, USB-C connectivity, extensive sensor compatibility, beginner-friendly development.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Arduino_Uno_R4_WiFi_hplvun'),
('Espressif Systems ESP32 DevKitC', 'iot_embedded', 'Microcontrollers', 'Details: Dual-core processor, Wi-Fi, Bluetooth, GPIO expansion.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/ESP32_DevKitC_xudo7m'),
('Aosong DHT22', 'iot_embedded', 'Sensor Modules', 'Details: Digital output, accurate measurements, low power consumption.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/DHT22_Temperature_Humidity_Sensor_dc0ca3'),
('Generic HC-SR04', 'iot_embedded', 'Sensor Modules', 'Details: Non-contact sensing, easy integration, real-time distance measurement.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/HC-SR04_Ultrasonic_Sensor_jmswqp'),
('Arduino Oplà IoT Kit', 'iot_embedded', 'Smart Home Kits', 'Details: Sensors, cloud connectivity, automation projects.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Arduino_Oplà_IoT_Kit_yufe7r'),
('Nabu Casa Home Assistant Green', 'iot_embedded', 'Smart Home Kits', 'Details: Local automation, device integration, energy monitoring.', 'https://res.cloudinary.com/dadujbhoi/image/upload/e_background_removal/f_auto,q_auto/Home_Assistant_Green_jcj6in');

INSERT INTO equipment_units (type_id, qr_code, location, status, condition)
SELECT
    et.id,
    'MERAS-T' || et.id || '-' || (700 + g),
    (ARRAY['Kontinkangas 5a','Kontinkangas SOTE','Linnanmaa Keskusaula','Linnanmaa Kirjasto','Linnanmaa OAMK'])[1 + ((et.id + g) % 5)],
    'available',
    'good'
FROM equipment_types et
CROSS JOIN LATERAL generate_series(1, 3 + floor(random() * 3)::int) AS g
ORDER BY et.id, g;

-- Max reservation duration theo tung category (theo Equipment Reservation and Usage Policy)
INSERT INTO system_settings (key, value) VALUES
('category_rules', '{
  "vr_ar":        { "duration": 24, "unit": "Hours" },
  "robotics":     { "duration": 7,  "unit": "Days"  },
  "audio_video":  { "duration": 72, "unit": "Hours" },
  "laboratory":   { "duration": 2,  "unit": "Days"  },
  "computing":    { "duration": 24, "unit": "Hours" },
  "iot_embedded": { "duration": 24, "unit": "Hours" }
}')
ON CONFLICT (key) DO NOTHING;

-- Buffer Time Between Bookings + Advance Booking Window
INSERT INTO system_settings (key, value) VALUES
('general_booking_settings', '{
  "buffer_hours": 0.5,
  "advance_booking_days": 30
}')
ON CONFLICT (key) DO NOTHING;

-- ── Booking Policies page ──

-- Max Active / Max Future Reservations theo role
INSERT INTO system_settings (key, value) VALUES
('reservation_limits', '{
  "student": { "max_active": 3, "max_future": 5 },
  "staff":   { "max_active": 5, "max_future": 8 }
}')
ON CONFLICT (key) DO NOTHING;

-- Late Return Policy
INSERT INTO system_settings (key, value) VALUES
('late_return_policy', '{
  "grace_period_hours": 0,
  "restriction_days": 7,
  "suspend_after": 3
}')
ON CONFLICT (key) DO NOTHING;

-- Return & Inspection toggles
INSERT INTO system_settings (key, value) VALUES
('return_inspection', '{
  "require_inspection": true,
  "require_qr_scan": true
}')
ON CONFLICT (key) DO NOTHING;