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

        // [NEW] Logger Patch: Log all outgoing requests to debug 405 errors
        const requestMethodStart = 'async _request(url, options) {';
        const requestMethodLog = 'async _request(url, options) { console.log("[ADT DEBUG] Request:", options.method || "GET", url);';

        if (content.includes(requestMethodStart) && !content.includes('[ADT DEBUG] Request:')) {
            console.log('[PATCH] Injecting debug logger into _request...');
            content = content.replace(requestMethodStart, requestMethodLog);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('[PATCH] Successfully injected logger.');
        }

        // [NEW] Patch to change login endpoint to be dynamic based on probe results
        // This allows AuthHandlers to "discover" the working URL and set it in process.env.MCP_ABAP_LOGIN_PATH
        const graphUrl = '"/sap/bc/adt/compatibility/graph"';
        const discoveryUrl = '"/sap/bc/adt/discovery"';
        const dynamicUrlCode = '(process.env.MCP_ABAP_LOGIN_PATH || "/sap/bc/adt/discovery")';

        // Check if we need to patch (either original GRAPH or our previous DISCOVERY patch)
        if (content.includes(graphUrl) || (content.includes(discoveryUrl) && !content.includes('process.env.MCP_ABAP_LOGIN_PATH'))) {
            console.log('[PATCH] Making login endpoint dynamic (process.env.MCP_ABAP_LOGIN_PATH)...');

            // Limit replacement to the specific validation/login lines if possible, 
            // but for now global replace is safer to catch all usages in AdtHTTP.js
            if (content.includes(graphUrl)) {
                content = content.replace(new RegExp(graphUrl, 'g'), dynamicUrlCode);
            }
            if (content.includes(discoveryUrl)) {
                content = content.replace(new RegExp(discoveryUrl, 'g'), dynamicUrlCode);
            }

            fs.writeFileSync(filePath, content, 'utf8');
            console.log('[PATCH] Successfully made login endpoint dynamic.');
        } else if (content.includes('process.env.MCP_ABAP_LOGIN_PATH')) {
            console.log('[PATCH] Login endpoint is already dynamic.');
        }
    } catch (error) {
        console.error('[PATCH] Error applying runtime patch:', error);
    }
};

// Execute patch immediately
patchLibrary();
