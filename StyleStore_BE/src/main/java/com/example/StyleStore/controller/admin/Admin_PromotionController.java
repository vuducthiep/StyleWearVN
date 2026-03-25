package com.example.StyleStore.controller.admin;

import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.dto.response.PromotionResponse;
import com.example.StyleStore.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/promotions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class Admin_PromotionController {
    private final PromotionService promotionService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PromotionResponse>>> getAllPromotions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("asc")
                    ? Sort.by(sortBy).ascending()
                    : Sort.by(sortBy).descending();

            PageRequest pageable = PageRequest.of(page, size, sort);
            Page<PromotionResponse> promotions = promotionService.getAllPromotions(pageable);
            return ResponseEntity.ok(ApiResponse.ok("Lấy toàn bộ khuyến mãi thành công", promotions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Lỗi lấy danh sách khuyến mãi: " + e.getMessage()));
        }
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PromotionResponse>>> searchPromotions(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("asc")
                    ? Sort.by(sortBy).ascending()
                    : Sort.by(sortBy).descending();

            PageRequest pageable = PageRequest.of(page, size, sort);
            Page<PromotionResponse> promotions = promotionService.searchPromotions(keyword, pageable);
            return ResponseEntity.ok(ApiResponse.ok("Tìm kiếm khuyến mãi thành công", promotions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Lỗi tìm kiếm khuyến mãi: " + e.getMessage()));
        }
    }

    @GetMapping("/available")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<PromotionResponse>>> getAvailablePromotions(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("asc")
                    ? Sort.by(sortBy).ascending()
                    : Sort.by(sortBy).descending();

            PageRequest pageable = PageRequest.of(page, size, sort);
            Page<PromotionResponse> promotions = promotionService.getAvailablePromotions(pageable, keyword);
            return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách khuyến mãi khả dụng thành công", promotions));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Lỗi lấy khuyến mãi khả dụng: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(@RequestBody PromotionResponse request) {
        try {
            PromotionResponse createdPromotion = promotionService.createPromotion(request);
            return ResponseEntity.status(201)
                    .body(ApiResponse.ok("Tạo khuyến mãi thành công", createdPromotion));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Lỗi tạo khuyến mãi: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> updatePromotion(
            @PathVariable Long id,
            @RequestBody PromotionResponse request) {
        try {
            PromotionResponse updatedPromotion = promotionService.updatePromotion(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật khuyến mãi thành công", updatedPromotion));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.fail(e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Lỗi cập nhật khuyến mãi: " + e.getMessage()));
        }
    }
}
