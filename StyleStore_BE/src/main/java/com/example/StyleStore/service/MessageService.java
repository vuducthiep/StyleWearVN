package com.example.StyleStore.service;

import com.example.StyleStore.dto.response.AdminChatUsersResponse;
import com.example.StyleStore.dto.response.MessageResponse;

import java.util.List;

public interface MessageService {
    MessageResponse sendMessage(Long receiverUserId, String content);
    MessageResponse sendMessageFrom(Long senderUserId, Long receiverUserId, String content);
    MessageResponse sendMessageFromEmail(String senderEmail, Long receiverUserId, String content);
    List<MessageResponse> getConversation(Long otherUserId);
    int markConversationRead(Long otherUserId);
    List<AdminChatUsersResponse> getChatUsers();
}
