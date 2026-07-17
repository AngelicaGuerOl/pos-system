package com.angelica.pos.supplier.settlement.service;

import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlement;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementItem;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import com.angelica.pos.supplier.settlement.repository.SupplierSettlementRepository;
import com.angelica.pos.user.entity.Role;
import com.angelica.pos.user.entity.User;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class SupplierSettlementExportServiceImplTest {

    private SupplierSettlementRepository settlementRepository;
    private SupplierSettlementExportServiceImpl exportService;

    @BeforeEach
    void setUp() {
        settlementRepository = mock(SupplierSettlementRepository.class);
        exportService = new SupplierSettlementExportServiceImpl(settlementRepository);
    }

    @Test
    void exportOmitsZeroRowsKeepsRelevantRowsAndPreservesSummaryTotals() throws Exception {
        SupplierSettlement settlement = settlementWithItems(List.of(
                item("Producto en cero", bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), false),
                item("Con existencia inicial", bd("2"), bd("0"), bd("2"), bd("0"), bd("2"), bd("40"), bd("0"), bd("0"), bd("40"), false),
                item("Con entradas", bd("0"), bd("3"), bd("3"), bd("0"), bd("3"), bd("0"), bd("60"), bd("0"), bd("60"), false),
                item("Con inventario final", bd("0"), bd("0"), bd("0"), bd("4"), bd("-4"), bd("0"), bd("0"), bd("80"), bd("-80"), false),
                item("Con importe negativo", bd("0"), bd("0"), bd("0"), bd("1"), bd("-1"), bd("0"), bd("0"), bd("20"), bd("-20"), false),
                item("Con inconsistencia", bd("0"), bd("0"), bd("1"), bd("2"), bd("-1"), bd("0"), bd("0"), bd("40"), bd("-40"), true)
        ));
        when(settlementRepository.findWithItemsById(10L)).thenReturn(Optional.of(settlement));

        SupplierSettlementExportService.ExportedSettlement exported = exportService.export(10L);

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(exported.content()))) {
            Sheet summary = workbook.getSheet("Resumen");
            Sheet detail = workbook.getSheet("Detalle");

            assertNotNull(summary);
            assertNotNull(detail);
            assertEquals(2, workbook.getNumberOfSheets());

            List<String> exportedProducts = exportedProductNames(detail);
            assertFalse(exportedProducts.contains("Producto en cero"));
            assertTrue(exportedProducts.contains("Con existencia inicial"));
            assertTrue(exportedProducts.contains("Con entradas"));
            assertTrue(exportedProducts.contains("Con inventario final"));
            assertTrue(exportedProducts.contains("Con importe negativo"));
            assertTrue(exportedProducts.contains("Con inconsistencia"));

            assertEquals(1000.0, numericValue(summary, "Inventario inicial"));
            assertEquals(500.0, numericValue(summary, "Mercancia recibida"));
            assertEquals(1500.0, numericValue(summary, "Total disponible"));
            assertEquals(300.0, numericValue(summary, "Inventario final"));
            assertEquals(1200.0, numericValue(summary, "Importe por justificar"));
            assertEquals(1100.0, numericValue(summary, "Importe entregado"));
            assertEquals(-100.0, numericValue(summary, "Diferencia"));

            Row inconsistentRow = rowByProduct(detail, "Con inconsistencia");
            assertNotNull(inconsistentRow);
            assertTrue(inconsistentRow.getCell(0).getCellStyle().getFillForegroundColor() > 0);
        }
    }

    @Test
    void exportWritesMessageWhenNoRelevantProductsExist() throws Exception {
        SupplierSettlement settlement = settlementWithItems(List.of(
                item("Producto en cero", bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), bd("0"), false)
        ));
        when(settlementRepository.findWithItemsById(10L)).thenReturn(Optional.of(settlement));

        SupplierSettlementExportService.ExportedSettlement exported = exportService.export(10L);

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(exported.content()))) {
            Sheet detail = workbook.getSheet("Detalle");

            assertEquals("No hubo productos con movimientos o existencias en este corte.",
                    detail.getRow(1).getCell(0).getStringCellValue());
        }
    }

    private SupplierSettlement settlementWithItems(List<SupplierSettlementItem> items) {
        Supplier supplier = Supplier.builder()
                .id(1L)
                .name("Barcel")
                .build();
        User user = User.builder()
                .id(1L)
                .username("admin")
                .role(Role.ADMIN)
                .passwordHash("hash")
                .build();
        SupplierSettlement settlement = SupplierSettlement.builder()
                .id(10L)
                .supplier(supplier)
                .periodStart(LocalDate.of(2026, 7, 1))
                .periodEnd(LocalDate.of(2026, 7, 17))
                .status(SupplierSettlementStatus.FINALIZED)
                .openingInventoryValue(bd("1000"))
                .entriesSaleValue(bd("500"))
                .availableInventoryValue(bd("1500"))
                .closingInventoryValue(bd("300"))
                .expectedAmount(bd("1200"))
                .deliveredAmount(bd("1100"))
                .differenceAmount(bd("-100"))
                .notes("Revision")
                .hasDiscrepancies(true)
                .createdBy(user)
                .finalizedBy(user)
                .createdAt(OffsetDateTime.parse("2026-07-17T10:00:00-06:00"))
                .finalizedAt(OffsetDateTime.parse("2026-07-17T11:00:00-06:00"))
                .items(new ArrayList<>())
                .build();
        items.forEach(settlement::addItem);
        return settlement;
    }

    private SupplierSettlementItem item(
            String productName,
            BigDecimal openingQuantity,
            BigDecimal receivedQuantity,
            BigDecimal availableQuantity,
            BigDecimal closingQuantity,
            BigDecimal quantityToJustify,
            BigDecimal openingValue,
            BigDecimal receivedSaleValue,
            BigDecimal closingValue,
            BigDecimal expectedAmount,
            boolean hasDiscrepancy
    ) {
        return SupplierSettlementItem.builder()
                .product(Product.builder().id(1L).name(productName).barcode("BC-" + productName).unit(ProductUnit.PIECE).build())
                .productNameSnapshot(productName)
                .barcodeSnapshot("BC-" + productName)
                .unitSnapshot(ProductUnit.PIECE)
                .openingQuantity(openingQuantity)
                .openingSalePrice(bd("20"))
                .openingValue(openingValue)
                .receivedQuantity(receivedQuantity)
                .receivedSaleValue(receivedSaleValue)
                .availableQuantity(availableQuantity)
                .closingQuantity(closingQuantity)
                .closingSalePrice(bd("20"))
                .closingValue(closingValue)
                .quantityToJustify(quantityToJustify)
                .expectedAmount(expectedAmount)
                .hasDiscrepancy(hasDiscrepancy)
                .build();
    }

    private List<String> exportedProductNames(Sheet detail) {
        List<String> names = new ArrayList<>();
        for (int i = 1; i <= detail.getLastRowNum(); i++) {
            Row row = detail.getRow(i);
            if (row != null && row.getCell(0) != null) {
                names.add(row.getCell(0).getStringCellValue());
            }
        }
        return names;
    }

    private Row rowByProduct(Sheet detail, String productName) {
        for (int i = 1; i <= detail.getLastRowNum(); i++) {
            Row row = detail.getRow(i);
            if (row != null && row.getCell(0) != null && productName.equals(row.getCell(0).getStringCellValue())) {
                return row;
            }
        }
        return null;
    }

    private double numericValue(Sheet sheet, String label) {
        for (int i = 0; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row != null && row.getCell(0) != null && label.equals(row.getCell(0).getStringCellValue())) {
                return row.getCell(1).getNumericCellValue();
            }
        }
        throw new AssertionError("No se encontro la etiqueta " + label);
    }

    private BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
