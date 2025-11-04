// b// bancoDeDados/createDB.js
export let banco;
let moduloSql;

const NOME_BD_IDB   = 'rightdestiny_db';
const NOME_STORE    = 'arquivos';
const CHAVE_ARQUIVO = 'rightdestiny.sqlite';

// ---- IndexedDB util ----
function abrirIndexedDB() {
  return new Promise((ok, erro) => {
    const req = indexedDB.open(NOME_BD_IDB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(NOME_STORE)) db.createObjectStore(NOME_STORE);
    };
    req.onsuccess = () => ok(req.result);
    req.onerror   = () => erro(req.error);
  });
}
async function idbLer(chave) {
  const idb = await abrirIndexedDB();
  return new Promise((ok, erro) => {
    const tx = idb.transaction(NOME_STORE, 'readonly');
    const st = tx.objectStore(NOME_STORE);
    const r  = st.get(chave);
    r.onsuccess = () => ok(r.result || null);
    r.onerror   = () => erro(r.error);
  });
}
async function idbGravar(chave, valor) {
  const idb = await abrirIndexedDB();
  return new Promise((ok, erro) => {
    const tx = idb.transaction(NOME_STORE, 'readwrite');
    const st = tx.objectStore(NOME_STORE);
    const r  = st.put(valor, chave);
    r.onsuccess = () => ok(true);
    r.onerror   = () => erro(r.error);
  });
}

export async function persistirBanco() {
  if (!banco) return;
  const bin = banco.export();
  await idbGravar(CHAVE_ARQUIVO, bin);
}

// 👉 Promise que resolve quando o DB está pronto
export const dbPronto = (async () => {
  try {
    // 1) sql-wasm.js precisa ter carregado (CDN do <head>)
    if (typeof window.initSqlJs !== 'function') {
      throw new Error('sql.js não carregou. Confirme a tag <script src="https://unpkg.com/sql.js@1.10.2/dist/sql-wasm.js"> no <head>.');
    }

    // 2) inicializa apontando o WASM para a mesma CDN
    moduloSql = await window.initSqlJs({
      locateFile: (arquivo) => `https://unpkg.com/sql.js@1.10.2/dist/${arquivo}`,
    });

    // 3) abre/cria banco
    const salvo = await idbLer(CHAVE_ARQUIVO);
    banco = salvo ? new moduloSql.Database(new Uint8Array(salvo)) : new moduloSql.Database();

    // 4) tabela + seed idempotentes
    banco.exec(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        senha_hash TEXT NOT NULL,
        criado_em TEXT NOT NULL
      );
    `);

    const emailAdmin = 'admin@admin.com';
    const existe = banco.exec(`SELECT id FROM usuarios WHERE email='${emailAdmin}' LIMIT 1;`);
    const temAdmin = existe.length && existe[0].values.length;
    if (!temAdmin) {
      const bcrypt = window.dcodeIO?.bcrypt;
      const hash = bcrypt ? bcrypt.hashSync('admin123', bcrypt.genSaltSync(10)) : 'admin123';
      const agora = new Date().toISOString();
      const stmt = banco.prepare('INSERT INTO usuarios(email, senha_hash, criado_em) VALUES (?, ?, ?)');
      stmt.run([emailAdmin, hash, agora]);
      stmt.free();
    }

    await persistirBanco();
    return banco;
  } catch (e) {
    console.error('[DB] Falha ao iniciar:', e);
    window.__erroBanco = e;
    throw e;
  }
})();
