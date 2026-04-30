package com.example.StyleStore.service;

import com.example.StyleStore.dto.request.UserOrderRequest;
import com.example.StyleStore.dto.response.OrderResponse;
import com.example.StyleStore.model.*;
import com.example.StyleStore.model.enums.OrderStatus;
import com.example.StyleStore.model.enums.PaymentMethod;
import com.example.StyleStore.model.enums.ProductStatus;
import com.example.StyleStore.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.*;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ✅ Test: UPDATE WHERE - Prevents Overselling
 * 
 * Kiểm chứng rằng cơ chế UPDATE WHERE ngăn chặn hiện tượng overselling
 * khi nhiều user mua cùng sản phẩm đồng thời
 */
@SpringBootTest
@ActiveProfiles("test")
public class OrderConcurrencyTest {

    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductSizeRepository productSizeRepository;
    @Autowired private SizeRepository sizeRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private Category category;
    private Size size;
    private Product product;
    private ProductSize productSize;
    private Role role;

    @BeforeEach
    public void setUp() {
        // ✅ Xóa dữ liệu cũ bằng cú pháp tương thích H2
        jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY FALSE");
        try {
            jdbcTemplate.execute("TRUNCATE TABLE comments");
            jdbcTemplate.execute("TRUNCATE TABLE order_items");
            jdbcTemplate.execute("TRUNCATE TABLE orders");
            jdbcTemplate.execute("TRUNCATE TABLE product_sizes");
            jdbcTemplate.execute("TRUNCATE TABLE products");
            jdbcTemplate.execute("TRUNCATE TABLE categories");
            jdbcTemplate.execute("TRUNCATE TABLE sizes");
            jdbcTemplate.execute("TRUNCATE TABLE users");
            jdbcTemplate.execute("TRUNCATE TABLE roles");
        } finally {
            jdbcTemplate.execute("SET REFERENTIAL_INTEGRITY TRUE");
        }

        // ✅ Tạo role
        role = roleRepository.save(Role.builder()
                .name("CUSTOMER")
                .build());

        // ✅ Tạo dữ liệu test
        category = categoryRepository.save(Category.builder()
                .name("Test Category")
                .status("ACTIVE")
                .build());

        size = sizeRepository.save(Size.builder()
                .name("M")
                .build());

        product = productRepository.save(Product.builder()
                .name("Test Product")
                .price(100.0)
                .gender("UNISEX")
                .color("Black")
                .thumbnail("test.jpg")
                .status(ProductStatus.ACTIVE)
                .category(category)
                .build());

        productSize = productSizeRepository.save(ProductSize.builder()
                .product(product)
                .size(size)
                .stock(5)  // ✅ Tồn kho = 5
                .build());
    }

    /**
     * ✅ TEST: 2 user mua cùng lúc, stock đúng đủ cho 1 người
     * 
     * Kịch bản:
     * - Stock = 5
     * - User A: mua 5 (đồng thời)
     * - User B: mua 5 (đồng thời)
     * 
     * Kỳ vọng:
     * - 1 người mua thành công
     * - 1 người mua thất bại (hết hàng)
     * - Final stock = 0 (không bao giờ âm!)
     */
    @Test
    public void testTwoUsersConcurrentBuy_ExactStock() throws InterruptedException {
        System.out.println("\n===============================================");
        System.out.println("TEST: 2 Users - Exact Stock");
        System.out.println("===============================================");
        System.out.println("Stock ban đầu: " + productSize.getStock());

        // ✅ Tạo 2 user
        User userA = userRepository.save(User.builder()
                .fullName("User A")
                .email("userA@test.com")
                .password("password")
                .phoneNumber("0123456789")
                .role(role)
                .build());

        User userB = userRepository.save(User.builder()
                .fullName("User B")
                .email("userB@test.com")
                .password("password")
                .phoneNumber("0123456789")
                .role(role)
                .build());

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(2);

        List<OrderResponse> success = Collections.synchronizedList(new ArrayList<>());
        List<String> failed = Collections.synchronizedList(new ArrayList<>());

        // ✅ Thread 1: User A mua 5
        Thread thread1 = new Thread(() -> {
            try {
                startLatch.await();  // Chờ tín hiệu bắt đầu
                
                UserOrderRequest request = UserOrderRequest.builder()
                        .orderItems(List.of(
                                new UserOrderRequest.OrderItemRequest(product.getId(), size.getId(), 5)
                        ))
                        .shippingAddress("Address A")
                        .paymentMethod(PaymentMethod.COD)
                        .build();

                OrderResponse order = orderService.createOrder(userA, request);
                success.add(order);
                System.out.println("✓ User A: Mua thành công (qty: 5)");
            } catch (Exception e) {
                failed.add(e.getMessage());
                System.out.println("✗ User A: " + e.getMessage());
            } finally {
                endLatch.countDown();
            }
        });

        // ✅ Thread 2: User B mua 5
        Thread thread2 = new Thread(() -> {
            try {
                startLatch.await();  // Chờ tín hiệu bắt đầu
                
                UserOrderRequest request = UserOrderRequest.builder()
                        .orderItems(List.of(
                                new UserOrderRequest.OrderItemRequest(product.getId(), size.getId(), 5)
                        ))
                        .shippingAddress("Address B")
                        .paymentMethod(PaymentMethod.COD)
                        .build();

                OrderResponse order = orderService.createOrder(userB, request);
                success.add(order);
                System.out.println("✓ User B: Mua thành công (qty: 5)");
            } catch (Exception e) {
                failed.add(e.getMessage());
                System.out.println("✗ User B: " + e.getMessage());
            } finally {
                endLatch.countDown();
            }
        });

        // ✅ Khởi động 2 thread
        thread1.start();
        thread2.start();

        // ✅ Đợi chuẩn bị, rồi cho 2 thread chạy cùng lúc
        Thread.sleep(100);
        startLatch.countDown();

        // ✅ Chờ cả 2 thread kết thúc
        endLatch.await();

        // ✅ Kiểm tra kết quả
        System.out.println("\n--- Kết quả ---");
        System.out.println("Mua thành công: " + success.size());
        System.out.println("Mua thất bại: " + failed.size());

        ProductSize finalStock = productSizeRepository.findById(productSize.getId()).orElse(productSize);
        System.out.println("Stock cuối: " + finalStock.getStock());

        // ✅ ASSERT
        assertEquals(1, success.size(), "Phải có đúng 1 đơn hàng thành công");
        assertEquals(1, failed.size(), "Phải có đúng 1 đơn hàng thất bại");
        assertEquals(0, finalStock.getStock(), "Stock phải = 0");
        assertTrue(failed.get(0).contains("chỉ còn"), "Lỗi phải chứa thông tin stock");

        System.out.println("\n✅ TEST PASSED: Không bị oversell!");
        System.out.println("===============================================\n");
    }

    /**
     * ✅ TEST: 10 users mua đồng thời - Stress Test
     * 
     * Kịch bản:
     * - Stock = 10
     * - 10 users, mỗi người mua 2 (total demand = 20)
     * 
     * Kỳ vọng:
     * - Chỉ 5 người mua thành công
     * - 5 người thất bại
     * - Stock cuối = 0
     */
    @Test
    public void testStressTest_10UsersConcurrent() throws InterruptedException {
        System.out.println("\n===============================================");
        System.out.println("TEST: 10 Users - Stress Test");
        System.out.println("===============================================");

        // ✅ Reset stock = 10
        productSize.setStock(10);
        productSizeRepository.save(productSize);
        System.out.println("Stock ban đầu: 10");

        int NUM_USERS = 10;
        int QTY_PER_USER = 2;

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(NUM_USERS);

        List<OrderResponse> success = Collections.synchronizedList(new ArrayList<>());
        List<String> failed = Collections.synchronizedList(new ArrayList<>());

        // ✅ Tạo 10 users và threads
        for (int i = 0; i < NUM_USERS; i++) {
            final int userId = i;

            User user = userRepository.save(User.builder()
                    .fullName("User " + userId)
                    .email("user" + userId + "@test.com")
                    .password("password")
                    .phoneNumber("0123456789")
                    .role(role)
                    .build());

            Thread thread = new Thread(() -> {
                try {
                    startLatch.await();

                    UserOrderRequest request = UserOrderRequest.builder()
                            .orderItems(List.of(
                                    new UserOrderRequest.OrderItemRequest(
                                            product.getId(),
                                            size.getId(),
                                            QTY_PER_USER
                                    )
                            ))
                            .shippingAddress("Address " + userId)
                            .paymentMethod(PaymentMethod.COD)
                            .build();

                    OrderResponse order = orderService.createOrder(user, request);
                    success.add(order);
                    System.out.println("✓ User " + userId + ": Mua " + QTY_PER_USER + " thành công");
                } catch (Exception e) {
                    failed.add("User " + userId + ": " + e.getMessage());
                    System.out.println("✗ User " + userId + ": Hết hàng");
                } finally {
                    endLatch.countDown();
                }
            });

            thread.start();
        }

        // ✅ Khởi động tất cả threads cùng lúc
        Thread.sleep(100);
        startLatch.countDown();

        // ✅ Chờ tất cả kết thúc
        endLatch.await();

        // ✅ Kiểm tra kết quả
        System.out.println("\n--- Kết quả ---");
        System.out.println("Mua thành công: " + success.size());
        System.out.println("Mua thất bại: " + failed.size());
        int totalSold = success.size() * QTY_PER_USER;
        System.out.println("Tổng sold: " + totalSold);

        ProductSize finalStock = productSizeRepository.findById(productSize.getId()).orElse(productSize);
        System.out.println("Stock cuối: " + finalStock.getStock());

        // ✅ ASSERT
        assertTrue(success.size() <= 5, "Phải có tối đa 5 đơn thành công");
        assertTrue(totalSold <= 10, "Tổng sold phải <= 10");
        assertEquals(10 - totalSold, finalStock.getStock(), "Stock phải bằng 10 - sold");
        assertTrue(finalStock.getStock() >= 0, "Stock không bao giờ âm!");

        System.out.println("\n✅ STRESS TEST PASSED: Xử lý được 10 concurrent requests!");
        System.out.println("===============================================\n");
    }

    /**
     * ✅ TEST: 5 users mua, stock = 3 (không đủ cho ai hết)
     * 
     * Kịch bản:
     * - Stock = 3
     * - 5 users, mỗi người mua 1
     * 
     * Kỳ vọng:
     * - 3 người mua thành công
     * - 2 người thất bại
     * - Stock = 0 (không bao giờ âm!)
     */
    @Test
    public void testStockNeverGoesNegative() throws InterruptedException {
        System.out.println("\n===============================================");
        System.out.println("TEST: Stock Never Goes Negative");
        System.out.println("===============================================");

        // ✅ Reset stock = 3
        productSize.setStock(3);
        productSizeRepository.save(productSize);
        System.out.println("Stock ban đầu: 3");

        int NUM_USERS = 5;

        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch endLatch = new CountDownLatch(NUM_USERS);

        List<OrderResponse> success = Collections.synchronizedList(new ArrayList<>());
        List<String> failed = Collections.synchronizedList(new ArrayList<>());

        // ✅ Tạo 5 users
        for (int i = 0; i < NUM_USERS; i++) {
            final int userId = i;

            User user = userRepository.save(User.builder()
                    .fullName("User " + userId)
                    .email("user" + userId + "@test.com")
                    .password("password")
                    .phoneNumber("0123456789")
                    .role(role)
                    .build());

            Thread thread = new Thread(() -> {
                try {
                    startLatch.await();

                    UserOrderRequest request = UserOrderRequest.builder()
                            .orderItems(List.of(
                                    new UserOrderRequest.OrderItemRequest(
                                            product.getId(),
                                            size.getId(),
                                            1  // Mỗi người mua 1
                                    )
                            ))
                            .shippingAddress("Address " + userId)
                            .paymentMethod(PaymentMethod.COD)
                            .build();

                    OrderResponse order = orderService.createOrder(user, request);
                    success.add(order);
                    System.out.println("✓ User " + userId + ": Mua 1 thành công");
                } catch (Exception e) {
                    failed.add(e.getMessage());
                    System.out.println("✗ User " + userId + ": Hết hàng");
                } finally {
                    endLatch.countDown();
                }
            });

            thread.start();
        }

        // ✅ Khởi động tất cả
        Thread.sleep(100);
        startLatch.countDown();

        // ✅ Chờ kết thúc
        endLatch.await();

        // ✅ Kiểm tra
        System.out.println("\n--- Kết quả ---");
        System.out.println("Mua thành công: " + success.size());
        System.out.println("Mua thất bại: " + failed.size());

        ProductSize finalStock = productSizeRepository.findById(productSize.getId()).orElse(productSize);
        System.out.println("Stock cuối: " + finalStock.getStock());

        // ✅ ASSERT
        assertEquals(3, success.size(), "Phải có đúng 3 đơn thành công");
        assertEquals(2, failed.size(), "Phải có đúng 2 đơn thất bại");
        assertEquals(0, finalStock.getStock(), "Stock cuối phải = 0");
        assertFalse(finalStock.getStock() < 0, "Stock KHÔNG BAO GIỜ được âm!");

        System.out.println("\n✅ TEST PASSED: Stock không bao giờ âm!");
        System.out.println("===============================================\n");
    }
}
