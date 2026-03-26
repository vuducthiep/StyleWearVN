package com.example.StyleStore.service.impl;

import com.example.StyleStore.dto.response.AdminChatUsersResponse;
import com.example.StyleStore.dto.response.MessageResponse;
import com.example.StyleStore.model.Message;
import com.example.StyleStore.model.User;
import com.example.StyleStore.repository.MessageRepository;
import com.example.StyleStore.repository.UserRepository;
import com.example.StyleStore.service.MessageService;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MessageServiceImpl implements MessageService {

        private final MessageRepository messageRepository;
        private final UserRepository userRepository;

        public MessageServiceImpl(MessageRepository messageRepository, UserRepository userRepository) {
                this.messageRepository = messageRepository;
                this.userRepository = userRepository;
        }

        private String getCurrentUserEmail() {
                return SecurityContextHolder.getContext()
                                .getAuthentication()
                                .getName();
        }

        private User getCurrentUser() {
                String userEmail = getCurrentUserEmail();
                return userRepository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("User not found"));
        }

        @Override
        @Transactional
        public MessageResponse sendMessage(Long receiverUserId, String content) {
                User sender = getCurrentUser();
                User receiver = userRepository.findById(receiverUserId)
                                .orElseThrow(() -> new RuntimeException("Receiver not found"));

                Message message = Message.builder()
                                .sender(sender)
                                .receiver(receiver)
                                .content(content)
                                .build();

                Message savedMessage = messageRepository.save(message);
                return toDto(savedMessage);
        }

        @Override
        @Transactional
        public MessageResponse sendMessageFrom(Long senderUserId, Long receiverUserId, String content) {
                User sender = userRepository.findById(senderUserId)
                                .orElseThrow(() -> new RuntimeException("Sender not found"));
                User receiver = userRepository.findById(receiverUserId)
                                .orElseThrow(() -> new RuntimeException("Receiver not found"));

                Message message = Message.builder()
                                .sender(sender)
                                .receiver(receiver)
                                .content(content)
                                .build();

                Message savedMessage = messageRepository.save(message);
                return toDto(savedMessage);
        }

        @Override
        @Transactional
        public MessageResponse sendMessageFromEmail(String senderEmail, Long receiverUserId, String content) {
                User sender = userRepository.findByEmail(senderEmail)
                                .orElseThrow(() -> new RuntimeException("Sender not found"));
                User receiver = userRepository.findById(receiverUserId)
                                .orElseThrow(() -> new RuntimeException("Receiver not found"));

                Message message = Message.builder()
                                .sender(sender)
                                .receiver(receiver)
                                .content(content)
                                .build();

                Message savedMessage = messageRepository.save(message);
                return toDto(savedMessage);
        }

        @Override
        @Transactional(readOnly = true)
        public List<MessageResponse> getConversation(Long otherUserId) {
                User currentUser = getCurrentUser();
                List<Message> messages = messageRepository.findConversation(currentUser.getId(), otherUserId);
                return messages.stream()
                                .map(this::toDto)
                                .collect(Collectors.toList());
        }

        @Override
        @Transactional
        public int markConversationRead(Long otherUserId) {
                User currentUser = getCurrentUser();
                return messageRepository.markReadBetween(otherUserId, currentUser.getId());
        }

        @Override
        @Transactional(readOnly = true)
        public List<AdminChatUsersResponse> getChatUsers() {
                User currentUser = getCurrentUser();
                List<MessageRepository.ChatUserProjection> users = messageRepository
                                .findDistinctChatUsers(currentUser.getId());
                return users.stream()
                                .map(user -> AdminChatUsersResponse.builder()
                                                .id(user.getId())
                                                .fullName(user.getFullName())
                                                .email(user.getEmail())
                                                .build())
                                .collect(Collectors.toList());
        }

        private MessageResponse toDto(Message message) {
                return MessageResponse.builder()
                                .id(message.getId())
                                .senderId(message.getSender() != null ? message.getSender().getId() : null)
                                .receiverId(message.getReceiver() != null ? message.getReceiver().getId() : null)
                                .content(message.getContent())
                                .isRead(message.isRead())
                                .createdAt(message.getCreatedAt())
                                .build();
        }
}
