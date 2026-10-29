# Contract Guardian

Frontend corporativo de gestão de contratos, desenvolvido em **React 19.3.1, TypeScript 5.9 e Tailwind CSS 4.3.3**, com Vite 8.3.5. Inclui dashboard, contratos, calendário, relatórios, formulário e administração de acessos. A carteira começa vazia, sem contratos, contas ou históricos pré-cadastrados.

A migração mantém a interface e as regras da versão anterior. Esta etapa continua sendo somente frontend: o login corporativo e a análise automática de documentos aguardam integração com um backend.

## Requisitos e execução

Use Node.js **22.12 ou superior**; Node.js 24 é recomendado. O `package-lock.json` fixa as dependências da entrega.

```powershell
npm ci
npm run dev
```

Abra [http://127.0.0.1:4173](http://127.0.0.1:4173). `npm start` também inicia o servidor de desenvolvimento. Para encerrar, pressione `Ctrl+C`.

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Executa o frontend com atualização durante o desenvolvimento. |
| `npm run check` | Verifica os tipos TypeScript, com modo estrito e sem gerar arquivos. |
| `npm test` | Executa a suíte automatizada com Vitest. |
| `npm run build` | Verifica os tipos e gera a aplicação de produção em `dist/`. |
| `npm run preview` | Serve o resultado do build localmente na porta 4173. |

Encerre o servidor de desenvolvimento antes de iniciar o preview, pois ambos usam a mesma porta. Para conferir a versão de produção:

```powershell
npm run build
npm run preview
```

`dist/` é uma saída gerada e ignorada pelo Git. Faça alterações em `src/`, `public/` e nos arquivos de configuração; não edite os arquivos compilados.

## Explorar os fluxos existentes

Na tela de entrada, use a opção explícita de **prévia da interface**. As personas **Prévia master** e **Prévia reader** permitem explorar comportamentos da interface; elas não são contas reais ou autenticadas.

| Perfil | Permissões na prévia |
| --- | --- |
| Master | Consulta e exporta contratos, cadastra e edita contratos, aprova ou recusa solicitações e altera permissões. |
| Reader | Consulta dashboard, contratos, calendário e relatórios; exporta dados, sem ações de edição ou administração. |

A opção **Solicitar acesso** recebe nome, e-mail corporativo, departamento e justificativa. Não solicita senha. O pedido fica apenas na sessão local da prévia; nenhuma mensagem ou notificação real é enviada à empresa.

Uma aprovação cria um acesso local com perfil inicial **reader**. A promoção para master exige uma segunda ação explícita. Aprovações, recusas e alterações de perfil registram responsável, data e detalhes no histórico da sessão. A recusa exige um motivo. O responsável vem da sessão do serviço de acesso, e não dos campos da solicitação.

Tentar entrar com e-mail e senha retorna `BACKEND_NOT_CONFIGURED`. A aplicação não armazena senhas nem concede uma sessão corporativa real.

## Contratos e documentos

Na prévia master, cadastre o primeiro contrato preenchendo os dados da contratante, da contratada e do contrato. Os indicadores, gráficos e alertas passam a usar os registros salvos no navegador.

O formulário aceita a seleção ou o arraste de PDF, JPG/JPEG e TXT, com validação de formato, tamanho e arquivo vazio. O adaptador em `src/services/document-service.ts` informa que a análise aguarda integração; nesta entrega, ele não lê, armazena ou transmite o conteúdo do documento. O preenchimento manual continua disponível, e o **status da assinatura sempre depende de confirmação manual**.

Os gráficos consideram o valor mensal integral de cada contrato assinado que tenha sobreposição com o mês, sem rateio diário. Meses futuros são compromissos projetados, não pagamentos realizados. Sem contratos, os valores são zero; sem uma base anterior maior que zero, não há variação percentual. Os status usam a data de São Paulo.

## Dados preservados entre as versões

| Dados | Armazenamento |
| --- | --- |
| Contratos cadastrados | `localStorage`, chave `guardian-contracts-v2`. |
| Sessão, solicitações, usuários e auditoria da prévia | `sessionStorage`, chave `guardian-access-preview-v1`. |
| Preferências visuais e avisos | `localStorage`, chave `guardian-preferences-v1`. |
| Senhas e credenciais | Não são persistidas pela aplicação. |

As chaves da versão anterior foram mantidas. A antiga chave `guardian-contracts-v1` continua ignorada, sem ser apagada automaticamente. Quando o navegador bloqueia armazenamento, os fluxos locais podem continuar em memória durante a sessão.

Não há sincronização por API entre pessoas ou dispositivos. Sair da prévia encerra a persona atual, preservando os registros enquanto o `sessionStorage` existir. Limpar os dados locais pode apagar os contratos e o histórico de prévia.

As permissões do frontend demonstram o produto e restringem as ações comuns da interface. A autorização real precisa ser validada pelo backend em cada operação. A sessão local não deve ser usada como controle de segurança de produção.

## Organização do código

```text
src/
  components/
    auth/              # Login, solicitação, layout e prévia
    contracts/         # Tabela, detalhes e componentes do formulário
    dashboard/         # Indicadores e gráficos
    layout/            # Navegação, avisos e estrutura do workspace
    ui/                # Ícones, modal, mensagens e cabeçalhos compartilhados
    users/             # Solicitações, usuários, perfis e auditoria
  domain/              # Datas, status e cálculos financeiros
  hooks/               # Integração React com estado e armazenamento
  lib/                 # Utilitários compartilhados, como CSV
  pages/               # Telas compostas com componentes TSX
  services/            # Adaptadores tipados para acesso, documentos e exportação
  styles/              # Tailwind, componentes visuais e efeitos específicos
  types.ts             # Modelos e contratos de dados compartilhados
public/                # Recursos estáticos
tests/                # Testes automatizados
docs/                 # Arquitetura e plano de backend
```

A interface é renderizada por componentes React nativos, com estado e eventos declarativos. Não há uma segunda aplicação JavaScript antiga embutida sob os componentes. Tailwind é compilado pelo plugin do Vite; utilitários e `@apply` compõem os estilos reutilizáveis. CSS específico preserva detalhes como aurora, gráficos, estados e pontos de quebra.

Leia [a arquitetura](docs/ARCHITECTURE.md) para localizar os pontos de mudança e [o plano de backend](docs/BACKEND.md) antes de conectar serviços reais.

## Código para o GitHub privado

O pacote de código-fonte contém `src/`, `public/`, testes, documentação, `index.html`, configurações e arquivos de dependências. Não é necessário incluir `node_modules/` ou o build para versionar o projeto; outro ambiente pode reconstruí-lo com `npm ci` e `npm run build`.

Nenhum repositório GitHub de destino foi informado, portanto nenhum repositório foi criado ou recebeu o código. Para enviar uma cópia extraída do pacote, sem pasta `.git`, a um repositório privado criado pela empresa, substitua a URL abaixo e use sua autenticação habitual:

```powershell
git init
git add .
git commit -m "Adicionar frontend React do Contract Guardian"
git branch -M main
git remote add origin https://github.com/SUA_ORGANIZACAO/SEU_REPOSITORIO_PRIVADO.git
git push -u origin main
```

Se a pasta já estiver em um repositório, confira o histórico e os remotos antes de configurar um destino. Nunca inclua credenciais no código ou na URL do Git.

## Hospedagem

Depois de `npm run build`, publique o conteúdo de `dist/` em uma hospedagem estática. As rotas do produto usam o fragmento da URL (`#login`, `#dashboard` etc.). O frontend não exige um servidor de API para exibir a prévia.

`.openai/hosting.json` pertence à publicação pelo Sites e pode ser omitido da exportação para outra hospedagem. A eventual entrada no ChatGPT antes de um Site privado é uma proteção da hospedagem; ela não é o login corporativo do Contract Guardian e não acompanha os arquivos publicados por conta própria. O produto não implementa login social.
