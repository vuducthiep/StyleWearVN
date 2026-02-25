package com.example.StyleStore.service;

import com.example.StyleStore.dto.PromotionDto;
import com.example.StyleStore.model.Promotion;
import com.example.StyleStore.repository.PromotionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PromotionService {

    private final PromotionRepository promotionRepository;

    public PromotionService(PromotionRepository promotionRepository) {
        this.promotionRepository = promotionRepository;
    }

    public List<PromotionDto> getAvailablePromotions() {
        LocalDateTime now = LocalDateTime.now();
        return promotionRepository
                .findByIsActiveTrueAndStartAtLessThanEqualAndEndAtGreaterThanEqual(now, now)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private PromotionDto toDto(Promotion promotion) {
        return PromotionDto.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .discountPercent(promotion.getDiscountPercent())
                .maxDiscountAmount(promotion.getMaxDiscountAmount())
                .minOrderAmount(promotion.getMinOrderAmount())
                .startAt(promotion.getStartAt())
                .endAt(promotion.getEndAt())
                .isActive(promotion.getIsActive())
                .build();
    }
}