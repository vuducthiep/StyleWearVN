package com.example.StyleStore.handler;

import com.example.StyleStore.service.OAuth2UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final OAuth2UserService oAuth2UserService;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        try {
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String picture = oAuth2User.getAttribute("picture");

            log.info("OAuth2 Login Success - Email: {}, Name: {}", email, name);

            // Xử lý OAuth2 user - register hoặc update
            var authResponse = oAuth2UserService.processOAuth2User(email, name, picture);

            // URL encode các parameters để tránh lỗi với ký tự đặc biệt
            String encodedEmail = URLEncoder.encode(email != null ? email : "", StandardCharsets.UTF_8);
            String encodedName = URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8);
            String encodedPicture = URLEncoder.encode(picture != null ? picture : "", StandardCharsets.UTF_8);

            // Redirect về frontend với token
            String redirectUrl = String.format(
                    "http://localhost:5173/oauth2-callback?token=%s&email=%s&name=%s&picture=%s&userId=%d",
                    authResponse.accessToken(),
                    encodedEmail,
                    encodedName,
                    encodedPicture,
                    authResponse.userId());

            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            log.error("OAuth2 authentication failed", e);
            response.sendRedirect("http://localhost:5173/login?error=oauth2_failure");
        }
    }
}
