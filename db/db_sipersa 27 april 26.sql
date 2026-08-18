-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 27, 2026 at 02:58 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_sipersa`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `letters_incoming`
--

CREATE TABLE `letters_incoming` (
  `id` int NOT NULL,
  `letter_number` varchar(50) NOT NULL,
  `sender` varchar(100) NOT NULL,
  `recipient` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `date_received` date NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Diterima',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `letters_outgoing`
--

CREATE TABLE `letters_outgoing` (
  `id` int NOT NULL,
  `template_id` int DEFAULT NULL,
  `letter_number` varchar(50) DEFAULT NULL,
  `sender` varchar(100) NOT NULL,
  `recipient` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `date_sent` date DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Terkirim',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `request_id` int DEFAULT NULL,
  `draft_data` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `letters_outgoing`
--

INSERT INTO `letters_outgoing` (`id`, `template_id`, `letter_number`, `sender`, `recipient`, `subject`, `date_sent`, `file_path`, `status`, `created_at`, `request_id`, `draft_data`) VALUES
(1, 1, 'TEST/001', 'PAUD Terpadu Restu 2', 'Test Recipient', 'Test Subject', NULL, NULL, 'Draft', '2026-04-26 14:20:50', NULL, NULL),
(3, 2, '1001/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'Kepala Sekolah Test', 'Test Perihal Surat', NULL, NULL, 'Draft', '2026-04-26 14:23:11', 7, NULL),
(4, 2, '1002/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'Surat keterangan izin mengajar', 'Surat keterangan izin mengajar', NULL, NULL, 'Draft', '2026-04-26 14:27:58', 5, NULL),
(5, 2, '1003/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'Pengajuan cuti', 'Pengajuan cuti', NULL, NULL, 'Draft', '2026-04-26 14:36:01', 1, NULL),
(6, 2, '1004/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', '', '', NULL, NULL, 'Draft', '2026-04-26 16:02:27', NULL, '{\"content\":\"Berkenaan dengan permohonan , Menerangkan dengan sesungguhnya bahwa\",\"subject\":\"\",\"recipient\":\"\"}'),
(7, 2, '1005/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'Kepala Sekolah Test', 'Test Perihal Surat', NULL, NULL, 'Draft', '2026-04-27 02:22:54', 7, '{\"content\":\"<p>Berkenaan dengan permohonan <strong>Test Perihal Surat</strong>, Menerangkan dengan sesungguhnya bahwa...</p>\",\"subject\":\"Test Perihal Surat\",\"recipient\":\"Kepala Sekolah Test\"}'),
(8, 3, '1001/PAUD-R2/ST/IV/2026', 'PAUD Terpadu Restu 2', 'kepsek', 'abc', NULL, NULL, 'Draft', '2026-04-27 02:23:20', 8, NULL),
(9, 1, '1001/PAUD-R2/UND/IV/2026', 'PAUD Terpadu Restu 2', 'Kepala Sekolah', 'Pengajuan cuti', NULL, NULL, 'Draft', '2026-04-27 02:23:35', 9, '{\"content\":\"<p>Berkenaan dengan permohonan <strong>Pengajuan cuti</strong>, Dengan ini kami mengundang...</p>\",\"subject\":\"Pengajuan cuti\",\"recipient\":\"Kepala Sekolah\"}'),
(10, 1, '1002/PAUD-R2/UND/IV/2026', 'PAUD Terpadu Restu 2', '', '', NULL, NULL, 'Draft', '2026-04-27 02:24:08', NULL, '{\"content\":\"<p>Berkenaan dengan permohonan <strong></strong>, Dengan ini kami mengundang...</p>\",\"subject\":\"\",\"recipient\":\"\"}'),
(11, 2, '1006/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'kepsek', 'test1', NULL, NULL, 'Draft', '2026-04-27 02:41:40', 10, '{\"content\":\"dfddfd dengan permohonan test1, Menerangkan dengan sesungguhnya bahwa...\",\"subject\":\"test1\",\"recipient\":\"kepsek\"}'),
(12, 2, '1007/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'Bagian Kepegawaian', 'Permohonan Cuti Sakit', NULL, NULL, 'Draft', '2026-04-27 02:43:17', 6, '{\"content\":\"<p>Berkenaan dengan permohonan <strong>Permohonan Cuti Sakit</strong>, Menerangkan dengan sesungguhnya bahwa...</p>\",\"subject\":\"Permohonan Cuti Sakit\",\"recipient\":\"Bagian Kepegawaian\"}'),
(13, 2, '1008/PAUD-R2/SK/IV/2026', 'PAUD Terpadu Restu 2', 'Surat keterangan izin mengajar', 'Surat keterangan izin mengajar', NULL, NULL, 'Draft', '2026-04-27 02:44:11', 5, '{\"content\":\"Berkenaan dengan permohonan Surat keterangan izin mengajar, Menerangkan dengan sesungguhnya bahwgghghgghghghghg. selama \",\"subject\":\"Surat keterangan izin mengajar\",\"recipient\":\"Surat keterangan izin mengajar\"}');

-- --------------------------------------------------------

--
-- Table structure for table `letter_requests`
--

CREATE TABLE `letter_requests` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `letter_type` varchar(100) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` text,
  `date_requested` date NOT NULL,
  `status` enum('Menunggu','Disetujui','Ditolak','Selesai','Diproses') DEFAULT 'Menunggu',
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `letter_requests`
--

INSERT INTO `letter_requests` (`id`, `user_id`, `letter_type`, `subject`, `content`, `date_requested`, `status`, `file_path`, `created_at`) VALUES
(1, 4, 'Pengajuan cuti', 'Pengajuan cuti', 'Sehubungan dengan adanya halal bihalal di RT maka dengan ini saya Yohana mengajukan cuti pada tanggal 24 April', '2026-04-23', 'Diproses', NULL, '2026-04-23 06:32:46'),
(2, 5, 'Request Surat Keterangan Kerja', 'Request Surat Keterangan Kerja', 'Mohon dibuatkan surat keterangan kerja untuk keperluan administrasi bank. Terima kasih.', '2026-04-23', 'Menunggu', NULL, '2026-04-23 07:31:37'),
(3, 5, 'Surat Keterangan Mengajar', 'Surat Keterangan Mengajar', 'Mohon dibuatkan surat keterangan mengajar untuk keperluan administrasi.', '2026-04-23', 'Menunggu', 'uploads/1776930426_ucmpo1.jpg', '2026-04-23 07:47:06'),
(4, 5, 'Test Surat Keputusan', 'Test Surat Keputusan', 'Ini adalah test permohonan surat untuk verifikasi logika urutan.', '2026-04-23', 'Menunggu', NULL, '2026-04-23 07:52:11'),
(5, 4, 'Surat keterangan izin mengajar', 'Surat keterangan izin mengajar', 'jjjjjj', '2026-04-23', 'Diproses', 'uploads/1776931666_Kalender Beasiswa 2026.pdf', '2026-04-23 08:07:46'),
(6, 4, 'Bagian Kepegawaian', 'Permohonan Cuti Sakit', 'Saya ingin mengajukan cuti...', '2026-04-23', 'Diproses', NULL, '2026-04-23 12:04:08'),
(7, 4, 'Kepala Sekolah Test', 'Test Perihal Surat', 'Ini adalah isi surat test untuk verifikasi auto generate.', '2026-04-23', 'Diproses', NULL, '2026-04-23 12:07:17'),
(8, 4, 'kepsek', 'abc', 'haiii', '2026-04-25', 'Diproses', NULL, '2026-04-25 11:44:47'),
(9, 4, 'Kepala Sekolah', 'Pengajuan cuti', 'saya yohana mengajukan cuti pada 32 april', '2026-04-25', 'Diproses', 'uploads/1777139554_SLA KN Amelia-Yohana.pdf', '2026-04-25 17:52:34'),
(10, 4, 'kepsek', 'test1', 'halo', '2026-04-27', 'Diproses', 'uploads/1777257413_SLA KN Amelia-Yohana.pdf', '2026-04-27 02:36:53');

-- --------------------------------------------------------

--
-- Table structure for table `letter_templates`
--

CREATE TABLE `letter_templates` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `number_format` varchar(100) DEFAULT NULL,
  `content` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `letter_templates`
--

INSERT INTO `letter_templates` (`id`, `name`, `type`, `number_format`, `content`, `created_at`) VALUES
(1, 'Surat Undangan', 'undangan', '[SEQ]/PAUD-R2/UND/[MONTH]/[YEAR]', '<p>Dengan ini kami mengundang...</p>', '2026-04-23 06:42:45'),
(2, 'Surat Keterangan', 'keterangan', '[SEQ]/PAUD-R2/SK/[MONTH]/[YEAR]', '<p>Menerangkan dengan sesungguhnya bahwa...</p>', '2026-04-23 06:42:45'),
(3, 'Surat Tugas', 'tugas', '[SEQ]/PAUD-R2/ST/[MONTH]/[YEAR]', '<p>Menugaskan kepada...</p>', '2026-04-23 06:42:45');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `jabatan` varchar(100) DEFAULT NULL,
  `role` enum('admin','tata_usaha','kepala_sekolah','guru') NOT NULL,
  `status` enum('aktif','tidak aktif') DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `email`, `jabatan`, `role`, `status`, `created_at`, `updated_at`) VALUES
(1, 'admin@restudua.com', 'admin123', 'Administrator SIPERSA', 'admin@restudua.com', 'Administrator', 'admin', 'aktif', '2026-04-23 06:02:11', '2026-04-23 10:48:04'),
(2, 'tu@restudua.com', 'tu123', 'Dhea Amanda', 'tu@restudua.com', 'Tata Usaha', 'tata_usaha', 'aktif', '2026-04-23 06:02:11', '2026-04-23 10:49:09'),
(3, 'kepsek@restudua.com', 'kepsek123', 'Maslichah Hartatik, S.S', 'kepsek@restudua.com', 'Kepala Sekolah ', 'kepala_sekolah', 'aktif', '2026-04-23 06:02:11', '2026-04-23 10:50:14'),
(4, 'guru1@restudua.com', 'gurusatu', 'Guru 1', 'guru1@restudua.com', 'Guru KB1', 'guru', 'aktif', '2026-04-23 06:02:11', '2026-04-25 10:50:44'),
(5, 'guru@test.com', 'password123', 'Guru Updated', 'guru@test.com', 'Guru Matematika', 'guru', 'tidak aktif', '2026-04-23 07:29:55', '2026-04-23 10:26:15');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `letters_incoming`
--
ALTER TABLE `letters_incoming`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `letters_outgoing`
--
ALTER TABLE `letters_outgoing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `letter_number` (`letter_number`),
  ADD KEY `template_id` (`template_id`);

--
-- Indexes for table `letter_requests`
--
ALTER TABLE `letter_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `letter_templates`
--
ALTER TABLE `letter_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `letters_incoming`
--
ALTER TABLE `letters_incoming`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `letters_outgoing`
--
ALTER TABLE `letters_outgoing`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `letter_requests`
--
ALTER TABLE `letter_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `letter_templates`
--
ALTER TABLE `letter_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `letters_outgoing`
--
ALTER TABLE `letters_outgoing`
  ADD CONSTRAINT `letters_outgoing_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `letter_templates` (`id`);

--
-- Constraints for table `letter_requests`
--
ALTER TABLE `letter_requests`
  ADD CONSTRAINT `letter_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
