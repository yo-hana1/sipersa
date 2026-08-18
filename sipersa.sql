-- Database: db_sipersa
-- Description: Database schema for Sistem Informasi Persuratan dan Arsip (SIPERSA)

CREATE DATABASE IF NOT EXISTS db_sipersa;
USE db_sipersa;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'tata_usaha', 'kepala_sekolah', 'guru') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Table: letters_incoming (Surat Masuk)
CREATE TABLE IF NOT EXISTS letters_incoming (
    id INT AUTO_INCREMENT PRIMARY KEY,
    letter_number VARCHAR(50) NOT NULL,
    sender VARCHAR(100) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    date_received DATE NOT NULL,
    file_path VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Diterima',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Table: letters_outgoing (Surat Keluar)
CREATE TABLE IF NOT EXISTS letters_outgoing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    letter_number VARCHAR(50) NOT NULL UNIQUE,
    sender VARCHAR(100) NOT NULL,
    recipient VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    date_sent DATE NOT NULL,
    file_path VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Terkirim',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Table: letter_requests (Permohonan Surat)
CREATE TABLE IF NOT EXISTS letter_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    letter_type VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT,
    date_requested DATE NOT NULL,
    status ENUM('Menunggu', 'Disetujui', 'Ditolak', 'Selesai', 'Diproses') DEFAULT 'Menunggu',
    file_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Table: letter_templates
CREATE TABLE IF NOT EXISTS letter_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Seed initial data
INSERT INTO users (username, password, full_name, role) VALUES 
('admin', 'admin123', 'Administrator SIPERSA', 'admin'),
('tu', 'tu123', 'Petugas Tata Usaha', 'tata_usaha'),
('kepsek', 'kepsek123', 'Kepala Sekolah', 'kepala_sekolah'),
('guru', 'guru123', 'Guru Pengajar', 'guru');
