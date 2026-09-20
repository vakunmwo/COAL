# 10 — Infraestrutura e armadilhas

> Leia antes de codar.

---

# 1. Mapa de infraestrutura conhecido

## CoalUP TV / site
- Hostinger;
- PHP 8.2;
- MySQL;
- domínio `coalup.com.br`.

## CRM
Fonte histórica:
- React/Vite;
- `localStorage`;
- build single-file.

Evolução recente:
- CRM integrado/embutido no site está em construção;
- em 02/09/2026 havia hotfixes implementados/verificados;
- ponte site→CRM aparece no DDL/campos;
- deploy da fase mais recente **não deve ser presumido**.

## GlamBook
- Vercel;
- Next.js;
- Prisma;
- Postgres/Neon.

## Propostas/sites demo
- HTML autossuficiente é um padrão útil quando reduz dependência.

---

# 2. Pagamento — regra de ouro

Webhook é aviso.

**Nunca entregar só com webhook.**

Sempre:
1. receber;
2. reconfirmar na API;
3. validar;
4. aplicar idempotência;
5. executar a mutação.

InfinitePay:
- atenção a `invoice_slug` x `slug`;
- webhook pode repetir;
- resposta precisa ser rápida.

---

# 3. Códigos UniTV

16 dígitos.

Excel pode corromper silenciosamente.

Nunca transportar código de recarga via Excel/CSV.

---

# 4. Neon / Prisma

Banco gratuito pode dormir.

`connect_timeout` precisa considerar cold start.

Não diagnosticar P1001 automaticamente como rede.

---

# 5. Hostinger

- credenciais fora do `public_html`;
- `DirectoryIndex` precisa considerar `index.php`;
- conferir redirecionamento `www`;
- ao publicar demo em pasta, testar `.htaccess`.

---

# 6. Single-file — quando usar

Vantagens:
- deploy simples;
- fácil enviar/arquivar;
- versão única;
- funciona em hospedagem comum.

Riscos:
- base64 duplicado explode peso;
- manutenção manual vira perigosa;
- biblioteca externa fica bloqueante;
- um CSS errado afeta tudo.

Regras aprendidas:
- embutir só asset usado;
- CSS variable para base64 reutilizado;
- SVG inline para paths;
- orçamento de peso definido;
- backup por fase;
- hash/QA quando necessário.

---

# 7. Closet Rosa — armadilhas técnicas que viraram regra

## 7.1 “Inserido no código” não significa “visível”
Assets foram aplicados com 16–19% de opacidade e ninguém percebia.

Regra:
se desligar a camada visual e o site parecer igual, a direção de arte falhou.

Foi criado:
- `?art=on`
- `?art=off`

## 7.2 Mobile Grid 0px
Bug crítico no PDP:

o CSS Grid calculou a linha da imagem em `0px`, enquanto a mídia continuava visível
por `aspect-ratio`.

Resultado:
imagem e conteúdo se sobrepunham.

Correção:
no mobile portrait, PDP virou fluxo em bloco.

Nunca confiar apenas em estrutura DOM para QA visual.

## 7.3 Modal mobile
Regras consolidadas:
- close fora do scroller;
- `100dvh`;
- safe area;
- touch target ≥ 44px;
- CTA acessível;
- scroll lock;
- restaurar posição da página;
- resetar scroll ao trocar produto relacionado;
- focus trap.

## 7.4 Landscape
Celular landscape merece layout próprio quando há PDP complexo.

## 7.5 Safari
Chromium aprovado não significa Safari aprovado.

Quando cliente usa iPhone:
fazer smoke test físico em Safari antes de apresentar/publicar.

---

# 8. QA técnico

Antes de congelar:
- `node --check`;
- IDs duplicados com parser HTML real, não regex ingênuo;
- console;
- overflow horizontal;
- mobile 320/360/390/430;
- landscape;
- desktop;
- reduced motion;
- fluxo comercial;
- restauração de scroll.

---

# 9. Falha silenciosa

Não aceitar:
- `catch {}` vazio;
- fallback que apaga dado;
- save sem retorno;
- erro só em console quando usuário precisa agir.

Erro precisa:
- aparecer;
- preservar contexto;
- permitir correção.

---

# 10. Segurança

Nunca colocar em fonte de IA:
- senha;
- chave privada;
- credencial de fornecedor;
- dado de cartão;
- backup com credencial de cliente.

Use placeholder.

Arquivos legados já tiveram credenciais em texto puro.
Não transportar isso para a base nova.
