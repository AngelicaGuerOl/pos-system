package com.angelica.pos.inventory.movement.repository;

import com.angelica.pos.inventory.movement.entity.InventoryMovement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface InventoryMovementRepository extends
        JpaRepository<InventoryMovement, Long>,
        JpaSpecificationExecutor<InventoryMovement> {

    boolean existsByProductId(Long productId);

    @Query("""
            SELECT im
            FROM InventoryMovement im
            JOIN FETCH im.product
            JOIN FETCH im.createdBy
            WHERE im.id = :id
            """)
    Optional<InventoryMovement> findByIdWithDetails(@Param("id") Long id);

    @Override
    @EntityGraph(attributePaths = {"product", "createdBy"})
    Page<InventoryMovement> findAll(Specification<InventoryMovement> specification, Pageable pageable);

    @Query(
            value = """
            SELECT im
            FROM InventoryMovement im
            JOIN FETCH im.product p
            JOIN FETCH im.createdBy
            WHERE p.id = :productId
            """,
            countQuery = """
            SELECT COUNT(im)
            FROM InventoryMovement im
            WHERE im.product.id = :productId
            """
    )
    Page<InventoryMovement> findByProductIdWithDetails(@Param("productId") Long productId, Pageable pageable);
}
