#!/usr/bin/env node

// Import patch loader FIRST to ensure abap-adt-api is patched before it is loaded
import './patch-loader.js';

// Import and run the actual server logic
import './server.js';
