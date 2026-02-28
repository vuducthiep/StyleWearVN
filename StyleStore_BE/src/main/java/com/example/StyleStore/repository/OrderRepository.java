package com.example.StyleStore.repository;

import com.example.StyleStore.dto.BestSellingProductsInCategoriesDTO;
import com.example.StyleStore.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    interface MonthlyRevenueProjection {
        Integer getYear();

        Integer getMonth();

        BigDecimal getRevenue();
    }

    interface ProductSalesProjection {
        Long getProductId();

        String getProductName();

        Long getQuantitySold();
    }

    // get sum Revenue By Month
    @Query(value = """
            SELECT YEAR(o.created_at)   AS year,
            			 MONTH(o.created_at)  AS month,
            			 COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM orders o
            WHERE o.created_at >= :from AND o.created_at < :to
            	AND o.status = :completedStatus
            GROUP BY YEAR(o.created_at), MONTH(o.created_at)
            ORDER BY year, month
            """, nativeQuery = true)
    List<MonthlyRevenueProjection> sumRevenueByMonth(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("completedStatus") String completedStatus);

    // get revenue by month
    @Query(value = """
            SELECT COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM orders o
            WHERE YEAR(o.created_at) = :year AND MONTH(o.created_at) = :month
              AND o.status = :completedStatus
            """, nativeQuery = true)
    Optional<BigDecimal> getRevenueByYearMonth(
            @Param("year") int year,
            @Param("month") int month,
            @Param("completedStatus") String completedStatus);

    // get revenue by date range
    @Query(value = """
            SELECT COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM orders o
            WHERE o.created_at >= :from AND o.created_at < :to
              AND o.status = :completedStatus
            """, nativeQuery = true)
    Optional<BigDecimal> getRevenueByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("completedStatus") String completedStatus);

    // get revenue by year
    @Query(value = """
            SELECT COALESCE(SUM(o.total_amount), 0) AS revenue
            FROM orders o
            WHERE YEAR(o.created_at) = :year
              AND o.status = :completedStatus
            """, nativeQuery = true)
    Optional<BigDecimal> getRevenueByYear(
            @Param("year") int year,
            @Param("completedStatus") String completedStatus);

    @Query(value = """
            SELECT
                p.id AS productId,
                p.name AS productName,
                COALESCE(SUM(oi.quantity), 0) AS quantitySold
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN products p ON p.id = oi.product_id
            WHERE o.created_at >= :from AND o.created_at < :to
                AND o.status = :completedStatus
            GROUP BY p.id, p.name
            ORDER BY quantitySold DESC, p.id ASC
            """, nativeQuery = true)
    List<ProductSalesProjection> getProductSalesByDateRange(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            @Param("completedStatus") String completedStatus);

    List<Order> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // get best-selling in categories

    @Query(value = """
                    SELECT category_id, category_name, product_id, product_name, product_thumbnail, total_sold
            FROM (
                SELECT
                    c.id AS category_id,
                    c.name AS category_name,
                    p.name AS product_name,
                    p.id AS product_id,
                    p.thumbnail AS product_thumbnail,
                    SUM(oi.quantity) AS total_sold,
                    ROW_NUMBER() OVER (
                        PARTITION BY c.id
                        ORDER BY SUM(oi.quantity) DESC
                    ) AS rn
                FROM categories c
                JOIN products p ON c.id = p.category_id
                JOIN order_items oi ON oi.product_id = p.id
                GROUP BY c.id, c.name, p.id, p.name, p.thumbnail
            ) t
            WHERE rn = 1;
                    """, nativeQuery = true)
    List<BestSellingProductsInCategoriesDTO> getBestSellingProductsInCategories();
}
