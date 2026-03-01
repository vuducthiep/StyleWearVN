package com.example.StyleStore.service;

import com.example.StyleStore.dto.CategoryStockDto;
import com.example.StyleStore.model.Category;
import com.example.StyleStore.model.Product;
import com.example.StyleStore.model.ProductSize;
import com.example.StyleStore.model.Size;
import com.example.StyleStore.model.enums.ProductStatus;
import com.example.StyleStore.repository.CategoryRepository;
import com.example.StyleStore.repository.ProductRepository;
import com.example.StyleStore.repository.ProductSizeRepository;
import com.example.StyleStore.repository.SizeRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SizeRepository sizeRepository;

    @Autowired
    private ProductSizeRepository productSizeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Page<Product> getProducts(Pageable pageable) {
        return productRepository.findByStatus(ProductStatus.ACTIVE, pageable);
    }

    public Page<Product> getProductsByCategory(Category category, Pageable pageable) {
        return productRepository.findByCategoryAndStatus(category, ProductStatus.ACTIVE, pageable);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public Product createProduct(Product product) {
        // Lấy tất cả sizes từ database
        List<Size> allSizes = sizeRepository.findAll();

        // Tạo ProductSize cho tất cả size, mặc định stock = 0
        List<ProductSize> productSizes = new ArrayList<>();
        for (Size size : allSizes) {
            // Tìm xem size này có trong danh sách gửi lên không
            Integer stock = 0;
            if (product.getProductSizes() != null) {
                for (ProductSize ps : product.getProductSizes()) {
                    if (ps.getSize() != null && ps.getSize().getId().equals(size.getId())) {
                        stock = ps.getStock() != null ? ps.getStock() : 0;
                        break;
                    }
                }
            }

            ProductSize productSize = ProductSize.builder()
                    .product(product)
                    .size(size)
                    .stock(stock)
                    .build();
            productSizes.add(productSize);
        }

        product.setProductSizes(productSizes);
        return productRepository.save(product);
    }

    public boolean deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            return false;
        }
        productRepository.deleteById(id);
        return true;
    }

    public Product updateProduct(Long id, Product newProduct) {
        return productRepository.findById(id)
                .map(product -> {
                    if (newProduct.getName() != null) {
                        product.setName(newProduct.getName());
                    }
                    if (newProduct.getDescription() != null) {
                        product.setDescription(newProduct.getDescription());
                    }
                    if (newProduct.getGender() != null) {
                        product.setGender(newProduct.getGender());
                    }
                    if (newProduct.getBrand() != null) {
                        product.setBrand(newProduct.getBrand());
                    }
                    if (newProduct.getPrice() != null) {
                        product.setPrice(newProduct.getPrice());
                    }
                    if (newProduct.getThumbnail() != null) {
                        product.setThumbnail(newProduct.getThumbnail());
                    }
                    if (newProduct.getStatus() != null) {
                        product.setStatus(newProduct.getStatus());
                    }
                    if (newProduct.getCategory() != null) {
                        product.setCategory(newProduct.getCategory());
                    }

                    // Cập nhật stock của ProductSize
                    if (newProduct.getProductSizes() != null && !newProduct.getProductSizes().isEmpty()) {
                        product.getProductSizes().forEach(existingSize -> {
                            newProduct.getProductSizes().forEach(newSize -> {
                                if (existingSize.getId().equals(newSize.getId())) {
                                    if (newSize.getStock() != null) {
                                        existingSize.setStock(newSize.getStock());
                                    }
                                }
                            });
                        });
                    }

                    return productRepository.save(product);
                })
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
    }

    @Cacheable(cacheNames = "stats:products:count", key = "'fixed'")
    public long getTotalProductCount() {
        return productRepository.count();
    }

    public long getTotalStock() {
        Long total = productSizeRepository.sumTotalStock();
        return total != null ? total : 0L;
    }

    public List<CategoryStockDto> getStockByCategory() {
        return categoryRepository.sumStockByCategory().stream()
                .map(item -> new CategoryStockDto(
                        item.getCategoryId(),
                        item.getCategoryName(),
                        item.getTotalStock()))
                .collect(Collectors.toList());
    }

    public Page<Product> searchProductsByName(String name, Pageable pageable) {
        return productRepository.searchByName(name, ProductStatus.ACTIVE, pageable);
    }

    public Page<Product> searchProductsByNameOrCategory(String keyword, Pageable pageable) {
        return productRepository.searchByNameOrCategory(keyword, ProductStatus.ACTIVE, pageable);
    }
}