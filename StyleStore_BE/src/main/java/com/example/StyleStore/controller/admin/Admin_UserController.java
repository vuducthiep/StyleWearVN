package com.example.StyleStore.controller.admin;

import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.dto.response.AdminUserResponse;
import com.example.StyleStore.model.User;
import com.example.StyleStore.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class Admin_UserController {
    @Autowired
    private UserService userService;

    // for test api - only ADMIN can access (with pagination)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<AdminUserResponse> result = userService.getUsers(pageable).map(AdminUserResponse::from);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách người dùng thành công", result));
    }

    @GetMapping("/search")
        public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> searchUsers(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<AdminUserResponse> result = userService.searchUsersByFullNameOrEmail(keyword, pageable)
                .map(AdminUserResponse::from);
        return ResponseEntity.ok(ApiResponse.ok("Tìm kiếm người dùng thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user
                .map(u -> ResponseEntity.ok(ApiResponse.ok("Lấy người dùng thành công", AdminUserResponse.from(u))))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.fail("Không tìm thấy người dùng")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(@PathVariable Long id, @RequestBody User newUser) {
        if (newUser == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Yêu cầu không hợp lệ"));
        }
        try {
            User updatedUser = userService.updateUser(id, newUser);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật người dùng thành công", AdminUserResponse.from(updatedUser)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail("Không tìm thấy người dùng"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        boolean deleted = userService.deleteUser(id);
        return deleted
                ? ResponseEntity.ok(ApiResponse.ok("Xóa người dùng thành công", null))
                : ResponseEntity.status(404).body(ApiResponse.fail("Không tìm thấy người dùng"));
    }

}
