package com.products_api.controllers;

import com.products_api.models.ProductModel;
import com.products_api.services.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.websocket.Endpoint;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Products", description = "endpoints do produto")
@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Operation(summary = "criar um novo produto", description = "Endpoint para criar produto")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "product created sucesfuly"),
            @ApiResponse(responseCode = "400", description = "invalid data")
    })

    @PostMapping
    public ResponseEntity<ProductModel> saveProduct(@RequestBody ProductModel productModel) {
        ProductModel product = productService.create(productModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @GetMapping
    public ResponseEntity<List<ProductModel>> listProducts() {
        List<ProductModel> products = productService.findAll();
        return ResponseEntity.ok().body(products);
    }

    @GetMapping("/{idProduct}")
    public ResponseEntity<ProductModel> getById(@PathVariable UUID idProduct) {
        ProductModel product = productService.findById(idProduct);
        return ResponseEntity.ok().body(product);
    }

    @DeleteMapping("/{idProduct}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID idProduct) {
        productService.delete(idProduct);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{idProduct}")
    public ResponseEntity<ProductModel> updateProduct(
            @RequestBody ProductModel productModel,
            @PathVariable UUID idProduct
    ) {
        ProductModel productEdited = productService.update(idProduct, productModel);
        return ResponseEntity.ok().body(productEdited);
    }


}
