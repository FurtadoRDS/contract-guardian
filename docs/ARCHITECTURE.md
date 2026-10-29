# Arquitetura do frontend

O Contract Guardian é uma aplicação React com componentes TSX, TypeScript estrito, Tailwind CSS e build pelo Vite. O objetivo desta organização é manter uma única implementação para cada regra, reutilizar elementos visuais e preservar os fluxos e o desenho existentes.

## Camadas e responsabilidades

| Camada | Arquivos ou diretórios | Responsabilidade |
| --- | --- | --- |
| Entrada e composição | `src/main.tsx`, `src/App.tsx` | Montar o React, compor as páginas, rotas e ações do workspace. |
| Páginas | `src/pages/` | Compor as telas de autenticação, dashboard, contratos, calendário, relatórios, configurações e acessos. |
| Componentes | `src/components/` | Apresentar elementos reutilizáveis e comportamentos locais da interface. |
| Modelos | `src/types.ts` | Definir contratos, sessões, perfis, solicitações, usuários e eventos de auditoria. |
| Domínio | `src/domain/contracts.ts` | Calcular status, datas, valores mensais e variações sem depender da apresentação. |
| Serviços | `src/services/` | Concentrar transições de acesso, integração futura de documentos e exportação de contratos. |
| Hooks | `src/hooks/` | Conectar estado compartilhado e preferências aos componentes React. |
| Utilitários | `src/lib/` | Compartilhar mecanismos como a geração de CSV. |
| Estilos | `src/styles/` | Compor Tailwind, tokens visuais, estados, efeitos e responsividade. |

As telas usam JSX, propriedades tipadas, eventos React e estado declarativo. Referências a elementos nativos são usadas para necessidades como validação, foco, medição ou abertura de diálogos; não existe um renderer de HTML legado embutido no React.

## Rotas e sessão

`useHashRoute` acompanha o fragmento da URL e expõe a navegação. Isso permite servir o build estático sem exigir uma configuração de rotas no backend da hospedagem.

As rotas públicas incluem o login e a solicitação de acesso. Sem sessão de prévia, o workspace retorna ao login. O perfil reader fica restrito a consulta e exportação; telas e ações de escrita e administração exigem master na interface e nos mutators locais.

`src/services/access-service.ts` continua sendo um adaptador de prévia. Ele fornece a sessão e as cópias dos registros, valida transições e publica alterações. `useAccess` assina essas mudanças e atualiza o estado React; os componentes não mantêm uma segunda cópia independente das regras de acesso.

O adaptador não autentica pessoas. `signIn` retorna `BACKEND_NOT_CONFIGURED`, e `startPreview` escolhe uma persona visual explícita. O backend deverá substituir essa origem de sessão e validar todas as operações no servidor.

## Contratos e armazenamento

`useContracts` observa uma store compartilhada com `useSyncExternalStore`. Os componentes usam os mutators da store para salvar ou limpar contratos; as atualizações são imutáveis e a validação do perfil ocorre dentro do mutator.

| Chave | Uso |
| --- | --- |
| `guardian-contracts-v2` | Carteira local de contratos, inicialmente vazia. |
| `guardian-access-preview-v1` | Sessão, solicitações, usuários e auditoria da prévia. |
| `guardian-preferences-v1` | Tema, ativação de avisos e antecedência dos vencimentos. |

A migração mantém essas chaves para preservar os dados existentes no mesmo navegador e origem. A chave antiga `guardian-contracts-v1` permanece ignorada sem ser removida. Armazenamento local não substitui uma API corporativa nem sincroniza dados entre dispositivos.

`src/domain/contracts.ts` é a fonte única para status e cálculos financeiros. As páginas, gráficos e tabelas consomem os mesmos helpers. Contratos assinados entram no compromisso mensal quando sua vigência se sobrepõe ao mês, sem rateio diário; meses futuros são projeções e uma base anterior zero não gera uma porcentagem artificial.

## Formulário e documentos

A página do contrato é composta por campos empresariais, dados do contrato, upload e resumo. O modelo do formulário preserva a distinção entre valores digitados e o registro normalizado que será salvo.

`analyzeContractDocument`, em `src/services/document-service.ts`, é o ponto de substituição pela API de análise. O contrato de retorno tipado usa `DocumentAnalysisResult.fields` e exclui o status da assinatura. Atualmente o adaptador informa a integração pendente, sem ler ou enviar conteúdo de arquivos. A interface conserva a seleção, validação e revisão manual e cancela uma análise pendente ao sair.

O status da assinatura deve permanecer uma decisão humana, mesmo quando a extração real for conectada. Não derive esse campo automaticamente do documento.

## Componentes e estilos compartilhados

- `components/ui/` concentra ícones, modal, mensagens, ajuda e cabeçalhos.
- `components/layout/` contém sidebar, estrutura do workspace, avisos e rodapé.
- `components/dashboard/` separa indicadores, saúde dos contratos e gráfico financeiro.
- `components/contracts/` reúne identidade, tabela, detalhes e componentes do formulário.
- `components/auth/` separa apresentação, login, solicitação e opções de prévia.
- `components/users/` separa tabelas, resumo e diálogos de revisão ou alteração de perfil.

`src/styles/index.css` importa Tailwind e os estilos de componentes. Classes utilitárias são usadas no TSX; `@layer components` e `@apply` compõem estilos reutilizáveis. CSS específico mantém os efeitos de aurora, estados visuais e detalhes responsivos necessários à continuidade do design. Tokens como cores, tipografia e superfícies continuam compartilhados entre as telas.

A exportação usa o utilitário comum de CSV, mantendo separador por ponto e vírgula, UTF-8 e escape das células. Regras de negócio e formatação não devem ser copiadas para cada tabela ou página.

## Testes e build

`npm run check` aplica as opções estritas do TypeScript. `npm test` executa Vitest com os testes de domínio, serviços, armazenamento e hooks configurados no projeto. Os registros usados nas verificações são fixtures de teste e não alimentam a aplicação.

`npm run build` verifica os tipos e compila o produto para `dist/`. Esse diretório é gerado, ignorado pelo Git e deve ser reconstruído a partir do código e do `package-lock.json`. Não mantenha uma segunda aplicação manual nele.

Para entregar ou versionar o fonte, inclua `src/`, `public/`, `tests/`, `docs/`, `index.html`, configurações, `package.json` e `package-lock.json`. Exclua `node_modules/`, `.git/`, arquivos locais de execução e segredos. A configuração `.openai/` é específica da hospedagem Sites e não é necessária para construir o projeto em outra hospedagem.

## Próxima integração

Os tipos e adaptadores dão pontos claros para conectar sessão, contratos, solicitações, usuários, auditoria e documentos. A API deverá ser a fonte de verdade e obter a identidade e a organização a partir da sessão validada no servidor. A primeira conta master precisa de provisionamento confiável no backend, sem autorregistro administrativo pela interface pública.

Consulte [BACKEND.md](BACKEND.md) para os endpoints propostos e as regras que continuam pendentes. A migração do framework não acrescenta autenticação real, envio de e-mails, sincronização por servidor ou análise automática de documentos.
