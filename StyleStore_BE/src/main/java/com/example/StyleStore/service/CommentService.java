package com.example.StyleStore.service;

import com.example.StyleStore.dto.request.CreateCommentRequest;
import com.example.StyleStore.dto.request.UpdateCommentRequest;
import com.example.StyleStore.dto.response.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentService {
    CommentResponse createComment(CreateCommentRequest request);
    CommentResponse updateComment(Long commentId, UpdateCommentRequest request);
    void deleteComment(Long commentId);
    Page<CommentResponse> getCommentsByProductId(Long productId, Pageable pageable);
    Page<CommentResponse> getCommentsByUserId(Long userId, Pageable pageable);
    long getCommentCount(Long productId);
}
