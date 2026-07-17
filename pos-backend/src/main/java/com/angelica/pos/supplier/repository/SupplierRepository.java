package com.angelica.pos.supplier.repository;

import com.angelica.pos.supplier.entity.Supplier;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<Supplier> findByIdAndActiveTrue(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Supplier s WHERE s.id = :id")
    Optional<Supplier> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT s
            FROM Supplier s
            WHERE (:active IS NULL OR s.active = :active)
              AND (
                    :search IS NULL
                    OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(s.contactName) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(s.phone) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            """)
    Page<Supplier> findAllWithFilters(
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
