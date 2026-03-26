package com.example.StyleStore.service;

import com.example.StyleStore.dto.request.UserOrderRequest;
import com.example.StyleStore.dto.response.OrderResponse;
import com.example.StyleStore.dto.response.stats.BestSellingProductsInCategoriesDTO;
import com.example.StyleStore.dto.response.stats.MonthlyRevenueDto;
import com.example.StyleStore.dto.response.stats.RevenueGrowthDto;
import com.example.StyleStore.dto.response.stats.RevenueWithProductsDto;
import com.example.StyleStore.model.User;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

public interface OrderService {
    List<MonthlyRevenueDto> getRecent12MonthsRevenue();
    RevenueGrowthDto getRevenueGrowth();
    RevenueWithProductsDto getRevenueByDate(LocalDate date);
    RevenueWithProductsDto getRevenueByMonth(int year, int month);
    RevenueWithProductsDto getRevenueByYear(int year);
    Page<OrderResponse> getAllOrders(int page, int size, String sortBy, String sortDir);
    Page<OrderResponse> searchOrders(String keyword, String status, int page, int size, String sortBy, String sortDir);
    Page<OrderResponse> filterOrdersByStatus(String status, int page, int size, String sortBy, String sortDir);
    OrderResponse getOrderById(Long id);
    OrderResponse getOrderDetailById(Long id);
    List<OrderResponse> getOrdersByUserId(Long userId);
    OrderResponse confirmOrder(long id);
    OrderResponse cancelOrder(long id);
    OrderResponse deliveredOrder(long id);
    OrderResponse createOrder(User user, UserOrderRequest request);
    List<BestSellingProductsInCategoriesDTO> getBestSellingProductsInCategories();
}
