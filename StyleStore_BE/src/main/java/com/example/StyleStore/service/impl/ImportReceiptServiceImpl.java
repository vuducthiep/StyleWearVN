package com.example.StyleStore.service.impl;

import com.example.StyleStore.dto.request.ImportReceiptCreateRequest;
import com.example.StyleStore.dto.request.SupplierCreateRequest;
import com.example.StyleStore.dto.request.SupplierUpdateRequest;
import com.example.StyleStore.dto.response.ImportReceiptItemResponse;
import com.example.StyleStore.dto.response.ImportReceiptResponse;
import com.example.StyleStore.dto.response.SupplierResponse;
import com.example.StyleStore.model.*;
import com.example.StyleStore.model.enums.ImportReceiptStatus;
import com.example.StyleStore.repository.*;
import com.example.StyleStore.service.ImportReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImportReceiptServiceImpl implements ImportReceiptService {

    private final ImportReceiptRepository importReceiptRepository;
    private final ImportReceiptItemRepository importReceiptItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final SizeRepository sizeRepository;
    private final ProductSizeRepository productSizeRepository;

    @Override
    @Transactional
    public ImportReceiptResponse createImportReceipt(ImportReceiptCreateRequest request) {
        if (request == null) {
            throw new RuntimeException("Yêu cầu không hợp lệ");
        }
        if (request.getSupplierId() == null) {
            throw new RuntimeException("SupplierId không được để trống");
        }
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Danh sách sản phẩm không được để trống");
        }

        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhà cung cấp"));

        ImportReceiptStatus status = resolveImportReceiptStatus(request.getStatus());

        ImportReceipt receipt = ImportReceipt.builder()
                .supplier(supplier)
                .createdBy(request.getCreatedBy())
                .note(request.getNote())
                .status(status)
                .build();

        ImportReceipt savedReceipt = importReceiptRepository.save(receipt);

        List<ImportReceiptItem> receiptItems = new ArrayList<>();
        for (ImportReceiptCreateRequest.ImportReceiptItemRequest itemRequest : request.getItems()) {
            if (itemRequest.getProductId() == null || itemRequest.getSizeId() == null) {
                throw new RuntimeException("Thông tin sản phẩm/size không hợp lệ");
            }
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() <= 0) {
                throw new RuntimeException("Số lượng nhập phải lớn hơn 0");
            }

            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm id=" + itemRequest.getProductId()));
            Size size = sizeRepository.findById(itemRequest.getSizeId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy size id=" + itemRequest.getSizeId()));

            Double importPrice = itemRequest.getImportPrice() != null ? itemRequest.getImportPrice() : product.getPrice();
            if (importPrice == null || importPrice < 0) {
                throw new RuntimeException("Giá nhập cho sản phẩm " + product.getName() + " không hợp lệ");
            }

            ProductSize productSize = productSizeRepository
                    .findByProduct_IdAndSize_Id(product.getId(), size.getId())
                    .orElseGet(() -> ProductSize.builder()
                            .product(product)
                            .size(size)
                            .stock(0)
                            .build());

            int currentStock = productSize.getStock() == null ? 0 : productSize.getStock();
            productSize.setStock(currentStock + itemRequest.getQuantity());
            productSizeRepository.save(productSize);

            ImportReceiptItem receiptItem = ImportReceiptItem.builder()
                    .receipt(savedReceipt)
                    .product(product)
                    .size(size)
                    .quantity(itemRequest.getQuantity())
                    .importPrice(importPrice)
                    .build();

            receiptItems.add(receiptItem);
        }

        importReceiptItemRepository.saveAll(receiptItems);
        return toImportReceiptResponse(savedReceipt, receiptItems, true);
    }

    @Override
    public Page<ImportReceiptResponse> getImportReceipts(int page, int size, String sortBy, String sortDir,
                                                         Long supplierId, String status) {
        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        PageRequest pageRequest = PageRequest.of(page, size, sort);
        ImportReceiptStatus normalizedStatus = null;
        if (status != null && !status.trim().isEmpty()) {
            normalizedStatus = resolveImportReceiptStatus(status);
        }

        return importReceiptRepository.search(supplierId, normalizedStatus, pageRequest)
                .map(receipt -> toImportReceiptResponse(receipt, null, false));
    }

    private ImportReceiptStatus resolveImportReceiptStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.trim().isEmpty()) {
            return ImportReceiptStatus.COMPLETED;
        }

        if (!ImportReceiptStatus.COMPLETED.name().equalsIgnoreCase(rawStatus.trim())) {
            throw new RuntimeException("Trạng thái phiếu nhập chỉ hỗ trợ COMPLETED");
        }

        return ImportReceiptStatus.COMPLETED;
    }

    @Override
    public ImportReceiptResponse getImportReceiptById(Long id) {
        ImportReceipt receipt = importReceiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập"));
        List<ImportReceiptItem> items = importReceiptItemRepository.findByReceiptId(id);
        return toImportReceiptResponse(receipt, items, true);
    }

    @Override
        public Page<SupplierResponse> getSuppliers(int page, int size, String sortBy, String sortDir, String keyword) {
        Sort sort = "asc".equalsIgnoreCase(sortDir)
            ? Sort.by(sortBy).ascending()
            : Sort.by(sortBy).descending();

        PageRequest pageRequest = PageRequest.of(page, size, sort);
        String normalizedKeyword = (keyword == null || keyword.trim().isEmpty()) ? null : keyword.trim();

        return supplierRepository.search(normalizedKeyword, pageRequest)
            .map(this::toSupplierResponse);
    }

    @Override
    public SupplierResponse createSupplier(SupplierCreateRequest request) {
        if (request == null || request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Tên nhà cung cấp không được để trống");
        }
        if (supplierRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new RuntimeException("Tên nhà cung cấp đã tồn tại");
        }

        String status = request.getStatus();
        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        }

        Supplier supplier = Supplier.builder()
                .name(request.getName().trim())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .status(status.trim().toUpperCase(Locale.ROOT))
                .note(request.getNote())
                .build();

        return toSupplierResponse(supplierRepository.save(supplier));
    }

    @Override
    public SupplierResponse updateSupplier(Long id, SupplierUpdateRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nha cung cap"));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String newName = request.getName().trim();
            if (!supplier.getName().equalsIgnoreCase(newName)
                    && supplierRepository.existsByNameIgnoreCase(newName)) {
                throw new RuntimeException("Ten nha cung cap da ton tai");
            }
            supplier.setName(newName);
        }

        if (request.getPhone() != null) supplier.setPhone(request.getPhone());
        if (request.getEmail() != null) supplier.setEmail(request.getEmail());
        if (request.getAddress() != null) supplier.setAddress(request.getAddress());
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            supplier.setStatus(request.getStatus().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getNote() != null) supplier.setNote(request.getNote());

        return toSupplierResponse(supplierRepository.save(supplier));
    }

    private ImportReceiptResponse toImportReceiptResponse(ImportReceipt receipt,
                                                          List<ImportReceiptItem> items,
                                                          boolean includeItems) {
        List<ImportReceiptItem> safeItems = items;
        if (safeItems == null) {
            safeItems = importReceiptItemRepository.findByReceiptId(receipt.getId());
        }

        double totalAmount = safeItems.stream()
                .mapToDouble(item -> {
                    double price = item.getImportPrice() == null ? 0.0 : item.getImportPrice();
                    int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
                    return price * quantity;
                })
                .sum();

        List<ImportReceiptItemResponse> itemResponses = null;
        if (includeItems) {
            itemResponses = safeItems.stream()
                    .map(item -> {
                        double price = item.getImportPrice() == null ? 0.0 : item.getImportPrice();
                        int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
                        return ImportReceiptItemResponse.builder()
                                .id(item.getId())
                                .productId(item.getProduct().getId())
                                .productName(item.getProduct().getName())
                                .sizeId(item.getSize().getId())
                                .sizeName(item.getSize().getName())
                                .quantity(quantity)
                                .importPrice(price)
                                .subtotal(price * quantity)
                                .build();
                    })
                    .collect(Collectors.toList());
        }

        return ImportReceiptResponse.builder()
                .id(receipt.getId())
                .supplierId(receipt.getSupplier().getId())
                .supplierName(receipt.getSupplier().getName())
                .createdBy(receipt.getCreatedBy())
                .note(receipt.getNote())
                .status(receipt.getStatus() != null ? receipt.getStatus().name() : null)
                .totalAmount(totalAmount)
                .createdAt(receipt.getCreatedAt())
                .updatedAt(receipt.getUpdatedAt())
                .items(itemResponses)
                .build();
    }

    private SupplierResponse toSupplierResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .address(supplier.getAddress())
                .status(supplier.getStatus())
                .note(supplier.getNote())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }
}
