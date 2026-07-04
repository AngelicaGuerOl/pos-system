package com.angelica.pos.catalog.category.service;

import com.angelica.pos.catalog.category.dto.CategoryRequest;
import com.angelica.pos.catalog.category.dto.CategoryResponse;
import com.angelica.pos.catalog.category.dto.CategoryUpdateRequest;
import com.angelica.pos.catalog.category.entity.Category;
import com.angelica.pos.catalog.category.exception.CategoryAlreadyExistsException;
import com.angelica.pos.catalog.category.exception.CategoryNotFoundException;
import com.angelica.pos.catalog.category.mapper.CategoryMapper;
import com.angelica.pos.catalog.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String normalizedName = normalizeName(request.getName());

        if (categoryRepository.existsByNameIgnoreCase(normalizedName)) {
            throw new CategoryAlreadyExistsException(normalizedName);
        }

        Category category = categoryMapper.toEntity(request);
        category.setName(normalizedName);
        category.setDescription(normalizeDescription(request.getDescription()));

        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toResponse(savedCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> findAllActive(String search) {
        String normalizedSearch = normalizeSearch(search);
        List<Category> categories = normalizedSearch == null
                ? categoryRepository.findAllByActiveTrueOrderByNameAsc()
                : categoryRepository.findAllByActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(normalizedSearch);

        return categoryMapper.toResponseList(categories);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        Category category = findActiveCategoryById(id);
        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse update(Long id, CategoryUpdateRequest request) {
        Category category = findActiveCategoryById(id);
        String normalizedName = normalizeName(request.getName());

        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(normalizedName, id)) {
            throw new CategoryAlreadyExistsException(normalizedName);
        }

        categoryMapper.updateEntityFromRequest(request, category);
        category.setName(normalizedName);
        category.setDescription(normalizeDescription(request.getDescription()));

        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Category category = findActiveCategoryById(id);
        category.setActive(false);
    }

    private Category findActiveCategoryById(Long id) {
        return categoryRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
    }

    private String normalizeName(String name) {
        return name.trim();
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }
        String normalizedDescription = description.trim();
        return normalizedDescription.isEmpty() ? null : normalizedDescription;
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String normalizedSearch = search.trim();
        return normalizedSearch.isEmpty() ? null : normalizedSearch;
    }
}
