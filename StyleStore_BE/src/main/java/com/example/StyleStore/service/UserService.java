package com.example.StyleStore.service;

import com.example.StyleStore.dto.response.stats.MonthlyUserDto;
import com.example.StyleStore.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface UserService {
    Optional<User> findByEmail(String email);
    User saveUser(User user);
    List<User> getAllUsers();
    Page<User> getUsers(Pageable pageable);
    Page<User> searchUsersByFullNameOrEmail(String keyword, Pageable pageable);
    Optional<User> getUserById(Long id);
    User createUser(User user);
    boolean deleteUser(Long id);
    User updateUser(Long id, User newUser);
    List<MonthlyUserDto> getRecent12MonthsUserRegistrations();
    long getTotalActiveUserCount();
}