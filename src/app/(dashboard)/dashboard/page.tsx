// src/app/(dashboard)/dashboard/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Plus, FolderGit, Server, Database } from 'lucide-react'
import ProjectCard from './ProjectCard'
import LogoutButton from './LogoutButton'

// --- Funções Auxiliares de API ---
async function getGithubStatus(repo: string | null) {
  if (!repo || !process.env.GITHUB_API_TOKEN) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}`, 'User-Agent': 'DashPro-App' },
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function getSupabaseStatus(ref: string | null) {
  if (!ref || !process.env.SUPABASE_MANAGEMENT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_MANAGEMENT_TOKEN}` },
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// NOVA FUNÇÃO: Busca as métricas usando a chave extraída
async function getSupabaseMetrics(ref: string | null, anonKey: string | null) {
  if (!ref || !anonKey) return null;
  try {
    const res = await fetch(`https://${ref}.supabase.co/rest/v1/rpc/get_db_metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json(); // Retorna { total_requests, success_rate }
  } catch { return null; }
}

// Função inteligente que caça a Anon Key dentro do texto dos arquivos .env
function extractAnonKey(env1: string | null, env2: string | null) {
  const combined = `${env1 || ''}\n${env2 || ''}`;
  // Procura por variáveis que contenham ANON_KEY ou PUBLISHABLE_KEY
  const match = combined.match(/(?:ANON_KEY|PUBLISHABLE_KEY)=["']?([^"'\n\r]+)/i);
  return match ? match[1].trim() : null;
}

// --- Componente Principal ---
export default async function DashboardPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const projetosComDados = await Promise.all(
    (projetos || []).map(async (projeto) => {
      const extractedKey = extractAnonKey(projeto.env_file, projeto.env_local_file);
      
      const [github, supabaseInfo, dbMetrics] = await Promise.all([
        getGithubStatus(projeto.github_repo),
        getSupabaseStatus(projeto.supabase_id),
        getSupabaseMetrics(projeto.supabase_id, extractedKey)
      ]);
      return { ...projeto, github, supabaseInfo, dbMetrics };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-2">
              <LayoutDashboard className="text-blue-600" />
              <span className="font-bold text-xl">DashPro</span>
            </div>

            {/* Menu de Atalhos e Logout */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-500 border-r border-gray-200 pr-6">
                <a href="https://github.com" target="_blank" className="flex items-center gap-1.5 hover:text-gray-900 transition"><FolderGit size={16}/> GitHub</a>
                <a href="https://vercel.com" target="_blank" className="flex items-center gap-1.5 hover:text-gray-900 transition"><Server size={16}/> Vercel</a>
                <a href="https://supabase.com/dashboard" target="_blank" className="flex items-center gap-1.5 hover:text-gray-900 transition"><Database size={16}/> Supabase</a>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 hidden lg:inline">{session.user.email}</span>
                <LogoutButton />
              </div>
            </div>

          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meus Projetos</h1>
          <Link href="/projetos/novo" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            <Plus size={20} /> Novo Projeto
          </Link>
        </div>

        {projetosComDados && projetosComDados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projetosComDados.map((projeto) => (
              <ProjectCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
          </div>
        )}
      </main>
    </div>
  )
}