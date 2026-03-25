package com.example.StyleStore.service;

import com.example.StyleStore.dto.response.PromotionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PromotionService {
    List<PromotionResponse> getAvailablePromotions();
    Page<PromotionResponse> getAllPromotions(Pageable pageable);
    Page<PromotionResponse> searchPromotions(String keyword, Pageable pageable);
    PromotionResponse createPromotion(PromotionResponse request);
    PromotionResponse updatePromotion(Long id, PromotionResponse request);
}