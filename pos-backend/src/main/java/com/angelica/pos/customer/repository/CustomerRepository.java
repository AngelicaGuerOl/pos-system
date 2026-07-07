package com.angelica.pos.customer.repository;

import com.angelica.pos.customer.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByIdAndActiveTrue(Long id);

    Page<Customer> findAllByActiveTrue(Pageable pageable);

    boolean existsByFirstNameIgnoreCaseAndLastNameIgnoreCaseAndPhoneIgnoreCaseAndActiveTrue(
            String firstName,
            String lastName,
            String phone
    );

    boolean existsByFirstNameIgnoreCaseAndLastNameIgnoreCaseAndPhoneIgnoreCaseAndActiveTrueAndIdNot(
            String firstName,
            String lastName,
            String phone,
            Long id
    );

    @Query("""
            SELECT c
            FROM Customer c
            WHERE c.active = true
              AND (
                    :search IS NULL
                    OR LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(c.phone) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Customer> findAllActiveWithFilters(
            @Param("search") String search,
            Pageable pageable
    );
}
