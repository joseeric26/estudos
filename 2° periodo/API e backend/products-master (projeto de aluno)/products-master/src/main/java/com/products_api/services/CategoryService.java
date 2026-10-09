package com.products_api.services;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.products_api.models.CategoryModel;
import com.products_api.repositories.CategoryRepository;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public CategoryModel create(CategoryModel category) {
        return categoryRepository.save(category);
    }

    public List<CategoryModel> findAll() {
        return categoryRepository.findAll();
    }

    public CategoryModel findById(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow();
    }

    public CategoryModel update(UUID categoryId, CategoryModel category) {
        CategoryModel existingCategory = findById(categoryId);

        existingCategory.setName(category.getName());
        existingCategory.setDescription(category.getDescription());

        return categoryRepository.save(existingCategory);
    }

    public void delete(UUID categoryId) {
        categoryRepository.deleteById(categoryId);
    }

}
