import type { Metadata } from 'next';
import Link from 'next/link';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Termos de Uso — SigeDaily',
  description: 'Condições de uso do SigeDaily.',
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-brand" href="/">
          SigeDaily
        </Link>

        <article className="legal-card">
          <p className="legal-kicker">Uso responsável</p>
          <h1>Termos de Uso</h1>
          <p className="legal-updated">
            Última atualização: 2 de setembro de 2026
          </p>

          <p>
            Ao acessar o SigeDaily, você concorda com estes termos. O sistema
            foi criado para registrar e compartilhar informações profissionais
            sobre implantações e atendimento interno.
          </p>

          <h2>Acesso autorizado</h2>
          <p>
            O acesso à criação e à consulta de dailys é reservado às contas
            Google dos domínios corporativos autorizados. A conta é pessoal, e
            cada usuário é responsável pelas ações realizadas durante sua
            sessão.
          </p>

          <h2>Uso adequado</h2>
          <p>
            O usuário deve registrar apenas informações relacionadas ao trabalho
            e que esteja autorizado a tratar. Não é permitido tentar contornar
            controles de acesso, prejudicar o funcionamento do serviço ou
            publicar conteúdo ilícito.
          </p>

          <h2>Relatórios, áudios e links</h2>
          <p>
            Antes de salvar ou compartilhar, o usuário deve conferir os dados
            inseridos e possuir autorização para gravar as pessoas envolvidas.
            Links de relatórios devem ser enviados somente aos destinatários
            adequados, pois quem tiver acesso ao link poderá visualizar seu
            conteúdo.
          </p>

          <h2>Disponibilidade e alterações</h2>
          <p>
            O SigeDaily poderá receber melhorias, manutenções e ajustes de
            segurança. Embora sejam adotadas medidas para manter o serviço
            disponível e íntegro, interrupções temporárias podem ocorrer.
          </p>

          <h2>Contato</h2>
          <p>
            Dúvidas sobre estes termos podem ser enviadas para{' '}
            <a href="mailto:caio@sistemasbr.net">caio@sistemasbr.net</a>.
          </p>

          <Link className="legal-back" href="/">
            Voltar ao SigeDaily
          </Link>
        </article>
      </div>
    </main>
  );
}
