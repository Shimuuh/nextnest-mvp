import puppeteer from 'puppeteer-core';
import fs from 'fs';

(async () => {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const browser = await puppeteer.launch({ executablePath: edgePath, headless: 'new' });
    const page = await browser.newPage();

    page.on('pageerror', err => {
        fs.appendFileSync('error_stack.txt', 'PAGEERROR:\n' + err.stack + '\n\n');
    });

    page.on('console', async msg => {
        if (msg.type() === 'error') {
            fs.appendFileSync('error_stack.txt', 'CONSOLE ERROR:\n' + msg.text() + '\n');
            const args = msg.args();
            for (let i = 0; i < args.length; i++) {
                try {
                    const stack = await page.evaluate(obj => obj && obj.stack ? obj.stack : obj, args[i]);
                    if (stack) {
                        fs.appendFileSync('error_stack.txt', stack + '\n');
                    }
                } catch (e) { }
            }
            fs.appendFileSync('error_stack.txt', '\n');
        }
    });

    await page.goto('http://localhost:5173');
    await page.evaluate(() => { localStorage.setItem('token', 'fake-token'); localStorage.setItem('role', 'donor'); });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    await browser.close();
    process.exit(0);
})();
