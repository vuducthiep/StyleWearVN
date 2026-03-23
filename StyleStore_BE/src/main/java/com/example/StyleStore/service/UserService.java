package com.example.StyleStore.service;

import com.example.StyleStore.dto.MonthlyUserDto;
import com.example.StyleStore.model.User;
import com.example.StyleStore.model.Role;
import com.example.StyleStore.repository.RoleRepository;
import com.example.StyleStore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    // for test api
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Page<User> getUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    public Page<User> searchUsersByFullNameOrEmail(String keyword, Pageable pageable) {
        return userRepository.searchByFullNameOrEmail(keyword, pageable);
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public boolean deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            return false;
        }
        userRepository.deleteById(id);
        return true;
    }

    public User updateUser(Long id, User newUser) {
        return userRepository.findById(id)
                .map(user -> {
                    if (newUser.getFullName() != null) {
                        user.setFullName(newUser.getFullName());
                    }
                    if (newUser.getEmail() != null) {
                        user.setEmail(newUser.getEmail());
                    }
                    if (newUser.getPassword() != null && !newUser.getPassword().isEmpty()) {
                        user.setPassword(newUser.getPassword());
                    }
                    if (newUser.getRole() != null) {
                        String roleName = newUser.getRole().getName();
                        if (roleName == null || roleName.isBlank()) {
                            throw new RuntimeException("Role không hợp lệ");
                        }
                        Role role = roleRepository.findByName(roleName)
                                .orElseThrow(() -> new RuntimeException("Role không tồn tại"));
                        user.setRole(role);
                    }
                    if (newUser.getStatus() != null) {
                        user.setStatus(newUser.getStatus());
                    }
                    if (newUser.getPhoneNumber() != null) {
                        user.setPhoneNumber(newUser.getPhoneNumber());
                    }
                    if (newUser.getGender() != null) {
                        user.setGender(newUser.getGender());
                    }
                    if (newUser.getAddress() != null) {
                        user.setAddress(newUser.getAddress());
                    }
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // public List<MonthlyUserDto> getMonthlyUserRegistrations(LocalDateTime from,
    // LocalDateTime to) {
    // return userRepository.countMonthlyUsers(from, to)
    // .stream()
    // .map(r -> new MonthlyUserDto(r.getYear(), r.getMonth(), r.getCount()))
    // .collect(Collectors.toList());
    // }

    // get 12 months user registrations
    @Cacheable(cacheNames = "stats:users:monthly", key = "'fixed'")
    public List<MonthlyUserDto> getRecent12MonthsUserRegistrations() {
        YearMonth now = YearMonth.now();
        YearMonth start = now.minusMonths(11);
        LocalDateTime from = start.atDay(1).atStartOfDay();
        LocalDateTime to = now.plusMonths(1).atDay(1).atStartOfDay();

        Map<YearMonth, Long> aggregated = userRepository.countMonthlyUsers(from, to)
                .stream()
                .collect(Collectors.toMap(
                        r -> YearMonth.of(r.getYear(), r.getMonth()),
                        UserRepository.MonthlyUserProjection::getCount));

        List<MonthlyUserDto> result = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            YearMonth ym = start.plusMonths(i);
            long count = aggregated.getOrDefault(ym, 0L);
            result.add(new MonthlyUserDto(ym.getYear(), ym.getMonthValue(), count));
        }
        return result;
    }

    @Cacheable(cacheNames = "stats:users:activeCount", key = "'fixed'")
    public long getTotalActiveUserCount() {
        return userRepository.countActiveUsers();
    }
}