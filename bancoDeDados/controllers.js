// bancoDeDados/controllers.js
// @ts-ignore
import { dbPronto } from './createDB.js';
import { UsuarioQueries } from './querys.js';

export const AuthController = {
  async login({ email, senha }) {
    await dbPronto; // segurança extra

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { ok: false, mensagem: 'Informe um e-mail válido.' };
    }
    if (!senha || senha.length < 6) {
      return { ok: false, mensagem: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    const usuario = await UsuarioQueries.buscarPorEmail(email); // <- await aqui !
    if (!usuario) return { ok: false, mensagem: 'Usuário não encontrado.' };

    const bcrypt = window.dcodeIO?.bcrypt;
    const confere = bcrypt ? bcrypt.compareSync(senha, usuario.senha_hash) : (senha === usuario.senha_hash);
    if (!confere) return { ok: false, mensagem: 'Senha inválida.' };

    sessionStorage.setItem('sessao', JSON.stringify({ usuarioId: usuario.id, email: usuario.email }));
    return { ok: true };
  },

  sair() { sessionStorage.removeItem('sessao'); },
  estaAutenticado() { return !!sessionStorage.getItem('sessao'); },
};
