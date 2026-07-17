package com.angelica.pos.legacy.importer.config;

import com.angelica.pos.legacy.importer.dto.LegacyImportReport;
import com.angelica.pos.legacy.importer.service.LegacyImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.List;

@Component
@Profile("legacy-import")
@RequiredArgsConstructor
public class LegacyImportRunner implements ApplicationRunner {

    private static final String DEFAULT_REPORT = "target/legacy-import-report";

    private final LegacyImportService importService;
    private final ConfigurableApplicationContext context;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        String directory = requiredOption(args, "legacy.import.directory");
        String mode = option(args, "legacy.import.mode", "preview");
        String reportPath = option(args, "legacy.import.report", DEFAULT_REPORT);

        LegacyImportReport report;
        if ("preview".equalsIgnoreCase(mode)) {
            report = importService.preview(Path.of(directory));
        } else if ("execute".equalsIgnoreCase(mode)) {
            report = importService.execute(Path.of(directory));
        } else {
            throw new IllegalArgumentException("legacy.import.mode debe ser preview o execute");
        }

        importService.writeReports(report, Path.of(reportPath));
        int exitCode = report.hasBlockingErrors() ? 1 : 0;
        System.exit(SpringApplication.exit(context, () -> exitCode));
    }

    private String requiredOption(ApplicationArguments args, String name) {
        String value = option(args, name, null);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Parametro requerido: --" + name);
        }
        return value;
    }

    private String option(ApplicationArguments args, String name, String defaultValue) {
        List<String> values = args.getOptionValues(name);
        if (values == null || values.isEmpty()) {
            return defaultValue;
        }
        return values.get(0);
    }
}
