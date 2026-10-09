package com.products_api.controllers;

import com.products_api.models.CategoryModel;
import com.products_api.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryModel> saveCategory(@RequestBody CategoryModel categoryModel) {
        CategoryModel category = categoryService.create(categoryModel);
        return ResponseEntity.status(HttpStatus.CREATED).body(category);
    }

    @GetMapping
    public ResponseEntity<List<CategoryModel>> listCategories() {
        List<CategoryModel> categories = categoryService.findAll();
        return ResponseEntity.ok().body(categories);
    }

    @GetMapping("/{idCategory}")
    public ResponseEntity<CategoryModel> getById(@PathVariable UUID idCategory) {
        CategoryModel category = categoryService.findById(idCategory);
        return ResponseEntity.ok().body(category);
    }

    @DeleteMapping("/{idCategory}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID idCategory) {
        categoryService.delete(idCategory);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{idCategory}")
    public ResponseEntity<CategoryModel> updateCategory(
            @RequestBody CategoryModel categoryModel,
            @PathVariable UUID idCategory) {
        CategoryModel categoryEdited = categoryService.update(idCategory, categoryModel);
        return ResponseEntity.ok().body(categoryEdited);
    }
}
