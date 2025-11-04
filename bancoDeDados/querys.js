// bancoDeDados/querys.js
// @ts-ignore
import { banco, persistirBanco, dbPronto } from './createDB.js';

export const UsuarioQueries = {
  async buscarPorEmail(email) {
    await dbPronto; // garante que o DB está pronto
    if (!banco) throw new Error('Banco não inicializado');
    const stmt = banco.prepare('SELECT id, email, senha_hash FROM usuarios WHERE email = ? LIMIT 1;');
    stmt.bind([email]);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
  },

  async criarUsuario(email, senhaHash) {
    await dbPronto;
    if (!banco) throw new Error('Banco não inicializado');
    const stmt = banco.prepare('INSERT INTO usuarios(email, senha_hash, criado_em) VALUES (?, ?, ?)');
    stmt.run([email, senhaHash, new Date().toISOString()]);
    stmt.free();
    await persistirBanco();
  },
};
