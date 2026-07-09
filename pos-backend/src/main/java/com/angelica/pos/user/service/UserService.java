package com.angelica.pos.user.service;

import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.dto.UserCreateRequest;
import com.angelica.pos.user.dto.UserResponse;
import com.angelica.pos.user.dto.UserUpdateRequest;
import org.springframework.data.domain.Pageable;

public interface UserService {

    UserResponse create(UserCreateRequest request);

    PageResponse<UserResponse> findAllActive(String search, Pageable pageable);

    UserResponse findById(Long id);

    UserResponse update(Long id, UserUpdateRequest request);

    void deactivate(Long id);
}
