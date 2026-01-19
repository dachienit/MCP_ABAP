import fs from 'fs';
import path from 'path';

// Define the path to the library file we need to patch
// In production (built), __dirname is 'dist/', so we go up to node_modules
// We handle both dev (src) and prod (dist) structures by looking for node_modules relative to CWD or __dirname
const getLibraryPath = () => {
    // Try standard node_modules location
    let possiblePath = path.resolve(process.cwd(), 'node_modules/abap-adt-api/build/AdtHTTP.js');
    if (fs.existsSync(possiblePath)) return possiblePath;

    // Try relative to __dirname (dist)
    possiblePath = path.resolve(__dirname, '../node_modules/abap-adt-api/build/AdtHTTP.js');
    if (fs.existsSync(possiblePath)) return possiblePath;

    return null;
};

const patchLibrary = () => {
    try {
        const filePath = getLibraryPath();
        if (!filePath) {
            console.warn('[PATCH] Could not find abap-adt-api/build/AdtHTTP.js to patch. Proxy might fail for HTTP destinations.');
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');

        // Check if already patched
        if (!content.includes('httpAgent: options.httpAgent,')) {
            console.log('[PATCH] Patching abap-adt-api/build/AdtHTTP.js to support httpAgent...');

            const target = 'httpsAgent: options.httpsAgent,';
            const replacement = 'httpAgent: options.httpAgent,\n        httpsAgent: options.httpsAgent,';

            if (content.includes(target)) {
                content = content.replace(target, replacement);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('[PATCH] Successfully patched AdtHTTP.js');
            } else {
                console.warn('[PATCH] Could not find insertion point in AdtHTTP.js');
            }
        } else {
            console.log('[PATCH] AdtHTTP.js is already patched.');
        }
    } catch (error) {
        console.error('[PATCH] Error applying runtime patch:', error);
    }
};

// Execute patch immediately
patchLibrary();
