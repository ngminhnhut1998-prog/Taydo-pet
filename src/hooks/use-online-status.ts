"use client";

import { useState, useEffect } from 'react';

// This app is now in mock data mode, so we always report "online"
// to avoid confusion with sync UI.
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // In a real app, you'd have this logic:
        /*
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
            setIsOnline(navigator.onLine);
        }
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        };
        */
       
       // For mock mode, we just stay online.
       setIsOnline(true);

    }, []);

    return isOnline;
}
