package com.example.StyleStore.service;

import com.example.StyleStore.dto.PromotionDto;
import com.example.StyleStore.model.Promotion;
import com.example.StyleStore.repository.PromotionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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

    public Page<PromotionDto> getAllPromotions(Pageable pageable) {
        return promotionRepository.findAll(pageable)
                .map(this::toDto);
    }

    public PromotionDto createPromotion(PromotionDto request) {
        validatePromotionRequest(request);

        String normalizedCode = request.getCode().trim().toUpperCase();
        if (promotionRepository.findByCode(normalizedCode).isPresent()) {
            throw new IllegalArgumentException("Mã khuyến mãi đã tồn tại");
        }

        Promotion promotion = Promotion.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .discountPercent(request.getDiscountPercent())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(request.getMinOrderAmount())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        return toDto(promotionRepository.save(promotion));
    }

    public PromotionDto updatePromotion(Long id, PromotionDto request) {
        validatePromotionRequest(request);

        Promotion promotion = promotionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khuyến mãi với id: " + id));

        String normalizedCode = request.getCode().trim().toUpperCase();
        promotionRepository.findByCode(normalizedCode).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalArgumentException("Mã khuyến mãi đã tồn tại");
            }
        });

        promotion.setCode(normalizedCode);
        promotion.setName(request.getName().trim());
        promotion.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        promotion.setDiscountPercent(request.getDiscountPercent());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());
        promotion.setMinOrderAmount(request.getMinOrderAmount());
        promotion.setStartAt(request.getStartAt());
        promotion.setEndAt(request.getEndAt());
        promotion.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);

        return toDto(promotionRepository.save(promotion));
    }

    private void validatePromotionRequest(PromotionDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu khuyến mãi không hợp lệ");
        }
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã khuyến mãi không được để trống");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên khuyến mãi không được để trống");
        }
        if (request.getDiscountPercent() == null
                || request.getDiscountPercent().compareTo(BigDecimal.ZERO) <= 0
                || request.getDiscountPercent().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Phần trăm giảm giá phải lớn hơn 0 và không vượt quá 100");
        }
        if (request.getMaxDiscountAmount() == null || request.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Giảm tối đa phải lớn hơn 0");
        }
        if (request.getMinOrderAmount() == null || request.getMinOrderAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Đơn tối thiểu không được nhỏ hơn 0");
        }
        if (request.getStartAt() == null || request.getEndAt() == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc là bắt buộc");
        }
        if (!request.getEndAt().isAfter(request.getStartAt())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
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