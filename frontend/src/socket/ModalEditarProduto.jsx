import { useState } from "react";

export default function ModalEditarProduto({ produto, onClose, onAtualizar }) {
  const [quantidade, setQuantidade] = useState(produto.quantidade);

  const atualizar = () => {
    const produtoAtualizado = { ...produto, quantidade };
    onAtualizar(produtoAtualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">Repor Stock</h2>
        <label className="block mb-2">
          Nova quantidade:
          <input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(parseInt(e.target.value))}
            className="border p-2 rounded w-full"
          />
        </label>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
          <button onClick={atualizar} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Guardar</button>
        </div>
      </div>
    </div>
  );
}