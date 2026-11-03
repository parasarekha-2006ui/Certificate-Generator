-- Online Certificate Generator Database Schema
-- Database name: online_certificate_db

CREATE DATABASE IF NOT EXISTS online_certificate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE online_certificate_db;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    college VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_student_dept (department),
    INDEX idx_student_year (year)
) ENGINE=InnoDB;

-- 3. Certificate Templates Table (7 designs)
CREATE TABLE IF NOT EXISTS certificate_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(150) NOT NULL,
    default_body TEXT NOT NULL,
    primary_color VARCHAR(20) DEFAULT '#1e3a8a',
    secondary_color VARCHAR(20) DEFAULT '#6366f1',
    accent_color VARCHAR(20) DEFAULT '#d97706',
    border_style VARCHAR(30) DEFAULT 'classic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Events Table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    issuing_authority VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_event_name (name)
) ENGINE=InnoDB;

-- 5. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_id VARCHAR(60) NOT NULL UNIQUE,
    student_id INT NULL,
    event_id INT NULL,
    template_id INT NULL,
    certificate_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    college_name VARCHAR(200) NOT NULL,
    department VARCHAR(100) NOT NULL,
    year VARCHAR(20) NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    issue_date DATE NOT NULL,
    description TEXT,
    issuing_authority VARCHAR(150) NOT NULL,
    status ENUM('Valid', 'Revoked') DEFAULT 'Valid' NOT NULL,
    qr_code_path VARCHAR(255) NULL,
    pdf_path VARCHAR(255) NULL,
    logo_path VARCHAR(255) NULL,
    signature_path VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL,
    INDEX idx_cert_id (certificate_id),
    INDEX idx_cert_type (certificate_type),
    INDEX idx_cert_status (status),
    INDEX idx_cert_event (event_id),
    INDEX idx_cert_student (student_id)
) ENGINE=InnoDB;

-- Seed the 7 Certificate Templates
INSERT INTO certificate_templates (template_key, name, title, default_body, primary_color, secondary_color, accent_color, border_style)
VALUES 
(
    'participation',
    'Participation Certificate',
    'CERTIFICATE OF PARTICIPATION',
    'This is proudly presented to {student_name} from {college_name}, Department of {department} ({year}), for actively participating in the {event_name} held on {event_date}.',
    '#1e3a8a',
    '#3b82f6',
    '#d97706',
    'classic_double'
),
(
    'achievement',
    'Achievement Certificate',
    'CERTIFICATE OF ACHIEVEMENT',
    'This certificate of distinction is awarded to {student_name} from {college_name}, Department of {department} ({year}), in recognition of outstanding performance and securing an exceptional rank in {event_name} held on {event_date}.',
    '#0f172a',
    '#b45309',
    '#eab308',
    'royal_gold'
),
(
    'workshop',
    'Workshop Completion',
    'CERTIFICATE OF WORKSHOP COMPLETION',
    'This certifies that {student_name} from {college_name}, Department of {department} ({year}), has successfully completed the intensive hands-on technical workshop on {event_name} conducted on {event_date}.',
    '#065f46',
    '#10b981',
    '#047857',
    'modern_emerald'
),
(
    'seminar',
    'Seminar Attendance',
    'CERTIFICATE OF SEMINAR ATTENDANCE',
    'This is to certify that {student_name} from {college_name}, Department of {department} ({year}), attended and contributed to the academic seminar on {event_name} organized on {event_date}.',
    '#4c1d95',
    '#8b5cf6',
    '#6366f1',
    'academic_purple'
),
(
    'hackathon',
    'Hackathon Excellence',
    'HACKATHON EXCELLENCE AWARD',
    'In recognition of exemplary innovation, coding endurance, and problem-solving prowess demonstrated by {student_name} from {college_name}, Department of {department} ({year}), at {event_name} on {event_date}.',
    '#111827',
    '#6366f1',
    '#06b6d4',
    'cyber_tech'
),
(
    'internship',
    'Internship Completion',
    'INTERNSHIP COMPLETION CERTIFICATE',
    'This is to certify that {student_name} from {college_name}, Department of {department} ({year}), has successfully completed an institutional internship program in {event_name} concluded on {event_date}. Their diligence and enthusiasm are highly commended.',
    '#1e293b',
    '#2563eb',
    '#0284c7',
    'corporate_blue'
),
(
    'nss',
    'National Service Scheme (NSS)',
    'NSS APPRECIATION CERTIFICATE',
    'Presented to NSS Volunteer {student_name} from {college_name}, Department of {department} ({year}), for selfless community service and dedicated volunteer leadership during the {event_name} initiative on {event_date}.',
    '#7f1d1d',
    '#dc2626',
    '#b91c1c',
    'national_crimson'
)
ON DUPLICATE KEY UPDATE 
    name=VALUES(name),
    title=VALUES(title),
    default_body=VALUES(default_body),
    primary_color=VALUES(primary_color),
    secondary_color=VALUES(secondary_color),
    accent_color=VALUES(accent_color),
    border_style=VALUES(border_style);

-- Seed Sample Events
INSERT INTO events (id, name, event_date, description, issuing_authority)
VALUES
(1, 'Annual Tech Symposium & Hackathon 2026', '2026-03-15', 'A national-level technical symposium and 24-hour innovation hackathon bringing together students across engineering domains.', 'Prof. Dr. R. K. Sharma, Dean of Academic Affairs'),
(2, 'Workshop on Cloud Native Architectures & DevOps', '2026-02-20', 'Hands-on training session on Docker, Kubernetes, CI/CD pipelines, and cloud computing principles.', 'Dr. S. Meenakshi, Head of Computer Science & Engineering'),
(3, 'National Seminar on Artificial Intelligence & Ethics', '2026-01-28', 'Interactive academic forum exploring ethical frameworks in modern machine learning and large language models.', 'Prof. A. N. Varma, Director of Research & Development'),
(4, 'NSS Village Outreach & Rural Health Camp', '2026-02-05', 'Community outreach initiative providing free medical checkups and digital literacy sessions in adopted rural clusters.', 'Capt. M. Suresh, NSS Programme Officer')
ON DUPLICATE KEY UPDATE 
    name=VALUES(name),
    event_date=VALUES(event_date),
    description=VALUES(description),
    issuing_authority=VALUES(issuing_authority);

-- Seed Sample Students for testing
INSERT INTO students (id, student_id, name, college, department, year, email, phone)
VALUES
(1, 'STU2026001', 'Aarav Patel', 'Apex Institute of Technology', 'Computer Science and Engineering', '3rd Year', 'aarav.patel@example.com', '9876543210'),
(2, 'STU2026002', 'Priya Sundaram', 'Apex Institute of Technology', 'Information Technology', '4th Year', 'priya.sundaram@example.com', '9876543211'),
(3, 'STU2026003', 'Rohan Mehta', 'Apex Institute of Technology', 'Electronics and Communication', '2nd Year', 'rohan.mehta@example.com', '9876543212')
ON DUPLICATE KEY UPDATE 
    student_id=VALUES(student_id),
    name=VALUES(name),
    college=VALUES(college),
    department=VALUES(department),
    year=VALUES(year),
    email=VALUES(email),
    phone=VALUES(phone);
