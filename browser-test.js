const { chromium } = require('playwright');

async function runTests() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    const baseUrl = 'http://localhost:8000';
    const results = [];
    
    // Test 1: Homepage loads
    try {
        await page.goto(baseUrl + '/index.html', { waitUntil: 'networkidle' });
        const toolCount = await page.locator('[data-tool-id]').count();
        results.push({
            test: 'Homepage loads',
            expected: 'Page loads and displays tools',
            actual: `Loaded with ${toolCount} tools visible`,
            status: toolCount >= 14 ? 'PASS' : 'FAIL'
        });
    } catch (e) {
        results.push({
            test: 'Homepage loads',
            expected: 'Page loads',
            actual: `Error: ${e.message}`,
            status: 'FAIL'
        });
    }
    
    // Test 2: Software directory loads
    try {
        await page.goto(baseUrl + '/software.html', { waitUntil: 'networkidle' });
        const listingCount = await page.locator('[data-listing-id]').count();
        results.push({
            test: 'Software directory loads',
            expected: '35 listings',
            actual: `${listingCount} listings found`,
            status: listingCount === 35 ? 'PASS' : 'FAIL'
        });
    } catch (e) {
        results.push({
            test: 'Software directory loads',
            expected: 'Page loads',
            actual: `Error: ${e.message}`,
            status: 'FAIL'
        });
    }
    
    // Test 3-18: Check all 16 tool pages load
    const tools = [
        'aspect-ratio', 'data-transfer', 'download-time', 'mouse-sensitivity', 
        'qr-code', 'refresh-rate', 'storage-converter', 'text-analyzer',
        'ppi-calculator', 'edpi-calculator', 'hash-generator', 'json-formatter',
        'colour-converter', 'date-time-calculator', 'base64-encoder', 'electricity-cost-calculator'
    ];
    
    for (const tool of tools) {
        try {
            const response = await page.goto(baseUrl + '/tools/' + tool + '.html', { waitUntil: 'domcontentloaded' });
            const hasError = await page.evaluate(() => {
                return window.console ? false : true;
            });
            results.push({
                test: `Tool page: ${tool}`,
                expected: 'Loads without HTTP errors',
                actual: `Status ${response.status()}`,
                status: response.status() === 200 ? 'PASS' : 'FAIL'
            });
        } catch (e) {
            results.push({
                test: `Tool page: ${tool}`,
                expected: 'Loads',
                actual: `Error: ${e.message}`,
                status: 'FAIL'
            });
        }
    }
    
    // Check for console errors on homepage
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    
    await page.goto(baseUrl + '/index.html');
    await page.waitForTimeout(1000);
    
    results.push({
        test: 'Homepage console errors',
        expected: 'No console errors',
        actual: errors.length === 0 ? 'No errors' : `${errors.length} errors`,
        status: errors.length === 0 ? 'PASS' : 'FAIL'
    });
    
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
}

runTests().catch(console.error);
