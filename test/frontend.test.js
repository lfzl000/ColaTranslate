const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

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
