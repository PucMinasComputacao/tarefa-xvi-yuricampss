
const API_URL = 'http://localhost:3000/produtos';

// ── Pega o ID da query string ─────────────────
const params     = new URLSearchParams(window.location.search);
const produtoId  = params.get('id');

const loadingEl   = document.getElementById('loadingDetalhe');
const erroEl      = document.getElementById('erroDetalhe');
const conteudoEl  = document.getElementById('conteudoDetalhe');
const modalEl     = document.getElementById('modal');
const formEl      = document.getElementById('formProduto');
const toastEl     = document.getElementById('toast');

let produtoAtual = null;



async function getProduto(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error('Produto não encontrado');
  return res.json();
}

async function atualizarProduto(id, dados) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao atualizar');
  return res.json();
}

async function excluirProduto(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir');
}


function renderizarDetalhe(p) {
  document.title = `TechStore — ${p.nome}`;

  document.getElementById('detalheImagem').src     = p.imagem
    || 'https://placehold.co/600x600/1d2230/6c63ff?text=Sem+imagem';
  document.getElementById('detalheImagem').alt     = p.nome;
  document.getElementById('detalheCategoria').textContent  = p.categoria;
  document.getElementById('detalheNome').textContent       = p.nome;
  document.getElementById('detalheDescricao').textContent  = p.descricao;
  document.getElementById('detalhePreco').textContent      = formatarPreco(p.preco);

  const badge = document.getElementById('detalheBadgeEstoque');
  badge.textContent  = p.emEstoque ? 'Em estoque' : 'Indisponível';
  badge.className    = `badge-estoque badge-estoque--${p.emEstoque ? 'sim' : 'nao'}`;
}

function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}



async function carregarProduto() {
  if (!produtoId) { mostrarErro(); return; }

  try {
    produtoAtual = await getProduto(produtoId);
    renderizarDetalhe(produtoAtual);
    loadingEl.classList.add('hidden');
    conteudoEl.classList.remove('hidden');
  } catch {
    mostrarErro();
  }
}

function mostrarErro() {
  loadingEl.classList.add('hidden');
  erroEl.classList.remove('hidden');
}



function abrirModal() {
  preencherFormulario(produtoAtual);
  modalEl.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('inputNome').focus(), 100);
}

function fecharModal() {
  modalEl.classList.add('hidden');
  document.body.style.overflow = '';
  limparErros();
  document.getElementById('formErro').classList.add('hidden');
}

function preencherFormulario(p) {
  document.getElementById('produtoId').value        = p.id;
  document.getElementById('inputNome').value        = p.nome;
  document.getElementById('inputPreco').value       = p.preco;
  document.getElementById('inputCategoria').value   = p.categoria;
  document.getElementById('inputImagem').value      = p.imagem || '';
  document.getElementById('inputDescricao').value   = p.descricao;
  document.getElementById('inputEstoque').checked   = p.emEstoque;
}


function limparErros() {
  ['Nome','Preco','Categoria','Descricao'].forEach(campo => {
    const el = document.getElementById(`erro${campo}`);
    if (el) el.textContent = '';
  });
  ['inputNome','inputPreco','inputCategoria','inputDescricao'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('invalid');
  });
}

function validarFormulario() {
  let valido = true;
  limparErros();

  const marcar = (campoId, erroId, msg) => {
    document.getElementById(campoId).classList.add('invalid');
    document.getElementById(erroId).textContent = msg;
    valido = false;
  };

  const nome = document.getElementById('inputNome').value.trim();
  if (!nome) marcar('inputNome', 'erroNome', 'Nome é obrigatório.');
  else if (nome.length < 3) marcar('inputNome', 'erroNome', 'Mínimo de 3 caracteres.');

  const preco = parseFloat(document.getElementById('inputPreco').value);
  if (isNaN(preco) || preco < 0) marcar('inputPreco', 'erroPreco', 'Preço inválido.');

  if (!document.getElementById('inputCategoria').value)
    marcar('inputCategoria', 'erroCategoria', 'Selecione uma categoria.');

  const desc = document.getElementById('inputDescricao').value.trim();
  if (!desc) marcar('inputDescricao', 'erroDescricao', 'Descrição é obrigatória.');
  else if (desc.length < 10) marcar('inputDescricao', 'erroDescricao', 'Mínimo de 10 caracteres.');

  return valido;
}


formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;

  const btnSalvar = document.getElementById('btnSalvar');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando…';

  const dados = {
    nome:      document.getElementById('inputNome').value.trim(),
    preco:     parseFloat(document.getElementById('inputPreco').value),
    categoria: document.getElementById('inputCategoria').value,
    imagem:    document.getElementById('inputImagem').value.trim(),
    descricao: document.getElementById('inputDescricao').value.trim(),
    emEstoque: document.getElementById('inputEstoque').checked,
  };

  try {
    const atualizado = await atualizarProduto(produtoAtual.id, dados);
    produtoAtual = atualizado;
    renderizarDetalhe(produtoAtual);
    fecharModal();
    mostrarToast('Produto atualizado com sucesso!', 'success');
  } catch (err) {
    const formErro = document.getElementById('formErro');
    formErro.textContent = 'Erro ao salvar. Verifique o servidor.';
    formErro.classList.remove('hidden');
    console.error(err);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar alterações';
  }
});



document.getElementById('btnExcluirDetalhe').addEventListener('click', async () => {
  if (!confirm(`Excluir "${produtoAtual.nome}"? Esta ação não pode ser desfeita.`)) return;

  try {
    await excluirProduto(produtoAtual.id);
    mostrarToast('Produto excluído. Redirecionando…', 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch {
    mostrarToast('Erro ao excluir produto.', 'error');
  }
});



document.getElementById('btnEditarDetalhe').addEventListener('click', abrirModal);
document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
document.getElementById('modalBackdrop').addEventListener('click', fecharModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });



let toastTimer;
function mostrarToast(msg, tipo = 'success') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `toast toast--${tipo}`;
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 3000);
}

carregarProduto();
