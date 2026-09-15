import type { Metadata } from 'next';
import Link from 'next/link';
import '../legal.css';

export const metadata: Metadata = {
  title: 'Política de Privacidade — SigeDaily',
  description: 'Como o SigeDaily trata os dados dos usuários e dos relatórios.',
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link className="legal-brand" href="/">
          SigeDaily
        </Link>

        <article className="legal-card">
          <p className="legal-kicker">Transparência e segurança</p>
          <h1>Política de Privacidade</h1>
          <p className="legal-updated">
            Última atualização: 15 de setembro de 2026
          </p>

          <p>
            O SigeDaily é uma ferramenta de uso profissional para registrar e
            compartilhar resumos de implantações. Esta política explica quais
            dados são tratados e com qual finalidade.
          </p>

          <h2>Dados tratados</h2>
          <ul>
            <li>
              Dados básicos da Conta do Google, como nome e endereço de e-mail,
              usados para autenticação e identificação de quem criou o
              relatório.
            </li>
            <li>
              Conteúdo informado nos dailys, incluindo cliente, cidade, estado,
              plano, datas, funcionários, cargos, observações e gravações de
              áudio.
            </li>
            <li>
              Informações técnicas estritamente necessárias para segurança e
              funcionamento da sessão.
            </li>
          </ul>

          <h2>Como os dados são usados</h2>
          <p>
            Os dados são utilizados para autorizar contas corporativas, criar,
            armazenar, consultar, editar e compartilhar relatórios, além de
            registrar sua autoria. As informações recebidas do Google não são
            vendidas, usadas para publicidade ou compartilhadas para finalidades
            alheias ao SigeDaily.
          </p>

          <h2>Armazenamento e compartilhamento</h2>
          <p>
            Relatórios e áudios são processados na infraestrutura da Cloudflare.
            O acesso à área de gestão, aos relatórios e aos áudios exige uma
            conta corporativa autorizada. Receber um link não dispensa o login,
            e o compartilhamento pelo WhatsApp só ocorre quando iniciado pelo
            próprio usuário.
          </p>

          <h2>Histórico de utilização</h2>
          <p>
            Registramos o e-mail autenticado, a data e hora, o acesso ao sistema
            e a abertura, criação ou alteração de relatórios, com a
            identificação do relatório. Esses registros servem ao acompanhamento
            interno de uso e são consultáveis exclusivamente pelo administrador
            Caio. Uma abertura não comprova a leitura do conteúdo. O histórico
            não coleta IP ou localização e não recupera atividades anteriores à
            sua implantação.
          </p>

          <h2>Retenção, segurança e seus direitos</h2>
          <p>
            Os dados permanecem armazenados enquanto forem necessários ao
            histórico de implantações ou até serem removidos por usuário
            autorizado. Adotamos sessão assinada, conexão segura e validação de
            domínio corporativo. Para solicitar acesso, correção ou exclusão de
            dados, entre em contato pelo e-mail{' '}
            <a href="mailto:caio@sistemasbr.net">caio@sistemasbr.net</a>.
          </p>

          <h2>Alterações nesta política</h2>
          <p>
            Esta política poderá ser atualizada para refletir mudanças no
            SigeDaily. A data da versão vigente será sempre indicada nesta
            página.
          </p>

          <Link className="legal-back" href="/">
            Voltar ao SigeDaily
          </Link>
        </article>
      </div>
    </main>
  );
}
