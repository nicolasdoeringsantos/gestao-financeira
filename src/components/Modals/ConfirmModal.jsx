import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-500 shadow-lg shadow-rose-950/40"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
};
