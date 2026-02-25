package com.example.StyleStore.dto;

import com.example.StyleStore.model.enums.PaymentMethod;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderRequest {
    private String shippingAddress;
    private PaymentMethod paymentMethod;
    private String promotionCode;
    private List<OrderItemRequest> orderItems;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OrderItemRequest {
        private Long productId;
        private Long sizeId;
        private Integer quantity;
    }
}
