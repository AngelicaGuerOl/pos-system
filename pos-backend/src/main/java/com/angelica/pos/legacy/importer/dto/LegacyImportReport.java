package com.angelica.pos.legacy.importer.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class LegacyImportReport {

    private String mode;
    private String directory;
    private List<String> filesFound = new ArrayList<>();
    private List<LegacyWorkbookReport> workbooks = new ArrayList<>();
    private List<String> blockingErrors = new ArrayList<>();
    private List<String> warnings = new ArrayList<>();

    public boolean hasBlockingErrors() {
        return !blockingErrors.isEmpty();
    }

    @Getter
    @Setter
    public static class LegacyWorkbookReport {
        private String fileName;
        private String supplierName;
        private String checksum;
        private int sheetsAnalyzed;
        private int productsDetected;
        private int productsNew;
        private int productsReused;
        private int baselinesToCreate;
        private int entriesToCreate;
        private int settlementsToCreate;
        private BigDecimal latestStockValue = BigDecimal.ZERO;
        private List<LegacySheetReport> sheets = new ArrayList<>();
        private List<String> warnings = new ArrayList<>();
        private List<String> errors = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class LegacySheetReport {
        private String sheetName;
        private String periodStart;
        private String periodEnd;
        private int openingItems;
        private int receivedBlocks;
        private int receivedItems;
        private int closingItems;
        private BigDecimal openingValue = BigDecimal.ZERO;
        private BigDecimal receivedValue = BigDecimal.ZERO;
        private BigDecimal closingValue = BigDecimal.ZERO;
        private BigDecimal calculatedExpectedAmount = BigDecimal.ZERO;
        private BigDecimal excelExpectedAmount;
        private boolean alreadyImported;
        private List<String> ignoredRows = new ArrayList<>();
        private List<String> warnings = new ArrayList<>();
        private List<String> errors = new ArrayList<>();
    }
}
