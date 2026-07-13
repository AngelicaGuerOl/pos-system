package com.angelica.pos.cash.session.service;

import com.angelica.pos.cash.session.dto.CashSessionOpenRequest;
import com.angelica.pos.cash.session.dto.CashSessionResponse;
import com.angelica.pos.cash.session.entity.CashSession;
import com.angelica.pos.cash.session.entity.CashSessionStatus;
import com.angelica.pos.cash.session.exception.CashSessionAlreadyOpenException;
import com.angelica.pos.cash.session.exception.CashSessionNotFoundException;
import com.angelica.pos.cash.session.mapper.CashSessionMapper;
import com.angelica.pos.cash.session.repository.CashSessionRepository;
import com.angelica.pos.security.AuthenticatedUser;
import com.angelica.pos.shared.response.PageResponse;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CashSessionServiceImplTest {

    private CashSessionRepository cashSessionRepository;
    private UserRepository userRepository;
    private CashSessionMapper cashSessionMapper;
    private CashSessionServiceImpl cashSessionService;

    @BeforeEach
    void setUp() {
        cashSessionRepository = mock(CashSessionRepository.class);
        userRepository = mock(UserRepository.class);
        cashSessionMapper = mock(CashSessionMapper.class);
        cashSessionService = new CashSessionServiceImpl(cashSessionRepository, userRepository, cashSessionMapper);
    }

    @Test
    void openCreatesOpenCashSessionForAuthenticatedUser() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);
        CashSessionOpenRequest request = buildOpenRequest("100.00");
        CashSession savedCashSession = CashSession.builder()
                .id(10L)
                .openedBy(user)
                .openingAmount(request.getOpeningAmount())
                .status(CashSessionStatus.OPEN)
                .build();
        CashSessionResponse response = new CashSessionResponse();
        response.setId(10L);
        response.setOpenedByUserId(user.getId());
        response.setOpeningAmount(request.getOpeningAmount());
        response.setStatus(CashSessionStatus.OPEN);

        when(cashSessionRepository.existsByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(false);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.saveAndFlush(any(CashSession.class))).thenReturn(savedCashSession);
        when(cashSessionMapper.toResponse(savedCashSession)).thenReturn(response);

        CashSessionResponse result = cashSessionService.open(request, authenticatedUser);

        assertEquals(10L, result.getId());
        assertEquals(user.getId(), result.getOpenedByUserId());
        assertEquals(CashSessionStatus.OPEN, result.getStatus());
        assertNull(savedCashSession.getClosedBy());
        assertNull(savedCashSession.getClosedAt());
        assertNull(savedCashSession.getExpectedCash());
        assertNull(savedCashSession.getCountedCash());
        assertNull(savedCashSession.getCashDifference());
    }

    @Test
    void openRejectsUserWithExistingOpenCashSession() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.existsByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(true);

        assertThrows(
                CashSessionAlreadyOpenException.class,
                () -> cashSessionService.open(buildOpenRequest("0.00"), authenticatedUser)
        );
    }

    @Test
    void openConvertsConcurrentUniqueViolationToAlreadyOpenException() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.existsByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(false);
        when(userRepository.findByIdAndActiveTrue(user.getId())).thenReturn(Optional.of(user));
        when(cashSessionRepository.saveAndFlush(any(CashSession.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate open cash session"));

        assertThrows(
                CashSessionAlreadyOpenException.class,
                () -> cashSessionService.open(buildOpenRequest("50.00"), authenticatedUser)
        );
    }

    @Test
    void findCurrentReturnsEmptyWhenUserHasNoOpenCashSession() {
        User user = buildUser();
        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        when(cashSessionRepository.findByOpenedByIdAndStatus(user.getId(), CashSessionStatus.OPEN))
                .thenReturn(Optional.empty());

        assertFalse(cashSessionService.findCurrent(authenticatedUser).isPresent());
    }

    @Test
    void findByIdThrowsWhenCashSessionDoesNotExist() {
        when(cashSessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(CashSessionNotFoundException.class, () -> cashSessionService.findById(99L));
    }

    @Test
    void findAllReturnsPageResponse() {
        User user = buildUser();
        CashSession cashSession = CashSession.builder()
                .id(1L)
                .openedBy(user)
                .openingAmount(BigDecimal.ZERO)
                .status(CashSessionStatus.OPEN)
                .build();
        CashSessionResponse response = new CashSessionResponse();
        response.setId(1L);

        PageRequest pageable = PageRequest.of(0, 10);
        when(cashSessionRepository.findAll(pageable))
                .thenReturn(new PageImpl<>(List.of(cashSession), pageable, 1));
        when(cashSessionMapper.toResponseList(List.of(cashSession))).thenReturn(List.of(response));

        PageResponse<CashSessionResponse> result = cashSessionService.findAll(pageable);

        assertEquals(1, result.getContent().size());
        assertEquals(0, result.getPage());
        assertEquals(10, result.getSize());
        assertEquals(1, result.getTotalElements());
        assertTrue(result.isFirst());
        assertTrue(result.isLast());
        verify(cashSessionRepository).findAll(pageable);
    }

    private CashSessionOpenRequest buildOpenRequest(String amount) {
        CashSessionOpenRequest request = new CashSessionOpenRequest();
        request.setOpeningAmount(new BigDecimal(amount));
        return request;
    }

    private User buildUser() {
        return User.builder()
                .id(5L)
                .username("cashier")
                .passwordHash("password-hash")
                .role(Role.CASHIER)
                .active(true)
                .mustChangePassword(false)
                .build();
    }
}
