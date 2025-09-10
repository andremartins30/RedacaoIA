'use client';

import { useEffect, useState } from 'react';

export function useIsClient() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
}

// Hook para Google Vision OCR
export function useVisionOCR() {
    const [isReady, setIsReady] = useState(false);
    const isClient = useIsClient();

    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            // OCR com Google Vision está sempre pronto no cliente
            setIsReady(true);
        }
    }, [isClient]);

    return { isReady, isClient };
}
