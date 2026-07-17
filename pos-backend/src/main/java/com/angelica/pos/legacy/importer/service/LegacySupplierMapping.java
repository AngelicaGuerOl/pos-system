package com.angelica.pos.legacy.importer.service;

import java.util.Map;

public final class LegacySupplierMapping {

    private LegacySupplierMapping() {
    }

    public static final Map<String, String> FILE_TO_SUPPLIER = Map.of(
            "BARCEL.xlsx", "BARCEL",
            "BIMBO_TIA ROSA_MARINELA.xlsx", "BIMBO / TIA ROSA / MARINELA",
            "EL ZORRO.xlsx", "EL ZORRO",
            "REFRESCO.xlsx", "REFRESCO",
            "RICOLINO.xlsx", "RICOLINO",
            "SABRITA.xlsx", "SABRITA"
    );
}
