package com.example.StyleStore.repository;

import com.example.StyleStore.model.ImportReceipt;
import com.example.StyleStore.model.enums.ImportReceiptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImportReceiptRepository extends JpaRepository<ImportReceipt, Long> {

    @Query("""
            SELECT ir
            FROM ImportReceipt ir
            WHERE (:supplierId IS NULL OR ir.supplier.id = :supplierId)
              AND (:status IS NULL OR ir.status = :status)
            """)
    Page<ImportReceipt> search(@Param("supplierId") Long supplierId,
                               @Param("status") ImportReceiptStatus status,
                               Pageable pageable);
}
