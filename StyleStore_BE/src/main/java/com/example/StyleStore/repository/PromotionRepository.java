package com.example.StyleStore.repository;

import com.example.StyleStore.model.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PromotionRepository extends JpaRepository<Promotion, Long> {
    Optional<Promotion> findByCode(String code);

    List<Promotion> findByIsActiveTrueAndStartAtLessThanEqualAndEndAtGreaterThanEqual(LocalDateTime startAt,
            LocalDateTime endAt);
}