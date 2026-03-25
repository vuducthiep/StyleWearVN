package com.example.StyleStore.repository;

import com.example.StyleStore.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    Optional<Promotion> findByCode(String code);

    @Query("""
            SELECT p
            FROM Promotion p
            WHERE LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
               OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<Promotion> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    List<Promotion> findByIsActiveTrueAndStartAtLessThanEqualAndEndAtGreaterThanEqual(LocalDateTime startAt,
            LocalDateTime endAt);

    @Query("""
            SELECT p
            FROM Promotion p
            WHERE p.isActive = true
              AND p.startAt <= :now
              AND p.endAt >= :now
              AND (
                    :keyword = ''
                    OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(COALESCE(p.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
              )
            """)
    Page<Promotion> findAvailablePromotions(@Param("now") LocalDateTime now,
            @Param("keyword") String keyword,
            Pageable pageable);
}