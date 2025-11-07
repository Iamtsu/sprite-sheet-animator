const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    saveJSONFile: (data) => ipcRenderer.invoke('save-json-file', data),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

    // Menu event listeners
    onLoadSpriteSheet: (callback) => {
        ipcRenderer.on('load-sprite-sheet', (event, filePath) => callback(filePath));
    },
    onImportAnimationData: (callback) => {
        ipcRenderer.on('import-animation-data', (event, data) => callback(data));
    },
    onRequestExportData: (callback) => {
        ipcRenderer.on('request-export-data', () => callback());
    },
    onMenuZoomIn: (callback) => {
        ipcRenderer.on('menu-zoom-in', () => callback());
    },
    onMenuZoomOut: (callback) => {
        ipcRenderer.on('menu-zoom-out', () => callback());
    },
    onMenuResetZoom: (callback) => {
        ipcRenderer.on('menu-reset-zoom', () => callback());
    },

    // Platform info
    isElectron: true,
    platform: process.platform
});
