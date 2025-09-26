import { useEffect, useState } from "react";
import ModalEditarProduto from "./ModalEditarProduto";
import MensagemMultilingue from "./MensagemMultilingue";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import axios from "axios";

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


  const fetchProdutos = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/produtos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dados = await res.json();
    setProdutos(dados);
  };

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
  setProdutoSelecionadoModal(produto);
  setQuantidadeSelecionada(1);
  setModalAberto(true);
};


const confirmarAdicionarCarrinho = async () => {
  if (!produtoSelecionadoModal) return;
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("https://mercadoyangue-i3in.onrender.com/api/carrinho/add", {
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
    adicionarNoCarrinho(dados.carrinho); // atualiza o estado do carrinho
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
      await axios.delete(`https://mercadoyangue-i3in.onrender.com/api/produtos/${id}`, {
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


  return (
    <div className="max-w-7xl mx-auto px-4 py-6 bg-gradient-to-b from-green-50 to-yellow-50">
      <div className="flex flex-col items-center mt-4 mb-4">
    <h1 className="text-4xl font-extrabold text-green-800 text-center">
    A Praça Digital do Campo à Cidade!
  </h1>
</div>

      <MensagemMultilingue />

      <div className="bg-[#5C4033] border border-yellow-500 shadow p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold text-yellow-400 mb-2 text-center">
          Filtros de Busca
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {["nome", "provincia", "municipio", "area"].map((campo) => (
            <input
              key={campo}
              type="text"
              name={campo}
              placeholder={campo[0].toUpperCase() + campo.slice(1)}
              value={filtros[campo] || ""}
              onChange={handleChange}
              className="bg-white text-black border border-gray-300 p-2 rounded"
            />
          ))}
        </div>
      </div>

      {vendedoresUnicos.length === 0 ? (
        <p className="text-center text-yellow-400">Nenhum produto encontrado.</p>
      ) : (
        vendedoresUnicos.map((vendedor) => {
          const produtosDoVendedor = produtosVisiveis.filter(
    (p) => (p.vendedor?.nome || "Desconhecido") === vendedor
  );

          return (
            <div key={vendedor} className="mb-10 border-b pb-6">
              <h3 className="text-xl font-bold text-green-800 mb-2">
                🧑🏿‍🌾{" "}
                {(produtosDoVendedor[0]?.vendedor?.genero === "feminino"
                  ? "Vendedora"
                  : "Vendedor") + ": "}{" "}
                {vendedor}
              </h3>

              <Carousel
                showThumbs={false}
                infiniteLoop
                autoPlay
                showStatus={false}
                showArrows
                className="rounded overflow-hidden shadow"
              >
                {produtosDoVendedor.map((produto) => (
                  <div
                    key={produto._id}
                    className="bg-white p-4 rounded shadow hover:shadow-md transition relative"
                  >
                    <button
                      onClick={() => toggleFavorito(produto._id)}
                      className="absolute top-2 right-2 text-xl"
                    >
                      {favoritos.includes(produto._id) ? "💚" : "🤍"}
                    </button>

                    <img
                      src={`https://mercadoyangue-i3in.onrender.com/uploads/${produto.imagem}`}
                      alt={produto.nome}
                      className="mx-auto h-48 object-contain cursor-pointer"
                      onClick={() => {
                        if (usuario) {
                          setProdutoSelecionado(produto);
                          setAbaAtiva && setAbaAtiva("detalhes");
                        } else {
                          alert("Por favor, inicie sessão para ver os detalhes.");
                        }
                      }}
                    />

                    <h4 className="text-lg font-semibold mt-2 text-center text-green-700">
                      {produto.nome}
                    </h4>

                    <p
                      className={`text-center font-bold text-lg ${
                        esgotado(produto)
                          ? "text-red-600"
                          : produto.quantidade < 3
                          ? "text-yellow-600"
                          : "text-green-700"
                      }`}
                    >
                      {esgotado(produto)
                        ? "Esgotado"
                        : formatarKz(produto.preco)}
                    </p>

                    <p className="text-center text-sm text-green-800">
  Disponível: {produto.quantidade - (produto.reservados || 0)} {produto.unidade || "un"}
</p>


                    <p className="text-center text-yellow-600 text-sm mt-1">
                      {renderEstrelas(produto.vendas || 0)}
                    </p>

                    {produto.quantidade < 3 && !esgotado(produto) && (
                      <p className="text-xs text-yellow-700 text-center">
                        ⚠️ Estoque quase a acabar!
                      </p>
                    )}

                    <p className="text-center text-sm text-green-800">
                      {produto.localizacaoDetalhada ||
                        `${produto.provincia} - ${produto.municipio}`}
                    </p>

                    <p className="text-xs text-center text-green-900 line-clamp-2 mt-1">
                      {produto.descricao}
                    </p>

                    <div className="flex justify-center mt-3 gap-2 flex-wrap">
{/* 🔹 Botões apenas para clientes */}
{usuario?.tipo === "cliente" && (
  <div className="flex gap-2">
    <button
      onClick={() => abrirModalCarrinho(produto)}
      disabled={esgotado(produto)}
      className={`px-3 py-1 text-sm rounded ${
        esgotado(produto)
          ? "bg-yellow-400 text-white"
          : "bg-green-700 text-white hover:bg-green-800"
      }`}
    >
      {esgotado(produto) ? "Indisponível" : "Adicionar ao carrinho"}
    </button>

        <button
  className="bg-amber-800 hover:bg-amber-900 text-white px-4 py-2 rounded-md shadow-md transition duration-200 font-semibold text-sm"
  onClick={() => {
    // Armazena o vendedor selecionado
    localStorage.setItem(
      "vendedorSelecionado",
      JSON.stringify({
        id: produto.vendedor?._id,
        nome: produto.vendedor?.nome,
      })
    );

    // Abre a aba do chat
    setAbaAtiva && setAbaAtiva("chat");
  }}
>
  💬 Conversar com o Vendedor
</button>

  </div>
)}


  {/* 🔹 Botões apenas para o próprio vendedor */}
  {usuario?.tipo === "vendedor" && usuario?.nome === produto.vendedor?.nome && (
    <>
      <button
        onClick={(e) => excluirProduto(produto._id, e)}
        className="px-8 py-1 bg-yellow-800 text-white rounded text-sm hover:bg-yellow-900"
      >
        Eliminar
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setProdutoParaEditar(produto);
          setMostrarModalEditar(true);
        }}
        className="px-8 py-1 bg-green-800 text-white rounded text-sm hover:bg-green-900"
      >
        Editar
      </button>
    </>
  )}
</div>
                  </div>
                ))}
              </Carousel>
            </div>
          );
        })
      )}



{modalAberto && produtoSelecionadoModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
      <h3 className="text-xl font-bold mb-4">{produtoSelecionadoModal.nome}</h3>
      <p className="mb-2">
        Disponível: {produtoSelecionadoModal.quantidade - (produtoSelecionadoModal.reservados || 0)} {produtoSelecionadoModal.unidade || "un"}
      </p>
      <input
        type="number"
        min="1"
        max={produtoSelecionadoModal.quantidade - (produtoSelecionadoModal.reservados || 0)}
        value={quantidadeSelecionada}
        onChange={(e) => setQuantidadeSelecionada(Number(e.target.value))}
        className="border p-2 w-full mb-4"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setModalAberto(false)}
          className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
        >
          Cancelar
        </button>
        <button
          onClick={confirmarAdicionarCarrinho}
          className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  </div>
)}

      {mostrarModalEditar && produtoParaEditar && (
  <ModalEditarProduto
    produto={produtoParaEditar}
    onClose={() => setMostrarModalEditar(false)}
    onAtualizar={async (produtoAtualizado) => {
      try {
        const token = localStorage.getItem("token");
        // Atualiza no backend
        const res = await axios.put(
          `https://mercadoyangue-i3in.onrender.com/api/produtos/${produtoAtualizado._id}`,
          produtoAtualizado,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const atualizadoDoServidor = res.data;

        // Atualiza estado local
        setProdutos((prev) =>
          prev.map((p) =>
            p._id === atualizadoDoServidor._id ? atualizadoDoServidor : p
          )
        );
        setProdutosFiltrados((prev) =>
          prev.map((p) =>
            p._id === atualizadoDoServidor._id ? atualizadoDoServidor : p
          )
        );

        setMostrarModalEditar(false);
        alert("Produto atualizado com sucesso!");
      } catch (err) {
        console.error("Erro ao atualizar produto:", err);
        alert("Falha ao atualizar produto. Ver console.");
      }
    }}
  />
)}
    </div>
  );
}
