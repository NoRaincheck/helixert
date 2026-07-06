// Helixert — Progress System (localStorage persistence)

const STORAGE_KEY = 'helixert-progress';

export function saveProgress(data) {
    try {
        const existing = getProgress();
        const merged = { ...existing, ...data, lastSaved: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
        console.warn('Failed to save progress:', e);
    }
}

export function getProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {
        console.warn('Failed to load progress:', e);
    }
    return { completedLevels: [], lastSaved: null };
}

export function clearProgress() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear progress:', e);
    }
}

export function exportProgress() {
    const progress = getProgress();
    return btoa(JSON.stringify(progress));
}

export function importProgress(code) {
    try {
        const data = JSON.parse(atob(code));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.warn('Failed to import progress:', e);
        return false;
    }
}
