const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../node_modules/abap-adt-api/build/AdtHTTP.js');

try {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');

        // Check if already patched
        if (!content.includes('httpAgent: options.httpAgent,')) {
            console.log('Patching abap-adt-api/build/AdtHTTP.js to support httpAgent...');

            const target = 'httpsAgent: options.httpsAgent,';
            const replacement = 'httpAgent: options.httpAgent,\n        httpsAgent: options.httpsAgent,';

            content = content.replace(target, replacement);

            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Successfully patched AdtHTTP.js');
        } else {
            console.log('AdtHTTP.js is already patched.');
        }
    } else {
        console.warn('Could not find node_modules/abap-adt-api/build/AdtHTTP.js to patch. Skipping.');
    }
} catch (error) {
    console.error('Error patching AdtHTTP.js:', error);
    // Do not fail the build/install, just warn
}
