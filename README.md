# Zelda GBI

Jogo de aventura top-down no estilo Zelda, ambientado em um mapa inspirado em **Guanambi, Bahia**. Você é Link, um adolescente moderno (boné, camiseta, jeans, tênis e mochila) que usa espada e escudo.

## Como jogar

Não precisa instalar nada. Abra o `index.html` no navegador (dois cliques no arquivo).

No PowerShell:

```powershell
Start-Process .\index.html
```

Na tela de título, clique na página e aperte **Enter**.

## Controles

| Tecla | Ação |
|---|---|
| Setas / WASD | Andar |
| Z ou J | Espada |
| X ou K (segurar) | Escudo (bloqueia golpes de frente, mas deixa você mais lento) |
| Enter ou E | Falar com NPCs / avançar diálogo |
| M | Mostrar/esconder minimapa |
| P ou Esc | Pausar |
| C (na tela de título) | Continuar jogo salvo |

O progresso é salvo automaticamente no navegador (localStorage).

## O mapa

- **Guanambi — Área Urbana:** ruas, praça com igreja e o **Monte Pascoal**, com um mirante.
- **Zona rural:** caatinga, roças, açude, sítios e trilhas.
- **Mutans (distrito):** vila aos pés da **Serra de Mutans**, que inclui a **Serra da Mandiroba**.
- **Caetité:** cidade vizinha, ligada por estrada.
- **Palmas de Monte Alta:** cidade a oeste, também ligada por estrada.

A disposição das regiões é esquemática, não uma reprodução fiel do mapa real.

## Missão

Fale com o **Seu Zé**, na praça de Guanambi. O Guardião da Mandiroba roubou o Cristal da Mandiroba: vá até Mutans, suba a trilha da serra, derrote o Guardião e devolva o cristal.

## Inimigos

Cachorros de rua (cidades), escorpiões e cobras (zona rural), morcegos (serras) e o Guardião da Mandiroba (chefe).

## Estrutura

```
index.html      página e canvas
src/world.js    mapa em tiles, regiões e geração do mundo
src/game.js     loop, Link, combate, inimigos, NPCs, HUD e save
```

Feito com HTML5 Canvas e JavaScript puro, sem dependências. A arte é desenhada por código.
