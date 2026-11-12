#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const GUIAS_DIR = path.join(REPO_ROOT, 'guias');
const OUTPUT_FILE = path.join(REPO_ROOT, 'index.json');

function parseSimpleYamlFrontmatter(rawContent) {
  const match = rawContent.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?$/);
  if (!match) return null;
  const yamlText = match[1];
  const bodyText = match[2] || '';

  const data = {};
  const lines = yamlText.split(/\r?\n/);
  let currentKey = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (rawLine.startsWith('  - ') || rawLine.startsWith(' - ') || trimmed.startsWith('- ')) {
      const val = trimmed.replace(/^-\s*/, '').replace(/^['"]|['"]$/g, '').trim();
      if (currentKey && Array.isArray(data[currentKey])) {
        data[currentKey].push(val);
      }
      continue;
    }

    if (rawLine.startsWith('  ') && currentKey && typeof data[currentKey] === 'object' && !Array.isArray(data[currentKey])) {
      const subMatch = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (subMatch) {
        const subKey = subMatch[1];
        let subVal = subMatch[2].trim().replace(/^['"]|['"]$/g, '');
        data[currentKey][subKey] = subVal;
      }
      continue;
    }

    const matchKey = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (matchKey) {
      currentKey = matchKey[1];
      let value = matchKey[2].trim();
      if (value === '') {
        if (currentKey === 'tags') data[currentKey] = [];
        else if (currentKey === 'video') data[currentKey] = {};
        else data[currentKey] = '';
      } else {
        data[currentKey] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }

  return { meta: data, body: bodyText };
}

function extractMaterials(body) {
  const materialsMatch = body.match(/##\s+Materiais\r?\n([\s\S]*?)(?=\r?\n##\s+|$)/i);
  if (!materialsMatch) return [];
  const lines = materialsMatch[1].split(/\r?\n/);
  const items = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]')) {
      const clean = trimmed
        .replace(/^-\s*\[[ xX]\]\s*/, '')
        .replace(/\*\(pesquisado\)\*/g, '')
        .trim();
      if (clean) items.push(clean);
    }
  }
  return items;
}

function stripMarkdown(md) {
  return md
    .replace(/^#{1,6}\s+.*$/gm, '') // Remove headers
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Keep link text
    .replace(/[-*]\s*\[[ xX]\]\s*/g, '') // Remove checklists
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove code
    .replace(/\*\(pesquisado\)\*/g, '') // Remove researched tag
    .replace(/[*_~]/g, '') // Remove bold, italic, strikethrough
    .replace(/\{t=\d+\}/g, '') // Remove timestamps
    .replace(/\r?\n+/g, ' ') // Collapse newlines
    .trim();
}

function buildIndex() {
  console.log('📦 Construindo index.json...');
  if (!fs.existsSync(GUIAS_DIR)) {
    console.error(`❌ Diretório '${GUIAS_DIR}' não encontrado.`);
    process.exit(1);
  }

  const files = fs.readdirSync(GUIAS_DIR).filter(f => f.endsWith('.md'));
  const indexList = [];

  for (const file of files) {
    const filePath = path.join(GUIAS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = parseSimpleYamlFrontmatter(content);
    if (!parsed) continue;

    const { meta, body } = parsed;

    // Apenas guias com status 'publicado' entram no índice
    if (meta.status !== 'publicado') {
      console.log(`⏩ Ignorando rascunho: ${file}`);
      continue;
    }

    const materials = extractMaterials(body);
    const plainText = stripMarkdown(body);

    indexList.push({
      id: meta.slug,
      slug: meta.slug,
      title: meta.title,
      summary: meta.summary,
      tags: meta.tags || [],
      difficulty: meta.difficulty,
      time: meta.time,
      cost: meta.cost,
      cost_date: meta.cost_date,
      video: meta.video || {},
      updated: meta.updated,
      materials: materials,
      text: plainText
    });
  }

  // Ordena por updated decrescente
  indexList.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(indexList, null, 2), 'utf8');
  console.log(`✅ Sucesso! index.json gerado com ${indexList.length} guia(s) publicado(s).`);
  console.log(`📍 Arquivo: ${OUTPUT_FILE}`);
}

buildIndex();
