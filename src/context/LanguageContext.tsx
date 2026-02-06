"use client";

import React, { createContext, useContext } from "react";
import { vi, type TranslationKeys } from "@/i18n";

type LanguageContextType = {
    t: TranslationKeys;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Always use Vietnamese - no language switching
    const t = vi;

    return (
        <LanguageContext.Provider value={{ t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}

// Helper hook for simple translation access
export function useTranslation() {
    const { t } = useLanguage();
    return t;
}
