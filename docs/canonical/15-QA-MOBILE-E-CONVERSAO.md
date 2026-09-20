# 15 — QA Mobile e Conversão

Frente 2 e 3.

Agente correspondente: `AGENTES/08-QA-MOBILE.md`.

---

# 1. Missão

Testar como usuário real.

Não “revisar design”.
Não confiar em código porque parece correto.

---

# 2. Viewports mínimas aprendidas

Portrait:
- 320×568;
- 360×800;
- 390×844;
- 430×932.

Landscape:
- 844×390.

Desktop de regressão:
- 1440×900.

Quando cliente usa iPhone:
**Safari físico continua gate recomendado.**

---

# 3. Fluxo real

QA deve tocar:
- entrada;
- menu;
- scroll;
- card;
- PDP;
- fechar;
- voltar;
- variações;
- CTA;
- WhatsApp;
- Provador;
- relacionados;
- Tour;
- modal;
- landscape.

---

# 4. O que inspecionar

- overflow horizontal;
- elemento atrás de modal;
- botão inalcançável;
- scroll preso;
- página de fundo movendo;
- touch target pequeno;
- copy truncada;
- CTA escondido;
- safe area;
- teclado;
- foco;
- `100dvh`;
- reduced motion.

---

# 5. Caso crítico do PDP

Sintoma:
imagem e conteúdo se sobrepondo.

Causa:
CSS Grid com primeira linha calculada em 0px e mídia transbordando.

Lição:
**DOM correto não garante layout correto.**

Use browser real/emulação real e screenshot.

---

# 6. Modal mobile robusto

Preferir:
- fluxo natural;
- close fixo fora do scroller;
- scroll interno previsível;
- lock da página;
- restauração exata;
- focus trap;
- Escape;
- CTA acessível;
- safe area.

---

# 7. QA técnico

- JS syntax;
- IDs;
- console;
- fallback;
- reduced motion;
- performance;
- eventos.

Parser HTML real para IDs.
Regex pode gerar falso positivo em strings JS.

---

# 8. Gate

Não declarar “aprovado visualmente” se não renderizou.

Status possíveis:
- aprovado;
- reprovado;
- bloqueado pelo ambiente.

Honestidade no QA é parte do produto.
