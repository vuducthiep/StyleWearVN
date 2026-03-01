package com.example.StyleStore.repository;

import com.example.StyleStore.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    @Query("""
            SELECT u
            FROM User u
            WHERE LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<User> searchByFullNameOrEmail(@Param("keyword") String keyword, Pageable pageable);

    boolean existsByEmail(String email);

    interface MonthlyUserProjection {
        Integer getYear();

        Integer getMonth();

        Long getCount();
    }

    @Query(value = """
                SELECT YEAR(u.created_at) AS year,
                       MONTH(u.created_at) AS month,
                       COUNT(u.id) AS count
                FROM users u
                WHERE u.created_at >= :from AND u.created_at < :to
                GROUP BY YEAR(u.created_at), MONTH(u.created_at)
                ORDER BY year, month
            """, nativeQuery = true)
    List<MonthlyUserProjection> countMonthlyUsers(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query(value = "SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'", nativeQuery = true)
    long countActiveUsers();
}
