package com.angelica.pos.legacy.importer.entity;

import com.angelica.pos.supplier.entity.Supplier;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "legacy_import_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegacyImportSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_checksum", nullable = false, length = 64)
    private String fileChecksum;

    @Column(name = "sheet_name", nullable = false, length = 120)
    private String sheetName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_status", nullable = false, length = 30)
    private LegacyImportStatus importStatus;

    @Column(name = "imported_at", nullable = false)
    private OffsetDateTime importedAt;

    @Column(name = "records_created", nullable = false)
    private Integer recordsCreated;

    @Column(name = "warnings_count", nullable = false)
    private Integer warningsCount;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @PrePersist
    public void prePersist() {
        if (importedAt == null) {
            importedAt = OffsetDateTime.now();
        }
        if (recordsCreated == null) {
            recordsCreated = 0;
        }
        if (warningsCount == null) {
            warningsCount = 0;
        }
    }
}
