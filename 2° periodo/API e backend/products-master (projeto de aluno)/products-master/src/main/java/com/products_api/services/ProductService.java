package com.products_api.services;

import com.products_api.models.ProductModel;
import com.products_api.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public ProductModel create(ProductModel product) {
        return productRepository.save(product);
    }

    public List<ProductModel> findAll() {
        return productRepository.findAll();
    }

    public ProductModel findById(UUID productId) {
        return productRepository.findById(productId)
                .orElseThrow();
    }

    public ProductModel update(UUID productId, ProductModel product) {
        ProductModel existingProduct = findById(productId);

        existingProduct.setName(product.getName());
        existingProduct.setDescription(product.getDescription());
        existingProduct.setType(product.getType());
        existingProduct.setPrice(product.getPrice());

        return productRepository.save(existingProduct);
    }

    public void delete(UUID productId) {
        productRepository.deleteById(productId);
    }
}
