# Estudo de Caso - Escolha de Estilos Arquiteturais

Este repositório documenta a defesa arquitetural de três sistemas fictícios: E-commerce, Aplicativo Bancário e Jogo Multiplayer.

A entrega é **100% teórica e de modelagem**. Não há implementação de código. As decisões foram formalizadas em ADRs e estão organizadas para comunicação técnica e explicação a stakeholders.

## Entregáveis do projeto

- Refinamento dos requisitos não funcionais dos três sistemas.
- Priorização dos requisitos e identificação do atributo de qualidade ISO/IEC 25010 mais crítico.
- ADR para cada sistema, com contexto, decisão, status e consequências.
- Justificativa técnica e de negócio de cada estilo arquitetural.
- Análise dos trade-offs e dos cenários de crise.
- Material para apresentação oral dos resultados.

Os ADRs detalhados estão em [`ADR.md`](./ADR.md).

---

## Parte 1 - Refinamento dos Requisitos

### 1. E-commerce

#### Contexto de negócio

Plataforma de compra e venda online com catálogo de produtos, promoções, pedidos, pagamentos e entregas. O sistema precisa manter a operação durante grandes variações de demanda e garantir que pedidos e pagamentos sejam processados de forma segura.

#### Requisitos não funcionais priorizados

| Prioridade | Requisito não funcional | Justificativa |
|---|---|---|
| 1 | Escalabilidade elástica | A demanda pode crescer rapidamente em campanhas e Black Friday. |
| 2 | Disponibilidade e confiabilidade | Uma indisponibilidade impede vendas e pode gerar prejuízo financeiro. |
| 3 | Segurança e proteção de dados | Dados pessoais e informações de pagamento precisam de proteção. |
| 4 | Desempenho e baixa latência | Páginas e pagamentos devem responder rapidamente. |
| 5 | Conformidade legal - LGPD e CDC | É necessário atender aos direitos do usuário e às regras comerciais. |
| 6 | Usabilidade e responsividade | A experiência precisa permanecer adequada em diferentes dispositivos. |

#### Atributo de qualidade ISO/IEC 25010 mais importante

**Escalabilidade**, relacionada à capacidade do sistema de manter o desempenho em diferentes cargas e ampliar recursos conforme a demanda.

#### Cenário de crise

Na Black Friday, o volume de acessos, pagamentos e pedidos pode aumentar muito em um curto período. O sistema deve adicionar capacidade para o catálogo e os pedidos sem interromper pagamentos já autorizados. O estoque precisa ser atualizado, mas não exige uma atualização global imediata em todos os fluxos.

#### Estilo arquitetural definitivo

**Arquitetura Orientada a Eventos (EDA)**, combinada com:

- **Consumidor Idempotente**, para evitar o processamento duplicado de eventos reentregues;
- **Transactional Outbox**, para publicar eventos na mesma transação em que ocorre a alteração de estado;
- **Inbox opcional**, para reforçar a deduplicação e controlar eventos recebidos pelos consumidores;
- execução em nuvem pública multi-cloud.

#### Justificativa técnica e de negócio

A EDA desacopla eventos como pedido criado, pagamento aprovado e entrega iniciada. Assim, cada área pode crescer conforme sua própria demanda. O Transactional Outbox evita perda de eventos em falhas intermediárias, enquanto o consumidor idempotente impede cobranças ou atualizações duplicadas.

Para a empresa, essa escolha reduz o risco de indisponibilidade em campanhas e permite pagar mais por capacidade apenas nos períodos de maior demanda. A consistência eventual é aceitável em informações secundárias, desde que eventos críticos sejam rastreados e processados corretamente.

---

### 2. Aplicativo Bancário

#### Contexto de negócio

Aplicativo financeiro com operações de câmbio e atualização de contas. As operações precisam ser corretas, rastreáveis e recuperáveis, pois divergências podem causar prejuízo financeiro e risco regulatório.

#### Requisitos não funcionais priorizados

| Prioridade | Requisito não funcional | Justificativa |
|---|---|---|
| 1 | Segurança e proteção de dados | Protege contas, credenciais e dados financeiros. |
| 2 | Integridade e consistência de dados | Operações críticas não podem gerar saldo incorreto ou operações duplicadas. |
| 3 | Disponibilidade e resiliência | Clientes precisam acessar serviços essenciais com baixa interrupção. |
| 4 | Conformidade regulatória e legal | O banco deve atender LGPD, regras do banco central e demais exigências. |
| 5 | Auditoria e rastreabilidade | Toda alteração precisa ser explicável e verificável. |
| 6 | Desempenho e baixa latência | Transferências e consultas devem responder rapidamente. |
| 7 | Escalabilidade | O sistema deve acompanhar o crescimento da base de usuários. |
| 8 | Usabilidade e acessibilidade | Pessoas com perfis diferentes devem conseguir operar o aplicativo com segurança. |
| 9 | Manutenibilidade e observabilidade | Falhas financeiras exigem diagnóstico rápido e rastreamento. |

#### Atributo de qualidade ISO/IEC 25010 mais importante

**Segurança**, pois uma falha pode expor dados ou permitir operações financeiras não autorizadas.

A **integridade**, relacionada à confiabilidade e consistência dos dados, é o segundo atributo mais crítico.

#### Cenário de crise

Durante um ataque ou tentativa de fraude, o sistema precisa bloquear operações suspeitas, preservar os registros das tentativas e manter o histórico completo das alterações. A reconstrução do estado da conta deve ser possível após qualquer inconsistência.

#### Estilo arquitetural definitivo

**Event Sourcing com CQRS**:

- **Event Sourcing** registra operações válidas como eventos financeiros imutáveis;
- **CQRS** separa comandos de escrita de consultas otimizadas;
- **API Gateway** centraliza autenticação e autorização;
- identificadores de **idempotência** impedem a aplicação repetida de uma operação.

#### Justificativa técnica e de negócio

Os eventos imutáveis formam uma trilha de auditoria completa e permitem reconstruir o estado da conta em uma data anterior. O CQRS separa operações críticas de leitura, permitindo que consultas de saldo e histórico sejam mais eficientes sem interferir na validação dos comandos.

As operações críticas mantêm consistência forte no caminho de escrita. As consultas podem ter consistência eventual controlada, sendo atualizadas pelas projeções derivadas dos eventos.

Para o negócio, essa arquitetura reduz riscos regulatórios, facilita investigações e oferece evidências para auditorias. A complexidade e o custo são justificáveis por uma redução potencial de perdas financeiras e multas.

---

### 3. Jogo Multiplayer

#### Contexto de negócio

Jogo entre duas pessoas em dispositivos diferentes e geograficamente distantes. A ação de um participante deve ser validada pelo servidor e refletida rapidamente no outro dispositivo.

#### Requisitos não funcionais priorizados

| Prioridade | Requisito não funcional | Justificativa |
|---|---|---|
| 1 | Desempenho e baixa latência | O atraso entre ações e respostas prejudica a jogabilidade. |
| 2 | Consistência e sincronização do estado | Os jogadores devem enxergar o mesmo estado da partida. |
| 3 | Disponibilidade e confiabilidade | A partida não pode ser interrompida por falhas simples. |
| 4 | Segurança e integridade | O servidor precisa impedir trapaças e alterações indevidas. |
| 5 | Escalabilidade | O sistema deve suportar mais partidas e jogadores simultâneos. |
| 6 | Manutenibilidade e observabilidade | Métricas de latência e partidas ajudam a encontrar falhas. |
| 7 | Portabilidade e compatibilidade | Clientes diferentes devem participar da mesma partida. |

#### Atributo de qualidade ISO/IEC 25010 mais importante

**Desempenho**, especialmente a latência e a velocidade da comunicação em tempo real.

#### Cenário de crise

No lançamento de uma nova partida, muitos jogadores podem entrar ao mesmo tempo. Conexões instáveis, perda de pacotes e reconexões podem ocorrer. O servidor deve manter a integridade da partida, garantir uma ordem consistente das ações e recuperar rapidamente jogadores desconectados.

#### Estilo arquitetural definitivo

**Arquitetura Cliente-Servidor em quatro camadas**:

1. Interface do cliente;
2. Serviços da aplicação;
3. Servidor autoritativo de jogo;
4. Banco de dados.

As atualizações em tempo real serão feitas por WebSockets ou protocolo equivalente.

#### Justificativa técnica e de negócio

O servidor autoritativo valida ações, resolve a ordem dos eventos e publica o estado atualizado aos participantes. Isso evita que cada cliente determine isoladamente o estado da partida.

Para o negócio, a arquitetura permite partidas estáveis entre usuários distantes, protege a integridade do jogo e facilita o monitoramento da experiência. A comunicação persistente reduz a latência quando comparada à repetição constante de requisições HTTP convencionais.

---

## Parte 2 - Mini Projeto: Defesa Arquitetural

### ADRs

Um ADR registra o contexto, a decisão, o status e as consequências esperadas. O projeto aceita as seguintes decisões:

| Sistema | Estilo arquitetural definitivo | Status |
|---|---|---|
| E-commerce | EDA com Consumidor Idempotente, Transactional Outbox e Inbox opcional | Aceito |
| Aplicativo Bancário | Event Sourcing com CQRS | Aceito |
| Jogo Multiplayer | Cliente-Servidor em quatro camadas | Aceito |

Os ADRs completos estão em [`ADR.md`](./ADR.md).

### Resumo das consequências

#### E-commerce

- **Prós:** escalabilidade por fluxo de negócio, desacoplamento, resiliência e capacidade de absorver picos.
- **Contras:** complexidade de broker, observabilidade distribuída, consistência eventual, Outbox/Inbox e deduplicação.

#### Aplicativo Bancário

- **Prós:** auditoria completa, reconstrução do histórico, separação entre escrita e leitura e maior rastreabilidade.
- **Contras:** complexidade de versionamento, replay, projeções, migração de eventos e possíveis atrasos nas consultas.

#### Jogo Multiplayer

- **Prós:** baixa latência, comunicação bidirecional, estado autoritativo e sincronização entre dispositivos.
- **Contras:** servidor central pode receber muita carga, exige dimensionamento, balanceamento, reconexão e tolerância a falhas.

---

## Parte 3 - Apresentação Oral

A apresentação deve explicar cada sistema por meio de:

1. problema de negócio e contexto;
2. prioridades dos requisitos não funcionais;
3. atributo ISO/IEC 25010 mais importante;
4. estilo arquitetural escolhido;
5. benefícios técnicos e impactos de negócio;
6. trade-offs e dívidas técnicas assumidas;
7. pior cenário e estratégia de mitigação.

### Comunicação com stakeholders

Uma analogia visual pode tornar os estilos mais compreensíveis:

- **E-commerce:** EDA é como uma cozinha com pedidos assíncronos. Cada setor prepara uma etapa sem bloquear os demais.
- **App bancário:** Event Sourcing é como um livro-contábil imutável. O saldo é o resultado atual de todas as operações registradas.
- **Jogo multiplayer:** o servidor autoritativo é como um árbitro. Cada jogador informa ações, mas o árbitro valida e publica o estado oficial.

---

## Parte 4 - Reflexão

### Por que documentar uma decisão arquitetural é tão importante quanto o diagrama?

O diagrama mostra **como** o sistema será organizado, mas não registra necessariamente **por que** aquela organização foi escolhida. O ADR preserva o contexto, os requisitos conhecidos, as alternativas consideradas e os custos assumidos.

Sem essa documentação, uma equipe futura pode alterar partes da arquitetura sem compreender os riscos que ela evita. O ADR também facilita auditorias, onboarding e decisões de evolução, pois permite voltar à justificativa original.

### Como defender a escolha técnica para um stakeholder que se importa principalmente com dinheiro e prazos?

A explicação técnica deve ser traduzida em impacto de negócio:

- No **e-commerce**, a EDA evita indisponibilidade na Black Friday e permite escalar recursos somente quando necessário, reduzindo servidores ociosos e protegendo vendas.
- No **banco**, o Event Sourcing com CQRS aumenta a rastreabilidade e ajuda a evitar prejuízos, fraudes e multas causadas por operações incorretas.
- No **jogo multiplayer**, o servidor autoritativo protege a experiência dos jogadores e reduz a chance de partidas inconsistentes, trapaças e perda de usuários.

Toda escolha possui custo. Por isso, a defesa deve comparar o benefício esperado com a dívida técnica: capacidade de entrega, prazo da equipe, custo operacional, manutenção e risco do pior cenário.

---

## Organização profissional sugerida

```text
Estilos Arquiteturais e Estudo de Caso Jogo Multiplayer/
├── README.md
├── README2.md
├── ADR.md
├── slides/
└── diagramas/
    └── jogo-multiplayer.drawio
```
