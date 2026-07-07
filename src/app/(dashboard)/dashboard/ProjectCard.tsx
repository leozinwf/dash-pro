"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { FolderGit, AlertCircle, Database, Link as LinkIcon, AlertTriangle, Edit, Trash2, Key, Lock, Eye, EyeOff, X, Info, ExternalLink, Server, Copy } from 'lucide-react'
import Link from 'next/link'

export default function ProjectCard({ projeto }: { projeto: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [showEnvModal, setShowEnvModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showVercelModal, setShowVercelModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editEnvType, setEditEnvType] = useState<'env' | 'local' | null>(null)
  const [tempEnvContent, setTempEnvContent] = useState('')

  async function handleDelete() {
    setIsDeleting(true)
    await supabase.from('projetos').delete().eq('id', projeto.id)
    setShowModal(false)
    router.refresh()
  }

  const handleCopyEnv = (text: string) => { navigator.clipboard.writeText(text); alert('Copiado!'); }

  const handleSaveEnv = async (type: 'env' | 'local') => {
    const field = type === 'env' ? 'env_file' : 'env_local_file'
    await supabase.from('projetos').update({ [field]: tempEnvContent }).eq('id', projeto.id)
    setEditEnvType(null)
    router.refresh()
  }

  const handleDeleteEnv = async (type: 'env' | 'local') => {
    if (!confirm('Certeza que deseja excluir este arquivo?')) return;
    const field = type === 'env' ? 'env_file' : 'env_local_file'
    await supabase.from('projetos').update({ [field]: null }).eq('id', projeto.id)
    router.refresh()
  }

  const hasEnv = projeto.env_file || projeto.env_local_file;

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full hover:shadow-md transition">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900">{projeto.nome}</h3>
          <div className="flex gap-1.5">
            <button onClick={() => setShowDetailsModal(true)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md" title="Detalhes Completos"><Info size={16} /></button>
            <Link href={`/projetos/${projeto.id}/editar`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit size={16} /></Link>
            <button onClick={() => setShowModal(true)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
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
                  <span className={projeto.github.open_issues_count > 0 ? 'text-orange-600 font-medium' : ''}>🐛 {projeto.github.open_issues_count} Issues</span>
                </div>
              ) : <span className="text-sm text-gray-400">Repositório não encontrado</span>}
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
                    {projeto.supabaseInfo.status.includes('ACTIVE') && (
                      <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-medium text-green-700">Online</span>
                      </span>
                    )}

                    {projeto.supabaseInfo.status === 'PAUSED' && (
                      <span className="flex items-center gap-1.5 text-red-600">
                        <AlertCircle size={14} />
                        Pausado
                      </span>
                    )}

                    {projeto.supabaseInfo.status === 'Unhealthy' && (
                      <span className="flex items-center gap-1.5 text-yellow-600">
                        <AlertTriangle size={14} />
                        Instável
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Ref não configurada</span>
              )}
            </div>
          </div>

          {/* Botões de Acesso Rápido */}
          <div className="pt-2 flex flex-wrap gap-2">
            {projeto.github_repo && <a href={`https://github.com/${projeto.github_repo}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-900 text-white rounded text-xs font-medium hover:bg-gray-800"><FolderGit size={12} /> GitHub</a>}
            {projeto.supabase_id && <a href={`https://supabase.com/dashboard/project/${projeto.supabase_id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100"><Database size={12} /> Supabase</a>}
            {projeto.projeto_url && <a href={projeto.projeto_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"><ExternalLink size={12} /> Acessar App</a>}
            {projeto.vercelDeployments && projeto.vercelDeployments.length > 0 && <button onClick={() => setShowVercelModal(true)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"><Server size={12} /> Deploys</button>}
            {hasEnv && <button onClick={() => setShowEnvModal(true)} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"><Eye size={12} /> Ver .env</button>}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes Completos */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold flex items-center gap-2"><Info className="text-blue-600" /> Detalhes do Projeto</h3><button onClick={() => setShowDetailsModal(false)}><X size={24} className="text-gray-400" /></button></div>
            <div className="space-y-4">
              <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Nome</p><p className="bg-gray-50 p-2 rounded-lg border">{projeto.nome}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Conta Supabase</p><p className="bg-gray-50 p-2 text-sm rounded-lg border">{projeto.supabase_account || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Supabase Ref</p><p className="bg-gray-50 p-2 text-sm rounded-lg border">{projeto.supabase_id || 'N/A'}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Vercel ID</p><p className="bg-gray-50 p-2 text-sm rounded-lg border">{projeto.vercel_id || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">GitHub Repo</p><p className="bg-gray-50 p-2 text-sm rounded-lg border break-all">{projeto.github_repo || 'N/A'}</p></div>
              </div>
              {projeto.database_password && (
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Senha do Banco</p>
                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                    <Lock size={16} className="text-gray-400" /><input type={showPassword ? "text" : "password"} value={projeto.database_password} readOnly className="bg-transparent flex-1 text-sm outline-none" /><button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
              )}
              {projeto.observacoes && <div><p className="text-xs text-gray-500 font-semibold uppercase mb-1">Observações</p><p className="bg-yellow-50/50 p-3 text-sm rounded-lg border whitespace-pre-wrap">{projeto.observacoes}</p></div>}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Deploys da Vercel */}
      {showVercelModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold flex items-center gap-2"><Server className="text-black" /> Histórico Vercel</h3><button onClick={() => setShowVercelModal(false)}><X size={24} className="text-gray-400" /></button></div>
            <div className="space-y-3 overflow-y-auto pr-2">
              {projeto.vercelDeployments?.map((dep: any) => (
                <a key={dep.uid} href={`https://${dep.url}`} target="_blank" rel="noreferrer" className="block border p-4 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-sm text-gray-900">{dep.meta?.githubCommitMessage || 'Deploy manual ou via CLI'}</p>
                    {dep.state === 'READY' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">READY</span>}
                    {dep.state === 'ERROR' && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">ERROR</span>}
                    {dep.state === 'BUILDING' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold">BUILDING</span>}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2">Há {Math.round((Date.now() - dep.created) / 60000)} minutos <span className="text-gray-300">•</span> {dep.meta?.githubCommitRef || 'main'}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"><div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><Trash2 className="h-6 w-6 text-red-600" /></div><h3 className="text-lg font-bold text-center mb-2">Excluir projeto?</h3><div className="flex gap-3 mt-6"><button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button><button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{isDeleting ? 'Excluindo...' : 'Excluir'}</button></div></div>
        </div>
      )}

      {/* Modal de Visualização das Chaves .env */}
      {showEnvModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold flex items-center gap-2"><Key className="text-blue-600" /> Chaves de Ambiente</h3><button onClick={() => setShowEnvModal(false)}><X size={24} className="text-gray-400" /></button></div>
            <div className="overflow-y-auto flex-1 space-y-6 pr-2">

              {projeto.env_file && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                    <h4 className="font-bold text-gray-700 text-sm">.env</h4>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopyEnv(projeto.env_file)} className="text-xs flex items-center gap-1 text-gray-600 hover:text-black"><Copy size={14} /> Copiar</button>
                      <button onClick={() => { setEditEnvType('env'); setTempEnvContent(projeto.env_file) }} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"><Edit size={14} /> Editar</button>
                      <button onClick={() => handleDeleteEnv('env')} className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800"><Trash2 size={14} /> Excluir</button>
                    </div>
                  </div>
                  {editEnvType === 'env' ? (
                    <div className="p-4 bg-gray-50"><textarea value={tempEnvContent} onChange={(e) => setTempEnvContent(e.target.value)} rows={10} className="w-full text-sm font-mono p-2 border rounded outline-none" /><div className="flex justify-end gap-2 mt-2"><button onClick={() => setEditEnvType(null)} className="px-3 py-1 border rounded text-sm bg-white">Cancelar</button><button onClick={() => handleSaveEnv('env')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Salvar Alterações</button></div></div>
                  ) : <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto whitespace-pre-wrap font-mono">{projeto.env_file}</pre>}
                </div>
              )}

              {projeto.env_local_file && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex justify-between items-center border-b border-gray-200">
                    <h4 className="font-bold text-gray-700 text-sm">.env.local</h4>
                    <div className="flex gap-2">
                      <button onClick={() => handleCopyEnv(projeto.env_local_file)} className="text-xs flex items-center gap-1 text-gray-600 hover:text-black"><Copy size={14} /> Copiar</button>
                      <button onClick={() => { setEditEnvType('local'); setTempEnvContent(projeto.env_local_file) }} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800"><Edit size={14} /> Editar</button>
                      <button onClick={() => handleDeleteEnv('local')} className="text-xs flex items-center gap-1 text-red-600 hover:text-red-800"><Trash2 size={14} /> Excluir</button>
                    </div>
                  </div>
                  {editEnvType === 'local' ? (
                    <div className="p-4 bg-gray-50"><textarea value={tempEnvContent} onChange={(e) => setTempEnvContent(e.target.value)} rows={10} className="w-full text-sm font-mono p-2 border rounded outline-none" /><div className="flex justify-end gap-2 mt-2"><button onClick={() => setEditEnvType(null)} className="px-3 py-1 border rounded text-sm bg-white">Cancelar</button><button onClick={() => handleSaveEnv('local')} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Salvar Alterações</button></div></div>
                  ) : <pre className="bg-gray-900 text-gray-100 p-4 text-sm overflow-x-auto whitespace-pre-wrap font-mono">{projeto.env_local_file}</pre>}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  )
}