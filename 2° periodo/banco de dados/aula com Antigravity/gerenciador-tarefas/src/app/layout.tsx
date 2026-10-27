import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gerenciador de Tarefas | Next.js, MongoDB e Docker',
  description:
    'Sistema acadêmico de gerenciamento de tarefas CRUD com Next.js App Router, MongoDB e Docker Compose.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
