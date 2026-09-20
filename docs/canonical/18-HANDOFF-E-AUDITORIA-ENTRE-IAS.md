# 18 — Handoff e auditoria entre IAs

A COAL UP usa múltiplas IAs.
Sem handoff, elas recriam decisões e introduzem regressão.

---

# 1. Handoff mínimo

Todo pacote deve dizer:

- frente;
- cliente/prospect;
- objetivo;
- fatos;
- inferências;
- lacunas;
- decisões;
- proibições;
- estado atual;
- arquivos;
- conflitos;
- próximo gate.

---

# 2. Primeira resposta da IA receptora

Antes de alterar:

## ENTENDI
objetivo.

## ESTADO ATUAL
o que existe.

## GAP
o que falta.

## CONFLITOS
fontes/código.

## ORDEM
sequência.

## NÃO VOU MEXER AINDA
o que exige autorização.

Depois parar.

---

# 3. Não recomeçar por gosto

A IA receptora não deve:

> “reconstruir tudo na minha arquitetura”

sem provar ganho.

Comparar:
- UX;
- CRO;
- performance;
- manutenção;
- acessibilidade;
- risco;
- esforço.

---

# 4. Produção paralela

Pode ser útil:
- ChatGPT implementa;
- Claude implementa/audita;
- depois comparar.

A comparação deve responder:
- qual parte de cada versão é superior?
- o que preservar?
- onde fundir?
- qual regressão pode entrar?

---

# 5. Gate de código

Antes de editar:
- backup;
- fonte de verdade;
- arquitetura;
- regras comerciais;
- QA esperado.

Depois:
- diff;
- testes;
- relatório;
- artefato final.

---

# 6. Handoff de cliente

Nunca carregar:
- credencial;
- senha;
- dado desnecessário;
- política não confirmada.

Cliente real:
dado ausente continua ausente.

---

# 7. Claude como fonte

Para atualizar Claude:
subir `FONTES-CANONICAS` + agentes necessários.

**Não subir `LEGADO-ORIGINAL` junto como fonte ativa.**

O legado serve para:
- auditoria histórica;
- entender mudança;
- recuperar detalhe.

Não para governar decisão atual.
