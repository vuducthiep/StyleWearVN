package com.example.StyleStore.controller;

import com.example.StyleStore.dto.request.SendMessageRequest;
import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.dto.response.AdminChatUsersResponse;
import com.example.StyleStore.dto.response.MessageResponse;
import com.example.StyleStore.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(MessageService messageService, SimpMessagingTemplate messagingTemplate) {
        this.messageService = messageService;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        try {
            MessageResponse message = messageService.sendMessage(request.getReceiverUserId(), request.getContent());

            messagingTemplate.convertAndSend(
                    "/topic/messages/" + request.getReceiverUserId(),
                    message);
            messagingTemplate.convertAndSend(
                    "/topic/messages/" + message.getSenderId(),
                    message);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.ok("Send message success", message));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Send message failed: " + e.getMessage()));
        }
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getConversation(@PathVariable Long otherUserId) {
        try {
            List<MessageResponse> messages = messageService.getConversation(otherUserId);
            return ResponseEntity.ok(ApiResponse.ok("Get conversation success", messages));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Get conversation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/chat-users")
    public ResponseEntity<ApiResponse<List<AdminChatUsersResponse>>> getChatUsers() {
        try {
            List<AdminChatUsersResponse> users = messageService.getChatUsers();
            return ResponseEntity.ok(ApiResponse.ok("Get chat users success", users));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Get chat users failed: " + e.getMessage()));
        }
    }

    @PatchMapping("/conversation/{otherUserId}/read")
    public ResponseEntity<ApiResponse<Integer>> markConversationRead(@PathVariable Long otherUserId) {
        try {
            int updated = messageService.markConversationRead(otherUserId);
            return ResponseEntity.ok(ApiResponse.ok("Mark read success", updated));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.fail("Mark read failed: " + e.getMessage()));
        }
    }
}
