# ADR - Estilos Arquiteturais dos Sistemas

Este documento registra as decisões arquiteturais tomadas para os três sistemas do estudo de caso. Os ADRs a seguir seguem o formato: contexto, decisão, status e consequências.

## 1. ADR - E-commerce

### Status

Aceito.

### Contexto

O sistema é um serviço de compra e venda online de produtos, com acompanhamento de promoções, pedidos, pagamentos e entregas. Ele precisa lidar com períodos de grande demanda sem comprometer a disponibilidade do negócio.

Os requisitos não funcionais prioritários são:

- alta escalabilidade;
- disponibilidade e confiabilidade;
- segurança e proteção de dados;
- conformidade com LGPD e CDC;
- desempenho, com baixa latência;
- usabilidade e responsividade;
- consistência eventual;
- manutenibilidade e observabilidade.

Os serviços relacionados a catálogo, pedidos, pagamentos e entregas podem apresentar cargas e comportamentos diferentes. Uma falha isolada não pode impedir toda a operação da plataforma.

### Decisão

Adotar Arquitetura Orientada a Eventos (EDA) com Consumidor Idempotente e padrão Transactional Outbox, usando opcionalmente o padrão Inbox nos consumidores, além de execução em nuvem pública multi-cloud.

Cada domínio terá responsabilidades bem definidas. Promoções, pedidos, pagamentos e entregas serão conectados por eventos assíncronos publicados em um broker de mensagens.

O padrão Transactional Outbox será aplicado por cada produtor: a alteração de estado e o registro do evento ficarão na mesma transação local do banco de dados. Um publicador separado lerá os registros pendentes e enviará os eventos ao broker, marcando-os somente após a confirmação da entrega. Isso evita perder eventos ou publicar alterações que não foram confirmadas no banco.

Os consumidores serão idempotentes. Cada evento terá um identificador único e o consumidor registrará os eventos já processados ou manterá uma chave de deduplicação junto às alterações de estado. Assim, reentregas, falhas de confirmação ou mensagens duplicadas não serão processadas duas vezes. Como reforço opcional, o padrão Inbox poderá armazenar os eventos recebidos antes do processamento e controlar seu estado.

Serviços críticos poderão ser redundados ou mantidos em diferentes provedores de nuvem. A consistência eventual será aceita nos fluxos que não exigem atualização imediata e global.

### Consequências

#### Benefícios

- Permite escalar microsserviços de acordo com a demanda de cada área.
- Suporta picos de acesso sem exigir o redimensionamento de todo o sistema.
- Diminui o acoplamento entre pedidos, pagamentos e entregas.
- A comunicação assíncrona permite continuidade parcial do negócio quando um serviço secundário está indisponível.
- Reduz o impacto de falhas isoladas e facilita implantações independentes.
- A execução em nuvem multi-cloud contribui para a resiliência e evita dependência excessiva de uma única infraestrutura.
- Melhora a organização por domínios de negócio e a capacidade de evolução individual dos serviços.

#### Dívidas técnicas e desafios

- Aumenta a complexidade de implantação, configuração e operação da infraestrutura.
- Exige observabilidade distribuída, métricas, logs centralizados e rastreamento entre serviços.
- Cria desafios de consistência eventual, duplicação de eventos e entrega fora de ordem.
- Necessita de mecanismos de idempotência, repetição e recuperação de mensagens.
- Exige manter tabelas Outbox, um publicador confiável e políticas de repetição e limpeza.
- Pode exigir tabelas Inbox e registros de eventos processados para deduplicação nos consumidores.
- Falhas na publicação ou reprocessamento tornam necessária observabilidade específica do Outbox e do broker.
- Introduz maior custo de nuvem, monitoramento, rede e ferramentas operacionais.
- Pode tornar depuração, testes integrados e gestão de versões mais difíceis.
- Exige políticas robustas de segurança, isolamento e proteção de dados pessoais em cada serviço.

## 2. ADR - Aplicativo bancário

### Status

Aceito.

### Contexto

O sistema bancário oferece recursos de câmbio e atualização do estado da conta. Operações financeiras podem envolver várias etapas distribuídas e precisam ser corretas, auditáveis e recuperáveis em caso de falha.

Os requisitos não funcionais prioritários são:

- segurança extrema e proteção de dados;
- consistência forte e integridade ACID;
- disponibilidade e resiliência;
- auditoria e rastreabilidade;
- conformidade com LGPD, normas do banco central e CDC;
- desempenho e latência;
- alta escalabilidade;
- usabilidade e acessibilidade;
- manutenibilidade e observabilidade.

Uma indisponibilidade parcial ou uma atualização incorreta pode causar prejuízo financeiro e exigir forte rastreabilidade das operações.

### Decisão

Adotar Event Sourcing (Armazenamento de Eventos) com CQRS, API Gateway e idempotência nas operações financeiras críticas.

No Event Sourcing, o estado da conta não será representado apenas pelo registro atual. Cada operação válida será armazenada como um evento financeiro imutável, como crédito autorizado, débito confirmado ou cotação aplicada. A partir da sequência de eventos, o sistema poderá reconstruir o estado atual da conta e auditar qualquer alteração.

O CQRS separará comandos de consultas: os comandos validarão regras, autorização e disponibilidade de saldo antes de criar novos eventos; os modelos de consulta serão atualizados por projeções derivadas desses eventos e otimizados para consultas de saldo e histórico. A consistência forte será mantida no caminho de escrita das operações críticas, enquanto as projeções poderão apresentar consistência eventual. O API Gateway centralizará autenticação e autorização, e todas as operações de escrita usarão identificadores de idempotência para impedir a repetição de um mesmo fato financeiro.

### Consequências

#### Benefícios

- Permite escalabilidade independente de serviços como contas, câmbio e pagamentos.
- Separa responsabilidades sensíveis e reduz o acoplamento entre módulos financeiros.
- Mantém consistência forte nas operações locais por meio de transações ACID.
- Permite reconstruir o estado da conta em qualquer momento por meio da sequência de eventos.
- Melhora rastreabilidade por meio de eventos imutáveis e trilhas completas de auditoria.
- Permite separar a carga e a evolução dos modelos de escrita e consulta.
- O CQRS oferece modelos de leitura otimizados para saldo, histórico e câmbio.
- Facilita a identificação e correção de divergências por meio de novas projeções.
- Permite centralizar autenticação, autorização e políticas de acesso no API Gateway.
- Facilita recuperação segura por meio de idempotência.

#### Dívidas técnicas e desafios

- Event Sourcing aumenta a complexidade do modelo de dados, das migrações e da evolução dos eventos.
- O CQRS exige manter modelos de leitura sincronizados e lidar com atualização eventual das projeções.
- Exige versionamento e compatibilidade de eventos antigos, além de mecanismos de replay e reconstrução.
- Há complexidade adicional para garantir idempotência e evitar a criação ou aplicação duplicada de fatos.
- Consultas podem ficar temporariamente desatualizadas até a projeção processar os novos eventos.
- A infraestrutura de armazenamento e auditoria precisa garantir integridade, disponibilidade, retenção e segurança dos eventos.
- Segurança, criptografia, controle de acesso e conformidade exigem processos contínuos e revisão frequente.

## 3. ADR - Jogo multiplayer

### Status

Aceito.

### Contexto

O sistema permite que duas pessoas joguem em dispositivos diferentes e geograficamente distantes. A ação de um participante precisa produzir uma resposta rápida e consistente no outro dispositivo.

Os requisitos não funcionais prioritários são:

- desempenho e latência ultrabaixa;
- comunicação em tempo real;
- disponibilidade e confiabilidade;
- segurança e integridade do estado;
- escalabilidade;
- consistência e sincronização rápida do estado do jogo;
- manutenibilidade e observabilidade;
- portabilidade e compatibilidade.

O servidor precisa validar as ações dos participantes e evitar divergências no estado exibido em cada cliente.

### Decisão

Adotar uma arquitetura cliente-servidor organizada em quatro camadas: interface do cliente, serviços da aplicação, servidor de jogo e banco de dados.

O servidor de jogo será autoritativo. Ele receberá as ações dos jogadores, validará regras e ordem dos eventos e publicará o estado atualizado aos participantes. A comunicação em tempo real entre cliente e servidor será feita por WebSockets ou protocolo equivalente. Cada camada terá responsabilidades separadas, com o banco de dados usado para informações persistentes e o servidor de jogo responsável pelo estado atual da partida.

### Consequências

#### Benefícios

- Reduz a latência por meio de comunicação bidirecional persistente.
- Permite que jogadores distantes geograficamente participem da mesma partida.
- O servidor autoritativo centraliza validações e evita que o cliente altere o estado da partida.
- Facilita a sincronização rápida e consistente entre os participantes.
- Separa apresentação, aplicação, lógica da partida e persistência em camadas claras.
- Permite ampliar a infraestrutura do servidor conforme o número de partidas e conexões.
- Facilita monitoramento da latência, das partidas e da integridade do estado.

#### Dívidas técnicas e desafios

- O servidor de jogo é um ponto central de carga e pode se tornar um ponto único de falha.
- Exige dimensionamento de capacidade, balanceamento de conexões e estratégias de tolerância a falhas.
- Conexões persistentes aumentam o custo de infraestrutura e o esforço de monitoramento.
- Reconexões, perda de pacotes e ações enviadas fora de ordem exigem mecanismos de recuperação.
- Deve haver proteção contra trapaças, validação de entradas e prevenção de manipulação do estado.
- Escalar o estado das partidas para muitos usuários exige replicação, partição ou outros mecanismos distribuídos.
- A compatibilidade entre protocolos e plataformas deve ser testada continuamente.
