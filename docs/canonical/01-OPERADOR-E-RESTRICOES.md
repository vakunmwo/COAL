# 01 — O operador e as restrições

> Revisado em 06/09/2026.
>
> Valores pessoais antigos foram preservados no legado, mas não são tratados aqui
> como números atuais sem confirmação.

# 1. Restrição central

Jhonatan opera a COAL UP sozinho e mantém emprego fixo no turno da noite.

A função exata aparece de formas diferentes em fontes antigas
(`auxiliar de produção` / `auxiliar de logística`). **Não escolher uma como atual sem
confirmar.**

O que é estável para decisão:

- não há funcionário;
- não há a quem delegar;
- as horas do negócio saem do descanso;
- custo recorrente ruim corrói liberdade;
- operação manual recorrente precisa ser reduzida;
- portfólio só vale se reduzir o custo do próximo projeto.

---

# 2. Como decidir

Passe qualquer ideia por estes filtros:

1. **Quantas horas recorrentes custa?**
2. **É receita pontual ou recorrente?**
3. **Cria dependência manual do Jhonatan?**
4. **Precisa de ferramenta paga?**
5. **O que a ferramenta substitui?**
6. **O processo fica mais reaproveitável depois?**

Não usar números antigos de receita/hora como atuais sem confirmação.

---

# 3. Filosofia operacional

A frase que virou regra de engenharia:

> “Assim como aplicativos de bancos não podemos deixar nenhuma chance de falha, e se
> tiver falha o usuário precisa ter a opção de corrigir.”

Consequências:

- falha silenciosa é proibida;
- dado não pode sumir sem aviso;
- erro precisa dizer o que aconteceu;
- usuário precisa ter caminho de correção;
- exclusão crítica deve ser restaurável;
- ação financeira deve ser idempotente;
- QA precisa testar comportamento real, não só código.

---

# 4. Prioridade atual da empresa

A direção recente é **usar Marketing para levantar caixa e portfólio**, ao mesmo
tempo em que Jhonatan estrutura automações para reduzir o X1 manual.

Exemplos de automação desejada:
- agente para atendimento da CoalUP TV;
- agente para prospecção e qualificação de lead;
- onboarding de cliente;
- CRM integrado ao site;
- auditoria e produção apoiadas por IA.

Isso não significa abandonar a Frente 1; significa diminuir a dor operacional antes
de voltar a escalar aquisição.

---

# 5. Regra de ferramenta

Padrão de preferência:

1. gratuito;
2. autohospedado;
3. construído;
4. pago apenas se economizar tempo/risco suficiente.

Ao recomendar assinatura paga, responda:

`custo mensal ÷ economia/ganho mensal = prazo de payback`

Se não existe dado para fazer a conta, diga o que falta.

---

# 6. Regra de portfólio

Preço abaixo do valor de referência só se justifica quando existe contrapartida real.

Exemplo usado na Closet Rosa:
- valor de referência: R$1.490;
- condição de portfólio: R$500;
- contrapartida: autorização específica para case.

Não chamar de “desconto” genérico sem explicar o motivo.
