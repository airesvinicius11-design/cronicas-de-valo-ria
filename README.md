👑 Crônicas de Valória - RPG 2D (Versão Beta)

Bem-vindo a Crônicas de Valória, um RPG 2D de ação e aventura imersivo desenvolvido em JavaScript puro, Canvas HTML5 e Tailwind CSS. Explore vilarejos vibrantes, enfrente monstros perigosos nas florestas, complete missões, colete tesouros e forje a sua lenda!

🗺️ Visão Geral do Mundo

O jogo se passa em um vasto mundo aberto com motor de colisão deslizante e ordenação de profundidade (Y-sorting 2D). Explore regiões como:

Bosque de Valória: O ponto de partida e lar de aliados e mercadores.

Porto das Brumas: Uma região costeira repleta de esqueletos corsários e tesouros marinhos.

Cidadela das Cinzas: Terras rúnicas guardadas por golens de pedra ferozes.

Terras Vulcânicas: Região de perigos extremos e chefes formidáveis.

🛡️ Classes de Heróis Disponíveis

Ao iniciar sua jornada, você pode escolher entre 4 classes distintas, cada uma com atributos, armas e estilos de combate próprios:

🧙‍♂️ Mago Arcano: Domina os ventos mágicos e dispara esferas de pura energia arcana à distância. (Arma inicial: Cajado do Orbe Azul)

🪓 Bárbaro Nórdico: Guerreiro bruto das montanhas gélidas que esmaga inimigos com força bruta. (Arma inicial: Machado Duplo Nórdico)

🛡️ Cavaleiro Real: Defensor jurado do trono, empunha espada e escudo com honra inabalável. (Arma inicial: Espada Real & Escudo)

🏹 Arqueiro da Floresta: Mestre batedor que ataca das sombras com precisão cirúrgica. (Arma inicial: Arco Élfico)

🎮 Controles

💻 No Computador (PC)

Movimentação: Teclas W, A, S, D ou Setas Direcionais.

Atacar / Interagir com NPC: Clique do Mouse (em cima do alvo ou monstro).

Interagir com Objetos/Baús: Tecla E.

Inventário: Tecla J.

Beber Poção de Vida: Tecla H.

Salvar Progresso: Tecla Z.

📱 No Dispositivo Móvel (Touch)

Movimentação: Joystick virtual analógico na parte inferior esquerda.

Ações: Botões dedicados na parte inferior direita para Atacar, Interagir (E) e Beber Poção (H).

✨ Principais Recursos

Sistema de Combate Dinâmico: Combos de eliminação consecutiva que aumentam os bônus de XP, projéteis customizados (esferas arcanas e flechas) e ataques corporais.

Diário de Missões: Missões secundárias e principais interativas concedidas por NPCs, com recompensas em XP, Ouro e Armas Raras.

Mochila & Inventário Completo: Gerencie armas equipadas, poções e Tomos de Sabedoria mágicos.

Evolução de Personagem: Sistema progressivo de níveis (curva de XP baseada em progressão geométrica) que aumenta vida, ataque e defesa automaticamente a cada nível ganho.

Salvamento Automático: Seus dados de progresso, inventário e missões são salvos automaticamente no localStorage do navegador (e a cada 45 segundos) com opção de carregar partidas salvas a qualquer momento.

Relatório de Erros Integrado: Ferramenta na tela de menu principal para reportar bugs diretamente por e-mail. 

🚀 Como Jogar

Como este projeto utiliza uma arquitetura modular limpa, certifique-se de manter os três arquivos principais na mesma pasta:

index.html (Estrutura e interfaces UI)

style.css (Estilizações customizadas e animações)

script.js (Motor gráfico do Canvas, física e lógica de jogo)

Basta abrir o arquivo link em qualquer navegador!

Atualização BETA(0.01)

A primeia atualização do jogo,trazendo melhorias graficas, visuais e na jogabilidade. Aqui abaixo está oque foi adicionado e melhorado nessa versão do jogo

1. Correção de Erros Críticos (Bug Fix)

    Visibilidade de Monstros e Animais: Correção do erro de sintaxe no código JavaScript (causado por uma duplicação na função drawEnemy e chaves extras em drawBossTexture), que impedia a renderização gráfica correta e deixava as entidades invisíveis.

2. Sistema de Contas e Identificação

    IDs Aleatórios (VAL-XXXX): Implementação de um sistema de identificação onde cada conta gera um código único.

    Múltiplas Contas & Amigos: Suporte para alternar entre diferentes contas locais, gerenciar perfis e manter uma lista de amigos integrada.

3. Multiplayer Cooperativo Online (PeerJS)

    Conexão P2P com Amigos: Integração com o PeerJS para partidas cooperativas diretas utilizando os IDs de Valória dos amigos.

    Sincronização em Tempo Real: Transmissão de posições, animações de movimento, direções e ataques do jogador parceiro no mapa.

    Indicador de Direção: Inclusão de um indicador na interface que aponta a localização exata do amigo caso ele esteja fora do enquadramento da câmara.

4. Mecânicas de RPG e Progressão

    Sistema de Missões (Quests): Adição de missões distribuídas por NPCs no mapa, com acompanhamento de progresso e recompensas em XP, ouro e armas lendárias.

    Inventário Completo: Sistema de itens interativo com suporte a poções de vida, tomos de sabedoria (que concedem XP ao ler) e troca/equipamento de armas (como cajados, machados, espadas e arcos).

    Sistema de Combate e Combos: Contador de combos ativos que bonificam o jogador com mais XP ao derrotar inimigos em sequência.

    Exploração de Regiões: Detecção automática de novas áreas (Bosque de Valória, Porto das Brumas, Cidadela das Cinzas) com bônus de descoberta e XP.

5. Gráficos, Interface e Controles

    Texturas Customizadas por Entidade: Criação de visuais detalhados em estilo cartoon para classes de personagens e diferentes tipos de monstros e chefes (Slimes, Goblins, Lobos Sombrios, Esqueletos Corsários, Golens de Pedra, Chefes Grommash e Colosso Ignis).

    Controles Dual (Mobile & PC): Suporte completo para joystick virtual em dispositivos móveis e atalhos de teclado/mouse no PC, com proteções contra cliques acidentais ao preencher formulários. 
