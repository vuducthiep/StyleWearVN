package com.example.StyleStore.service.impl;

import com.example.StyleStore.dto.request.UserCreateCommentRequest;
import com.example.StyleStore.dto.request.UserUpdateCommentRequest;
import com.example.StyleStore.dto.response.CommentResponse;
import com.example.StyleStore.model.Comment;
import com.example.StyleStore.model.Product;
import com.example.StyleStore.model.User;
import com.example.StyleStore.repository.CommentRepository;
import com.example.StyleStore.repository.ProductRepository;
import com.example.StyleStore.repository.UserRepository;
import com.example.StyleStore.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentServiceImpl implements CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    private String getCurrentUserEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();
    }

    @Override
    @Transactional
    public CommentResponse createComment(UserCreateCommentRequest request) {
        String userEmail = getCurrentUserEmail();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

        Comment comment = Comment.builder()
                .content(request.getContent())
                .product(product)
                .user(user)
                .build();

        Comment savedComment = commentRepository.save(comment);
        return convertToDTO(savedComment);
    }

    @Override
    @Transactional
    public CommentResponse updateComment(Long commentId, UserUpdateCommentRequest request) {
        String userEmail = getCurrentUserEmail();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (!comment.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("You don't have permission to update this comment");
        }

        comment.setContent(request.getContent());
        Comment updatedComment = commentRepository.save(comment);
        return convertToDTO(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId) {
        String userEmail = getCurrentUserEmail();
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));

        if (!comment.getUser().getEmail().equals(userEmail)) {
            throw new RuntimeException("You don't have permission to delete this comment");
        }

        commentRepository.delete(comment);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByProductId(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found with id: " + productId);
        }
        Page<Comment> comments = commentRepository.findByProductId(productId, pageable);
        return comments.map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CommentResponse> getCommentsByUserId(Long userId, Pageable pageable) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        Page<Comment> comments = commentRepository.findByUserId(userId, pageable);
        return comments.map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public long getCommentCount(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found with id: " + productId);
        }
        return commentRepository.countByProductId(productId);
    }

    private CommentResponse convertToDTO(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .productId(comment.getProduct().getId())
                .productName(comment.getProduct().getName())
                .userId(comment.getUser().getId())
                .userFullName(comment.getUser().getFullName())
                .userEmail(comment.getUser().getEmail())
                .build();
    }
}
