package com.example.StyleStore.service;

import com.example.StyleStore.dto.request.UserCreateCommentRequest;
import com.example.StyleStore.dto.request.UserUpdateCommentRequest;
import com.example.StyleStore.dto.response.CommentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CommentService {
    CommentResponse createComment(UserCreateCommentRequest request);
    CommentResponse updateComment(Long commentId, UserUpdateCommentRequest request);
    void deleteComment(Long commentId);
    Page<CommentResponse> getCommentsByProductId(Long productId, Pageable pageable);
    Page<CommentResponse> getCommentsByUserId(Long userId, Pageable pageable);
    long getCommentCount(Long productId);
}
