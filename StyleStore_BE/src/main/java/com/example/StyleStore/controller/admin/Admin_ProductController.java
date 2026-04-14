package com.example.StyleStore.controller.admin;

import com.example.StyleStore.dto.response.ApiResponse;
import com.example.StyleStore.model.Product;
import com.example.StyleStore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/admin/products")
@CrossOrigin(origins = "*")
public class Admin_ProductController {
    @Autowired
    private ProductService productService;

    // get list product, pagination, sort
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<Product>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> result = productService.getProducts(pageable);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách sản phẩm thành công", result));
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<Product>>> searchProducts(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Product> result = productService.searchProductsByNameOrCategory(keyword, pageable);
        return ResponseEntity.ok(ApiResponse.ok("Tìm kiếm sản phẩm thành công", result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product
                .map(p -> ResponseEntity.ok(ApiResponse.ok("Lấy sản phẩm thành công", p)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.fail("Không tìm thấy sản phẩm")));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> createProduct(@RequestBody Product product) {
        if (product == null || product.getName() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Yêu cầu không hợp lệ"));
        }
        try {
            Product createdProduct = productService.createProduct(product);
            return ResponseEntity.status(201).body(ApiResponse.ok("Tạo sản phẩm thành công", createdProduct));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(ApiResponse.fail("Lỗi khi tạo sản phẩm: " + e.getMessage()));
        }
    }

    // if need delete, just set status = false, not delete from database
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Product>> updateProduct(@PathVariable Long id, @RequestBody Product newProduct) {
        if (newProduct == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Yêu cầu không hợp lệ"));
        }
        try {
            Product updatedProduct = productService.updateProduct(id, newProduct);
            return ResponseEntity.ok(ApiResponse.ok("Cập nhật sản phẩm thành công", updatedProduct));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(ApiResponse.fail("Không tìm thấy sản phẩm"));
        }
    }

    //not use delete, just set status = false
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        boolean deleted = productService.deleteProduct(id);
        return deleted
                ? ResponseEntity.ok(ApiResponse.ok("Xóa sản phẩm thành công", null))
                : ResponseEntity.status(404).body(ApiResponse.fail("Không tìm thấy sản phẩm"));
    }
}
