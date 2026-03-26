package com.example.StyleStore.controller.user;

import com.example.StyleStore.dto.request.UserCreateCommentRequest;
import com.example.StyleStore.dto.request.UserUpdateCommentRequest;
import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.dto.response.CommentResponse;
import com.example.StyleStore.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/comments")
@CrossOrigin(origins = "*")
public class User_CommentController {

    @Autowired
    private CommentService commentService;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @Valid @RequestBody UserCreateCommentRequest request) {
        try {
            CommentResponse comment = commentService.createComment(request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Tạo comment thành công", comment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Lỗi khi tạo comment: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateCommentRequest request) {
        try {
            CommentResponse comment = commentService.updateComment(id, request);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật comment thành công", comment));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Lỗi khi cập nhật comment: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id) {
        try {
            commentService.deleteComment(id);
            return ResponseEntity.ok(ApiResponse.ok("Xóa comment thành công", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Lỗi khi xóa comment: " + e.getMessage()));
        }
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> getCommentsByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<CommentResponse> comments = commentService.getCommentsByProductId(productId, pageable);
            return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách comment thành công", comments));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Lỗi khi lấy danh sách comment: " + e.getMessage()));
        }
    }

    // Rating has been removed; stats endpoint removed accordingly
}
