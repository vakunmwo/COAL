# COMO APLICAR ESTE PATCH

1. NÃO faça commit do ZIP.
2. Extraia localmente.
3. No repositório, preserve a tentativa React/inglês apenas como arquivo histórico, por exemplo:
   `archive/google-ai-wrong-v1/`
4. Copie `index.html` e `assets/` deste pacote para a RAIZ do repositório.
5. Faça commit e push.
6. Confirme no GitHub que existem:
   - `/index.html`
   - `/assets/v104-funnel.js`
   - `/assets/v104-context.js`
   - `/assets/v104-readability.css`
7. Só depois repita o inventário no AI Studio.

Se a aplicação em React (`src/components/PipelineBoard.tsx`) continuar sendo a entrada ativa do preview,
o Google continuará mapeando o produto errado.
