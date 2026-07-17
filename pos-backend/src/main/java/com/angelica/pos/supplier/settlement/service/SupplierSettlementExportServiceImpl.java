package com.angelica.pos.supplier.settlement.service;

import com.angelica.pos.supplier.settlement.entity.SupplierSettlement;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementItem;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementDraftExportNotAllowedException;
import com.angelica.pos.supplier.settlement.exception.SupplierSettlementNotFoundException;
import com.angelica.pos.supplier.settlement.repository.SupplierSettlementRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierSettlementExportServiceImpl implements SupplierSettlementExportService {

    private final SupplierSettlementRepository settlementRepository;

    @Override
    @Transactional(readOnly = true)
    public ExportedSettlement export(Long id) {
        SupplierSettlement settlement = settlementRepository.findWithItemsById(id)
                .orElseThrow(() -> new SupplierSettlementNotFoundException(id));
        if (settlement.getStatus() != SupplierSettlementStatus.FINALIZED) {
            throw new SupplierSettlementDraftExportNotAllowedException(id);
        }

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet summarySheet = workbook.createSheet("Resumen");
            Sheet detailSheet = workbook.createSheet("Detalle");
            CellStyle headerStyle = headerStyle(workbook);
            DataFormat dataFormat = workbook.createDataFormat();
            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.setDataFormat(dataFormat.getFormat("$#,##0.00"));
            CellStyle quantityStyle = workbook.createCellStyle();
            quantityStyle.setDataFormat(dataFormat.getFormat("#,##0.00"));
            CellStyle discrepancyTextStyle = discrepancyStyle(workbook);
            CellStyle discrepancyMoneyStyle = discrepancyStyle(workbook);
            discrepancyMoneyStyle.setDataFormat(dataFormat.getFormat("$#,##0.00"));
            CellStyle discrepancyQuantityStyle = discrepancyStyle(workbook);
            discrepancyQuantityStyle.setDataFormat(dataFormat.getFormat("#,##0.00"));

            writeSummary(summarySheet, settlement, moneyStyle, headerStyle);
            writeDetails(
                    detailSheet,
                    settlement,
                    moneyStyle,
                    quantityStyle,
                    headerStyle,
                    discrepancyTextStyle,
                    discrepancyMoneyStyle,
                    discrepancyQuantityStyle
            );

            autosize(summarySheet, 2);
            autosize(detailSheet, 13);
            workbook.write(output);
            return new ExportedSettlement(filename(settlement), output.toByteArray());
        } catch (IOException exception) {
            throw new IllegalStateException("No se pudo generar el archivo Excel del corte", exception);
        }
    }

    private int writeHeader(Sheet sheet, SupplierSettlement settlement, int rowNumber, CellStyle headerStyle) {
        Row title = sheet.createRow(rowNumber++);
        title.createCell(0).setCellValue("Datos del corte");
        title.getCell(0).setCellStyle(headerStyle);
        rowNumber = writePair(sheet, rowNumber, "Proveedor", settlement.getSupplier().getName());
        rowNumber = writePair(sheet, rowNumber, "Periodo", settlement.getPeriodStart() + " a " + settlement.getPeriodEnd());
        rowNumber = writePair(sheet, rowNumber, "Fecha de finalizacion", String.valueOf(settlement.getFinalizedAt()));
        rowNumber = writePair(sheet, rowNumber, "Finalizado por", settlement.getFinalizedBy() == null ? "No registrado" : settlement.getFinalizedBy().getUsername());
        rowNumber = writePair(sheet, rowNumber, "Estado", settlement.getStatus().name());
        return rowNumber;
    }

    private void writeDetails(
            Sheet sheet,
            SupplierSettlement settlement,
            CellStyle moneyStyle,
            CellStyle quantityStyle,
            CellStyle headerStyle,
            CellStyle discrepancyTextStyle,
            CellStyle discrepancyMoneyStyle,
            CellStyle discrepancyQuantityStyle
    ) {
        int rowNumber = 0;
        Row header = sheet.createRow(rowNumber++);
        String[] columns = {
                "Producto", "Codigo de barras", "Unidad", "Existencia inicial", "Entradas", "Disponible",
                "Inventario final contado", "Cantidad por justificar", "Precio utilizado",
                "Inventario inicial en dinero", "Valor de entradas", "Inventario final en dinero",
                "Importe por justificar"
        };
        for (int i = 0; i < columns.length; i++) {
            header.createCell(i).setCellValue(columns[i]);
            header.getCell(i).setCellStyle(headerStyle);
        }

        List<SupplierSettlementItem> visibleItems = settlement.getItems().stream()
                .filter(this::shouldExportItem)
                .toList();
        if (visibleItems.isEmpty()) {
            Row row = sheet.createRow(rowNumber);
            row.createCell(0).setCellValue("No hubo productos con movimientos o existencias en este corte.");
        }

        for (SupplierSettlementItem item : visibleItems) {
            Row row = sheet.createRow(rowNumber++);
            boolean discrepancy = hasDiscrepancy(item);
            row.createCell(0).setCellValue(item.getProductNameSnapshot());
            row.createCell(1).setCellValue(item.getBarcodeSnapshot() == null ? "" : item.getBarcodeSnapshot());
            row.createCell(2).setCellValue(item.getUnitSnapshot().name());
            quantity(row, 3, value(item.getOpeningQuantity()).doubleValue(), discrepancy ? discrepancyQuantityStyle : quantityStyle);
            quantity(row, 4, value(item.getReceivedQuantity()).doubleValue(), discrepancy ? discrepancyQuantityStyle : quantityStyle);
            quantity(row, 5, value(item.getAvailableQuantity()).doubleValue(), discrepancy ? discrepancyQuantityStyle : quantityStyle);
            quantity(row, 6, value(item.getClosingQuantity()).doubleValue(), discrepancy ? discrepancyQuantityStyle : quantityStyle);
            quantity(row, 7, value(item.getQuantityToJustify()).doubleValue(), discrepancy ? discrepancyQuantityStyle : quantityStyle);
            money(row, 8, value(item.getClosingSalePrice()).doubleValue(), discrepancy ? discrepancyMoneyStyle : moneyStyle);
            money(row, 9, value(item.getOpeningValue()).doubleValue(), discrepancy ? discrepancyMoneyStyle : moneyStyle);
            money(row, 10, value(item.getReceivedSaleValue()).doubleValue(), discrepancy ? discrepancyMoneyStyle : moneyStyle);
            money(row, 11, value(item.getClosingValue()).doubleValue(), discrepancy ? discrepancyMoneyStyle : moneyStyle);
            money(row, 12, value(item.getExpectedAmount()).doubleValue(), discrepancy ? discrepancyMoneyStyle : moneyStyle);
            if (discrepancy) {
                row.getCell(0).setCellStyle(discrepancyTextStyle);
                row.getCell(1).setCellStyle(discrepancyTextStyle);
                row.getCell(2).setCellStyle(discrepancyTextStyle);
            }
        }

        sheet.createFreezePane(0, 1);
        sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(0, Math.max(rowNumber - 1, 1), 0, columns.length - 1));
    }

    private void writeSummary(Sheet sheet, SupplierSettlement settlement, CellStyle moneyStyle, CellStyle headerStyle) {
        int rowNumber = 0;
        rowNumber = writeHeader(sheet, settlement, rowNumber, headerStyle);
        rowNumber++;
        Row title = sheet.createRow(rowNumber++);
        title.createCell(0).setCellValue("Resumen");
        title.getCell(0).setCellStyle(headerStyle);
        rowNumber = writeMoneyPair(sheet, rowNumber, "Inventario inicial", settlement.getOpeningInventoryValue().doubleValue(), moneyStyle);
        rowNumber = writeMoneyPair(sheet, rowNumber, "Mercancia recibida", settlement.getEntriesSaleValue().doubleValue(), moneyStyle);
        rowNumber = writeMoneyPair(sheet, rowNumber, "Total disponible", settlement.getAvailableInventoryValue().doubleValue(), moneyStyle);
        rowNumber = writeMoneyPair(sheet, rowNumber, "Inventario final", settlement.getClosingInventoryValue().doubleValue(), moneyStyle);
        rowNumber = writeMoneyPair(sheet, rowNumber, "Importe por justificar", settlement.getExpectedAmount().doubleValue(), moneyStyle);
        rowNumber = writeNullableMoneyPair(sheet, rowNumber, "Importe entregado", settlement.getDeliveredAmount(), moneyStyle);
        rowNumber = writeNullableMoneyPair(sheet, rowNumber, "Diferencia", settlement.getDifferenceAmount(), moneyStyle);
        writePair(sheet, rowNumber, "Observaciones", settlement.getNotes() == null ? "No registrado" : settlement.getNotes());
    }

    private int writePair(Sheet sheet, int rowNumber, String label, String value) {
        Row row = sheet.createRow(rowNumber++);
        row.createCell(0).setCellValue(label);
        row.createCell(1).setCellValue(value == null ? "" : value);
        return rowNumber;
    }

    private int writeMoneyPair(Sheet sheet, int rowNumber, String label, double value, CellStyle style) {
        Row row = sheet.createRow(rowNumber++);
        row.createCell(0).setCellValue(label);
        money(row, 1, value, style);
        return rowNumber;
    }

    private int writeNullableMoneyPair(Sheet sheet, int rowNumber, String label, BigDecimal value, CellStyle style) {
        if (value == null) {
            return writePair(sheet, rowNumber, label, "No registrado");
        }
        return writeMoneyPair(sheet, rowNumber, label, value.doubleValue(), style);
    }

    private void quantity(Row row, int column, double value, CellStyle style) {
        row.createCell(column).setCellValue(value);
        row.getCell(column).setCellStyle(style);
    }

    private void money(Row row, int column, double value, CellStyle style) {
        row.createCell(column).setCellValue(value);
        row.getCell(column).setCellStyle(style);
    }

    private boolean shouldExportItem(SupplierSettlementItem item) {
        return hasDiscrepancy(item)
                || isNonZero(item.getOpeningQuantity())
                || isNonZero(item.getReceivedQuantity())
                || isNonZero(item.getAvailableQuantity())
                || isNonZero(item.getClosingQuantity())
                || isNonZero(item.getQuantityToJustify())
                || isNonZero(item.getOpeningValue())
                || isNonZero(item.getReceivedSaleValue())
                || isNonZero(item.getClosingValue())
                || isNonZero(item.getExpectedAmount());
    }

    private boolean hasDiscrepancy(SupplierSettlementItem item) {
        return Boolean.TRUE.equals(item.getHasDiscrepancy())
                || value(item.getClosingQuantity()).compareTo(value(item.getAvailableQuantity())) > 0;
    }

    private boolean isNonZero(BigDecimal value) {
        return value(value).compareTo(BigDecimal.ZERO) != 0;
    }

    private BigDecimal value(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private CellStyle headerStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private CellStyle discrepancyStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void autosize(Sheet sheet, int columns) {
        for (int i = 0; i < columns; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private String filename(SupplierSettlement settlement) {
        String supplier = Normalizer.normalize(settlement.getSupplier().getName().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return "corte-" + supplier + "-" + settlement.getPeriodStart() + "-a-" + settlement.getPeriodEnd() + ".xlsx";
    }
}
