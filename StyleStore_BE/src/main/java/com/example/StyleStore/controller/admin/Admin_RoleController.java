package com.example.StyleStore.controller.admin;

import com.example.StyleStore.dto.ApiResponse;
import com.example.StyleStore.model.Role;
import com.example.StyleStore.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
@CrossOrigin(origins = "*")
public class Admin_RoleController {

	@Autowired
	private RoleRepository roleRepository;

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<ApiResponse<List<Role>>> getAllRoles() {
		List<Role> roles = roleRepository.findAll();
		return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách role thành công", roles));
	}
}
