// src/app/(dashboard)/dashboard/ProjectCard.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FolderGit, AlertCircle, Clock, Database, Link as LinkIcon, Edit, Trash2, Key, Lock, Eye, X } from 'lucide-react'
import Link from 'next/link'

export default function ProjectCard({ projeto }: { projeto: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [showEnvModal, setShowEnvModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    const { error } = await supabase.from('projetos').delete().eq('id', projeto.id)
    if (!error) {
      setShowModal(false)
      router.refresh()
    }
    setIsDeleting(false)
  }

  const hasEnv = projeto.env_file || projeto.env_local_file;

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full hover:shadow-md transition">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">{projeto.nome}</h3>
          <div className="flex gap-2">
            <Link href={`/projetos/${projeto.id}/editar`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">
              <Edit size={16} />
            </Link>
            <button onClick={() => setShowModal(true)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="space-y-5 flex-1">
          {/* Status GitHub */}
          <div className="flex items-start gap-3">
            <FolderGit size={18} className="text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Código (GitHub)</p>
              {projeto.github ? (
                <div className="mt-1 text-sm text-gray-600">
                  <span className="mr-3">⭐ {projeto.github.stargazers_count} Stars</span>
                  <span className={projeto.github.open_issues_count > 0 ? 'text-orange-600 font-medium' : ''}>
                    🐛 {projeto.github.open_issues_count} Issues
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Repositório não encontrado</span>
              )}
            </div>
          </div>

          {/* Status Supabase */}
          <div className="flex items-start gap-3">
            <Database size={18} className="text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Banco (Supabase)</p>
              {projeto.supabaseInfo ? (
                <div className="mt-1.5">
                  <div className="flex items-center gap-2">
                    {/* Status Bolinha Piscando */}
                    {projeto.supabaseInfo.status.includes('ACTIVE') && (
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-green-700">Online</span>
                      </span>
                    )}
                    
                    {projeto.supabaseInfo.status === 'PAUSED' && <span className="flex items-center gap-1.5 text-red-600"><AlertCircle size={14}/> Pausado</span>}
                    {projeto.supabaseInfo.status === 'RESTORING' && <span className="flex items-center gap-1.5 text-yellow-600"><Clock size={14}/> Restaurando</span>}
                  </div>

                  {/* NOVAS MÉTRICAS DE REQUESTS */}
                  {projeto.dbMetrics && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Requests</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('pt-BR').format(projeto.dbMetrics.total_requests)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Success Rate</p>
                        <p className={`text-sm font-medium ${projeto.dbMetrics.success_rate >= 99 ? 'text-green-600' : 'text-orange-600'}`}>
                          {projeto.dbMetrics.success_rate}%
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <span className="text-sm text-gray-400">Ref não configurada</span>
              )}
            </div>
          </div>

          {/* Informações Extras */}
          <div className="pt-2 flex flex-wrap gap-2">
            {projeto.projeto_url && (
              <a href={projeto.projeto_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition">
                <LinkIcon size={12} /> Acessar App
              </a>
            )}
            {hasEnv && (
              <button onClick={() => setShowEnvModal(true)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition cursor-pointer">
                <Eye size={12} /> Ver .env
              </button>
            )}
            {projeto.database_password && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                <Lock size={12} /> Senha Salva
              </span>
            )}
          </div>

          {projeto.observacoes && (
            <div className="mt-2 p-3 bg-yellow-50/50 border border-yellow-100 rounded-lg text-sm text-gray-700">
              <p className="font-semibold text-xs text-yellow-800 mb-1">Anotações:</p>
              <p className="whitespace-pre-wrap">{projeto.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Exclusão (Mantido igual) */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl transform transition-all">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><Trash2 className="h-6 w-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Excluir projeto?</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">{isDeleting ? 'Excluindo...' : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização das Chaves .env */}
      {showEnvModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Key className="text-blue-600" /> Chaves de Ambiente</h3>
              <button onClick={() => setShowEnvModal(false)} className="text-gray-400 hover:text-gray-700 p-1"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-6 pr-2">
              {projeto.env_file && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">📄 .env</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">{projeto.env_file}</pre>
                </div>
              )}
              {projeto.env_local_file && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2 text-sm">📄 .env.local</h4>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">{projeto.env_local_file}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}