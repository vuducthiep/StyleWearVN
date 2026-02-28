package com.example.StyleStore.dto;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

public class RevenueWithProductsDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private final BigDecimal revenue;
    private final List<ProductSalesDto> soldProducts;

    public RevenueWithProductsDto(BigDecimal revenue, List<ProductSalesDto> soldProducts) {
        this.revenue = revenue;
        this.soldProducts = soldProducts;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public List<ProductSalesDto> getSoldProducts() {
        return soldProducts;
    }
}
