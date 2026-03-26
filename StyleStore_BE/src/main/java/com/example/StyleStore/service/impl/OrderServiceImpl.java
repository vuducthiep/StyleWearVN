package com.example.StyleStore.service.impl;

import com.example.StyleStore.dto.request.UserOrderRequest;
import com.example.StyleStore.dto.response.OrderResponse;
import com.example.StyleStore.dto.response.stats.BestSellingProductsInCategoriesDTO;
import com.example.StyleStore.dto.response.stats.MonthlyRevenueDto;
import com.example.StyleStore.dto.response.stats.ProductSalesDto;
import com.example.StyleStore.dto.response.stats.RevenueGrowthDto;
import com.example.StyleStore.dto.response.stats.RevenueWithProductsDto;
import com.example.StyleStore.dto.response.OrderItemDto;
import com.example.StyleStore.model.*;
import com.example.StyleStore.model.enums.OrderStatus;
import com.example.StyleStore.repository.OrderItemRepository;
import com.example.StyleStore.repository.OrderRepository;
import com.example.StyleStore.repository.PromotionRepository;
import com.example.StyleStore.repository.ProductRepository;
import com.example.StyleStore.repository.ProductSizeRepository;
import com.example.StyleStore.service.OrderService;

import io.jsonwebtoken.lang.Collections;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ProductSizeRepository productSizeRepository;
    private final PromotionRepository promotionRepository;

    public OrderServiceImpl(OrderRepository orderRepository, OrderItemRepository orderItemRepository,
            ProductRepository productRepository, ProductSizeRepository productSizeRepository,
            PromotionRepository promotionRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
        this.productSizeRepository = productSizeRepository;
        this.promotionRepository = promotionRepository;
    }

    @Override
    @Cacheable(cacheNames = "stats:revenue:monthly", key = "'fixed'")
    public List<MonthlyRevenueDto> getRecent12MonthsRevenue() {
        YearMonth now = YearMonth.now();
        YearMonth start = now.minusMonths(11);
        LocalDateTime from = start.atDay(1).atStartOfDay();
        LocalDateTime to = now.plusMonths(1).atDay(1).atStartOfDay();

        Map<YearMonth, BigDecimal> aggregated = orderRepository
                .sumRevenueByMonth(from, to, OrderStatus.DELIVERED.name())
                .stream()
                .collect(Collectors.toMap(
                        r -> YearMonth.of(r.getYear(), r.getMonth()),
                        OrderRepository.MonthlyRevenueProjection::getRevenue));

        List<MonthlyRevenueDto> result = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            YearMonth ym = start.plusMonths(i);
            BigDecimal revenue = aggregated.getOrDefault(ym, BigDecimal.ZERO);
            result.add(new MonthlyRevenueDto(ym.getYear(), ym.getMonthValue(), revenue));
        }
        return result;
    }

    @Override
    @Cacheable(cacheNames = "stats:revenue:growth", key = "'fixed'")
    public RevenueGrowthDto getRevenueGrowth() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth previousMonth = currentMonth.minusMonths(1);
        YearMonth twoMonthsAgo = currentMonth.minusMonths(2);
        BigDecimal previousMonthRevenue = orderRepository.getRevenueByYearMonth(previousMonth.getYear(),
                previousMonth.getMonthValue(), OrderStatus.DELIVERED.name()).orElse(BigDecimal.ZERO);
        BigDecimal twoMonthsAgoRevenue = orderRepository.getRevenueByYearMonth(twoMonthsAgo.getYear(),
                twoMonthsAgo.getMonthValue(), OrderStatus.DELIVERED.name()).orElse(BigDecimal.ZERO);
        BigDecimal growth;
        BigDecimal growthPercentage;
        if (twoMonthsAgoRevenue.compareTo(BigDecimal.ZERO) == 0) {
            if (previousMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
                growth = previousMonthRevenue;
                growthPercentage = BigDecimal.valueOf(100);
            } else {
                growth = BigDecimal.ZERO;
                growthPercentage = BigDecimal.ZERO;
            }
        } else {
            growth = previousMonthRevenue.subtract(twoMonthsAgoRevenue);
            growthPercentage = growth
                    .divide(twoMonthsAgoRevenue, 2, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return new RevenueGrowthDto(
                currentMonth.getMonthValue(),
                currentMonth.getYear(),
                previousMonthRevenue,
                twoMonthsAgoRevenue,
                growth,
                growthPercentage);
    }

    @Override
    public RevenueWithProductsDto getRevenueByDate(LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay();
        return buildRevenueWithProducts(from, to);
    }

    @Override
    public RevenueWithProductsDto getRevenueByMonth(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime from = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime to = yearMonth.plusMonths(1).atDay(1).atStartOfDay();
        return buildRevenueWithProducts(from, to);
    }

    @Override
    public RevenueWithProductsDto getRevenueByYear(int year) {
        LocalDateTime from = LocalDate.of(year, 1, 1).atStartOfDay();
        LocalDateTime to = LocalDate.of(year + 1, 1, 1).atStartOfDay();
        return buildRevenueWithProducts(from, to);
    }

    private RevenueWithProductsDto buildRevenueWithProducts(LocalDateTime from, LocalDateTime to) {
        BigDecimal revenue = orderRepository
                .getRevenueByDateRange(from, to, OrderStatus.DELIVERED.name())
                .orElse(BigDecimal.ZERO);

        List<ProductSalesDto> soldProducts = orderRepository
                .getProductSalesByDateRange(from, to, OrderStatus.DELIVERED.name())
                .stream()
                .map(item -> new ProductSalesDto(
                        item.getProductId(),
                        item.getProductName(),
                        item.getQuantitySold() == null ? 0L : item.getQuantitySold()))
                .collect(Collectors.toList());

        return new RevenueWithProductsDto(revenue, soldProducts);
    }

    @Override
    public Page<OrderResponse> getAllOrders(int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<Order> orders = orderRepository.findAll(pageRequest);
        return orders.map(this::convertToDto);
    }

    @Override
    public Page<OrderResponse> searchOrders(String keyword, String status, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));

        String trimmedKeyword = keyword == null ? "" : keyword.trim();
        if (trimmedKeyword.isEmpty()) {
            if (status == null || status.trim().isEmpty()) {
                return getAllOrders(page, size, sortBy, sortDir);
            }
            return filterOrdersByStatus(status, page, size, sortBy, sortDir);
        }

        Long orderId = null;
        try {
            orderId = Long.parseLong(trimmedKeyword);
        } catch (NumberFormatException ignored) {
        }

        OrderStatus parsedStatus = parseOrderStatusOrThrow(status);
        Page<Order> orders = orderRepository.searchByUserNameOrOrderIdAndStatus(trimmedKeyword, orderId, parsedStatus, pageRequest);
        return orders.map(this::convertToDto);
    }

    @Override
    public Page<OrderResponse> filterOrdersByStatus(String status, int page, int size, String sortBy, String sortDir) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));

        OrderStatus parsedStatus = parseOrderStatusOrThrow(status);
        if (parsedStatus == null) {
            return orderRepository.findAll(pageRequest).map(this::convertToDto);
        }
        return orderRepository.findByStatus(parsedStatus, pageRequest).map(this::convertToDto);
    }

    private OrderStatus parseOrderStatusOrThrow(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }

        try {
            return OrderStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Trạng thái đơn hàng không hợp lệ: " + status);
        }
    }

    @Override
    public OrderResponse getOrderById(Long id) {
        return orderRepository.findById(id).map(this::convertToDto).orElse(null);
    }

    @Override
    public OrderResponse getOrderDetailById(Long id) {
        return orderRepository.findById(id).map(this::convertToDetailDto).orElse(null);
    }

    @Override
    public List<OrderResponse> getOrdersByUserId(Long userId) {
        List<Order> orders = orderRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    private OrderResponse convertToDto(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userName(order.getUser().getFullName())
                .phoneNumber(order.getUser().getPhoneNumber())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .promotionCode(order.getPromotion() != null ? order.getPromotion().getCode() : null)
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderResponse convertToDetailDto(Order order) {
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());

        List<OrderItemDto> orderItemDtos = orderItems.stream()
                .map(item -> OrderItemDto.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImage(item.getProduct().getThumbnail())
                        .sizeId(item.getSize().getId())
                        .sizeName(item.getSize().getName())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .subtotal(item.getPrice() * item.getQuantity())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userName(order.getUser().getFullName())
                .phoneNumber(order.getUser().getPhoneNumber())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .promotionCode(order.getPromotion() != null ? order.getPromotion().getCode() : null)
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .orderItems(orderItemDtos)
                .build();
    }

    @Override
    public OrderResponse confirmOrder(long id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getStatus() != OrderStatus.CREATED) {
            throw new RuntimeException("Only created orders can be confirmed");
        }
        order.setStatus(OrderStatus.SHIPPING);
        orderRepository.save(order);
        return convertToDto(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(long id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getStatus() != OrderStatus.SHIPPING && order.getStatus() != OrderStatus.CREATED) {
            throw new RuntimeException("Only shipping or created orders can be cancelled");
        }

        List<OrderItem> orderItems = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem orderItem : orderItems) {
            ProductSize productSize = productSizeRepository
                    .findByProduct_IdAndSize_Id(orderItem.getProduct().getId(), orderItem.getSize().getId())
                    .orElseThrow(() -> new RuntimeException("Product size not found while cancelling order"));
            productSize.setStock(productSize.getStock() + orderItem.getQuantity());
            productSizeRepository.save(productSize);
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
        return convertToDto(order);
    }

    @Override
    public OrderResponse deliveredOrder(long id) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getStatus() != OrderStatus.SHIPPING) {
            throw new RuntimeException("Only shipping orders can be delivered");
        }
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);
        return convertToDto(order);
    }

    @Override
    @Transactional
    public OrderResponse createOrder(User user, UserOrderRequest request) {
        if (request.getOrderItems() == null || request.getOrderItems().isEmpty()) {
            throw new RuntimeException("Danh sách sản phẩm không được để trống");
        }

        List<OrderItem> pendingOrderItems = new ArrayList<>();
        double totalAmount = 0.0;

        for (UserOrderRequest.OrderItemRequest itemRequest : request.getOrderItems()) {
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new RuntimeException("Số lượng sản phẩm phải lớn hơn 0");
            }

            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException(
                            "Sản phẩm với ID " + itemRequest.getProductId() + " không tồn tại"));

            ProductSize productSize = productSizeRepository
                    .findByProduct_IdAndSize_Id(itemRequest.getProductId(), itemRequest.getSizeId())
                    .orElseThrow(() -> new RuntimeException("Size không có sẵn cho sản phẩm này"));

            if (productSize.getStock() < itemRequest.getQuantity()) {
                throw new RuntimeException(
                        "Sản phẩm " + product.getName() + ", size " + productSize.getSize().getName()
                                + " chỉ còn " + productSize.getStock() + " cái");
            }

            productSize.setStock(productSize.getStock() - itemRequest.getQuantity());
            productSizeRepository.save(productSize);

            double unitPrice = product.getPrice();
            totalAmount += unitPrice * itemRequest.getQuantity();

            pendingOrderItems.add(OrderItem.builder()
                    .product(product)
                    .size(productSize.getSize())
                    .quantity(itemRequest.getQuantity())
                    .price(unitPrice)
                    .build());
        }

        Promotion promotion = null;
        double discountAmount = 0.0;
        double finalAmount = totalAmount;

        if (request.getPromotionCode() != null && !request.getPromotionCode().trim().isEmpty()) {
            String promotionCode = request.getPromotionCode().trim();
            promotion = promotionRepository.findByCode(promotionCode)
                    .orElseThrow(() -> new RuntimeException("Mã khuyến mãi không tồn tại"));

            LocalDateTime now = LocalDateTime.now();
            if (!Boolean.TRUE.equals(promotion.getIsActive())) {
                throw new RuntimeException("Mã khuyến mãi đã bị vô hiệu hóa");
            }
            if (now.isBefore(promotion.getStartAt()) || !now.isBefore(promotion.getEndAt())) {
                throw new RuntimeException("Mã khuyến mãi đã hết hạn hoặc chưa bắt đầu");
            }

            BigDecimal totalAmountDecimal = BigDecimal.valueOf(totalAmount);
            if (totalAmountDecimal.compareTo(promotion.getMinOrderAmount()) < 0) {
                throw new RuntimeException("Đơn hàng chưa đạt giá trị tối thiểu để áp dụng khuyến mãi");
            }

            BigDecimal calculatedDiscount = totalAmountDecimal
                    .multiply(promotion.getDiscountPercent())
                    .divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            BigDecimal cappedDiscount = calculatedDiscount.min(promotion.getMaxDiscountAmount());
            discountAmount = cappedDiscount.doubleValue();
            finalAmount = totalAmount - discountAmount;
            if (finalAmount < 0) finalAmount = 0.0;
        }

        Order order = Order.builder()
                .user(user)
                .totalAmount(totalAmount)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .status(OrderStatus.CREATED)
                .promotion(promotion)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Order savedOrder = orderRepository.save(order);
        pendingOrderItems.forEach(item -> item.setOrder(savedOrder));
        List<OrderItem> savedOrderItems = orderItemRepository.saveAll(pendingOrderItems);
        savedOrder.setOrderItems(savedOrderItems);
        return convertToDetailDto(savedOrder);
    }

    @Override
    public List<BestSellingProductsInCategoriesDTO> getBestSellingProductsInCategories() {
        return orderRepository.getBestSellingProductsInCategories();
    }    
}
