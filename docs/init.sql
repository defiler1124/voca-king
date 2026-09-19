-- ==============================================================================
-- VOCA KING 초기 데이터
-- ==============================================================================
-- MySQL 데이터베이스 초기 설정 및 샘플 데이터

-- 기본 관리자 계정 생성 (비밀번호: admin123 - BCrypt 해시)
-- 실제 운영에서는 반드시 변경할 것!
INSERT INTO users (email, password, name, role, active, created_at, updated_at)
VALUES (
    'admin@vocaking.com',
    '$2a$10$N4fS9Q5Q5Q5Q5Q5Q5Q5Q5OMv6XZ5vS5vS5vS5vS5vS5vS5vS5vS5u', -- admin123
    '관리자',
    'ADMIN',
    TRUE,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE email = email;

-- 샘플 레벨 데이터
INSERT INTO levels (name, color, light_color, order_index) VALUES
('Lv.1 Newbie', '#D32F3F', '#FFE5E5', 1),
('Lv.2 Newbie', '#A84D00', '#FFF3E0', 2),
('Lv.3 Newbie', '#8F6600', '#FFFDE7', 3),
('Lv.4 Newbie', '#00726A', '#E0F7FA', 4),
('Lv.5 Master', '#0B8850', '#E8F5E9', 5),
('Lv.6 Master', '#6552E0', '#EDE7F6', 6),
('Lv.7 Master', '#C22B76', '#FCE4EC', 7),
('Lv.8 Grand Master', '#00705F', '#E0F5F0', 8),
('Lv.9 Grand Master', '#4433C8', '#EDE9FD', 9),
('Lv.10 Legend', '#4A5468', '#ECEFF1', 10),
('Lv.11-12 Voca King', '#B01050', '#FCE4EC', 11)
ON DUPLICATE KEY UPDATE name = VALUES(name);
