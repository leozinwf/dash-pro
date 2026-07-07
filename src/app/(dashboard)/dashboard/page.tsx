import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Plus, FolderGit, Server, Database, Star } from 'lucide-react'
import ProjectCard from './ProjectCard'
import LogoutButton from './LogoutButton'

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

async function getSupabaseMetrics(ref: string | null, anonKey: string | null) {
  if (!ref || !anonKey) return null;
  try {
    const res = await fetch(`https://${ref}.supabase.co/rest/v1/rpc/get_db_metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` },
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json(); 
  } catch { return null; }
}

async function getVercelDeployments(projectId: string | null) {
  if (!projectId || !process.env.VERCEL_API_TOKEN) return null;
  try {
    const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5`, {
      headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
      next: { revalidate: 30 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.deployments || [];
  } catch { return null; }
}

async function getUserGithubRepos() {
  if (!process.env.GITHUB_API_TOKEN) return [];
  try {
    const res = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=100`, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}`, 'User-Agent': 'DashPro-App' },
      next: { revalidate: 60 }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

function extractAnonKey(env1: string | null, env2: string | null) {
  const combined = `${env1 || ''}\n${env2 || ''}`;
  const match = combined.match(/(?:ANON_KEY|PUBLISHABLE_KEY)=["']?([^"'\n\r]+)/i);
  return match ? match[1].trim() : null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const [{ data: projetos }, githubRepos] = await Promise.all([
    supabase.from('projetos').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
    getUserGithubRepos()
  ]);

  const projetosComDados = await Promise.all(
    (projetos || []).map(async (projeto) => {
      const extractedKey = extractAnonKey(projeto.env_file, projeto.env_local_file);
      const [github, supabaseInfo, dbMetrics, vercelDeployments] = await Promise.all([
        getGithubStatus(projeto.github_repo),
        getSupabaseStatus(projeto.supabase_id),
        getSupabaseMetrics(projeto.supabase_id, extractedKey),
        getVercelDeployments(projeto.vercel_id)
      ]);
      return { ...projeto, github, supabaseInfo, dbMetrics, vercelDeployments };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="text-blue-600" />
              <span className="font-bold text-xl">DashPro</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-500 border-r border-gray-200 pr-6">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-gray-900 transition"><FolderGit size={16}/> GitHub</a>
                <a href="https://vercel.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-gray-900 transition"><Server size={16}/> Vercel</a>
                <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-gray-900 transition"><Database size={16}/> Supabase</a>
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projetos Monitorados</h1>
          <Link href="/projetos/novo" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">
            <Plus size={20} /> Novo Projeto
          </Link>
        </div>

        {projetosComDados && projetosComDados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {projetosComDados.map((projeto) => (
              <ProjectCard key={projeto.id} projeto={projeto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 mb-12">
            <LayoutDashboard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum projeto encontrado</h3>
          </div>
        )}

        {/* Visão Geral do GitHub (Agora mostra TODOS) */}
        <div className="mb-6 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <FolderGit className="text-gray-700" /> Meus Repositórios (GitHub)
          </h2>
          
          {githubRepos && githubRepos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {githubRepos.map((repo: any) => (
                <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 hover:shadow-md transition block">
                  <h3 className="font-bold text-gray-900 truncate" title={repo.name}>{repo.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 h-10 overflow-hidden line-clamp-2">{repo.description || "Sem descrição."}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-gray-600">
                    {repo.language && (<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> {repo.language}</span>)}
                    <span className="flex items-center gap-1"><Star size={14} className="text-gray-400" /> {repo.stargazers_count}</span>
                    <span className="text-gray-400 ml-auto">Atualizado em {new Date(repo.updated_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500">Nenhum repositório encontrado ou Token não configurado.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}