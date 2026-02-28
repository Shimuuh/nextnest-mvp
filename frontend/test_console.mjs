import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
    try {
        const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
        const browser = await puppeteer.launch({ executablePath: edgePath, headless: 'new' });
        const page = await browser.newPage();

        let errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push('CONSOLE-ERROR: ' + msg.text());
                console.log('CONSOLE-ERROR:', msg.text());
            }
        });
        page.on('pageerror', err => {
            errors.push('PAGE-ERROR: ' + err.message);
            console.log('PAGE-ERROR:', err.message);
        });

        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 10000 }).catch(e => console.log('Goto err:', e));

        // Wait an extra second just in case
        await new Promise(r => setTimeout(r, 1000));

        if (errors.length === 0) {
            console.log("No client-side errors found. Checking body content...");
            const bodyContent = await page.evaluate(() => document.body.innerHTML);
            console.log("Body Content length: " + bodyContent.length);
        }

        await browser.close();
    } catch (e) {
        console.error("Puppeteer Script Error:", e);
    }
})();
