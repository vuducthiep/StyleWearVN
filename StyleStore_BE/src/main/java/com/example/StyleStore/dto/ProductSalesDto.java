package com.example.StyleStore.dto;

import java.io.Serializable;

public class ProductSalesDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private final Long productId;
    private final String productName;
    private final Long quantitySold;

    public ProductSalesDto(Long productId, String productName, Long quantitySold) {
        this.productId = productId;
        this.productName = productName;
        this.quantitySold = quantitySold;
    }

    public Long getProductId() {
        return productId;
    }

    public String getProductName() {
        return productName;
    }

    public Long getQuantitySold() {
        return quantitySold;
    }
}
