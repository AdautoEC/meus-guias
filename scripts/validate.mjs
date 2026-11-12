#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const GUIAS_DIR = path.join(REPO_ROOT, 'guias');

const REQUIRED_H2_ORDER = [
  'Materiais',
  'Ferramentas',
  'Passo a passo',
  'Variações',
  'Reciclagem e economia',
  'Dicas',
  'Fontes'
];

const FORBIDDEN_HTML_TAGS = /<\s*(script|iframe|object|embed|style|meta|link|base|form|input|button)[\s>]/i;
const FORBIDDEN_HTML_ATTRIBUTES = /\son\w+\s*=/i; // on* event handlers

function parseSimpleYamlFrontmatter(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/);
  if (!match) {
    throw new Error('Frontmatter inválido ou ausente. O arquivo deve começar com --- delimitando o YAML.');
  }
  const yamlText = match[1];
  const bodyText = match[2] || '';

  const data = {};
  const lines = yamlText.split(/\r?\n/);
  let currentKey = null;
  let inList = false;
  let inObject = false;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check list item
    if (rawLine.startsWith('  - ') || rawLine.startsWith(' - ') || trimmed.startsWith('- ')) {
      const val = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
      if (currentKey && Array.isArray(data[currentKey])) {
        data[currentKey].push(val);
      }
      continue;
    }

    // Check nested object field (e.g., video.id)
    if (rawLine.startsWith('  ') && currentKey && typeof data[currentKey] === 'object' && !Array.isArray(data[currentKey])) {
      const subMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (subMatch) {
        const subKey = subMatch[1];
        let subVal = subMatch[2].trim();
        subVal = subVal.replace(/^['"]|['"]$/g, '');
        data[currentKey][subKey] = subVal;
      }
      continue;
    }

    // Top-level key
    const matchKey = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (matchKey) {
      currentKey = matchKey[1];
      let value = matchKey[2].trim();
      if (value === '') {
        // Look ahead or set up list/object
        if (currentKey === 'tags') {
          data[currentKey] = [];
        } else if (currentKey === 'video') {
          data[currentKey] = {};
        } else {
          data[currentKey] = '';
        }
      } else {
        value = value.replace(/^['"]|['"]$/g, '');
        data[currentKey] = value;
      }
    }
  }

  return { meta: data, body: bodyText };
}

function validateGuideFile(filePath, seenSlugs) {
  const fileName = path.basename(filePath);
  const errors = [];
  const content = fs.readFileSync(filePath, 'utf8');

  let parsed;
  try {
    parsed = parseSimpleYamlFrontmatter(content);
  } catch (err) {
    return [`[${fileName}] Erro de sintaxe no Frontmatter: ${err.message}`];
  }

  const { meta, body } = parsed;
  const expectedSlug = fileName.replace(/\.md$/, '');

  // 1. Slug verification
  if (!meta.slug) {
    errors.push(`Campo 'slug' ausente no frontmatter.`);
  } else {
    if (meta.slug !== expectedSlug) {
      errors.push(`Slug '${meta.slug}' não confere com o nome do arquivo '${expectedSlug}'.`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
      errors.push(`Slug '${meta.slug}' contém caracteres inválidos. Use apenas minúsculas, números e hífens.`);
    }
    if (seenSlugs.has(meta.slug)) {
      errors.push(`Slug duplicado detectado: '${meta.slug}'.`);
    } else {
      seenSlugs.add(meta.slug);
    }
  }

  // 2. Title & summary
  if (!meta.title || typeof meta.title !== 'string' || meta.title.trim().length === 0) {
    errors.push(`Campo 'title' obrigatório e não pode ser vazio.`);
  }
  if (!meta.summary || typeof meta.summary !== 'string') {
    errors.push(`Campo 'summary' obrigatório.`);
  } else if (meta.summary.length > 200) {
    errors.push(`Campo 'summary' excede 200 caracteres (atual: ${meta.summary.length}).`);
  }

  // 3. Tags
  if (!Array.isArray(meta.tags) || meta.tags.length === 0) {
    errors.push(`Campo 'tags' deve conter entre 1 e 6 tags.`);
  } else if (meta.tags.length > 6) {
    errors.push(`Campo 'tags' possui mais de 6 tags (atual: ${meta.tags.length}).`);
  } else {
    for (const tag of meta.tags) {
      if (tag !== tag.toLowerCase()) {
        errors.push(`Tag '${tag}' deve ser toda em minúsculas.`);
      }
    }
  }

  // 4. Difficulty, time, cost, cost_date
  const allowedDifficulties = ['fácil', 'médio', 'difícil'];
  if (!allowedDifficulties.includes(meta.difficulty)) {
    errors.push(`Campo 'difficulty' ('${meta.difficulty}') inválido. Valores permitidos: fácil, médio, difícil.`);
  }
  if (!meta.time || typeof meta.time !== 'string') {
    errors.push(`Campo 'time' obrigatório (ex.: '6h', '45min').`);
  }
  if (!meta.cost || typeof meta.cost !== 'string') {
    errors.push(`Campo 'cost' obrigatório (ex.: 'R$ 180').`);
  }
  if (!meta.cost_date || !/^\d{4}-\d{2}$/.test(meta.cost_date)) {
    errors.push(`Campo 'cost_date' ('${meta.cost_date}') deve estar no formato AAAA-MM.`);
  }

  // 5. Video object
  if (!meta.video || typeof meta.video !== 'object') {
    errors.push(`Objeto 'video' obrigatório no frontmatter.`);
  } else {
    if (!meta.video.id || !/^[a-zA-Z0-9_-]{11}$/.test(meta.video.id)) {
      errors.push(`video.id ('${meta.video?.id}') deve ser um ID de YouTube com 11 caracteres.`);
    }
    if (!meta.video.credit || meta.video.credit.trim().length === 0) {
      errors.push(`video.credit é obrigatório.`);
    }
    if (!meta.video.url || !meta.video.url.startsWith('http')) {
      errors.push(`video.url ('${meta.video?.url}') deve ser uma URL válida.`);
    }
  }

  // 6. Updated & status
  if (!meta.updated || !/^\d{4}-\d{2}-\d{2}$/.test(meta.updated)) {
    errors.push(`Campo 'updated' ('${meta.updated}') deve estar no formato AAAA-MM-DD.`);
  }
  const allowedStatus = ['rascunho', 'publicado'];
  if (!allowedStatus.includes(meta.status)) {
    errors.push(`Campo 'status' ('${meta.status}') inválido. Valores permitidos: rascunho, publicado.`);
  }

  // 7. Security: Dangerous HTML tags or attributes
  if (FORBIDDEN_HTML_TAGS.test(body) || FORBIDDEN_HTML_ATTRIBUTES.test(body)) {
    errors.push(`Código HTML inseguro detectado no corpo do guia.`);
  }

  // 8. Fixed H2 headers in exact order
  const h2Matches = [...body.matchAll(/^##\s+([^\r\n]+)$/gm)].map(m => m[1].trim());
  if (h2Matches.length !== REQUIRED_H2_ORDER.length) {
    errors.push(
      `O guia deve ter exatamente 7 seções H2. Encontradas: ${h2Matches.length} (${h2Matches.join(', ')}). Esperadas: ${REQUIRED_H2_ORDER.join(', ')}`
    );
  } else {
    for (let i = 0; i < REQUIRED_H2_ORDER.length; i++) {
      if (h2Matches[i] !== REQUIRED_H2_ORDER[i]) {
        errors.push(
          `Cabeçalho H2 na posição ${i + 1} incorreto. Encontrado: '## ${h2Matches[i]}', Esperado: '## ${REQUIRED_H2_ORDER[i]}'.`
        );
      }
    }
  }

  // 9. Timestamps in H3 of Passo a passo
  const timestampRegex = /###\s+\d+\.\s+.*\{t=(\d+)\}/g;
  const invalidTimestampRegex = /###\s+\d+\.\s+.*\{t=[^}]*\}/g;
  const allH3Timestamps = body.match(invalidTimestampRegex) || [];
  for (const match of allH3Timestamps) {
    if (!/\{t=\d+\}/.test(match)) {
      errors.push(`Timestamp com formato inválido: '${match}'. Deve ser número inteiro em segundos, ex: {t=120}.`);
    }
  }

  // 10. Verify local images if any are referenced
  const imgMatches = [...body.matchAll(/!\[[^\]]*\]\((img\/[^)]+)\)/g)];
  for (const imgMatch of imgMatches) {
    const relImgPath = imgMatch[1];
    const fullImgPath = path.join(GUIAS_DIR, relImgPath);
    if (!fs.existsSync(fullImgPath)) {
      errors.push(`Imagem referenciada não encontrada no disco: '${relImgPath}'.`);
    }
  }

  return errors.map(err => `[${fileName}] ${err}`);
}

function runValidation() {
  console.log('🔍 Iniciando validação dos guias em:', GUIAS_DIR);
  if (!fs.existsSync(GUIAS_DIR)) {
    console.error(`❌ Diretório '${GUIAS_DIR}' não existe.`);
    process.exit(1);
  }

  const files = fs.readdirSync(GUIAS_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn('⚠️ Nenhum arquivo .md encontrado na pasta guias/.');
    process.exit(0);
  }

  const seenSlugs = new Set();
  let totalErrors = [];

  for (const file of files) {
    const filePath = path.join(GUIAS_DIR, file);
    const errors = validateGuideFile(filePath, seenSlugs);
    if (errors.length > 0) {
      totalErrors.push(...errors);
    }
  }

  if (totalErrors.length > 0) {
    console.error(`\n❌ Falha na validação! Encontrado(s) ${totalErrors.length} erro(s):`);
    for (const err of totalErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`\n✅ Sucesso! Todos os ${files.length} guia(s) passaram na validação do contrato.`);
  process.exit(0);
}

runValidation();
