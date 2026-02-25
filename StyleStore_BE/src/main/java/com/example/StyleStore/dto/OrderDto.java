package com.example.StyleStore.dto;

import com.example.StyleStore.model.enums.OrderStatus;
import com.example.StyleStore.model.enums.PaymentMethod;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDto {
    private Long id;
    private Long userId;
    private String userName;
    private String phoneNumber;
    private Double totalAmount;
    private Double discountAmount;
    private Double finalAmount;
    private String promotionCode;
    private String shippingAddress;
    private PaymentMethod paymentMethod;
    private OrderStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemDto> orderItems;
}
