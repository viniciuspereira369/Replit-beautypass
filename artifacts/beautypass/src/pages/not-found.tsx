import { Link } from 'wouter';
import { Compass } from 'lucide-react';
import { Empty } from '@/components/shell';

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-5 pt-10">
      <Empty icon={Compass} title="Página não encontrada" text="Este endereço não existe no passaporte. Volte para o início e continue explorando."
        action={<Link href="/" data-testid="link-notfound-home" className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white">Voltar ao início</Link>} />
    </div>
  );
}
