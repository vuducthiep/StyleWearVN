package com.example.StyleStore.controller.user;

import com.example.StyleStore.dto.ApiResponse;
import com.example.StyleStore.dto.PromotionDto;
import com.example.StyleStore.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user/promotions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class User_PromotionController {

    private final PromotionService promotionService;

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<PromotionDto>>> getAvailablePromotions() {
        try {
            List<PromotionDto> promotions = promotionService.getAvailablePromotions();
            return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách khuyến mãi khả dụng thành công", promotions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Lỗi lấy danh sách khuyến mãi: " + e.getMessage()));
        }
    }
}