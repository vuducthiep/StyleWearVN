package com.example.StyleStore.repository;

import com.example.StyleStore.model.ProductSize;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface ProductSizeRepository extends JpaRepository<ProductSize, Long> {
    Optional<ProductSize> findByProduct_IdAndSize_Id(Long productId, Long sizeId);

    @Query(value = "SELECT COALESCE(SUM(ps.stock), 0) FROM product_sizes ps", nativeQuery = true)
    Long sumTotalStock();

    /**
     * ✅ UPDATE WHERE Method - Atomic Inventory Decrease
     * 
     * SQL: UPDATE product_sizes 
     *      SET stock = stock - :quantity
     *      WHERE product_id = :productId 
     *        AND size_id = :sizeId 
     *        AND stock >= :quantity
     * 
     * Nguyên tắc:
     * - Nếu stock >= quantity → UPDATE thành công → Return 1
     * - Nếu stock < quantity → Không có hàng match → Return 0
     * 
     * Lợi ích:
     * - Atomic operation (1 SQL statement)
     * - Không cần Pessimistic Lock
     * - Tránh race condition: 2 người mua cùng lúc
     * - Simple & performant
     * 
     * Cách dùng:
     * int updated = decreaseStockIfAvailable(productId, sizeId, quantity);
     * if (updated == 0) {
     *     // Stock không đủ - fail
     *     throw new RuntimeException("Out of stock");
     * }
     * // Stock updated thành công!
     * 
     * @param productId ID sản phẩm
     * @param sizeId ID size
     * @param quantity Số lượng cần giảm
     * @return 1 nếu update thành công, 0 nếu stock không đủ
     */
    @Modifying
    @Transactional
    @Query(value = "UPDATE product_sizes SET stock = stock - :quantity " +
           "WHERE product_id = :productId AND size_id = :sizeId AND stock >= :quantity",
           nativeQuery = true)
    int decreaseStockIfAvailable(Long productId, Long sizeId, Integer quantity);
}
