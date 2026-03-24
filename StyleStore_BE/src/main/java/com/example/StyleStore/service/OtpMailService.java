package com.example.StyleStore.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpMailService {

    private final JavaMailSender mailSender;

    @Async("mailTaskExecutor")
    public void sendOtpEmail(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("Your OTP Code");
            message.setText("Your OTP is: " + otp);
            mailSender.send(message);
            log.info("OTP email sent successfully to {}", email);
        } catch (MailException ex) {
            log.error("Không thể gửi OTP tới {}: {}", email, ex.getMessage());
        }
    }
}
