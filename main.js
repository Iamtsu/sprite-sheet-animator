const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Handle Squirrel events on Windows
if (require('electron-squirrel-startup')) {
    app.quit();
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1530,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        title: 'Sprite Animation Editor',
        backgroundColor: '#1e1e1e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    mainWindow.loadFile('editor.html');

    // Create application menu
    const menu = Menu.buildFromTemplate(getMenuTemplate());
    Menu.setApplicationMenu(menu);

    // Open DevTools in development (disabled by default)
    // Uncomment the line below to auto-open DevTools with --enable-logging flag
    // if (process.argv.includes('--enable-logging')) {
    //     mainWindow.webContents.openDevTools();
    // }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function getMenuTemplate() {
    const isMac = process.platform === 'darwin';

    return [
        // App menu (macOS)
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        }] : []),

        // File menu
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Sprite Sheet...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        openSpriteSheet();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Import Animation Data...',
                    accelerator: 'CmdOrCtrl+I',
                    click: () => {
                        importJSON();
                    }
                },
                {
                    label: 'Export Animation Data...',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        exportJSON();
                    }
                },
                { type: 'separator' },
                isMac ? { role: 'close' } : { role: 'quit' }
            ]
        },

        // Edit menu
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle' },
                    { role: 'delete' },
                    { role: 'selectAll' },
                    { type: 'separator' },
                    {
                        label: 'Speech',
                        submenu: [
                            { role: 'startSpeaking' },
                            { role: 'stopSpeaking' }
                        ]
                    }
                ] : [
                    { role: 'delete' },
                    { type: 'separator' },
                    { role: 'selectAll' }
                ])
            ]
        },

        // View menu
        {
            label: 'View',
            submenu: [
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => {
                        mainWindow.webContents.send('menu-zoom-in');
                    }
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => {
                        mainWindow.webContents.send('menu-zoom-out');
                    }
                },
                {
                    label: 'Reset Zoom',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => {
                        mainWindow.webContents.send('menu-reset-zoom');
                    }
                },
                { type: 'separator' },
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },

        // Window menu
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front' },
                    { type: 'separator' },
                    { role: 'window' }
                ] : [
                    { role: 'close' }
                ])
            ]
        },

        // Help menu
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://github.com/');
                    }
                }
            ]
        }
    ];
}

// File operations
async function openSpriteSheet() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        mainWindow.webContents.send('load-sprite-sheet', filePath);
    }
}

async function importJSON() {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            mainWindow.webContents.send('import-animation-data', data);
        } catch (err) {
            dialog.showErrorBox('Import Error', `Failed to read file: ${err.message}`);
        }
    }
}

async function exportJSON() {
    mainWindow.webContents.send('request-export-data');
}

// IPC handlers
ipcMain.handle('save-json-file', async (event, data) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: 'animations.json',
        filters: [
            { name: 'JSON Files', extensions: ['json'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePath) {
        try {
            fs.writeFileSync(result.filePath, data, 'utf8');
            return { success: true, path: result.filePath };
        } catch (err) {
            dialog.showErrorBox('Export Error', `Failed to save file: ${err.message}`);
            return { success: false, error: err.message };
        }
    }

    return { success: false, cancelled: true };
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        return { success: true, data: data.toString('base64') };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
