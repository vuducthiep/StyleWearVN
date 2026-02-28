package com.example.StyleStore.controller.admin;

import com.example.StyleStore.dto.ApiResponse;
import com.example.StyleStore.dto.BestSellingProductsInCategoriesDTO;
import com.example.StyleStore.dto.CategoryStockDto;
import com.example.StyleStore.dto.MonthlyRevenueDto;
import com.example.StyleStore.dto.MonthlyUserDto;
import com.example.StyleStore.dto.RevenueGrowthDto;
import com.example.StyleStore.dto.RevenueWithProductsDto;
import com.example.StyleStore.service.OrderService;
import com.example.StyleStore.service.ProductService;
import com.example.StyleStore.service.UserService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/stats")
@CrossOrigin(origins = "*")
public class Admin_StatsController {
    private final UserService userService;
    private final OrderService orderService;
    private final ProductService productService;

    public Admin_StatsController(UserService userService, OrderService orderService, ProductService productService) {
        this.userService = userService;
        this.orderService = orderService;
        this.productService = productService;
    }

    @GetMapping("/monthly-user-registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MonthlyUserDto>>> getRecent12MonthsUserRegistrations() {
        List<MonthlyUserDto> result = userService.getRecent12MonthsUserRegistrations();
        return ResponseEntity
                .ok(ApiResponse.ok("Lấy số lượng người dùng đăng ký trong 12 tháng gần nhất thành công", result));
    }

    @GetMapping("/revenue/monthly-recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MonthlyRevenueDto>>> getRecent12MonthsRevenue() {
        List<MonthlyRevenueDto> result = orderService.getRecent12MonthsRevenue();
        return ResponseEntity.ok(ApiResponse.ok("Lấy doanh thu 12 tháng gần nhất thành công", result));
    }

    @GetMapping("/products/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductCount() {
        long count = productService.getTotalProductCount();
        Map<String, Object> response = Map.of("totalProducts", count);
        return ResponseEntity.ok(ApiResponse.ok("Lấy tổng số sản phẩm thành công", response));
    }

    @GetMapping("/products/total-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTotalStock() {
        long totalStock = productService.getTotalStock();
        List<CategoryStockDto> categoryStocks = productService.getStockByCategory();
        Map<String, Object> response = Map.of(
                "totalStock", totalStock,
                "categories", categoryStocks);
        return ResponseEntity.ok(ApiResponse.ok("Lấy tổng tồn kho thành công", response));
    }

    @GetMapping("/users/active-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getActiveUserCount() {
        long count = userService.getTotalActiveUserCount();
        Map<String, Object> response = Map.of("activeUsers", count);
        return ResponseEntity.ok(ApiResponse.ok("Lấy tổng số người dùng đang hoạt động thành công", response));
    }

    @GetMapping("/revenue/recent-month-growth")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RevenueGrowthDto>> getRecentMonthRevenueGrowth() {
        RevenueGrowthDto result = orderService.getRevenueGrowth();
        return ResponseEntity.ok(ApiResponse.ok("Lấy tăng trưởng doanh thu tháng vừa rồi thành công", result));
    }

    @GetMapping("/revenue/by-date")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RevenueWithProductsDto>> getRevenueByDate(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        RevenueWithProductsDto revenueData = orderService.getRevenueByDate(date);
        return ResponseEntity.ok(ApiResponse.ok("Lấy doanh thu theo ngày thành công", revenueData));
    }

    @GetMapping("/revenue/by-month")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RevenueWithProductsDto>> getRevenueByMonth(
            @RequestParam("year") int year,
            @RequestParam("month") int month) {
        RevenueWithProductsDto revenueData = orderService.getRevenueByMonth(year, month);
        return ResponseEntity.ok(ApiResponse.ok("Lấy doanh thu theo tháng thành công", revenueData));
    }

    @GetMapping("/revenue/by-year")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<RevenueWithProductsDto>> getRevenueByYear(
            @RequestParam("year") int year) {
        RevenueWithProductsDto revenueData = orderService.getRevenueByYear(year);
        return ResponseEntity.ok(ApiResponse.ok("Lấy doanh thu theo năm thành công", revenueData));
    }

    // get best-selling products in categories
    @GetMapping("/best-selling-product-in-categories")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<BestSellingProductsInCategoriesDTO>>> getBestSellingProductsInCategories() {
        List<BestSellingProductsInCategoriesDTO> result = orderService.getBestSellingProductsInCategories();
        return ResponseEntity.ok(ApiResponse.ok("Lấy sản phẩm bán chạy nhất theo danh mục thành công", result));
    }

}
