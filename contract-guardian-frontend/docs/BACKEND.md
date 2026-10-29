# Integração futura do backend

Este documento descreve uma proposta de integração. Os endpoints e controles abaixo **não estão implementados** neste frontend React. O Vite serve e compila a interface; ele não implementa a API do produto.

A migração para React, TypeScript e Tailwind preserva as regras e os dados locais da versão anterior. O frontend inicia vazio quando não existem registros na chave atual do navegador. `src/services/access-service.ts` demonstra solicitações, revisões e perfis usando apenas `sessionStorage`; `src/services/document-service.ts` informa que a análise aguarda integração. Para uso corporativo, esses adaptadores devem chamar uma API que seja a fonte de verdade para sessões, contratos, usuários, permissões e histórico.

## Pontos de integração no código React

Os modelos compartilhados estão em `src/types.ts`. As transições de acesso ficam em `src/services/access-service.ts`, observadas pelos componentes por meio de `src/hooks/useAccess.ts`. A carteira local e seus mutators ficam em `src/hooks/useContracts.ts`; datas, status e valores são calculados em `src/domain/contracts.ts`.

Conecte a API nesses pontos, mantendo os contratos tipados consumidos pelas páginas TSX. Evite duplicar regras de aprovação, perfil ou cálculo em cada componente. A store local não deve se tornar uma segunda fonte de verdade quando a persistência real estiver disponível.

## Sessão corporativa

| Método e endpoint sugerido | Responsabilidade |
| --- | --- |
| `POST /api/session` | Receber e-mail e senha, verificar as credenciais no backend e iniciar uma sessão somente para um acesso ativo e autorizado. |
| `GET /api/session` | Retornar a identidade, organização e perfil efetivamente associados à sessão do servidor. |
| `DELETE /api/session` | Revogar a sessão no servidor e encerrar o cookie correspondente. |

O login atual falha com `BACKEND_NOT_CONFIGURED`. A persona criada por `startPreview` é somente uma opção visual e não deve ser aceita pela futura API como identidade, token, conta ou evidência de permissão.

O backend deverá emitir cookies de sessão `HttpOnly` e `Secure`, com política `SameSite` apropriada, comunicação HTTPS e proteção contra CSRF nas operações de escrita. Credenciais nunca deverão ser gravadas em `localStorage`, `sessionStorage`, logs ou respostas da API. Limites de tentativas e respostas de erro que evitem expor a existência de contas deverão fazer parte da implementação de login. Estes são requisitos para a próxima etapa, não controles já oferecidos pelo frontend atual.

## Contratos

| Método e endpoint sugerido | Permissão e comportamento |
| --- | --- |
| `GET /api/contracts` | Master e reader consultam os contratos de sua organização; filtros e paginação podem ser aplicados no servidor. |
| `POST /api/contracts` | Somente master cadastra um contrato, após validação dos campos. |
| `PATCH /api/contracts/:id` | Somente master altera um contrato pertencente à sua organização. |

O reader pode consultar e exportar os contratos permitidos. Não pode criar, editar, alterar usuários ou revisar solicitações. Essas restrições precisam ser verificadas em cada endpoint, independentemente de botões ocultos ou valores enviados pelo frontend.

A API deve validar datas, valores, campos obrigatórios, dados empresariais e opções de assinatura; deve também resolver a organização a partir da sessão. Um `organizationId` fornecido pelo cliente não pode conceder acesso a dados de outra empresa. O backend deverá retornar identificadores estáveis e dados em formato consistente com o adaptador do frontend.

Os dados de `guardian-contracts-v2` são preenchimentos locais, sem sincronização. Uma futura importação deve ser explícita, validada e autorizada; o backend não deve tratar o conteúdo do armazenamento do navegador como registros confiáveis.

## Solicitações e aprovação de acesso

| Método e endpoint sugerido | Permissão e comportamento |
| --- | --- |
| `POST /api/access-requests` | Receber nome, e-mail, departamento e justificativa, inclusive antes do login; não coletar senha. |
| `GET /api/access-requests` | Somente master consulta as solicitações de sua organização. |
| `POST /api/access-requests/:id/review` | Somente master aprova ou rejeita uma solicitação pendente; rejeição exige justificativa. |
| `GET /api/users` | Somente master consulta os acessos e perfis administrativos de sua organização. |
| `PATCH /api/users/:id/role` | Somente master altera explicitamente um perfil entre reader e master. |
| `GET /api/audit` | Somente master consulta o histórico permitido da organização, sem opção de alterar eventos. |

O corpo da solicitação contém apenas `name`, `email`, `department` e `reason`. O backend deve normalizar o e-mail, validar os campos e impedir duplicatas pendentes ou acessos já ativos. O cliente não deve escolher seu próprio perfil, status, organização de destino ou responsável pela aprovação. O destino corporativo deve ser resolvido por uma configuração ou regra confiável da aplicação.

Uma sugestão de corpo para a revisão é:

```json
{
  "decision": "approved",
  "reason": ""
}
```

Para rejeitar, use `decision: "rejected"` com um motivo não vazio. A transição permitida é `pending → approved` ou `pending → rejected`. Uma solicitação já analisada não deve poder ser aprovada novamente, mesmo por chamadas simultâneas.

Na aprovação, o backend deverá executar uma transação atômica que:

1. Confira a sessão e a permissão master na organização correta.
2. Verifique que a solicitação ainda está pendente e que não existe um acesso ativo incompatível para o e-mail.
3. Crie ou habilite o acesso com perfil inicial **reader**.
4. Marque a solicitação como aprovada, com data e responsável fornecidos pelo servidor.
5. Acrescente o evento de auditoria da mesma operação.

Restrições e índices no banco, junto com a transação, devem impedir contas duplicadas e revisões repetidas. Uma promoção a master deve ocorrer somente por uma segunda ação administrativa explícita; aprovar uma solicitação não concede master automaticamente.

O fluxo de ativação de credenciais, convite ou verificação do e-mail deverá ser definido no backend. O frontend atual não envia e-mails, convites ou notificações reais, nem cria uma conta que possa usar o login corporativo.

## Primeiro master e mudanças de perfil

O primeiro master deverá ser provisionado exclusivamente por um processo confiável do backend ou de administração: por exemplo, configuração inicial controlada, migração ou comando administrativo restrito. A página pública de solicitação não poderá criar o primeiro master, contar usuários para decidir privilégios ou promover o solicitante.

Nas mudanças posteriores, o servidor deverá obter o responsável a partir da sessão e verificar o perfil vigente no momento da operação. Não pode confiar no perfil de um cookie não verificado, corpo JSON ou estado do frontend. Deve impedir a remoção do próprio perfil master e a remoção do último master ativo da organização, inclusive sob concorrência.

Um perfil aprovado que tenha sido alterado no servidor precisa refletir-se nas próximas respostas e decisões da API. Manter uma aba aberta ou alterar o armazenamento do navegador não pode preservar privilégios revogados.

## Histórico de auditoria

Os eventos atuais de prévia incluem `access.approved`, `access.rejected` e `role.changed`. O histórico futuro deve ser escrito pelo servidor e protegido contra alteração pelos endpoints de usuários. Cada evento deve registrar, no mínimo:

- Identificador e ação realizada.
- Identidade do alvo e identificador da solicitação, quando aplicável.
- Identidade do responsável obtida da sessão autenticada do servidor.
- Data e hora geradas no servidor.
- Perfil anterior e novo perfil, quando houver alteração.
- Motivo da revisão ou rejeição, quando informado ou obrigatório.

Campos como `actor`, `reviewedBy`, `approvedBy` e horários enviados pelo cliente não devem determinar a autoria real. Registros retornados como cópias pelo adaptador local evitam mutações acidentais da interface, mas não oferecem imutabilidade de segurança. Essa garantia depende do armazenamento e das permissões do backend.

## Análise de documentos

`analyzeContractDocument`, em `src/services/document-service.ts`, é o ponto de substituição pela integração real. Atualmente ele não lê, persiste ou transmite o arquivo e lança `BACKEND_NOT_CONFIGURED` para um documento selecionado. Um `AbortSignal` já cancelado é respeitado.

Uma opção futura é `POST /api/contracts/analyze`, com arquivo em `multipart/form-data`, permitido ao master. O servidor precisará verificar sessão, organização, tipo e tamanho do arquivo antes de processá-lo, além de aplicar os limites de uso apropriados. A interface aceita PDF, JPG/JPEG e TXT; essa validação também deverá existir no servidor.

A resposta tipada do analisador usa `DocumentAnalysisResult`, definido em `src/types.ts`, com os dados extraídos em `fields`. Esse objeto contém somente os campos para revisão nos grupos contratante, contratada e contrato; o tipo exclui `signature`. O **status da assinatura deve continuar manual**: o serviço não deve inferir, confirmar ou preencher esse campo automaticamente. O usuário precisa revisar os dados e selecionar o status antes de salvar o contrato.

## Publicação e limites atuais

`npm run build` verifica o TypeScript e gera os arquivos de produção em `dist/`, que podem ser hospedados como conteúdo estático. Publicar o frontend ou enviá-lo a um repositório GitHub não cria os serviços descritos neste documento. Credenciais, segredos e provisionamento devem permanecer no ambiente do backend.

Uma eventual proteção de um Site privado por entrada no ChatGPT pertence à hospedagem do Sites. Ela não autentica usuários corporativos no produto e não substitui nenhuma regra da futura API. Ao publicar os arquivos em hospedagem própria, esse controle externo não é levado junto. O frontend não contém implementação de login social.
