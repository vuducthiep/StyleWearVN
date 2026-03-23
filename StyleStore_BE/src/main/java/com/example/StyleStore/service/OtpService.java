package com.example.StyleStore.service;

import com.example.StyleStore.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_KEY_PREFIX = "auth:otp:code:";
    private static final String OTP_ATTEMPT_KEY_PREFIX = "auth:otp:attempt:";
    private static final String OTP_COOLDOWN_KEY_PREFIX = "auth:otp:cooldown:";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StringRedisTemplate stringRedisTemplate;
    private final OtpMailService otpMailService;
    private final UserRepository userRepository;

    @Value("${auth.otp.ttl-seconds:300}")
    private long otpTtlSeconds;

    @Value("${auth.otp.cooldown-seconds:60}")
    private long otpCooldownSeconds;

    @Value("${auth.otp.max-attempts:5}")
    private int otpMaxAttempts;

    public void sendOtpForRegistration(String rawEmail) {
        String email = normalizeEmail(rawEmail);

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email đã được đăng ký");
        }

        try {
            String cooldownKey = cooldownKey(email);
            Boolean inCooldown = stringRedisTemplate.hasKey(cooldownKey);
            if (Boolean.TRUE.equals(inCooldown)) {
                Long remainingSeconds = stringRedisTemplate.getExpire(cooldownKey, TimeUnit.SECONDS);
                if (remainingSeconds == null || remainingSeconds < 0) {
                    remainingSeconds = otpCooldownSeconds;
                }
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                        "Vui lòng chờ " + remainingSeconds + " giây trước khi yêu cầu OTP mới");
            }

            String otp = generateOtp();

            stringRedisTemplate.opsForValue().set(otpKey(email), otp, Duration.ofSeconds(otpTtlSeconds));
            stringRedisTemplate.opsForValue().set(attemptKey(email), "0", Duration.ofSeconds(otpTtlSeconds));
            stringRedisTemplate.opsForValue().set(cooldownKey, "1", Duration.ofSeconds(otpCooldownSeconds));

            otpMailService.sendOtpEmail(email, otp);
        } catch (RedisConnectionFailureException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ OTP tạm thời không khả dụng. Vui lòng thử lại sau", ex);
        }
    }

    public void verifyOtpOrThrow(String rawEmail, String rawOtp) {
        String email = normalizeEmail(rawEmail);
        String otp = rawOtp == null ? "" : rawOtp.trim();

        try {
            String otpKey = otpKey(email);
            String storedOtp = stringRedisTemplate.opsForValue().get(otpKey);
            if (storedOtp == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP không hợp lệ hoặc đã hết hạn");
            }

            if (!storedOtp.equals(otp)) {
                long attempts = increaseAttempt(email);
                if (attempts >= otpMaxAttempts) {
                    stringRedisTemplate.delete(otpKey);
                    stringRedisTemplate.delete(attemptKey(email));
                    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                            "Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới");
                }
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "OTP không chính xác. Bạn còn " + (otpMaxAttempts - attempts) + " lần thử");
            }

            stringRedisTemplate.delete(otpKey);
            stringRedisTemplate.delete(attemptKey(email));
        } catch (RedisConnectionFailureException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ OTP tạm thời không khả dụng. Vui lòng thử lại sau", ex);
        }
    }

    private long increaseAttempt(String email) {
        String attemptKey = attemptKey(email);

        try {
            Boolean attemptExists = stringRedisTemplate.hasKey(attemptKey);
            if (Boolean.FALSE.equals(attemptExists)) {
                Long ttl = stringRedisTemplate.getExpire(otpKey(email), TimeUnit.SECONDS);
                long ttlToUse = (ttl == null || ttl <= 0) ? otpTtlSeconds : ttl;
                stringRedisTemplate.opsForValue().set(attemptKey, "0", Duration.ofSeconds(ttlToUse));
            }

            Long current = stringRedisTemplate.opsForValue().increment(attemptKey);
            return current == null ? 1 : current;
        } catch (RedisConnectionFailureException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ OTP tạm thời không khả dụng. Vui lòng thử lại sau", ex);
        }
    }

    private String normalizeEmail(String rawEmail) {
        return rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
    }

    private String generateOtp() {
        int value = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", value);
    }

    private String otpKey(String email) {
        return OTP_KEY_PREFIX + email;
    }

    private String attemptKey(String email) {
        return OTP_ATTEMPT_KEY_PREFIX + email;
    }

    private String cooldownKey(String email) {
        return OTP_COOLDOWN_KEY_PREFIX + email;
    }
}
