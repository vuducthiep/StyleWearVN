package com.example.StyleStore.service;

import com.example.StyleStore.dto.response.stats.CategoryStockDto;
import com.example.StyleStore.model.Category;
import com.example.StyleStore.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ProductService {
    Page<Product> getProducts(Pageable pageable);
    Page<Product> getProductsByCategory(Category category, Pageable pageable);
    Optional<Product> getProductById(Long id);
    Product createProduct(Product product);
    boolean deleteProduct(Long id);
    Product updateProduct(Long id, Product newProduct);
    long getTotalProductCount();
    long getTotalStock();
    List<CategoryStockDto> getStockByCategory();
    Page<Product> searchProductsByName(String name, Pageable pageable);
    Page<Product> searchProductsByNameOrCategory(String keyword, Pageable pageable);
}