package com.angelica.pos.legacy.importer.repository;

import com.angelica.pos.legacy.importer.entity.LegacyImportSource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LegacyImportSourceRepository extends JpaRepository<LegacyImportSource, Long> {

    boolean existsByFileNameAndFileChecksumAndSheetName(String fileName, String fileChecksum, String sheetName);
}
