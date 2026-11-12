# 📚 Meus Guias (`meus-guias`)

> Repositório de conteúdo estruturado em Markdown para o ecossistema de **Site de Guias Desacoplado**.

Este repositório atua como a única fonte de verdade para os guias e projetos DIY. Ele não contém código de renderização ou backend web — apenas arquivos de conteúdo (`guias/*.md`), imagens associadas, rotinas de validação de dados e a automação de compilação do catálogo de busca (`index.json`).

---

## 🎯 Arquitetura e Papel no Ecossistema

O projeto segue o padrão **Desacoplado (Headless)**:

1. **Criação e Curadoria:** Você ou a skill de IA (`novo-guia`) extraem conteúdo de vídeos do YouTube, pesquisam insumos/preços locais e formatam o guia seguindo o [CONTRATO.md](./CONTRATO.md).
2. **Validação Automática:** Cada alteração em `guias/` é validada pelo script `scripts/validate.mjs` para garantir conformidade estrita de tipos, estrutura e segurança.
3. **Indexação:** O script `scripts/build-index.mjs` extrai metadados, materiais e corpo de texto limpo dos guias com `status: publicado`, gerando o arquivo `index.json`.
4. **Distribuição:** A GitHub Action roda a cada `git push`, valida o repositório e atualiza o `index.json`. A aplicação frontend ([site](../site)) consome o índice e os arquivos `.md` diretamente via CDN ou GitHub Raw.

---

## 📁 Estrutura de Pastas

```
meus-guias/
├── .claude/
│   └── skills/
│       └── novo-guia/
│           ├── SKILL.md             # Instruções e protocolo da skill de IA
│           └── extract-video.sh     # Script auxiliar de extração (yt-dlp)
├── .github/
│   └── workflows/
│       └── index.yml                # CI/CD: validação e geração do index.json
├── guias/
│   ├── bancada-de-marcenaria-compacta.md  # Guias de exemplo em Markdown
│   └── img/                         # Imagens locais organizadas por slug
│       └── .gitkeep
├── scripts/
│   ├── build-index.mjs              # Gerador do catálogo de busca (index.json)
│   └── validate.mjs                 # Validador sintático e semântico do contrato
├── CONTRATO.md                      # Especificação técnica do formato do guia
├── index.json                       # Catálogo gerado consumido pelo site
├── package.json                     # Scripts utilitários de desenvolvimento
└── README.md                        # Esta documentação
```

---

## 📋 Regras de Formatação ([CONTRATO.md](./CONTRATO.md))

Todo guia deve cumprir rigorosamente o contrato:
- **Nome do arquivo:** `guias/<slug>.md`.
- **Frontmatter obrigatório:** `title`, `slug`, `summary` (≤200 chars), `tags` (1 a 6 minúsculas), `difficulty`, `time`, `cost`, `cost_date` (`AAAA-MM`), `video` (`id`, `credit`, `url`), `updated` (`AAAA-MM-DD`) e `status` (`rascunho` ou `publicado`).
- **7 Cabeçalhos H2 fixos na ordem:**
  1. `## Materiais` (checklist `- [ ] item`)
  2. `## Ferramentas` (checklist `- [ ] item`)
  3. `## Passo a passo` (passos numerados `### N. Nome {t=segundos}`)
  4. `## Variações`
  5. `## Reciclagem e economia`
  6. `## Dicas`
  7. `## Fontes`
- Informações obtidas via pesquisa externa (e não do vídeo) recebem `*(pesquisado)*`.

---

## 🚀 Como Usar no Dia a Dia

### 1. Validar os guias manualmente
```bash
npm run validate
# ou
node scripts/validate.mjs
```

### 2. Atualizar o `index.json` localmente
```bash
npm run build:index
# ou
node scripts/build-index.mjs
```

### 3. Criar um novo guia com a Skill (`novo-guia`)
No terminal ou chat do seu agente (Claude Code / Antigravity):
```text
novo guia https://www.youtube.com/watch?v=EXEMPLO
```
O agente irá:
1. Extrair os metadados e legendas via `yt-dlp`.
2. Pesquisar materiais, preços em Reais (BRL) e dicas de segurança.
3. Gerar o rascunho em `guias/<slug>.md`.
4. Executar `validate.mjs`.
5. Apresentar o resumo para sua revisão.
6. **Aguardar sua aprovação explícita** antes de publicar.
