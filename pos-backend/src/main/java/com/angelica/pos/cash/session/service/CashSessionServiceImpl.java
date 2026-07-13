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
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.exception.UserNotFoundException;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CashSessionServiceImpl implements CashSessionService {

    private static final int MAX_PAGE_SIZE = 50;

    private final CashSessionRepository cashSessionRepository;
    private final UserRepository userRepository;
    private final CashSessionMapper cashSessionMapper;

    @Override
    @Transactional
    public CashSessionResponse open(CashSessionOpenRequest request, AuthenticatedUser authenticatedUser) {
        Long userId = authenticatedUser.getId();
        if (cashSessionRepository.existsByOpenedByIdAndStatus(userId, CashSessionStatus.OPEN)) {
            throw new CashSessionAlreadyOpenException(userId);
        }

        User user = userRepository.findByIdAndActiveTrue(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        CashSession cashSession = CashSession.builder()
                .openedBy(user)
                .openingAmount(request.getOpeningAmount())
                .status(CashSessionStatus.OPEN)
                .build();

        try {
            CashSession savedCashSession = cashSessionRepository.saveAndFlush(cashSession);
            return cashSessionMapper.toResponse(savedCashSession);
        } catch (DataIntegrityViolationException exception) {
            throw new CashSessionAlreadyOpenException(userId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CashSessionResponse> findCurrent(AuthenticatedUser authenticatedUser) {
        return cashSessionRepository.findByOpenedByIdAndStatus(authenticatedUser.getId(), CashSessionStatus.OPEN)
                .map(cashSessionMapper::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public CashSessionResponse findById(Long id) {
        CashSession cashSession = cashSessionRepository.findById(id)
                .orElseThrow(() -> new CashSessionNotFoundException(id));
        return cashSessionMapper.toResponse(cashSession);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CashSessionResponse> findAll(Pageable pageable) {
        validatePageSize(pageable);

        Page<CashSession> cashSessionsPage = cashSessionRepository.findAll(pageable);
        List<CashSessionResponse> content = cashSessionMapper.toResponseList(cashSessionsPage.getContent());

        return PageResponse.<CashSessionResponse>builder()
                .content(content)
                .page(cashSessionsPage.getNumber())
                .size(cashSessionsPage.getSize())
                .totalElements(cashSessionsPage.getTotalElements())
                .totalPages(cashSessionsPage.getTotalPages())
                .first(cashSessionsPage.isFirst())
                .last(cashSessionsPage.isLast())
                .build();
    }

    private void validatePageSize(Pageable pageable) {
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("El tamano de pagina no debe superar " + MAX_PAGE_SIZE + " registros");
        }
    }
}
