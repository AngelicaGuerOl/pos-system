package com.angelica.pos.user.service;

import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.dto.UserCreateRequest;
import com.angelica.pos.user.dto.UserResponse;
import com.angelica.pos.user.dto.UserUpdateRequest;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserAlreadyExistsException;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.mapper.UserMapper;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final int MAX_PAGE_SIZE = 50;

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String normalizedUsername = normalizeRequiredText(request.getUsername());

        if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
            throw new UserAlreadyExistsException(normalizedUsername);
        }

        User user = userMapper.toEntity(request);
        user.setUsername(normalizedUsername);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setMustChangePassword(true);

        User savedUser = userRepository.save(user);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> findAllActive(String search, Pageable pageable) {
        validatePageSize(pageable);

        String normalizedSearch = normalizeSearch(search);
        Page<User> usersPage = normalizedSearch == null
                ? userRepository.findAllActive(pageable)
                : userRepository.findAllActiveWithSearch(normalizedSearch, pageable);
        List<UserResponse> content = userMapper.toResponseList(usersPage.getContent());

        return PageResponse.<UserResponse>builder()
                .content(content)
                .page(usersPage.getNumber())
                .size(usersPage.getSize())
                .totalElements(usersPage.getTotalElements())
                .totalPages(usersPage.getTotalPages())
                .first(usersPage.isFirst())
                .last(usersPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(Long id) {
        User user = findActiveUserById(id);
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = findActiveUserById(id);
        String normalizedUsername = normalizeRequiredText(request.getUsername());

        if (userRepository.existsByUsernameIgnoreCaseAndIdNot(normalizedUsername, id)) {
            throw new UserAlreadyExistsException(normalizedUsername);
        }
        validateAdminContinuity(user, request.getRole(), request.getActive());

        userMapper.updateEntityFromRequest(request, user);
        user.setUsername(normalizedUsername);

        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public void deactivate(Long id) {
        User user = findActiveUserById(id);
        validateAdminContinuity(user, user.getRole(), false);
        user.setActive(false);
    }

    private User findActiveUserById(Long id) {
        return userRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }

    private void validateAdminContinuity(User currentUser, Role requestedRole, Boolean requestedActive) {
        boolean currentUserIsActiveAdmin = currentUser.getRole() == Role.ADMIN && Boolean.TRUE.equals(currentUser.getActive());
        boolean requestedUserWillRemainActiveAdmin = requestedRole == Role.ADMIN && Boolean.TRUE.equals(requestedActive);

        if (currentUserIsActiveAdmin
                && !requestedUserWillRemainActiveAdmin
                && userRepository.countByRoleAndActiveTrue(Role.ADMIN) <= 1) {
            throw new IllegalArgumentException("Debe existir al menos un administrador activo");
        }
    }

    private String normalizeRequiredText(String value) {
        return value.trim();
    }

    private String normalizeSearch(String search) {
        if (search == null) {
            return null;
        }
        String normalizedSearch = search.trim();
        return normalizedSearch.isEmpty() ? null : normalizedSearch;
    }
}
