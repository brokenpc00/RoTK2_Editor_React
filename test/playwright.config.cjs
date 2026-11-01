const path = require('node:path')

module.exports = {
    testDir: __dirname,
    testMatch: '*.spec.cjs',
    outputDir: path.join(__dirname, '.results'),
    workers: 1,
    use: {
        baseURL: 'http://127.0.0.1:8764',
        viewport: { width: 1000, height: 720 },
        headless: true,
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'node test/server.cjs',
        cwd: path.join(__dirname, '..'),
        url: 'http://127.0.0.1:8764',
        reuseExistingServer: false,
    },
}
