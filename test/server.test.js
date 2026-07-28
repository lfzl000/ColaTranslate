const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
    startServer,
    stopServer,
    setShortcutCallback,
    normalizeApiBase
} = require('../server');

const TOKEN = 'test-local-api-token';

async function withServer(t, callback) {
    const userDataPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cola-translate-test-'));
    t.after(async () => {
        setShortcutCallback(null);
        await stopServer();
        fs.rmSync(userDataPath, { recursive: true, force: true });
    });
    const port = await startServer(0, { userDataPath, authToken: TOKEN });
    await callback(`http://127.0.0.1:${port}`, userDataPath);
}

function apiHeaders(extra = {}) {
    return { 'X-Cola-Token': TOKEN, ...extra };
}

test('local API rejects requests without the Electron session token', async t => {
    await withServer(t, async baseUrl => {
        const response = await fetch(`${baseUrl}/api/shortcut`);
        assert.equal(response.status, 403);
    });
});

test('shortcut is persisted only after registration succeeds', async t => {
    await withServer(t, async (baseUrl, userDataPath) => {
        setShortcutCallback(key => key === 'Command+Shift+K'
            ? { ok: true, key }
            : { ok: false, error: '快捷键已占用' });

        const rejected = await fetch(`${baseUrl}/api/shortcut`, {
            method: 'POST',
            headers: apiHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ key: 'Command+Shift+X' })
        });
        assert.equal(rejected.status, 409);
        assert.equal(fs.existsSync(path.join(userDataPath, '.shortcut.json')), false);

        const accepted = await fetch(`${baseUrl}/api/shortcut`, {
            method: 'POST',
            headers: apiHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ key: 'Command+Shift+K' })
        });
        assert.equal(accepted.status, 200);
        assert.deepEqual(
            JSON.parse(fs.readFileSync(path.join(userDataPath, '.shortcut.json'), 'utf8')),
            { key: 'Command+Shift+K' }
        );
    });
});

test('API base validation allows HTTP APIs but rejects unsafe URL schemes and credentials', () => {
    assert.equal(normalizeApiBase('https://api.example.com/v1/', ''), 'https://api.example.com/v1');
    assert.equal(normalizeApiBase('http://127.0.0.1:11434/v1', ''), 'http://127.0.0.1:11434/v1');
    assert.throws(() => normalizeApiBase('file:///tmp/data', ''), /仅支持 HTTP 或 HTTPS/);
    assert.throws(() => normalizeApiBase('https://user:pass@example.com/v1', ''), /不能包含用户名或密码/);
});
