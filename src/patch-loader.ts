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

        // Check if already SAFE patched
        if (content.includes('...(options.httpAgent')) {
            console.log('[PATCH] AdtHTTP.js is already patched with SAFE patch.');
        } else {
            console.log('[PATCH] Patching abap-adt-api/build/AdtHTTP.js to support httpAgent (SAFE mode)...');

            const safeReplacement = '...(options.httpAgent && { httpAgent: options.httpAgent }),\n        ...(options.httpsAgent && { httpsAgent: options.httpsAgent }),';

            // Check for "Bad" patch (previous attempt)
            const badPatchTarget = 'httpAgent: options.httpAgent,\n        httpsAgent: options.httpsAgent,';

            // Check for Original code
            const originalTarget = 'httpsAgent: options.httpsAgent,';

            if (content.includes(badPatchTarget)) {
                console.log('[PATCH] Upgrading from previous patch...');
                content = content.replace(badPatchTarget, safeReplacement);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('[PATCH] Successfully upgraded patch in AdtHTTP.js');
            } else if (content.includes(originalTarget)) {
                console.log('[PATCH] Applying fresh patch...');
                content = content.replace(originalTarget, safeReplacement);
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('[PATCH] Successfully applied patch to AdtHTTP.js');
            } else {
                console.warn('[PATCH] Could not find insertion point in AdtHTTP.js');
            }
        }

        // [NEW] Patch to change login endpoint from compatibility/graph to discovery
        // This resolves 405 Method Not Allowed if Cloud Connector is restrictive
        const graphUrl = '"/sap/bc/adt/compatibility/graph"';
        const discoveryUrl = '"/sap/bc/adt/discovery"';

        if (content.includes(graphUrl)) {
            console.log('[PATCH] Replacing compatibility/graph with discovery endpoint...');
            content = content.replace(new RegExp(graphUrl, 'g'), discoveryUrl);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('[PATCH] Successfully updated login endpoint to /sap/bc/adt/discovery');
        } else if (content.includes(discoveryUrl)) {
            console.log('[PATCH] Login endpoint is already set to /sap/bc/adt/discovery');
        }
    } catch (error) {
        console.error('[PATCH] Error applying runtime patch:', error);
    }
};

// Execute patch immediately
patchLibrary();
