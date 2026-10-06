package com.vocaking.repository;

import com.vocaking.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 사용자 레포지토리
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /** 아이디로 사용자 조회 */
    Optional<User> findByUsername(String username);

    /** 아이디 중복 확인 */
    boolean existsByUsername(String username);
}
