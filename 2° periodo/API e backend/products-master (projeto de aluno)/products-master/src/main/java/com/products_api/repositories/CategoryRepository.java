package com.products_api.repositories;

import com.products_api.models.CategoryModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<CategoryModel, UUID> {
}
