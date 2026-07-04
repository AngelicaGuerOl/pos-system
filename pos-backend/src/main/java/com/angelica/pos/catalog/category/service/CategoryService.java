package com.angelica.pos.catalog.category.service;

import com.angelica.pos.catalog.category.dto.CategoryRequest;
import com.angelica.pos.catalog.category.dto.CategoryResponse;
import com.angelica.pos.catalog.category.dto.CategoryUpdateRequest;

import java.util.List;

public interface CategoryService {

    CategoryResponse create(CategoryRequest request);

    List<CategoryResponse> findAllActive(String search);

    CategoryResponse findById(Long id);

    CategoryResponse update(Long id, CategoryUpdateRequest request);

    void deactivate(Long id);
}
