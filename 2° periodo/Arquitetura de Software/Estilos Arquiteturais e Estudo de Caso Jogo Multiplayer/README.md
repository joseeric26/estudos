# Estilos Arquiteturais — Estudo de Caso

Este repositório apresenta o estudo de caso individual sobre a escolha de estilos arquiteturais para três sistemas fictícios: e-commerce, aplicativo bancário e jogo multiplayer.

A atividade é **100% teórica e de modelagem**. Não há implementação de código. O objetivo é analisar os sistemas, justificar as escolhas arquiteturais e documentar os resultados no repositório.

## Entrega

- **Análise dos sistemas:** contexto e requisitos não funcionais.
- **Escolha arquitetural:** estilo indicado e justificativa técnica e de negócio.
- **Apresentação oral:** explicação das escolhas por meio de slides.
- **Reflexão:** análise sobre trade-offs e contexto de negócio.
- **Diagrama bônus:** comunicação em alto nível do jogo multiplayer em formato [draw.io](./diagramas/jogo-multiplayer.drawio).

## Parte 1 — Contexto e requisitos

### E-commerce

Um serviço de compra e venda online de produtos, com acompanhamento de promoções, pedidos, pagamentos e entregas.

**Requisitos não funcionais mais importantes:**

- Alta escalabilidade em períodos de grande demanda.
- Tolerância a falhas.
- Consistência eventual.

**Estilo arquitetural:** Arquitetura Orientada a Eventos (EDA), com Consumidor Idempotente e padrão Transactional Outbox — opcionalmente acompanhado por Inbox — e execução em nuvem pública multi-cloud.

**Justificativa:** a Arquitetura Orientada a Eventos permite que pedidos, pagamentos, entregas e promoções sejam atualizados de forma assíncrona e com baixo acoplamento. O padrão Transactional Outbox registra o evento na mesma transação que altera o estado e um processo auxiliar o envia ao broker, evitando a perda de eventos em falhas intermediárias. O Consumidor Idempotente usa identificadores únicos e deduplicação para impedir o processamento repetido de eventos reentregues ou duplicados. O padrão Inbox pode ser aplicado nos consumidores para registrar eventos recebidos e controlar seu processamento.

**Trade-offs:** há maior complexidade operacional, necessidade de observabilidade distribuída, maior custo de infraestrutura e desafios na coordenação e depuração dos serviços. A equipe precisará manter registros Outbox/Inbox, políticas de repetição, limpeza e deduplicação.

### Aplicativo bancário

Um recurso bancário com sistema de câmbio e atualização do estado da conta.

**Requisitos não funcionais mais importantes:**

- Segurança extrema.
- Consistência forte com propriedades ACID.
- Auditoria.
- Alta escalabilidade.

**Estilo arquitetural:** Event Sourcing (Armazenamento de Eventos) com CQRS.

**Justificativa:** o Event Sourcing registra todas as operações financeiras válidas como eventos imutáveis, permitindo reconstruir o estado da conta em qualquer ponto do tempo e garantindo uma trilha completa de auditoria. O CQRS separa os comandos, responsáveis por validar alterações financeiras, das consultas, que usam modelos otimizados para saldo, histórico e câmbio. Essa separação melhora a rastreabilidade, a segurança e a escalabilidade das consultas. Um API Gateway continua centralizando autenticação e autorização.

**Trade-offs:** o Event Sourcing aumenta a complexidade do modelo de dados, das migrações e da reconstrução de projeções. O CQRS exige manter os modelos de escrita e leitura sincronizados e pode introduzir consistência eventual nas consultas. A equipe precisará de versionamento de eventos, replay, idempotência e proteção adicional dos dados pessoais.

### Jogo multiplayer

Um jogo com participação de duas pessoas em dispositivos diferentes e distantes geograficamente.

**Requisitos não funcionais mais importantes:**

- Latência ultrabaixa.
- Comunicação em tempo real.
- Sincronização rápida e consistente do estado do jogo.

**Estilo arquitetural:** arquitetura cliente-servidor organizada em quatro camadas.

**Justificativa:** o sistema de quatro camadas separa responsabilidades entre interface do cliente, serviços da aplicação, servidor de jogo e banco de dados. O servidor autoritativo recebe os dados dos dois participantes, valida ações e publica o estado atualizado. A arquitetura cliente-servidor permite maior alcance que uma solução limitada à proximidade dos pares, mantendo atualizações recorrentes e sincronização entre dispositivos distantes. WebSockets ou protocolos semelhantes podem reduzir o atraso e oferecer comunicação bidirecional em tempo real.

**Trade-offs:** o servidor pode se tornar um ponto central de carga e indisponibilidade. É necessário dimensionar o servidor de jogo, balancear conexões e aplicar estratégias de tolerância a falhas. O tráfego persistente também exige monitoramento e cuidado com reconexões e perda de pacotes.

## Parte 2 — Escolha e justificativa

Cada sistema recebeu uma arquitetura baseada em suas prioridades:

| Sistema | Estilo escolhido | Prioridade atendida |
|---|---|---|
| E-commerce | EDA com Consumidor Idempotente, Transactional Outbox e Inbox opcional | Escalabilidade, resiliência e consistência eventual confiável |
| Aplicativo bancário | Event Sourcing com CQRS | Segurança, auditoria, rastreabilidade e consistência das operações críticas |
| Jogo multiplayer | Cliente-servidor em quatro camadas | Latência baixa, tempo real e sincronização |

## Parte 3 — Apresentação oral

Na apresentação, cada estilo deve ser explicado em relação ao contexto do sistema. Os slides devem apresentar:

1. O contexto e os requisitos de cada sistema.
2. A arquitetura escolhida.
3. Os benefícios para o negócio e para a equipe.
4. As limitações e os trade-offs.

## Diagrama bônus — Jogo multiplayer

O diagrama em [`diagramas/jogo-multiplayer.drawio`](./diagramas/jogo-multiplayer.drawio) mostra, em alto nível, como os jogadores se comunicam com o servidor de jogo e como o servidor usa os serviços e o banco de dados.

O fluxo principal é:

```text
Jogador A <-> Cliente A <-> Servidor de jogo <-> Serviços da aplicação <-> Banco de dados
                                      ^
                                      |
                              Jogador B <-> Cliente B
```

Os clientes enviam ações e recebem atualizações por uma conexão WebSocket. O servidor de jogo valida as ações, resolve a ordem dos eventos e distribui o estado sincronizado aos participantes.

## Parte 4 — Reflexão

Não existe uma “bala de prata” porque uma arquitetura perfeita para todos os sistemas não existe. Cada projeto possui requisitos diferentes, e toda decisão arquitetural envolve trade-offs.

Microsserviços podem ajudar na escalabilidade e na implantação independente das partes do sistema, mas aumentam a complexidade operacional, o custo de observabilidade e a dificuldade de depuração. Um monolito pode ser mais simples para começar e facilitar transações locais, mas precisa ser bem organizado para não se tornar difícil de manter à medida que cresce.

O contexto de negócio também influencia a escolha. Uma equipe pequena, pouco orçamento ou pouco tempo para lançar o produto tendem a favorecer uma solução mais simples e com menor custo operacional. Uma empresa com grande escala, recursos de infraestrutura e uma equipe preparada pode justificar arquiteturas distribuídas. O estilo mais adequado é aquele que atende aos requisitos reais, ao prazo, à equipe disponível e ao orçamento, sem introduzir complexidade desnecessária.
