package com.angelica.pos.supplier.repository;

import com.angelica.pos.supplier.entity.SupplierInventoryBaseline;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SupplierInventoryBaselineRepository extends JpaRepository<SupplierInventoryBaseline, Long> {

    boolean existsBySupplierId(Long supplierId);

    @EntityGraph(attributePaths = {"supplier", "createdBy", "items", "items.product"})
    Optional<SupplierInventoryBaseline> findBySupplierId(Long supplierId);
}
