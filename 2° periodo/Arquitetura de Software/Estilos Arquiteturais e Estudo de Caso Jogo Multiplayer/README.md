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

**Estilo arquitetural:** microsserviços, arquitetura orientada a eventos e execução em nuvem pública multi-cloud.

**Justificativa:** o estilo baseado em microsserviços divide o sistema em serviços independentes, permitindo escalabilidade conforme a demanda de cada área. A execução em nuvem pública multi-cloud ajuda a isolar erros em partes específicas e manter fluxos críticos operando mesmo quando serviços secundários ficam indisponíveis. A arquitetura orientada a eventos conecta os processos por meio de eventos e permite que pedidos, pagamentos e entregas sejam atualizados de forma assíncrona. Essa combinação atende à consistência eventual e reduz o acoplamento entre os fluxos.

**Trade-offs:** há maior complexidade operacional, necessidade de observabilidade distribuída, maior custo de infraestrutura e desafios na coordenação e depuração dos serviços.

### Aplicativo bancário

Um recurso bancário com sistema de câmbio e atualização do estado da conta.

**Requisitos não funcionais mais importantes:**

- Segurança extrema.
- Consistência forte com propriedades ACID.
- Auditoria.
- Alta escalabilidade.

**Estilo arquitetural:** microsserviços orientados a eventos — Event-Driven Architecture (EDA).

**Justificativa:** a divisão em microsserviços permite escalabilidade independente das áreas do sistema e separação das responsabilidades. As etapas da transferência podem funcionar de forma assíncrona por filas e brokers de mensagens, como Apache Kafka ou RabbitMQ. Cada operação financeira crítica, porém, deve manter transações locais ACID e mecanismos de compensação. O padrão Saga pode coordenar uma transferência distribuída sem manter uma transação longa em todos os serviços. Um API Gateway centraliza autenticação, autorização e controle das chamadas, enquanto o registro de eventos imutáveis contribui para auditoria, rastreabilidade e atendimento a exigências fiscais e legais.

**Trade-offs:** microsserviços e eventos aumentam a complexidade operacional e exigem monitoramento, rastreamento distribuído, controle rigoroso de idempotência e estratégias consistentes de recuperação. A consistência forte continua sendo necessária nas operações financeiras críticas e não deve ser substituída pela consistência eventual do sistema inteiro.

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
| E-commerce | Microsserviços, orientada a eventos e multi-cloud | Escalabilidade, resiliência e consistência eventual |
| Aplicativo bancário | Microsserviços orientados a eventos | Segurança, auditoria e consistência ACID nas operações críticas |
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
