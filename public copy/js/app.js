

const API_URL = 'http://localhost:3000/produtos';

let produtos = [];
let categoriaAtiva = 'Todos';
let termoBusca = '';

const gridEl        = document.getElementById('gridProdutos');
const loadingEl     = document.getElementById('loadingState');
const emptyEl       = document.getElementById('emptyState');
const modalEl       = document.getElementById('modal');
const formEl        = document.getElementById('formProduto');
const toastEl       = document.getElementById('toast');
const contadorEl    = document.getElementById('contadorProdutos');
const inputBuscaEl  = document.getElementById('inputBusca');

const campoId          = () => document.getElementById('produtoId');
const campoNome        = () => document.getElementById('inputNome');
const campoPreco       = () => document.getElementById('inputPreco');
const campoCategoria   = () => document.getElementById('inputCategoria');
const campoImagem      = () => document.getElementById('inputImagem');
const campoDescricao   = () => document.getElementById('inputDescricao');
const campoEstoque     = () => document.getElementById('inputEstoque');


/** GET /produtos — lista todos os produtos */
async function getProdutos() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('Erro ao buscar produtos');
  return res.json();
}

async function criarProduto(dados) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao criar produto');
  return res.json();
}

async function atualizarProduto(id, dados) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  if (!res.ok) throw new Error('Erro ao atualizar produto');
  return res.json();
}

async function excluirProduto(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao excluir produto');
}

function produtosFiltrados() {
  return produtos.filter(p => {
    const matchCat = categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva;
    const termo = termoBusca.toLowerCase();
    const matchBusca = !termo
      || p.nome.toLowerCase().includes(termo)
      || p.categoria.toLowerCase().includes(termo);
    return matchCat && matchBusca;
  });
}

function renderizarGrid() {
  const lista = produtosFiltrados();

  loadingEl.classList.add('hidden');

  if (lista.length === 0) {
    gridEl.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    contadorEl.textContent = '0';
    return;
  }

  emptyEl.classList.add('hidden');
  gridEl.classList.remove('hidden');
  contadorEl.textContent = lista.length;

  gridEl.innerHTML = lista.map(p => `
    <article class="card" data-id="${p.id}">
      <div class="card__img-wrap">
        <img
          src="${p.imagem || 'https://placehold.co/400x300/1d2230/6c63ff?text=Sem+imagem'}"
          alt="${p.nome}"
          onerror="this.src='https://placehold.co/400x300/1d2230/6c63ff?text=Sem+imagem'"
        />
        <span class="card__estoque card__estoque--${p.emEstoque ? 'sim' : 'nao'}">
          ${p.emEstoque ? 'Em estoque' : 'Indisponível'}
        </span>
      </div>
      <div class="card__body">
        <p class="card__categoria">${p.categoria}</p>
        <h2 class="card__nome">${p.nome}</h2>
        <p class="card__descricao">${p.descricao}</p>
        <p class="card__preco">${formatarPreco(p.preco)}</p>
      </div>
      <div class="card__footer">
        <button class="btn btn--icon btn--sm" title="Editar" onclick="abrirModalEditar(${p.id}, event)">✏️</button>
        <button class="btn btn--icon btn--sm" title="Excluir" onclick="confirmarExclusao(${p.id}, event)">🗑️</button>
        <a href="detalhes.html?id=${p.id}" class="btn btn--ghost btn--sm" onclick="event.stopPropagation()">Ver mais</a>
      </div>
    </article>
  `).join('');
}

function formatarPreco(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
}



async function carregarProdutos() {
  loadingEl.classList.remove('hidden');
  gridEl.classList.add('hidden');
  emptyEl.classList.add('hidden');

  try {
    produtos = await getProdutos();
    renderizarGrid();
  } catch (err) {
    loadingEl.classList.add('hidden');
    mostrarToast('Não foi possível conectar ao servidor. Verifique se o JSON Server está rodando.', 'error');
    console.error(err);
  }
}


function abrirModal(titulo = 'Novo Produto') {
  document.getElementById('modalTitulo').textContent = titulo;
  modalEl.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => campoNome().focus(), 100);
}

function fecharModal() {
  modalEl.classList.add('hidden');
  document.body.style.overflow = '';
  limparFormulario();
}

function limparFormulario() {
  formEl.reset();
  campoId().value = '';
  limparErros();
  document.getElementById('formErro').classList.add('hidden');
}

function preencherFormulario(p) {
  campoId().value   = p.id;
  campoNome().value        = p.nome;
  campoPreco().value       = p.preco;
  campoCategoria().value   = p.categoria;
  campoImagem().value      = p.imagem || '';
  campoDescricao().value   = p.descricao;
  campoEstoque().checked   = p.emEstoque;
}

function abrirModalEditar(id, event) {
  if (event) event.stopPropagation();
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;
  limparFormulario();
  preencherFormulario(produto);
  abrirModal('Editar Produto');
}

window.abrirModalEditar = abrirModalEditar;



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

  const marcar = (campo, erroId, msg) => {
    document.getElementById(campo).classList.add('invalid');
    document.getElementById(erroId).textContent = msg;
    valido = false;
  };

  if (!campoNome().value.trim())
    marcar('inputNome', 'erroNome', 'Nome é obrigatório.');
  else if (campoNome().value.trim().length < 3)
    marcar('inputNome', 'erroNome', 'Nome deve ter ao menos 3 caracteres.');

  const preco = parseFloat(campoPreco().value);
  if (!campoPreco().value || isNaN(preco) || preco < 0)
    marcar('inputPreco', 'erroPreco', 'Informe um preço válido.');

  if (!campoCategoria().value)
    marcar('inputCategoria', 'erroCategoria', 'Selecione uma categoria.');

  if (!campoDescricao().value.trim())
    marcar('inputDescricao', 'erroDescricao', 'Descrição é obrigatória.');
  else if (campoDescricao().value.trim().length < 10)
    marcar('inputDescricao', 'erroDescricao', 'Descrição deve ter ao menos 10 caracteres.');

  return valido;
}

formEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validarFormulario()) return;

  const btnSalvar = document.getElementById('btnSalvar');
  btnSalvar.disabled = true;
  btnSalvar.textContent = 'Salvando…';

  const dados = {
    nome:       campoNome().value.trim(),
    preco:      parseFloat(campoPreco().value),
    categoria:  campoCategoria().value,
    imagem:     campoImagem().value.trim(),
    descricao:  campoDescricao().value.trim(),
    emEstoque:  campoEstoque().checked,
  };

  const id = campoId().value;

  try {
    if (id) {
      await atualizarProduto(id, dados);
      mostrarToast('Produto atualizado com sucesso!', 'success');
    } else {
      await criarProduto(dados);
      mostrarToast('Produto adicionado com sucesso!', 'success');
    }
    fecharModal();
    await carregarProdutos();
  } catch (err) {
    const formErro = document.getElementById('formErro');
    formErro.textContent = 'Erro ao salvar. Verifique o servidor e tente novamente.';
    formErro.classList.remove('hidden');
    console.error(err);
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.textContent = 'Salvar produto';
  }
});



async function confirmarExclusao(id, event) {
  if (event) event.stopPropagation();
  const produto = produtos.find(p => p.id === id);
  if (!produto) return;

  if (!confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) return;

  try {
    await excluirProduto(id);
    mostrarToast('Produto excluído.', 'success');
    await carregarProdutos();
  } catch (err) {
    mostrarToast('Erro ao excluir produto.', 'error');
    console.error(err);
  }
}

window.confirmarExclusao = confirmarExclusao;


let toastTimer;
function mostrarToast(msg, tipo = 'success') {
  clearTimeout(toastTimer);
  toastEl.textContent = msg;
  toastEl.className = `toast toast--${tipo}`;
  toastTimer = setTimeout(() => { toastEl.classList.add('hidden'); }, 3000);
}


document.querySelectorAll('.filtro-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    categoriaAtiva = btn.dataset.cat;
    renderizarGrid();
  });
});

inputBuscaEl.addEventListener('input', (e) => {
  termoBusca = e.target.value;
  renderizarGrid();
});


document.getElementById('btnAbrirModal').addEventListener('click', () => {
  limparFormulario();
  abrirModal('Novo Produto');
});

document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
document.getElementById('btnCancelar').addEventListener('click', fecharModal);
document.getElementById('modalBackdrop').addEventListener('click', fecharModal);

const btnAbrirModalEmpty = document.getElementById('btnAbrirModalEmpty');
if (btnAbrirModalEmpty) {
  btnAbrirModalEmpty.addEventListener('click', () => {
    limparFormulario();
    abrirModal('Novo Produto');
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fecharModal();
});


carregarProdutos();
