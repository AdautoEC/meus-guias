---
name: novo-guia
description: Criação e curadoria automatizada de guias no repositório meus-guias a partir de vídeos do YouTube, pesquisa de mercado brasileira e validação rigorosa pelo contrato.
---

# Skill: Novo Guia (`novo-guia`)

Esta skill orienta o agente de IA (como Claude Code ou Antigravity) no processo assistido de transformar um vídeo do YouTube em um guia Markdown estruturado, pronto para publicação no site desacoplado.

---

## Pré-requisitos do Ambiente

- `yt-dlp` instalado no PATH do sistema.
- `ffmpeg` (opcional, para captura de quadros de vídeo quando necessário dirimir dúvidas visuais de medidas).
- Node.js versão 20 ou superior.
- Git configurado com permissão de commit/push no repositório `meus-guias`.

---

## Fluxo de Execução em 9 Etapas

```
[1. Entrada & Slug]
       ↓
[2. Extração com yt-dlp]
       ↓
[3. Análise da Transcrição / Capítulos]
       ↓
[4. Pesquisa Web: Materiais, Preços Brasil, Variações]
       ↓
[5. Redação Estrita conforme CONTRATO.md]
       ↓
[6. Validação: node scripts/validate.mjs]
       ↓
[7. Apresentação do Pacote de Revisão]
       ↓
[8. GATE DE APROVAÇÃO HUMANA (Exclusivo: Espera "sim")]
       ↓
[9. Publicação: Atualização de status, Git commit & push / PR]
```

---

### Etapa 1: Entrada e Checagem de Slug
- Receba a URL do vídeo do YouTube.
- Gere uma sugestão de slug: minúsculo, sem acentos, palavras separadas por hífen (ex.: `mesa-lateral-paletes`).
- Verifique se `guias/<slug>.md` já existe. Se existir, adicione um sufixo ou alerte o usuário.

### Etapa 2: Extrair o Vídeo
- Execute `.claude/skills/novo-guia/extract-video.sh <URL>` ou os comandos equivalentes com `yt-dlp`:
  - `yt-dlp --dump-json "<URL>"` para extrair metadados (título original, canal, duração, capítulos).
  - `yt-dlp --write-subs --write-auto-subs --sub-lang "pt,en" --sub-format srt --skip-download -o "<DIR>/subtitles.%(ext)s" "<URL>"`.
- Se o vídeo não contiver legendas automáticas ou manuais:
  - **Alerte o usuário imediatamente**. Solicite uma transcrição manual ou resumo de etapas. **Nunca invente o conteúdo do vídeo**.

### Etapa 3: Entender o Conteúdo
- Leia a transcrição e mapeie a cronologia do projeto.
- Extraia os marcos de tempo (timestamps em segundos) para cada passo principal.

### Etapa 4: Pesquisa Complementar no Brasil
- Pesquise ferramentas equivalentes, insumos disponíveis em depósitos ou e-commerce brasileiros (MadeiraMadeira, Leroy Merlin, Mercado Livre) e estimativas realistas de custo (em BRL) com a data de referência atual (`cost_date: AAAA-MM`).
- Pesquise boas práticas de segurança (EPIs, cuidados elétricos ou de corte).
- Pesquise alternativas econômicas ou de materiais reciclados.

### Etapa 5: Redação Conforme o `CONTRATO.md`
- Redija o arquivo `guias/<slug>.md` com:
  - `status: rascunho`
  - Frontmatter completo com todos os campos obrigatórios.
  - Exatamente as 7 seções `##` obrigatórias na ordem do contrato:
    1. `## Materiais` (checklist `- [ ]`)
    2. `## Ferramentas` (checklist `- [ ]`)
    3. `## Passo a passo` (H3 com `{t=segundos}`)
    4. `## Variações`
    5. `## Reciclagem e economia`
    6. `## Dicas`
    7. `## Fontes`
- Todas as informações originadas da pesquisa externa recebem `*(pesquisado)*`.

### Etapa 6: Validação Prévia
- Execute no terminal:
  ```bash
  node scripts/validate.mjs
  ```
- O arquivo deve passar sem erros ou advertências impeditivas.

### Etapa 7: Montagem da Revisão
- Apresente ao usuário:
  - Título, slug, tempo estimado e estimativa de custo (`cost` e `cost_date`).
  - Lista de itens marcados como `*(pesquisado)*`.
  - Quaisquer pontos incertos ou medidas que precisem de confirmação.
  - Resumo dos passos com seus respectivos botões de tempo no vídeo.

### Etapa 8: Gate de Aprovação Obrigatório
- **PARE E AGUARDE**.
- Não faça commit nem push sem a confirmação explícita do usuário.
- Se o usuário solicitar ajustes de texto, materiais ou medidas, edite o arquivo e volte à Etapa 6.

### Etapa 9: Publicação
- Após a aprovação:
  1. Altere o campo `status` no frontmatter de `rascunho` para `publicado`.
  2. Atualize o campo `updated` com a data de hoje (`AAAA-MM-DD`).
  3. Execute `node scripts/build-index.mjs` para atualizar o índice local.
  4. Realize o commit e push:
     ```bash
     git add guias/<slug>.md index.json
     git commit -m "feat(guia): adicionar guia <slug>"
     git push
     ```
  5. (Ou, se configurado, crie uma branch e abra um Pull Request para revisão de terceiros).
