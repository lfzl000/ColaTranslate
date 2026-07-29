const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const sidepanelHtml = fs.readFileSync(path.join(__dirname, '..', 'extension', 'sidepanel.html'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extension', 'manifest.json'), 'utf8'));
const mainProcess = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

function functionBody(name, nextMarker) {
    const start = html.indexOf(`function ${name}`);
    const end = html.indexOf(nextMarker, start);
    assert.notEqual(start, -1, `${name} should exist`);
    assert.notEqual(end, -1, `${name} boundary should exist`);
    return html.slice(start, end);
}

test('desktop batch naming sends the complete proxy configuration', () => {
    const body = functionBody('doBatchNaming', 'function renderBatchResults');
    assert.match(body, /apiBase:\s*currentApiBase/);
    assert.match(body, /apiKey:\s*currentApiKey/);
    assert.match(body, /localApiFetch\('\/api\/proxy'/);
});

test('desktop Markdown translation sends the complete proxy configuration', () => {
    const start = html.indexOf("mdTranslateBtn.addEventListener('click'");
    const end = html.indexOf('function escapeHtml', start);
    const body = html.slice(start, end);
    assert.match(body, /apiBase:\s*currentApiBase/);
    assert.match(body, /apiKey:\s*currentApiKey/);
    assert.match(body, /localApiFetch\('\/api\/proxy'/);
});

test('dynamic values use attribute-aware escaping and deployment metadata is present', () => {
    assert.match(html, /data-value="\$\{escapeAttribute\(/);
    assert.match(html, /<ai_title style="display:none">/);
    assert.match(html, /<ai_summary style="display:none">/);
});

test('brand icon is used by the Web page and Chrome extension surfaces', () => {
    assert.match(html, /href="\/icons\/icon48\.png"/);
    assert.match(html, /src="\/icons\/icon128\.png"/);
    assert.match(sidepanelHtml, /href="icons\/icon48\.png"/);
    assert.match(sidepanelHtml, /src="icons\/icon128\.png"/);
    assert.equal(manifest.action.default_icon['16'], 'icons/icon16.png');
    assert.equal(manifest.action.default_icon['48'], 'icons/icon48.png');
    assert.equal(manifest.action.default_icon['128'], 'icons/icon128.png');
});

test('macOS hides the Dock icon with the window and restores it when showing', () => {
    const showWindowStart = mainProcess.indexOf('function showWindow()');
    const showWindowEnd = mainProcess.indexOf('async function createWindow()', showWindowStart);
    const showWindowBody = mainProcess.slice(showWindowStart, showWindowEnd);

    assert.match(mainProcess, /app\.dock\.hide\(\)/);
    assert.doesNotMatch(mainProcess, /app\.dock\.hide\(\)\.catch/);
    assert.match(showWindowBody, /app\.dock\.show\(\)\.catch/);
    assert.doesNotMatch(showWindowBody, /await app\.dock\.show\(\)/);
    assert.ok(showWindowBody.indexOf('mainWindow.show()') < showWindowBody.indexOf('app.dock.show()'));
    assert.match(mainProcess, /app\.dock\.setIcon\(getIcon\('icon512\.png'\)\)/);
});
