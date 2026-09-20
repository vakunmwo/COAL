# 12 — Arquitetura de agentes e IAs

A COAL UP não deve depender de “um chat que faz tudo”.

Agente bom tem:
- uma frente;
- uma missão;
- entrada clara;
- saída clara;
- limite;
- fonte mínima.

---

# 1. Agentes ativos recomendados

1. **Atendente CoalUP TV**
2. **Operador de Prospect**
3. **Conselheiro**
4. **Engenheiro**
5. **Editor de Marca**
6. **Orquestrador GMN**
7. **Tratamento de Fotos**
8. **QA Mobile**
9. **Direção Criativa Digital**
10. **Auditor de Handoff**

Prompts completos na pasta `AGENTES`.

---

# 2. Regra de contexto

Não anexar tudo em todos os agentes.

Excesso de contexto:
- aumenta conflito;
- aumenta resposta genérica;
- piora foco.

Cada agente deve receber:
- `00`;
- fontes da sua frente;
- fonte específica da tarefa.

---

# 3. Um cliente/prospect por conversa

Marketing:
- um prospect por chat;
- um cliente em execução por chat;
- QA separado quando necessário.

Não misturar histórico de duas empresas.

---

# 4. Fluxo ChatGPT ↔ Claude

## ChatGPT pode preparar
- dossiê;
- arquitetura;
- plano;
- decisões;
- protótipo;
- QA;
- pacote.

## Claude pode receber
- handoff;
- arquivos;
- código;
- estado;
- conflitos.

Primeira resposta do receptor:
- ENTENDI;
- ESTADO;
- GAP;
- CONFLITOS;
- ORDEM;
- NÃO VOU MEXER.

Só depois implementar.

---

# 5. Jhonatan é o gate humano

IA não:
- publica;
- aceita contrato;
- confirma dado de cliente;
- escolhe entre conflito comercial;
- inventa biografia;
- promete política;
- muda preço por conta própria.

---

# 6. Memória vira arquivo

Decisão importante não pode morrer no chat.

Ao encerrar:
- resumir decisão;
- atualizar fonte;
- registrar conflito;
- versionar.

É assim que o próximo agente não repete conselho velho.
