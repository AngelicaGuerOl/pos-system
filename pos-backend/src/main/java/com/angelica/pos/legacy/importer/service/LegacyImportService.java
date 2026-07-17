package com.angelica.pos.legacy.importer.service;

import com.angelica.pos.catalog.category.entity.Category;
import com.angelica.pos.catalog.category.repository.CategoryRepository;
import com.angelica.pos.catalog.product.entity.Product;
import com.angelica.pos.catalog.product.entity.ProductUnit;
import com.angelica.pos.catalog.product.repository.ProductRepository;
import com.angelica.pos.legacy.importer.dto.LegacyImportReport;
import com.angelica.pos.legacy.importer.entity.LegacyImportSource;
import com.angelica.pos.legacy.importer.entity.LegacyImportStatus;
import com.angelica.pos.legacy.importer.repository.LegacyImportSourceRepository;
import com.angelica.pos.supplier.entity.Supplier;
import com.angelica.pos.supplier.entity.SupplierInventoryBaseline;
import com.angelica.pos.supplier.entity.SupplierInventoryBaselineItem;
import com.angelica.pos.supplier.entry.entity.SupplierEntry;
import com.angelica.pos.supplier.entry.entity.SupplierEntryItem;
import com.angelica.pos.supplier.repository.SupplierInventoryBaselineRepository;
import com.angelica.pos.supplier.repository.SupplierRepository;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlement;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementItem;
import com.angelica.pos.supplier.settlement.entity.SupplierSettlementStatus;
import com.angelica.pos.supplier.settlement.repository.SupplierSettlementRepository;
import com.angelica.pos.supplier.entry.repository.SupplierEntryRepository;
import com.angelica.pos.user.entity.User;
import com.angelica.pos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LegacyImportService {

    private static final String HISTORICAL_CATEGORY = "Historico";
    private static final String HISTORICAL_USER = "admin";

    private final LegacyWorkbookAnalyzer analyzer;
    private final LegacyImportSourceRepository importSourceRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final SupplierInventoryBaselineRepository baselineRepository;
    private final SupplierEntryRepository entryRepository;
    private final SupplierSettlementRepository settlementRepository;
    private final ObjectMapper objectMapper;

    public LegacyImportReport preview(Path directory) throws IOException {
        return analyze(directory, "preview");
    }

    @Transactional
    public LegacyImportReport execute(Path directory) throws IOException {
        LegacyImportReport report = analyze(directory, "execute");
        if (report.hasBlockingErrors()) {
            return report;
        }
        List<Path> files = findExcelFiles(directory);
        for (Path file : files) {
            String supplierName = LegacySupplierMapping.FILE_TO_SUPPLIER.get(file.getFileName().toString());
            if (supplierName != null) {
                importWorkbook(file, supplierName, report);
            }
        }
        return report;
    }

    public void writeReports(LegacyImportReport report, Path reportBasePath) throws IOException {
        Path jsonPath = reportBasePath.toString().endsWith(".json")
                ? reportBasePath
                : Path.of(reportBasePath + ".json");
        Path markdownPath = Path.of(jsonPath.toString().replaceAll("\\.json$", ".md"));
        Files.createDirectories(jsonPath.toAbsolutePath().getParent());
        objectMapper.writeValue(jsonPath.toFile(), report);
        Files.writeString(markdownPath, toMarkdown(report), StandardCharsets.UTF_8);
    }

    private LegacyImportReport analyze(Path directory, String mode) throws IOException {
        LegacyImportReport report = new LegacyImportReport();
        report.setMode(mode);
        report.setDirectory(directory.toString());
        if (!Files.isDirectory(directory)) {
            report.getBlockingErrors().add("Directorio no encontrado: " + directory);
            return report;
        }
        List<Path> files = findExcelFiles(directory);
        for (Path file : files) {
            report.getFilesFound().add(file.getFileName().toString());
            String supplierName = LegacySupplierMapping.FILE_TO_SUPPLIER.get(file.getFileName().toString());
            if (supplierName == null) {
                report.getWarnings().add("Archivo sin mapeo explicito de proveedor: " + file.getFileName());
                continue;
            }
            LegacyWorkbookAnalyzer.AnalyzedWorkbook workbook = analyzer.analyze(file, supplierName, true);
            LegacyImportReport.LegacyWorkbookReport workbookReport = new LegacyImportReport.LegacyWorkbookReport();
            workbookReport.setFileName(workbook.fileName());
            workbookReport.setSupplierName(supplierName);
            workbookReport.setChecksum(workbook.checksum());
            workbookReport.setSheetsAnalyzed(workbook.sheets().size());
            workbookReport.setSettlementsToCreate(workbook.sheets().size());
            workbookReport.setEntriesToCreate(workbook.sheets().stream().mapToInt(sheet -> sheet.entries().size()).sum());
            workbookReport.setProductsDetected((int) workbook.sheets().stream()
                    .flatMap(sheet -> sheet.closingItems().stream())
                    .map(item -> normalizeKey(item.getProductName()))
                    .distinct()
                    .count());
            for (LegacyWorkbookAnalyzer.AnalyzedSheet sheet : workbook.sheets()) {
                LegacyImportReport.LegacySheetReport sheetReport = analyzer.toReport(sheet);
                sheetReport.setAlreadyImported(importSourceRepository.existsByFileNameAndFileChecksumAndSheetName(
                        workbook.fileName(),
                        workbook.checksum(),
                        sheet.sheetName()
                ));
                workbookReport.getSheets().add(sheetReport);
                workbookReport.getWarnings().addAll(sheetReport.getWarnings());
                if (!sheetReport.getErrors().isEmpty()) {
                    workbookReport.getErrors().add(sheet.sheetName() + ": " + String.join("; ", sheetReport.getErrors()));
                }
            }
            if (!workbookReport.getErrors().isEmpty()) {
                report.getBlockingErrors().add(workbook.fileName() + ": " + String.join("; ", workbookReport.getErrors()));
            }
            report.getWorkbooks().add(workbookReport);
        }
        return report;
    }

    @Transactional
    public void importWorkbook(Path file, String supplierName, LegacyImportReport report) throws IOException {
        LegacyWorkbookAnalyzer.AnalyzedWorkbook workbook = analyzer.analyze(file, supplierName, true);
        Supplier supplier = findOrCreateSupplier(supplierName);
        Category category = findOrCreateHistoricalCategory();
        User user = findImportUser();
        Map<String, Product> productsByName = loadProductsByName(supplier.getId());
        int recordsCreated = 0;

        for (int index = 0; index < workbook.sheets().size(); index++) {
            LegacyWorkbookAnalyzer.AnalyzedSheet sheet = workbook.sheets().get(index);
            boolean alreadyImported = importSourceRepository.existsByFileNameAndFileChecksumAndSheetName(
                    workbook.fileName(),
                    workbook.checksum(),
                    sheet.sheetName()
            );
            if (sheet.openingItems().isEmpty() || sheet.closingItems().isEmpty()) {
                throw new IllegalStateException("Hoja critica sin inventario inicial/final: " + workbook.fileName() + " / " + sheet.sheetName());
            }
            for (LegacyWorkbookAnalyzer.LegacyItem item : allItems(sheet)) {
                Product product = productsByName.computeIfAbsent(
                        normalizeKey(item.getProductName()),
                        ignored -> createHistoricalProduct(supplier, category, item)
                );
                product.setSalePrice(item.getPrice());
                if (item.getCostPrice() != null) {
                    product.setCostPrice(item.getCostPrice());
                    product.setCostPriceKnown(true);
                }
            }
            if (alreadyImported) {
                continue;
            }
            if (index == 0 && !baselineRepository.existsBySupplierId(supplier.getId())) {
                List<LegacyWorkbookAnalyzer.LegacyItem> openingItems = mergedItems(sheet.openingItems());
                SupplierInventoryBaseline baseline = SupplierInventoryBaseline.builder()
                        .supplier(supplier)
                        .baselineDate(sheet.periodStart().minusDays(1))
                        .createdBy(user)
                        .totalSaleValue(sumValue(sheet.openingItems()))
                        .build();
                for (LegacyWorkbookAnalyzer.LegacyItem item : openingItems) {
                    Product product = productsByName.get(normalizeKey(item.getProductName()));
                    baseline.addItem(SupplierInventoryBaselineItem.builder()
                            .product(product)
                            .quantity(item.getQuantity())
                            .salePriceSnapshot(item.getPrice())
                            .inventoryValue(item.getValue())
                            .historicalImport(true)
                            .sourceFile(workbook.fileName())
                            .sourceSheet(sheet.sheetName())
                            .build());
                }
                baselineRepository.save(baseline);
                recordsCreated++;
            }
            for (LegacyWorkbookAnalyzer.LegacyEntryBlock block : sheet.entries()) {
                List<LegacyWorkbookAnalyzer.LegacyItem> entryItems = mergedItems(positiveQuantityItems(block.items()));
                if (entryItems.isEmpty()) {
                    continue;
                }
                SupplierEntry entry = SupplierEntry.builder()
                        .supplier(supplier)
                        .entryDate(block.entryDate())
                        .registeredBy(user)
                        .totalCost(sumCostValue(entryItems))
                        .totalSaleValue(sumValue(entryItems))
                        .notes("Importacion historica: " + workbook.fileName() + " / " + sheet.sheetName() + " / " + block.title())
                        .historicalImport(true)
                        .sourceFile(workbook.fileName())
                        .sourceSheet(sheet.sheetName())
                        .build();
                for (LegacyWorkbookAnalyzer.LegacyItem item : entryItems) {
                    Product product = productsByName.get(normalizeKey(item.getProductName()));
                    BigDecimal salePrice = unitPriceForSubtotal(item);
                    boolean costKnown = item.getCostPrice() != null;
                    BigDecimal unitCost = costKnown ? item.getCostPrice() : BigDecimal.ZERO;
                    BigDecimal costSubtotal = item.getCostValue() == null ? item.getQuantity().multiply(unitCost) : item.getCostValue();
                    entry.addItem(SupplierEntryItem.builder()
                            .product(product)
                            .quantity(item.getQuantity())
                            .unitCost(unitCost)
                            .costKnown(costKnown)
                            .salePrice(salePrice)
                            .costSubtotal(costSubtotal)
                            .saleValueSubtotal(item.getValue())
                            .build());
                }
                entryRepository.save(entry);
                recordsCreated++;
            }
            SupplierSettlement settlement = SupplierSettlement.builder()
                    .supplier(supplier)
                    .periodStart(sheet.periodStart())
                    .periodEnd(sheet.periodEnd())
                    .status(SupplierSettlementStatus.FINALIZED)
                    .openingInventoryValue(sumValue(sheet.openingItems()))
                    .entriesSaleValue(sheet.entries().stream().flatMap(entry -> entry.items().stream()).map(LegacyWorkbookAnalyzer.LegacyItem::getValue).reduce(BigDecimal.ZERO, BigDecimal::add))
                    .availableInventoryValue(sumValue(sheet.openingItems()).add(sheet.entries().stream().flatMap(entry -> entry.items().stream()).map(LegacyWorkbookAnalyzer.LegacyItem::getValue).reduce(BigDecimal.ZERO, BigDecimal::add)))
                    .closingInventoryValue(sumValue(sheet.closingItems()))
                    .expectedAmount(sheet.calculatedExpectedAmount())
                    .deliveredAmount(null)
                    .differenceAmount(null)
                    .notes("Importado desde " + workbook.fileName() + " / " + sheet.sheetName())
                    .hasDiscrepancies(false)
                    .createdBy(user)
                    .finalizedBy(user)
                    .finalizedAt(OffsetDateTime.now())
                    .historicalImport(true)
                    .sourceFile(workbook.fileName())
                    .sourceSheet(sheet.sheetName())
                    .build();
            Map<String, LegacyWorkbookAnalyzer.LegacyItem> closingByName = toItemMap(sheet.closingItems());
            Map<String, LegacyWorkbookAnalyzer.LegacyItem> openingByName = toItemMap(sheet.openingItems());
            for (String productKey : settlementProductKeys(sheet)) {
                LegacyWorkbookAnalyzer.LegacyItem referenceItem = firstItem(sheet, productKey);
                LegacyWorkbookAnalyzer.LegacyItem openingItem = openingByName.getOrDefault(
                        productKey,
                        new LegacyWorkbookAnalyzer.LegacyItem(referenceItem.getProductName(), BigDecimal.ZERO, referenceItem.getPrice(), BigDecimal.ZERO)
                );
                Product product = productsByName.get(productKey);
                LegacyWorkbookAnalyzer.LegacyItem closingItem = closingByName.getOrDefault(
                        productKey,
                        new LegacyWorkbookAnalyzer.LegacyItem(referenceItem.getProductName(), BigDecimal.ZERO, referenceItem.getPrice(), BigDecimal.ZERO)
                );
                BigDecimal receivedQuantity = receivedQuantity(sheet, referenceItem.getProductName());
                BigDecimal receivedValue = receivedValue(sheet, referenceItem.getProductName());
                BigDecimal availableQuantity = openingItem.getQuantity().add(receivedQuantity);
                BigDecimal expected = openingItem.getValue().add(receivedValue).subtract(closingItem.getValue());
                settlement.addItem(SupplierSettlementItem.builder()
                        .product(product)
                        .productNameSnapshot(referenceItem.getProductName())
                        .barcodeSnapshot(product.getBarcode())
                        .unitSnapshot(product.getUnit())
                        .openingQuantity(openingItem.getQuantity())
                        .openingSalePrice(openingItem.getPrice())
                        .openingValue(openingItem.getValue())
                        .receivedQuantity(receivedQuantity)
                        .receivedSaleValue(receivedValue)
                        .availableQuantity(availableQuantity)
                        .closingQuantity(closingItem.getQuantity())
                        .closingSalePrice(closingItem.getPrice())
                        .closingValue(closingItem.getValue())
                        .quantityToJustify(availableQuantity.subtract(closingItem.getQuantity()))
                        .expectedAmount(expected)
                        .hasDiscrepancy(closingItem.getQuantity().compareTo(availableQuantity) > 0)
                        .build());
            }
            settlementRepository.save(settlement);
            importSourceRepository.save(LegacyImportSource.builder()
                    .fileName(workbook.fileName())
                    .fileChecksum(workbook.checksum())
                    .sheetName(sheet.sheetName())
                    .supplier(supplier)
                    .importStatus(LegacyImportStatus.IMPORTED)
                    .recordsCreated(recordsCreated)
                    .warningsCount(sheet.warnings().size())
                    .build());
            recordsCreated++;
        }
        updateLatestStock(workbook, productsByName);
    }

    private List<LegacyWorkbookAnalyzer.LegacyItem> allItems(LegacyWorkbookAnalyzer.AnalyzedSheet sheet) {
        List<LegacyWorkbookAnalyzer.LegacyItem> items = new java.util.ArrayList<>();
        items.addAll(sheet.openingItems());
        items.addAll(sheet.closingItems());
        sheet.entries().forEach(entry -> items.addAll(entry.items()));
        return items;
    }

    private List<LegacyWorkbookAnalyzer.LegacyItem> positiveQuantityItems(List<LegacyWorkbookAnalyzer.LegacyItem> items) {
        return items.stream()
                .filter(item -> item.getQuantity().compareTo(BigDecimal.ZERO) > 0)
                .toList();
    }

    private BigDecimal unitPriceForSubtotal(LegacyWorkbookAnalyzer.LegacyItem item) {
        BigDecimal calculated = item.getQuantity().multiply(item.getPrice());
        if (calculated.compareTo(item.getValue()) == 0) {
            return item.getPrice();
        }
        return item.getValue().divide(item.getQuantity(), 4, java.math.RoundingMode.HALF_UP);
    }

    private BigDecimal sumCostValue(List<LegacyWorkbookAnalyzer.LegacyItem> items) {
        return items.stream()
                .map(item -> item.getCostValue() == null ? BigDecimal.ZERO : item.getCostValue())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<String> settlementProductKeys(LegacyWorkbookAnalyzer.AnalyzedSheet sheet) {
        return allItems(sheet).stream()
                .map(item -> normalizeKey(item.getProductName()))
                .distinct()
                .toList();
    }

    private LegacyWorkbookAnalyzer.LegacyItem firstItem(LegacyWorkbookAnalyzer.AnalyzedSheet sheet, String productKey) {
        return allItems(sheet).stream()
                .filter(item -> normalizeKey(item.getProductName()).equals(productKey))
                .findFirst()
                .orElseThrow();
    }

    private BigDecimal receivedQuantity(LegacyWorkbookAnalyzer.AnalyzedSheet sheet, String productName) {
        String key = normalizeKey(productName);
        return sheet.entries().stream()
                .flatMap(entry -> entry.items().stream())
                .filter(item -> normalizeKey(item.getProductName()).equals(key))
                .map(LegacyWorkbookAnalyzer.LegacyItem::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal receivedValue(LegacyWorkbookAnalyzer.AnalyzedSheet sheet, String productName) {
        String key = normalizeKey(productName);
        return sheet.entries().stream()
                .flatMap(entry -> entry.items().stream())
                .filter(item -> normalizeKey(item.getProductName()).equals(key))
                .map(LegacyWorkbookAnalyzer.LegacyItem::getValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private void updateLatestStock(
            LegacyWorkbookAnalyzer.AnalyzedWorkbook workbook,
            Map<String, Product> productsByName
    ) {
        if (workbook.sheets().isEmpty()) {
            return;
        }
        LegacyWorkbookAnalyzer.AnalyzedSheet latest = workbook.sheets().get(workbook.sheets().size() - 1);
        for (LegacyWorkbookAnalyzer.LegacyItem item : latest.closingItems()) {
            Product product = productsByName.get(normalizeKey(item.getProductName()));
            if (product != null) {
                product.setCurrentStock(item.getQuantity());
                product.setSalePrice(item.getPrice());
            }
        }
    }

    private Supplier findOrCreateSupplier(String supplierName) {
        String normalized = normalizeKey(supplierName);
        return supplierRepository.findAll().stream()
                .filter(supplier -> normalizeKey(supplier.getName()).equals(normalized))
                .findFirst()
                .orElseGet(() -> supplierRepository.save(Supplier.builder()
                        .name(supplierName)
                        .active(true)
                        .notes("Creado por importacion historica")
                        .build()));
    }

    private Category findOrCreateHistoricalCategory() {
        return categoryRepository.findByNameIgnoreCase(HISTORICAL_CATEGORY)
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(HISTORICAL_CATEGORY)
                        .description("Productos creados desde Excel historicos")
                        .active(true)
                        .build()));
    }

    private User findImportUser() {
        return userRepository.findByUsernameIgnoreCaseAndActiveTrue(HISTORICAL_USER)
                .orElseThrow(() -> new IllegalStateException("No existe usuario activo para importacion: " + HISTORICAL_USER));
    }

    private Map<String, Product> loadProductsByName(Long supplierId) {
        Map<String, Product> products = new HashMap<>();
        for (Product product : productRepository.findBySupplierId(supplierId)) {
            String key = normalizeKey(product.getName());
            if (products.put(key, product) != null) {
                throw new IllegalStateException("Producto ambiguo para proveedor " + supplierId + ": " + product.getName());
            }
        }
        return products;
    }

    private Product createHistoricalProduct(
            Supplier supplier,
            Category category,
            LegacyWorkbookAnalyzer.LegacyItem item
    ) {
        String barcode = "HIST-" + supplier.getId() + "-" + Integer.toHexString(normalizeKey(item.getProductName()).hashCode()).toUpperCase(Locale.ROOT);
        Optional<Product> existing = productRepository.findByBarcodeIgnoreCase(barcode);
        if (existing.isPresent()) {
            return existing.get();
        }
        return productRepository.save(Product.builder()
                .category(category)
                .supplier(supplier)
                .barcode(barcode)
                .name(item.getProductName())
                .unit(ProductUnit.PIECE)
                .costPrice(BigDecimal.ZERO)
                .costPriceKnown(false)
                .salePrice(item.getPrice())
                .currentStock(BigDecimal.ZERO)
                .minimumStock(BigDecimal.ZERO)
                .active(true)
                .build());
    }

    private Map<String, LegacyWorkbookAnalyzer.LegacyItem> toItemMap(List<LegacyWorkbookAnalyzer.LegacyItem> items) {
        Map<String, LegacyWorkbookAnalyzer.LegacyItem> map = new LinkedHashMap<>();
        for (LegacyWorkbookAnalyzer.LegacyItem item : items) {
            String key = normalizeKey(item.getProductName());
            LegacyWorkbookAnalyzer.LegacyItem existing = map.get(key);
            if (existing == null) {
                map.put(key, item);
            } else {
                map.put(key, new LegacyWorkbookAnalyzer.LegacyItem(
                        existing.getProductName(),
                        existing.getQuantity().add(item.getQuantity()),
                        existing.getPrice(),
                        existing.getValue().add(item.getValue()),
                        existing.getCostPrice() == null ? item.getCostPrice() : existing.getCostPrice(),
                        mergeNullableAmount(existing.getCostValue(), item.getCostValue())
                ));
            }
        }
        return map;
    }

    private BigDecimal mergeNullableAmount(BigDecimal first, BigDecimal second) {
        if (first == null) {
            return second;
        }
        if (second == null) {
            return first;
        }
        return first.add(second);
    }

    private List<LegacyWorkbookAnalyzer.LegacyItem> mergedItems(List<LegacyWorkbookAnalyzer.LegacyItem> items) {
        return List.copyOf(toItemMap(items).values());
    }

    private BigDecimal sumValue(List<LegacyWorkbookAnalyzer.LegacyItem> items) {
        return items.stream().map(LegacyWorkbookAnalyzer.LegacyItem::getValue).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Path> findExcelFiles(Path directory) throws IOException {
        try (java.util.stream.Stream<Path> stream = Files.list(directory)) {
            return stream
                    .filter(path -> path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".xlsx"))
                    .filter(path -> !path.getFileName().toString().startsWith("~$"))
                    .sorted(Comparator.comparing(path -> path.getFileName().toString()))
                    .toList();
        }
    }

    private String normalizeKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.trim().replaceAll("\\s+", " ").toUpperCase(Locale.ROOT);
    }

    private String toMarkdown(LegacyImportReport report) {
        StringBuilder builder = new StringBuilder();
        builder.append("# Legacy import report\\n\\n");
        builder.append("Mode: ").append(report.getMode()).append("\\n\\n");
        for (LegacyImportReport.LegacyWorkbookReport workbook : report.getWorkbooks()) {
            builder.append("## ").append(workbook.getFileName()).append(" -> ").append(workbook.getSupplierName()).append("\\n");
            builder.append("- Sheets: ").append(workbook.getSheetsAnalyzed()).append("\\n");
            builder.append("- Products detected: ").append(workbook.getProductsDetected()).append("\\n");
            builder.append("- Entries: ").append(workbook.getEntriesToCreate()).append("\\n");
            builder.append("- Settlements: ").append(workbook.getSettlementsToCreate()).append("\\n");
            if (!workbook.getErrors().isEmpty()) {
                builder.append("- Errors: ").append(String.join("; ", workbook.getErrors())).append("\\n");
            }
            if (!workbook.getWarnings().isEmpty()) {
                builder.append("- Warnings: ").append(String.join("; ", workbook.getWarnings())).append("\\n");
            }
            builder.append("\\n");
        }
        if (!report.getBlockingErrors().isEmpty()) {
            builder.append("## Blocking errors\\n");
            report.getBlockingErrors().forEach(error -> builder.append("- ").append(error).append("\\n"));
        }
        return builder.toString();
    }
}
