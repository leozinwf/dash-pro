// src/app/(dashboard)/projetos/novo/page.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Save, FolderGit, Link as LinkIcon, Database, FileText, AlignLeft, Lock } from 'lucide-react'
import Link from 'next/link'

export default function NovoProjetoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nome, setNome] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [projetoUrl, setProjetoUrl] = useState('')
  const [supabaseId, setSupabaseId] = useState('')
  const [databasePassword, setDatabasePassword] = useState('') // <- NOVO CAMPO
  const [observacoes, setObservacoes] = useState('')
  const [envFile, setEnvFile] = useState('')
  const [envLocalFile, setEnvLocalFile] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEnvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => setEnvFile(event.target?.result as string)
      reader.readAsText(file)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) throw new Error("Sessão não encontrada.")

      // Limpa a URL do GitHub caso o usuário cole o link completo
      const cleanGithubRepo = githubRepo
        .replace('https://github.com/', '')
        .replace('.git', '')
        .trim()

      const { error: insertError } = await supabase
        .from('projetos')
        .insert({
          nome,
          github_repo: cleanGithubRepo,
          projeto_url: projetoUrl,
          supabase_id: supabaseId,
          database_password: databasePassword,
          env_file: envFile,
          env_local_file: envLocalFile,
          observacoes,
          user_id: session.user.id 
        })

      if (insertError) throw insertError

      router.push('/dashboard')
      router.refresh()

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o projeto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Cadastrar Novo Projeto</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Projeto <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Meu SaaS incrível" className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FolderGit size={16} /> Repositório GitHub
                </label>
                <input type="text" value={githubRepo} onChange={(e) => setGithubRepo(e.target.value)} placeholder="leozinwf/projeto" className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <LinkIcon size={16} /> URL do Projeto
                </label>
                <input type="url" value={projetoUrl} onChange={(e) => setProjetoUrl(e.target.value)} placeholder="https://meu-projeto.com" className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Database size={16} /> Supabase Project Ref
                </label>
                <input type="text" value={supabaseId} onChange={(e) => setSupabaseId(e.target.value)} placeholder="abcdefghijklmnopqrst" className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Lock size={16} /> Senha do Banco (DB Password)
                </label>
                <input type="password" value={databasePassword} onChange={(e) => setDatabasePassword(e.target.value)} placeholder="Sua senha do banco..." className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FileText size={16} /> Arquivo .env
                </label>
                <input type="file" accept=".env,text/plain" onChange={(e) => {
                  const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = (ev) => setEnvFile(ev.target?.result as string); r.readAsText(file); }
                }} className="w-full px-4 py-1.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none transition file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700" />
                {envFile && <p className="mt-1 text-xs text-green-600 font-medium">Arquivo carregado.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <FileText size={16} /> Arquivo .env.local
                </label>
                <input type="file" accept=".local,.env,text/plain" onChange={(e) => {
                  const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = (ev) => setEnvLocalFile(ev.target?.result as string); r.readAsText(file); }
                }} className="w-full px-4 py-1.5 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none transition file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700" />
                {envLocalFile && <p className="mt-1 text-xs text-green-600 font-medium">Arquivo local carregado.</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <AlignLeft size={16} /> Observações
              </label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Anotações sobre infra, lembretes de código..." className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"></textarea>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <Link href="/dashboard" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition">Cancelar</Link>
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50">
                {loading ? 'Salvando...' : <><Save size={20} /> Salvar</>}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}