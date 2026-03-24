package com.example.StyleStore.security.websocket;

import com.example.StyleStore.service.JwtService;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public WebSocketAuthChannelInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null) {
                authHeader = accessor.getFirstNativeHeader("authorization");
            }
            if (authHeader == null) {
                System.out.println("WS CONNECT missing Authorization header");
                return message;
            }

            String trimmedHeader = authHeader.trim();
            String lowerHeader = trimmedHeader.toLowerCase();
            String jwt = trimmedHeader;
            if (lowerHeader.startsWith("bearer ")) {
                jwt = trimmedHeader.substring(7).trim();
            } else if (lowerHeader.startsWith("bearer")) {
                jwt = trimmedHeader.substring(6).trim();
            }
            jwt = jwt.replaceAll("\\s+", "");
            String userEmail;
            try {
                userEmail = jwtService.extractUsername(jwt);
            } catch (Exception ex) {
                System.out.println("WS CONNECT invalid JWT: " + ex.getClass().getSimpleName());
                return message;
            }

            if (userEmail != null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());
                    accessor.setUser(auth);
                    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                    if (sessionAttributes == null) {
                        sessionAttributes = new HashMap<>();
                        accessor.setSessionAttributes(sessionAttributes);
                    }
                    sessionAttributes.put("simpUser", auth);
                    System.out.println("WS CONNECT authenticated user: " + userEmail);
                } else {
                    System.out.println("WS CONNECT token invalid for user: " + userEmail);
                }
            } else {
                System.out.println("WS CONNECT missing subject in JWT");
            }
        }

        if (accessor.getUser() == null) {
            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes != null
                    && sessionAttributes.get("simpUser") instanceof UsernamePasswordAuthenticationToken auth) {
                accessor.setUser(auth);
            }
        }

        return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    }
}
