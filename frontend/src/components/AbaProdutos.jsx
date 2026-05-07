import { useEffect, useState } from "react";
import ModalEditarProduto from "./ModalEditarProduto";
import MensagemMultilingue from "./MensagemMultilingue";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const formatarKz = (valor) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    minimumFractionDigits: 2,
  }).format(valor);

const renderEstrelas = (vendas) => {
  const totalEstrelas = Math.min(Math.floor(vendas / 5), 5);
  return Array.from({ length: 5 }, (_, i) =>
    i < totalEstrelas ? "⭐" : "☆"
  ).join("");
};

export default function AbaProdutos({
  produtos,
  setProdutos,
  setProdutoSelecionado,
  adicionarNoCarrinho,
  usuario,
  setAbaAtiva,
}) {
  const [filtros, setFiltros] = useState({
    nome: "",
    provincia: "",
    municipio: "",
    area: "",
  });
  const [produtosFiltrados, setProdutosFiltrados] = useState(produtos);
  const [produtoParaEditar, setProdutoParaEditar] = useState(null);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [favoritos, setFavoritos] = useState(
    () => JSON.parse(localStorage.getItem("favoritos") || "[]")
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoSelecionadoModal, setProdutoSelecionadoModal] = useState(null);
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState(1);

  const handleChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  const toggleFavorito = (id) => {
    const novos = favoritos.includes(id)
      ? favoritos.filter((f) => f !== id)
      : [...favoritos, id];
    setFavoritos(novos);
    localStorage.setItem("favoritos", JSON.stringify(novos));
  };

  const abrirModalCarrinho = (produto) => {
    if (!usuario) {
      if (window.confirm("Para adicionar ao carrinho precisa iniciar sessão. Deseja iniciar sessão agora?")) {
        setAbaAtiva && setAbaAtiva("login");
      }
      return;
    }
    if (usuario.tipo !== "cliente") return;
    setProdutoSelecionadoModal(produto);
    setQuantidadeSelecionada(1);
    setModalAberto(true);
  };

  const confirmarAdicionarCarrinho = async () => {
    if (!produtoSelecionadoModal) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/carrinho/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          produtoId: produtoSelecionadoModal._id,
          quantidade: quantidadeSelecionada,
        }),
      });
      if (!res.ok) throw new Error("Erro ao adicionar ao carrinho");
      const dados = await res.json();
      adicionarNoCarrinho(dados.carrinho);
      setModalAberto(false);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    let filtrados = produtos;
    if (filtros.nome.trim())
      filtrados = filtrados.filter((p) =>
        p.nome.toLowerCase().includes(filtros.nome.toLowerCase())
      );
    if (filtros.provincia.trim())
      filtrados = filtrados.filter((p) =>
        (p.provincia || "").toLowerCase().includes(filtros.provincia.toLowerCase())
      );
    if (filtros.municipio.trim())
      filtrados = filtrados.filter((p) =>
        (p.municipio || "").toLowerCase().includes(filtros.municipio.toLowerCase())
      );
    if (filtros.area.trim())
      filtrados = filtrados.filter((p) =>
        (p.localizacaoEspecifica || "")
          .toLowerCase()
          .includes(filtros.area.toLowerCase())
      );
    filtrados.sort((a, b) => (b.vendas || 0) - (a.vendas || 0));
    setProdutosFiltrados(filtrados);
  }, [filtros, produtos]);

  const esgotado = (produto) =>
    produto.quantidade === 0 || produto.quantidade === "0";

  const excluirProduto = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Deseja mesmo eliminar este produto?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/produtos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProdutosFiltrados((prev) => prev.filter((prod) => prod._id !== id));
      alert("Produto eliminado com sucesso!");
    } catch {
      alert("Erro ao eliminar produto.");
    }
  };

  const produtosVisiveis = usuario?.tipo === "vendedor" 
    ? produtosFiltrados.filter(p => p.vendedor?.nome === usuario.nome)
    : produtosFiltrados;

  const vendedoresUnicos = [
    ...new Set(
      produtosVisiveis
        .filter(p => !(usuario?.tipo === "vendedor" && p.vendedor?.nome !== usuario.nome))
        .map(p => p.vendedor?.nome || "Desconhecido")
    )
  ].sort((a, b) => a.localeCompare(b));

  const LIMITE_SELO_VENDAS = 5;
  const LIMITE_SELO_CADASTRO = 4;

  const vendasPorVendedor = produtosFiltrados.reduce((acc, p) => {
    const nome = p.vendedor?.nome || "Desconhecido";
    acc[nome] = (acc[nome] || 0) + (p.vendas || 0);
    return acc;
  }, {});

  const cadastrosPorVendedor = produtosFiltrados.reduce((acc, p) => {
    const nome = p.vendedor?.nome || "Desconhecido";
    acc[nome] = (acc[nome] || 0) + 1;
    return acc;
  }, {});

  const produtosMaisComprados = [...produtosFiltrados]
    .sort((a, b) => (b.vendas || 0) - (a.vendas || 0))
    .slice(0, 5);

  const vendedoresDoMes = Object.keys(cadastrosPorVendedor).filter(
    (vendedor) =>
      (cadastrosPorVendedor[vendedor] || 0) >= LIMITE_SELO_CADASTRO ||
      (vendasPorVendedor[vendedor] || 0) >= LIMITE_SELO_VENDAS
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden mb-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900 to-green-700 opacity-90"></div>
        <div className="relative bg-[url('https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] bg-cover bg-center p-8 md:p-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">🌾 Produtos Frescos de Angola</h1>
            <p className="text-green-100 text-lg mb-4">Direto do produtor para a sua mesa</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm">🚚 Entregamos em todo o país</span>
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm">💰 Pagamento Seguro</span>
              <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full text-white text-sm">🌱 Produtos Locais</span>
            </div>
          </div>
        </div>
      </div>

      <MensagemMultilingue />

      {/* Destaques - Grid em vez de Carousel */}
      {produtosMaisComprados.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-3xl">🔥</span> Mais Vendidos
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {produtosMaisComprados.map((produto) => (
              <div
                key={produto._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer group"
                onClick={() => {
                  if (usuario) {
                    setProdutoSelecionado(produto);
                    setAbaAtiva && setAbaAtiva("detalhes");
                  } else {
                    setAbaAtiva && setAbaAtiva("login");
                  }
                }}
              >
                <div className="relative h-32 overflow-hidden bg-green-100">
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                    🔥 Top
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-gray-800 truncate">{produto.nome}</h4>
                  <p className="text-green-700 font-bold text-lg">{formatarKz(produto.preco)}</p>
                  <div className="text-xs text-yellow-500">{renderEstrelas(produto.vendas || 0)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vendedores do Mês Banner */}
      {vendedoresDoMes.length > 0 && (
        <div className="mb-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🏆</span>
              <span className="text-white font-bold">Vendedores do Mês</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {vendedoresDoMes.map((vendedor, idx) => (
                <span key={idx} className="bg-white text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {vendedor}
                </span>
              ))}
            </div>
          </div>
          <p className="text-white/90 text-sm mt-2 text-center">
            💡 Continue cadastrando e vendendo mais produtos para ser destaque!
          </p>
        </div>
      )}

      {/* Filtros Modernos */}
      <div className="bg-white rounded-xl shadow-lg p-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-xl">🔍</span> Encontre o produto ideal
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "nome", placeholder: "Nome do produto", icon: "🌾" },
            { name: "provincia", placeholder: "Província", icon: "📍" },
            { name: "municipio", placeholder: "Município", icon: "🏘️" },
            { name: "area", placeholder: "Localização específica", icon: "🏠" }
          ].map((campo) => (
            <div key={campo.name} className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{campo.icon}</span>
              <input
                type="text"
                name={campo.name}
                placeholder={campo.placeholder}
                value={filtros[campo.name] || ""}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Listagem de Produtos por Vendedor */}
      {vendedoresUnicos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🌱</div>
          <p className="text-gray-500 text-lg">Nenhum produto encontrado.</p>
          <button 
            onClick={() => setFiltros({ nome: "", provincia: "", municipio: "", area: "" })}
            className="mt-4 text-green-600 hover:text-green-700 font-semibold"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {vendedoresUnicos.map((vendedor) => {
            const produtosDoVendedor = produtosVisiveis.filter(
              (p) => (p.vendedor?.nome || "Desconhecido") === vendedor
            );
            const seloPorVenda = (vendasPorVendedor[vendedor] || 0) >= LIMITE_SELO_VENDAS;
            const seloPorCadastro = (cadastrosPorVendedor[vendedor] || 0) >= LIMITE_SELO_CADASTRO;

            return (
              <div key={vendedor} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl">🧑‍🌾</span>
                      <h3 className="text-xl font-bold text-white">
                        {produtosDoVendedor[0]?.vendedor?.genero === "feminino" ? "Vendedora" : "Vendedor"}: {vendedor}
                      </h3>
                      {seloPorCadastro && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full">
                          🏅 Cadastro Ativo
                        </span>
                      )}
                      {seloPorVenda && (
                        <span className="bg-blue-400 text-blue-900 text-xs px-2 py-1 rounded-full">
                          💎 Top Vendas
                        </span>
                      )}
                    </div>
                    <div className="text-white/80 text-sm">
                      {produtosDoVendedor.length} produtos
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {produtosDoVendedor.map((produto) => (
                      <div
                        key={produto._id}
                        className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl transition group bg-white"
                      >
                        <div className="relative h-44 overflow-hidden bg-green-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorito(produto._id);
                            }}
                            className="absolute top-2 right-2 z-10 text-2xl drop-shadow-md"
                          >
                            {favoritos.includes(produto._id) ? "❤️" : "🤍"}
                          </button>
                          <img
                            src={produto.imagem}
                            alt={produto.nome}
                            className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition duration-300"
                            onClick={() => {
                              if (usuario) {
                                setProdutoSelecionado(produto);
                                setAbaAtiva && setAbaAtiva("detalhes");
                              } else {
                                alert("Por favor, inicie sessão para ver os detalhes.");
                              }
                            }}
                          />
                          {esgotado(produto) && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">Esgotado</span>
                            </div>
                          )}
                          {produto.quantidade < 3 && !esgotado(produto) && (
                            <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                              ⚠️ Últimas unidades
                            </div>
                          )}
                        </div>

                        <div className="p-3">
                          <h4 className="font-semibold text-gray-800 text-lg truncate">{produto.nome}</h4>
                          <p className="text-green-700 font-bold text-xl mt-1">
                            {esgotado(produto) ? "Indisponível" : formatarKz(produto.preco)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            📦 {produto.quantidade - (produto.reservados || 0)} {produto.unidade || "un"}
                          </p>
                          <div className="text-xs text-yellow-500 my-1">
                            {renderEstrelas(produto.vendas || 0)}
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            📍 {produto.localizacaoDetalhada || `${produto.provincia} - ${produto.municipio}`}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {produto.descricao?.substring(0, 80)}...
                          </p>

                          <div className="flex gap-2 mt-3">
                            {(usuario?.tipo === "cliente" || !usuario) && (
                              <button
                                onClick={() => abrirModalCarrinho(produto)}
                                disabled={esgotado(produto)}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                                  esgotado(produto)
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {usuario ? (esgotado(produto) ? "Indisponível" : "🛒 Comprar") : "🔒 Login"}
                              </button>
                            )}

                            {usuario?.tipo === "vendedor" && usuario?.nome === produto.vendedor?.nome && (
                              <>
                                <button
                                  onClick={(e) => excluirProduto(produto._id, e)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
                                >
                                  🗑️
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProdutoParaEditar(produto);
                                    setMostrarModalEditar(true);
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                                >
                                  ✏️
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Carrinho */}
      {modalAberto && produtoSelecionadoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 max-w-[90%] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <img src={produtoSelecionadoModal.imagem} alt="" className="w-16 h-16 object-cover rounded-lg" />
              <div>
                <h3 className="text-xl font-bold text-gray-800">{produtoSelecionadoModal.nome}</h3>
                <p className="text-green-700 font-bold">{formatarKz(produtoSelecionadoModal.preco)}</p>
              </div>
            </div>
            <p className="mb-2 text-gray-600">
              Disponível: {produtoSelecionadoModal.quantidade - (produtoSelecionadoModal.reservados || 0)} {produtoSelecionadoModal.unidade || "un"}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input
                type="number"
                min="1"
                max={produtoSelecionadoModal.quantidade - (produtoSelecionadoModal.reservados || 0)}
                value={quantidadeSelecionada}
                onChange={(e) => setQuantidadeSelecionada(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAdicionarCarrinho}
                className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {mostrarModalEditar && produtoParaEditar && (
        <ModalEditarProduto
          produto={produtoParaEditar}
          onClose={() => setMostrarModalEditar(false)}
          onAtualizar={async (produtoAtualizado) => {
            try {
              const token = localStorage.getItem("token");
              const res = await axios.put(
                `${API_URL}/produtos/${produtoAtualizado._id}`,
                produtoAtualizado,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const atualizadoDoServidor = res.data;
              setProdutos((prev) =>
                prev.map((p) => p._id === atualizadoDoServidor._id ? atualizadoDoServidor : p)
              );
              setProdutosFiltrados((prev) =>
                prev.map((p) => p._id === atualizadoDoServidor._id ? atualizadoDoServidor : p)
              );
              setMostrarModalEditar(false);
              alert("Produto atualizado com sucesso!");
            } catch (err) {
              console.error("Erro ao atualizar produto:", err);
              alert("Falha ao atualizar produto.");
            }
          }}
        />
      )}
    </div>
  );
}