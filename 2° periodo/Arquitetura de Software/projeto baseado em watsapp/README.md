# Diagrama de Componentes UML — Mensagens do WhatsApp

## Objetivo

Representar visualmente, em um diagrama de componentes UML, como uma mensagem pode ser enviada da Pessoa 1 para a Pessoa 2. O modelo é conceitual e simplificado; não descreve a arquitetura interna oficial do WhatsApp.

## Fluxo da mensagem

1. A Pessoa 1 digita uma mensagem no aplicativo e a envia.
2. O aplicativo encaminha a solicitação pela API Gateway ao serviço de mensagens.
3. O serviço de mensagens salva a conversa no banco de dados.
4. O serviço encaminha a mensagem ao aplicativo da Pessoa 2 por meio da API.
5. O aplicativo da Pessoa 2 recebe e exibe a mensagem.

## Componentes representados

- **Pessoa 1 e aplicativo remetente:** iniciam o envio da mensagem.
- **API Gateway:** faz a comunicação entre o aplicativo e os serviços.
- **Serviço de mensagens:** processa e encaminha a mensagem.
- **Banco de dados:** armazena a conversa.
- **Infraestrutura / escala:** representa o suporte a balanceamento de carga e capacidade escalável.
- **Aplicativo destinatário e Pessoa 2:** recebem e exibem a mensagem.

## Possível erro de conexão

Se uma falha de conexão impedir que a mensagem seja recebida, a proposta é mantê-la pendente. Enquanto estiver em espera, o usuário poderá cancelar o envio. Essa é uma possibilidade considerada no modelo conceitual do trabalho.

## Importância de desenhar a arquitetura antes de codificar

Desenhar a arquitetura é como fazer a planta de uma casa: permite visualizar como as partes se organizam e se conectam antes da construção. Isso ajuda a evitar retrabalho e a antecipar desafios de escala.

O diagrama também alinha o entendimento entre a equipe técnica e os stakeholders, como investidores e gerentes. Assim, todos podem compreender a visão geral do sistema e discutir suas responsabilidades e integrações.

## Entrega

- Diagrama de componentes UML editável: [diagrama-mensagens-whatsapp.drawio](./diagrama-mensagens-whatsapp.drawio).
- O diagrama identifica os principais componentes e suas conexões.
- **A entrega é 100% visual: não será desenvolvido código.**
- O diagrama pode ser aberto e editado no [draw.io](https://draw.io/) ou no Lucidchart.
