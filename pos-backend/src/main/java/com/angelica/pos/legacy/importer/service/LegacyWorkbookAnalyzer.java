package com.angelica.pos.legacy.importer.service;

import com.angelica.pos.legacy.importer.dto.LegacyImportReport;
import lombok.Getter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class LegacyWorkbookAnalyzer {

    private static final Pattern SHEET_DATE = Pattern.compile("\\s*(\\d{2})-(\\d{2})-(\\d{2})\\s*");
    private static final Pattern TITLE_DATE = Pattern.compile("(\\d{1,2})[-/](\\d{1,2})[-/](\\d{2,4})");
    private static final DateTimeFormatter SHEET_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yy");

    public AnalyzedWorkbook analyze(Path path, String supplierName, boolean alreadyImportedLookup) throws IOException {
        try (InputStream inputStream = Files.newInputStream(path);
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
            DataFormatter formatter = new DataFormatter(Locale.forLanguageTag("es-MX"));
            String checksum = checksum(path);
            List<AnalyzedSheet> sheets = new ArrayList<>();
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                parseSheetDate(sheet.getSheetName()).ifPresent(periodEnd -> sheets.add(analyzeSheet(
                        sheet,
                        periodEnd,
                        formatter,
                        evaluator
                )));
            }
            sheets.sort(Comparator.comparing(AnalyzedSheet::periodEnd));
            return new AnalyzedWorkbook(path, path.getFileName().toString(), supplierName, checksum, normalizeChronologicalPeriods(sheets));
        }
    }

    private List<AnalyzedSheet> normalizeChronologicalPeriods(List<AnalyzedSheet> sheets) {
        List<AnalyzedSheet> normalizedSheets = new ArrayList<>();
        for (int index = 0; index < sheets.size(); index++) {
            AnalyzedSheet sheet = sheets.get(index);
            LocalDate periodStart = sheet.periodStart();
            List<String> warnings = new ArrayList<>(sheet.warnings());
            if (index > 0) {
                LocalDate expectedStart = sheets.get(index - 1).periodEnd().plusDays(1);
                if (!periodStart.equals(expectedStart)) {
                    warnings.add("Periodo ajustado por orden cronologico. Detectado=" + periodStart + ", usado=" + expectedStart);
                }
                periodStart = expectedStart;
            }
            if (periodStart.isAfter(sheet.periodEnd())) {
                warnings.add("Periodo inicial detectado posterior al final; se uso la fecha de la hoja como inicio.");
                periodStart = sheet.periodEnd();
            }
            normalizedSheets.add(new AnalyzedSheet(
                    sheet.sheetName(),
                    periodStart,
                    sheet.periodEnd(),
                    sheet.openingItems(),
                    sheet.entries(),
                    sheet.closingItems(),
                    sheet.calculatedExpectedAmount(),
                    sheet.excelExpectedAmount(),
                    warnings,
                    sheet.ignoredRows()
            ));
        }
        return normalizedSheets;
    }

    private AnalyzedSheet analyzeSheet(
            Sheet sheet,
            LocalDate periodEnd,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        List<LegacyItem> opening = new ArrayList<>();
        List<LegacyEntryBlock> entries = new ArrayList<>();
        List<LegacyItem> closing = new ArrayList<>();
        List<String> warnings = new ArrayList<>();
        List<String> ignoredRows = new ArrayList<>();
        LocalDate periodStart = findTitleDate(sheet, formatter, evaluator)
                .map(date -> date.plusDays(1))
                .orElse(periodEnd);

        for (int rowIndex = sheet.getFirstRowNum(); rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            for (int cellIndex = row.getFirstCellNum(); cellIndex >= 0 && cellIndex < row.getLastCellNum(); cellIndex++) {
                String value = text(row.getCell(cellIndex), formatter, evaluator);
                String normalizedValue = normalize(value);
                Optional<BlockSpec> inlineHeader = inlineTableHeader(row, cellIndex, formatter, evaluator);
                if (inlineHeader.isPresent()) {
                    List<LegacyItem> items = parseItems(sheet, rowIndex + 1, cellIndex, inlineHeader.get(), formatter, evaluator, ignoredRows);
                    if (items.isEmpty()) {
                        warnings.add("Bloque sin partidas en fila " + (rowIndex + 1) + ": " + value);
                    } else if (normalizedValue.contains("INVENTARIO INICIAL")) {
                        opening.addAll(items);
                    } else if (normalizedValue.contains("INVENTARIO FINAL")) {
                        closing.addAll(items);
                    } else if (normalizedValue.contains("COMPRA")) {
                        LocalDate entryDate = parseEntryDate(value, periodEnd);
                        if (isLeadingOpeningBlock(sheet, rowIndex, cellIndex, formatter, evaluator)
                                || entryDate.isBefore(periodStart.minusYears(1))) {
                            opening.addAll(items);
                        } else {
                            entries.add(new LegacyEntryBlock(value, entryDate, items));
                        }
                    }
                    continue;
                }
                if (!isConceptHeader(value)) {
                    continue;
                }
                Optional<BlockSpec> conceptHeader = conceptTableHeader(row, cellIndex, formatter, evaluator);
                if (conceptHeader.isEmpty()) {
                    continue;
                }
                String title = findBlockTitle(sheet, rowIndex, cellIndex, formatter, evaluator);
                List<LegacyItem> items = parseItems(sheet, rowIndex + 1, cellIndex, conceptHeader.get(), formatter, evaluator, ignoredRows);
                if (items.isEmpty()) {
                    warnings.add("Bloque sin partidas en fila " + (rowIndex + 1) + ": " + title);
                    continue;
                }
                String normalizedTitle = normalize(title);
                if (normalizedTitle.contains("INVENTARIO INICIAL")) {
                    opening.addAll(items);
                } else if (normalizedTitle.contains("INVENTARIO FINAL")) {
                    closing.addAll(items);
                } else if (normalizedTitle.contains("COMPRA")) {
                    LocalDate entryDate = parseEntryDate(title, periodEnd);
                    if (isLeadingOpeningBlock(sheet, rowIndex, cellIndex, formatter, evaluator)
                            || entryDate.isBefore(periodStart.minusYears(1))) {
                        opening.addAll(items);
                    } else {
                        entries.add(new LegacyEntryBlock(title, entryDate, items));
                    }
                }
            }
        }

        if (opening.isEmpty()) {
            warnings.add("No se detecto detalle de inventario inicial por producto");
        }
        if (closing.isEmpty()) {
            warnings.add("No se detecto detalle de inventario final por producto");
        }
        BigDecimal openingValue = sumValue(opening);
        BigDecimal receivedValue = entries.stream()
                .flatMap(entry -> entry.items().stream())
                .map(LegacyItem::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal closingValue = sumValue(closing);
        BigDecimal calculated = openingValue.add(receivedValue).subtract(closingValue);
        BigDecimal excelExpected = findTotalEfectivo(sheet, formatter, evaluator).orElse(null);
        if (excelExpected != null && calculated.subtract(excelExpected).abs().compareTo(new BigDecimal("0.01")) > 0) {
            warnings.add("Diferencia contra total del Excel. Calculado=" + calculated + ", Excel=" + excelExpected);
        }
        return new AnalyzedSheet(
                sheet.getSheetName(),
                periodStart,
                periodEnd,
                opening,
                entries,
                closing,
                calculated,
                excelExpected,
                warnings,
                ignoredRows
        );
    }

    private List<LegacyItem> parseItems(
            Sheet sheet,
            int firstRow,
            int firstColumn,
            BlockSpec blockSpec,
            DataFormatter formatter,
            FormulaEvaluator evaluator,
            List<String> ignoredRows
    ) {
        List<LegacyItem> items = new ArrayList<>();
        int blankRows = 0;
        for (int rowIndex = firstRow; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                blankRows++;
                if (blankRows > 3) {
                    break;
                }
                continue;
            }
            String name = text(row.getCell(firstColumn), formatter, evaluator);
            if (name.isBlank()) {
                blankRows++;
                if (blankRows > 3) {
                    break;
                }
                continue;
            }
            String normalizedName = normalize(name);
            if (normalizedName.contains("SUMA") || normalizedName.contains("MENOS") || normalizedName.contains("INVENTARIO")) {
                break;
            }
            BigDecimal quantity = number(row.getCell(firstColumn + 1), formatter, evaluator);
            BigDecimal price = number(row.getCell(firstColumn + blockSpec.priceOffset()), formatter, evaluator);
            BigDecimal total = number(row.getCell(firstColumn + blockSpec.totalOffset()), formatter, evaluator);
            BigDecimal costPrice = blockSpec.costPriceOffset() == null
                    ? null
                    : number(row.getCell(firstColumn + blockSpec.costPriceOffset()), formatter, evaluator);
            BigDecimal costTotal = blockSpec.costTotalOffset() == null
                    ? null
                    : number(row.getCell(firstColumn + blockSpec.costTotalOffset()), formatter, evaluator);
            if (price == null || total == null) {
                PriceValue fallback = fallbackSaleValue(row, firstColumn, formatter, evaluator);
                if (fallback != null) {
                    price = fallback.price();
                    total = fallback.value();
                } else if (quantity != null && price != null) {
                    total = quantity.multiply(price);
                }
            }
            if (quantity == null || price == null || total == null) {
                ignoredRows.add("Fila " + (rowIndex + 1) + " ignorada por cantidad/precio/total incompleto: " + name);
                continue;
            }
            items.add(new LegacyItem(name.trim(), quantity, price, total, costPrice, costTotal));
            blankRows = 0;
        }
        return items;
    }

    private String findBlockTitle(
            Sheet sheet,
            int headerRow,
            int column,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        for (int rowIndex = headerRow - 1; rowIndex >= Math.max(0, headerRow - 6); rowIndex--) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            String value = text(row.getCell(column), formatter, evaluator);
            String normalized = normalize(value);
            if (normalized.contains("COMPRA") || normalized.contains("INVENTARIO")) {
                return value;
            }
        }
        return "";
    }

    private Optional<LocalDate> findTitleDate(Sheet sheet, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (int rowIndex = 0; rowIndex <= Math.min(sheet.getLastRowNum(), 20); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            for (int cellIndex = row.getFirstCellNum(); cellIndex >= 0 && cellIndex < row.getLastCellNum(); cellIndex++) {
                String value = text(row.getCell(cellIndex), formatter, evaluator);
                String normalized = normalize(value);
                if (normalized.contains("INVENTARIO INICIAL") || normalized.contains("INVENTARIO FINAL")) {
                    Optional<LocalDate> date = parseDateFromText(value);
                    if (date.isPresent()) {
                        return date;
                    }
                }
            }
        }
        return Optional.empty();
    }

    private boolean isLeadingOpeningBlock(
            Sheet sheet,
            int rowIndex,
            int cellIndex,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        return cellIndex == 0
                && rowIndex <= 10
                && findTitleDate(sheet, formatter, evaluator).isPresent();
    }

    private PriceValue fallbackSaleValue(
            Row row,
            int firstColumn,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        BigDecimal wideSalePrice = number(row.getCell(firstColumn + 5), formatter, evaluator);
        BigDecimal wideSaleValue = number(row.getCell(firstColumn + 6), formatter, evaluator);
        if (wideSalePrice != null && wideSaleValue != null) {
            return new PriceValue(wideSalePrice, wideSaleValue);
        }
        BigDecimal inlineSalePrice = number(row.getCell(firstColumn + 4), formatter, evaluator);
        BigDecimal inlineSaleValue = number(row.getCell(firstColumn + 5), formatter, evaluator);
        if (inlineSalePrice != null && inlineSaleValue != null) {
            return new PriceValue(inlineSalePrice, inlineSaleValue);
        }
        return null;
    }

    private Optional<BigDecimal> findTotalEfectivo(Sheet sheet, DataFormatter formatter, FormulaEvaluator evaluator) {
        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }
            for (int cellIndex = row.getFirstCellNum(); cellIndex >= 0 && cellIndex < row.getLastCellNum(); cellIndex++) {
                String value = text(row.getCell(cellIndex), formatter, evaluator);
                if (normalize(value).contains("TOTAL EFECTIVO")) {
                    for (int offset = 1; offset <= 4; offset++) {
                        BigDecimal number = number(row.getCell(cellIndex + offset), formatter, evaluator);
                        if (number != null) {
                            return Optional.of(number);
                        }
                    }
                }
            }
        }
        return Optional.empty();
    }

    private LocalDate parseEntryDate(String title, LocalDate fallback) {
        return parseDateFromText(title).orElse(fallback);
    }

    private Optional<LocalDate> parseDateFromText(String text) {
        Matcher matcher = TITLE_DATE.matcher(text);
        if (!matcher.find()) {
            return Optional.empty();
        }
        int day = Integer.parseInt(matcher.group(1));
        int month = Integer.parseInt(matcher.group(2));
        int year = Integer.parseInt(matcher.group(3));
        if (year < 100) {
            year += 2000;
        }
        return Optional.of(LocalDate.of(year, month, day));
    }

    private Optional<LocalDate> parseSheetDate(String sheetName) {
        Matcher matcher = SHEET_DATE.matcher(sheetName);
        if (!matcher.matches()) {
            return Optional.empty();
        }
        return Optional.of(LocalDate.parse(sheetName.trim(), SHEET_FORMATTER));
    }

    private boolean isConceptHeader(String value) {
        return normalize(value).equals("CONCEPTO");
    }

    private Optional<BlockSpec> inlineTableHeader(
            Row row,
            int cellIndex,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        String title = normalize(text(row.getCell(cellIndex), formatter, evaluator));
        if (!title.contains("INVENTARIO INICIAL") && !title.contains("INVENTARIO FINAL") && !title.contains("COMPRA")) {
            return Optional.empty();
        }
        String quantityHeader = normalize(text(row.getCell(cellIndex + 1), formatter, evaluator));
        String priceHeader = normalize(text(row.getCell(cellIndex + 2), formatter, evaluator));
        String totalHeader = normalize(text(row.getCell(cellIndex + 3), formatter, evaluator));
        String salePriceHeader = normalize(text(row.getCell(cellIndex + 4), formatter, evaluator));
        String saleTotalHeader = normalize(text(row.getCell(cellIndex + 5), formatter, evaluator));
        if (quantityHeader.contains("CANTIDAD")
                && salePriceHeader.contains("PRECIO VENTA")
                && saleTotalHeader.contains("TOTAL")) {
            return Optional.of(new BlockSpec(
                    4,
                    5,
                    priceHeader.contains("PRECIO COMPRA") ? 2 : null,
                    priceHeader.contains("PRECIO COMPRA") && totalHeader.contains("TOTAL") ? 3 : null
            ));
        }
        if (quantityHeader.contains("CANTIDAD")
                && priceHeader.contains("PRECIO")
                && totalHeader.contains("TOTAL")) {
            return Optional.of(new BlockSpec(2, 3, null, null));
        }
        return Optional.empty();
    }

    private Optional<BlockSpec> conceptTableHeader(
            Row row,
            int cellIndex,
            DataFormatter formatter,
            FormulaEvaluator evaluator
    ) {
        String quantityHeader = normalize(text(row.getCell(cellIndex + 1), formatter, evaluator));
        String priceHeader = normalize(text(row.getCell(cellIndex + 2), formatter, evaluator));
        String totalHeader = normalize(text(row.getCell(cellIndex + 3), formatter, evaluator));
        String salePriceHeader = normalize(text(row.getCell(cellIndex + 5), formatter, evaluator));
        String saleTotalHeader = normalize(text(row.getCell(cellIndex + 6), formatter, evaluator));
        if (quantityHeader.contains("CANTIDAD")
                && salePriceHeader.contains("PRECIO VENTA")
                && saleTotalHeader.contains("TOTAL")) {
            return Optional.of(new BlockSpec(
                    5,
                    6,
                    priceHeader.contains("PRECIO COMPRA") ? 2 : null,
                    priceHeader.contains("PRECIO COMPRA") && totalHeader.contains("TOTAL") ? 3 : null
            ));
        }
        if (quantityHeader.contains("CANTIDAD")
                && priceHeader.contains("PRECIO")
                && totalHeader.contains("TOTAL")) {
            return Optional.of(new BlockSpec(2, 3, null, null));
        }
        return Optional.empty();
    }

    private BigDecimal sumValue(List<LegacyItem> items) {
        return items.stream().map(LegacyItem::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private String text(Cell cell, DataFormatter formatter, FormulaEvaluator evaluator) {
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell, evaluator).trim();
    }

    private BigDecimal number(Cell cell, DataFormatter formatter, FormulaEvaluator evaluator) {
        String value = text(cell, formatter, evaluator)
                .replace("$", "")
                .replace(",", "")
                .trim();
        if (value.isBlank()) {
            return null;
        }
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    private String checksum(Path path) throws IOException {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(Files.readAllBytes(path)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible", exception);
        }
    }

    public LegacyImportReport.LegacySheetReport toReport(AnalyzedSheet sheet) {
        LegacyImportReport.LegacySheetReport report = new LegacyImportReport.LegacySheetReport();
        report.setSheetName(sheet.sheetName());
        report.setPeriodStart(sheet.periodStart().toString());
        report.setPeriodEnd(sheet.periodEnd().toString());
        report.setOpeningItems(sheet.openingItems().size());
        report.setReceivedBlocks(sheet.entries().size());
        report.setReceivedItems(sheet.entries().stream().mapToInt(entry -> entry.items().size()).sum());
        report.setClosingItems(sheet.closingItems().size());
        report.setOpeningValue(sumValue(sheet.openingItems()));
        report.setReceivedValue(sheet.entries().stream().flatMap(entry -> entry.items().stream()).map(LegacyItem::getValue).reduce(BigDecimal.ZERO, BigDecimal::add));
        report.setClosingValue(sumValue(sheet.closingItems()));
        report.setCalculatedExpectedAmount(sheet.calculatedExpectedAmount());
        report.setExcelExpectedAmount(sheet.excelExpectedAmount());
        report.getWarnings().addAll(sheet.warnings());
        report.getIgnoredRows().addAll(sheet.ignoredRows());
        if (sheet.openingItems().isEmpty()) {
            report.getErrors().add("Sin inventario inicial por producto");
        }
        if (sheet.closingItems().isEmpty()) {
            report.getErrors().add("Sin inventario final por producto");
        }
        return report;
    }

    public record AnalyzedWorkbook(Path path, String fileName, String supplierName, String checksum, List<AnalyzedSheet> sheets) {
    }

    public record AnalyzedSheet(
            String sheetName,
            LocalDate periodStart,
            LocalDate periodEnd,
            List<LegacyItem> openingItems,
            List<LegacyEntryBlock> entries,
            List<LegacyItem> closingItems,
            BigDecimal calculatedExpectedAmount,
            BigDecimal excelExpectedAmount,
            List<String> warnings,
            List<String> ignoredRows
    ) {
    }

    public record LegacyEntryBlock(String title, LocalDate entryDate, List<LegacyItem> items) {
    }

    private record BlockSpec(int priceOffset, int totalOffset, Integer costPriceOffset, Integer costTotalOffset) {
    }

    private record PriceValue(BigDecimal price, BigDecimal value) {
    }

    @Getter
    public static final class LegacyItem {
        private final String productName;
        private final BigDecimal quantity;
        private final BigDecimal price;
        private final BigDecimal value;
        private final BigDecimal costPrice;
        private final BigDecimal costValue;

        public LegacyItem(String productName, BigDecimal quantity, BigDecimal price, BigDecimal value) {
            this(productName, quantity, price, value, null, null);
        }

        public LegacyItem(
                String productName,
                BigDecimal quantity,
                BigDecimal price,
                BigDecimal value,
                BigDecimal costPrice,
                BigDecimal costValue
        ) {
            this.productName = productName;
            this.quantity = quantity;
            this.price = price;
            this.value = value;
            this.costPrice = costPrice;
            this.costValue = costValue;
        }
    }
}
