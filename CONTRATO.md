# Contrato de Formatação de Guias (`CONTRATO.md`)

Este documento define o contrato estrito de dados para todos os guias mantidos no repositório `meus-guias`. A skill de curadoria (`novo-guia`), o validador de CI (`validate.mjs`), o indexador (`build-index.mjs`) e a aplicação web (`site`) dependem exclusivamente desta especificação.

---

## 1. Frontmatter Obrigatório (YAML)

Cada guia deve ser um arquivo Markdown (`.md`) localizado na pasta `guias/`, com o nome no formato `<slug>.md`.

O bloco de frontmatter no topo do arquivo é delimitado por `---` e deve conter obrigatoriamente os seguintes campos:

```yaml
---
title: "Nome do Guia Completo e Claro"
slug: "nome-do-guia-completo-e-claro"
summary: "Resumo objetivo do projeto com no máximo 200 caracteres."
tags:
  - marcenaria
  - diy
  - oficina
difficulty: "médio"
time: "6h"
cost: "R$ 180"
cost_date: "2026-11"
video:
  id: "dQw4w9WgXcQ"
  credit: "Nome do Canal ou Criador"
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
updated: "2026-11-12"
status: "publicado"
---
```

### Regras dos Campos

| Campo | Tipo / Restrição | Descrição |
| :--- | :--- | :--- |
| `title` | String (não vazia) | Título legível do guia. |
| `slug` | String (kebab-case) | Deve ser exatamente igual ao nome do arquivo sem `.md`. Apenas letras minúsculas, números e hífens. Sem acentos. |
| `summary` | String (≤ 200 caracteres) | Breve sinopse utilizada na busca e nos cards da listagem. |
| `tags` | Lista de Strings (1 a 6 itens) | Termos em minúsculas para filtragem categórica. |
| `difficulty` | Enum: `fácil`, `médio`, `difícil` | Nível de complexidade de execução. |
| `time` | String (ex.: `2h`, `45min`, `1 dia`) | Estimativa de tempo de execução. |
| `cost` | String (ex.: `R$ 150`, `Gratuito`) | Estimativa de custo aproximado de materiais. |
| `cost_date` | String no formato `AAAA-MM` | Mês e ano da cotação de custos para transparência temporal. |
| `video.id` | String (11 caracteres alfanuméricos) | Identificador único do vídeo no YouTube. |
| `video.credit`| String (não vazia) | Nome do criador original / canal proprietário do vídeo. |
| `video.url` | String (URL válida do YouTube) | Link direto para o vídeo original. |
| `updated` | Data no formato `AAAA-MM-DD` | Data da última atualização do guia. |
| `status` | Enum: `rascunho`, `publicado` | Apenas guias com `status: publicado` são incluídos no `index.json`. |

---

## 2. Estrutura de Cabeçalhos (H2 Fixos)

O corpo do guia deve conter **exatamente os seguintes cabeçalhos de nível 2 (`##`)**, respeitando esta **ordem exata**:

1. `## Materiais`
2. `## Ferramentas`
3. `## Passo a passo`
4. `## Variações`
5. `## Reciclagem e economia`
6. `## Dicas`
7. `## Fontes`

---

## 3. Convenções do Corpo do Documento

### Checklist de Materiais e Ferramentas
Nas seções `## Materiais` e `## Ferramentas`, cada item deve ser formatado como uma tarefa de checklist Markdown:
```markdown
## Materiais
- [ ] Tábua de pinus 20x200cm (2 unidades)
- [ ] Parafusos soberbos 4x40mm (30 unidades)
- [ ] Cola para madeira PVA *(pesquisado)* (1 tubo 250g)

## Ferramentas
- [ ] Serra tico-tico ou serrote manual
- [ ] Parafusadeira ou chave Philips
- [ ] Lixa para madeira grão 120
```

### Passos Numerados e Timestamps
Na seção `## Passo a passo`, cada etapa é representada por um cabeçalho de nível 3 (`###`) sequencial e numerado:
- Se houver timestamp correspondente no vídeo, inclua a anotação `{t=<segundos>}` ao final da linha do título.
- O site converterá essa anotação no botão interativo **"Ver no vídeo"**, sincronizando o player embutido no segundo indicado.

Exemplo:
```markdown
### 1. Medir e traçar as peças {t=45}
Trace os cortes com esquadro nas duas tábuas principais.

### 2. Efetuar o corte das travessas {t=112}
Utilize o serrote mantendo a linha reta e lixe as rebarbas.
```

### Marcação de Pesquisa Externa
Qualquer informação que não tenha sido dita ou mostrada explicitamente no vídeo original, mas que tenha sido adicionada por pesquisa externa (ex.: nomes técnicos de peças, marcas recomendadas no Brasil, preços médios), deve receber o sufixo:
`*(pesquisado)*`

### Imagens Locais
Imagens complementares devem ser salvas na pasta `guias/img/<slug>/` e referenciadas com caminho relativo:
`![Legenda da imagem](img/<slug>/detalhe-encaixe.jpg)`

---

## 4. Segurança e Higiene de Conteúdo

- Não é permitida a inclusão de tags HTML executáveis (`<script>`, `<iframe>`, `<object>`, `<embed>`, `<style>`, atributos `onload/onclick`).
- Todo o HTML gerado no frontend passa adicionalmente por sanitização estrita via `DOMPurify`.
