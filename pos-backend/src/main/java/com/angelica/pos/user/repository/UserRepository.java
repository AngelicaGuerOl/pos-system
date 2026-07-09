package com.angelica.pos.user.repository;

import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByUsernameIgnoreCaseAndActiveTrue(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCaseAndIdNot(String username, Long id);

    boolean existsByRoleAndActiveTrue(Role role);

    long countByRoleAndActiveTrue(Role role);

    Optional<User> findByIdAndActiveTrue(Long id);

    @Query("""
            SELECT u
            FROM User u
            WHERE u.active = true
              AND (
                    :search IS NULL
                    OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<User> findAllActiveWithFilters(
            @Param("search") String search,
            Pageable pageable
    );
}
