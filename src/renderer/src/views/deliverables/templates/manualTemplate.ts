import type { ManualExportBundle } from '@/types'

// 다운로드 템플릿에 전달되는 데이터 구조
export interface ManualFn {
  number: number
  description: string
  color: string
}

export interface ManualPage {
  id: string
  title: string
  phase: string
  entryPath: string
  description: string
  imageSrc: string
  date: string
  functions: ManualFn[]
}

export type ManualOutlineRow =
  | {
      id: string
      kind: 'category'
      title: string
      depth: number
      parentId: string | null
    }
  | {
      id: string
      kind: 'item'
      title: string
      pageId: string
      depth: number
      parentId: string | null
    }

export interface ManualModel {
  projectTitle: string
  deliverableTitle: string
  outlineRows: ManualOutlineRow[]
  pages: ManualPage[]
}

const pdfFunctionsPerPage = 10

// 템플릿 문자열에 들어가는 사용자 입력값 escape 처리
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// 템플릿에서 쓰는 inline SVG 아이콘
const folderIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.75A2.75 2.75 0 0 1 5.75 4h4.1l2 2h6.4A2.75 2.75 0 0 1 21 8.75v8.5A2.75 2.75 0 0 1 18.25 20H5.75A2.75 2.75 0 0 1 3 17.25V6.75Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h12.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-7.02l-2-2H5.75Z"/></svg>'
const fileIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 3A2.75 2.75 0 0 0 4 5.75v12.5A2.75 2.75 0 0 0 6.75 21h10.5A2.75 2.75 0 0 0 20 18.25V8.5L14.5 3H6.75Zm0 1.5H13V8a2 2 0 0 0 2 2h3.5v8.25c0 .69-.56 1.25-1.25 1.25H6.75c-.69 0-1.25-.56-1.25-1.25V5.75c0-.69.56-1.25 1.25-1.25Zm7.75 1.06L17.44 8.5H15a.5.5 0 0 1-.5-.5V5.56ZM8 12.25h8v1.5H8v-1.5Zm0 3h6v1.5H8v-1.5Z"/></svg>'
const chevronIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.72 9.47a.75.75 0 0 1 1.06 0L12 12.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0l-3.75-3.75a.75.75 0 0 1 0-1.06Z"/></svg>'
const pathIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 5A2.75 2.75 0 0 0 2 7.75v8.5A2.75 2.75 0 0 0 4.75 19h14.5A2.75 2.75 0 0 0 22 16.25v-6.5A2.75 2.75 0 0 0 19.25 7h-7.69L9.78 5.22A.75.75 0 0 0 9.25 5h-4.5Zm0 1.5h4.19l1.78 1.78c.14.14.33.22.53.22h8c.69 0 1.25.56 1.25 1.25v6.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-8.5c0-.69.56-1.25 1.25-1.25Z"/></svg>'
const checkIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.28 6.22a.75.75 0 0 1 0 1.06l-8.25 8.25a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 1 1 1.06-1.06l3.72 3.72 7.72-7.72a.75.75 0 0 1 1.06 0Z"/></svg>'
const projectIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.75 4A2.75 2.75 0 0 0 2 6.75v10.5A2.75 2.75 0 0 0 4.75 20h14.5A2.75 2.75 0 0 0 22 17.25V6.75A2.75 2.75 0 0 0 19.25 4H4.75Zm0 1.5h14.5c.69 0 1.25.56 1.25 1.25v10.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25V6.75c0-.69.56-1.25 1.25-1.25ZM6.5 8h5v1.5h-5V8Zm0 3.25h11v1.5h-11v-1.5Zm0 3.25h8v1.5h-8v-1.5Z"/></svg>'

// 좌측 카테고리 목차 렌더링
const renderOutline = (rows: ManualOutlineRow[]): string =>
  rows
    .map((row) => {
      if (row.kind === 'category') {
        return `<button type="button" class="outline-row outline-category depth-${row.depth}" data-row-id="${escapeHtml(row.id)}" data-parent-id="${escapeHtml(row.parentId ?? '')}" data-depth="${row.depth}" data-kind="category">
          <span class="chevron">${chevronIcon}</span>
          <span class="outline-icon folder-icon">${folderIcon}</span>
          <span class="outline-title">${escapeHtml(row.title)}</span>
        </button>`
      }

      return `<a class="outline-row outline-item depth-${row.depth}" href="#${escapeHtml(row.pageId)}" data-page-id="${escapeHtml(row.pageId)}" data-parent-id="${escapeHtml(row.parentId ?? '')}" data-depth="${row.depth}" data-kind="item">
        <span class="outline-spacer"></span>
        <span class="outline-icon file-icon">${fileIcon}</span>
        <span class="outline-title">${escapeHtml(row.title)}</span>
      </a>`
    })
    .join('')

// 주요 기능 명세 표 row 렌더링
const renderFunctions = (functions: ManualFn[]): string =>
  functions
    .map(
      (item) => `
        <tr>
          <td>
            <span style="background-color: ${escapeHtml(item.color)};">${item.number}</span>
          </td>
          <td>
            <p>${escapeHtml(item.description)}</p>
          </td>
        </tr>
      `
    )
    .join('')

// PDF에서 기능 명세가 길 때 페이지를 나누기 위한 배열 분할
const splitFunctions = (functions: ManualFn[], size: number): ManualFn[][] => {
  if (functions.length === 0) return [[]]

  const chunks: ManualFn[][] = []
  for (let index = 0; index < functions.length; index += size) {
    chunks.push(functions.slice(index, index + size))
  }

  return chunks
}

// PDF 전용 모델 생성: 기능 설명을 6개씩 나누고 문서 페이지를 복제
const buildPdfModel = (model: ManualModel): ManualModel => ({
  ...model,
  pages: model.pages.flatMap((page) =>
    splitFunctions(page.functions, pdfFunctionsPerPage).map((functions, index) => ({
      ...page,
      id: index === 0 ? page.id : `${page.id}-${index + 1}`,
      functions
    }))
  )
})

// 본문 문서 페이지 렌더링
const renderPages = (model: ManualModel): string =>
  model.pages
    .map(
      (page, index) => `
        <article id="${escapeHtml(page.id)}" class="manual-page">
          <header class="manual-page-header">
            <div class="manual-page-path">
              <span class="path-phase">${escapeHtml(page.phase)}</span>
              <span class="path-separator">/</span>
              <strong>${escapeHtml(page.title)}</strong>
            </div>
            <div class="manual-page-date">작성일: ${escapeHtml(page.date)}</div>
          </header>

          <section class="manual-section">
            <h1>${escapeHtml(page.title)}</h1>
            <div class="entry-path">
              <span class="inline-icon">${pathIcon}</span>
              <span>경로: ${escapeHtml(page.entryPath || '입력된 화면 경로가 없습니다')}</span>
            </div>
            <div class="summary-box">
              <strong>화면 개요</strong>
              <p>${escapeHtml(page.description || '화면 설명이 없습니다.')}</p>
            </div>
          </section>

          <section class="manual-section">
            <h2><span class="inline-icon">${checkIcon}</span><span>화면구성</span></h2>
            <div class="screen-box">
              ${
                page.imageSrc
                  ? `<img src="${escapeHtml(page.imageSrc)}" alt="${escapeHtml(page.title)}" />`
                  : '<div class="empty-screen">저장된 화면 이미지가 없습니다</div>'
              }
            </div>
          </section>

          <section class="manual-section">
            <h2 class="border-heading"><span class="inline-icon">${checkIcon}</span><span>주요 기능 명세</span></h2>
            <table class="function-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>상세 설명</th>
                </tr>
              </thead>
              <tbody>${renderFunctions(page.functions)}</tbody>
            </table>
          </section>

          <footer class="manual-page-footer">
            <div class="manual-footer-title">
              <span class="inline-icon">${projectIcon}</span>
              <span>${escapeHtml(model.projectTitle)} - ${escapeHtml(model.deliverableTitle)}</span>
            </div>
            <div>Page ${index + 1} of ${model.pages.length}</div>
          </footer>
        </article>
      `
    )
    .join('')

// HTML/PDF에서 공통으로 사용하는 스타일
const manualCss = `* { box-sizing: border-box; }
body { margin: 0; display: grid; grid-template-columns: var(--outline-width, 288px) 1fr; min-height: 100vh; background: #e5e7eb; color: #1f3554; font-family: Arial, sans-serif; }
body.is-resizing { cursor: col-resize; user-select: none; }
.manual-outline { position: sticky; top: 0; height: 100vh; overflow: auto; border-right: 1px solid #d4d4d8; background: #fff; padding: 20px 12px; }
.manual-outline h2 { margin: 0 0 16px; font-size: 14px; color: #111827; }
.manual-outline-nav { display: flex; flex-direction: column; gap: 3px; }
.manual-resizer { position: fixed; top: 0; bottom: 0; left: calc(var(--outline-width, 288px) - 4px); z-index: 20; width: 8px; cursor: col-resize; }
.manual-resizer:hover { background: rgba(79, 70, 229, .16); }
.outline-row { display: flex; align-items: center; gap: 6px; width: 100%; min-height: 32px; border: 0; border-radius: 6px; background: transparent; padding: 0 8px; color: #111827; font: inherit; text-align: left; text-decoration: none; cursor: pointer; }
.outline-row:hover { background: #f3f4f6; }
.outline-row.active { background: #ede9fe; color: #4f46e5; font-weight: 700; }
.outline-row.hidden { display: none; }
.outline-category { margin-top: 4px; font-size: 13px; font-weight: 700; }
.outline-item { font-size: 12px; color: #4b5563; }
.outline-icon, .inline-icon { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; flex: 0 0 auto; color: #4f46e5; }
.outline-icon svg, .inline-icon svg, .chevron svg { width: 16px; height: 16px; fill: currentColor; }
.chevron, .outline-spacer { display: inline-flex; align-items: center; justify-content: center; width: 14px; flex: 0 0 auto; color: #9ca3af; transition: transform .15s ease; }
.outline-category.collapsed .chevron { transform: rotate(-90deg); }
.outline-title { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.depth-1 { padding-left: 16px; }
.depth-2 { padding-left: 32px; }
.depth-3 { padding-left: 48px; }
.depth-4 { padding-left: 64px; }
.manual-main { padding: 32px; overflow: auto; }
.manual-page { display: flex; flex-direction: column; width: 794px; min-height: 1123px; margin: 0 auto 32px; padding: 24px 28px; background: #fff; color: #1f3554; box-shadow: 0 1px 4px rgba(15, 23, 42, .1); page-break-after: always; }
.manual-page-header { display: flex; align-items: flex-end; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
.manual-page-path { display: flex; min-width: 0; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; }
.manual-page-path .path-phase { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.manual-page-path .path-separator { color: #9ca3af; }
.manual-page-path strong { color: #315b96; }
.manual-page-date { font-size: 11px; font-weight: 700; color: #475569; }
.manual-section { margin-top: 28px; }
h1 { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; }
h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 8px; font-size: 14px; font-weight: 900; color: #1f3554; }
.entry-path { display: flex; align-items: center; gap: 6px; margin-top: 8px; font-size: 12px; color: #475569; }
.summary-box { margin-top: 20px; border: 1px solid #cfd9e8; border-radius: 6px; background: #eef4ff; padding: 16px; }
.summary-box strong { display: block; margin-bottom: 8px; font-size: 14px; color: #315b96; }
.summary-box p { margin: 0; font-size: 12px; line-height: 1.65; color: #243b5a; white-space: pre-line; }
.screen-box { display: flex; align-items: center; justify-content: center; min-height: 250px; border: 1px solid #cbd5e1; background: #fff; padding: 4px; }
.screen-box img { max-width: 100%; max-height: 390px; object-fit: contain; }
.empty-screen { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 250px; background: #f8fafc; color: #94a3b8; font-size: 14px; }
.border-heading { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
.function-table { width: 100%; table-layout: fixed; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 12px; }
.function-table th { border: 1px solid #cbd5e1; background: #eef2f7; color: #1f3554; padding: 8px 12px; text-align: center; }
.function-table th:first-child { width: 64px; text-align: center; }
.function-table td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; vertical-align: middle; overflow-wrap: anywhere; word-break: break-all; }
.function-table td:first-child { text-align: center; }
.function-table span { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 999px; color: #fff; font-size: 11px; font-weight: 700; }
.function-table p { margin: 0; line-height: 1.6; color: #475569; text-align: center; overflow-wrap: anywhere; word-break: break-all; white-space: pre-line; }
.manual-page-footer { display: flex; align-items: flex-end; justify-content: space-between; margin-top: auto; border-top: 1px solid #e2e8f0; padding-top: 28px; font-size: 11px; color: #1f3554; }
.manual-footer-title { display: flex; align-items: center; gap: 6px; }
@media print {
  body { display: block; background: #fff; }
  .manual-outline { display: none; }
  .manual-resizer { display: none; }
  .manual-main { padding: 0; }
  .manual-page { margin: 0; box-shadow: none; width: auto; min-height: 100vh; padding: 18px 24px; }
  .manual-page-header { padding-bottom: 10px; }
  .manual-section { margin-top: 16px; }
  h1 { font-size: 21px; }
  .summary-box { margin-top: 12px; padding: 10px 12px; }
  .summary-box strong { margin-bottom: 5px; font-size: 12px; }
  .summary-box p { font-size: 11px; line-height: 1.5; }
  .screen-box { min-height: 190px; }
  .screen-box img { max-height: 300px; }
  .function-table { font-size: 11px; }
  .function-table th { padding: 6px 8px; }
  .function-table td { padding: 7px 8px; }
  .function-table p { line-height: 1.45; }
  .manual-page-footer { padding-top: 16px; }
}`

// HTML 다운로드 파일에서 좌측 목차 접기/선택/크기조절 처리
const manualJs = `const root = document.documentElement
const outlineRows = Array.from(document.querySelectorAll('.outline-row'))
const resizer = document.querySelector('.manual-resizer')

let resizeStartX = 0
let resizeStartWidth = 288

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const getOutlineWidth = () => {
  const value = getComputedStyle(root).getPropertyValue('--outline-width').trim()
  return Number(value.replace('px', '')) || 288
}

const onResizeMove = (event) => {
  root.style.setProperty('--outline-width', clamp(resizeStartWidth + event.clientX - resizeStartX, 220, 520) + 'px')
}

const onResizeEnd = () => {
  document.body.classList.remove('is-resizing')
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup', onResizeEnd)
}

resizer?.addEventListener('pointerdown', (event) => {
  resizeStartX = event.clientX
  resizeStartWidth = getOutlineWidth()
  document.body.classList.add('is-resizing')
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup', onResizeEnd)
})

const isHiddenByParent = (row) => {
  let parentId = row.dataset.parentId
  while (parentId) {
    const parent = document.querySelector('[data-row-id="' + parentId + '"]')
    if (!parent || parent.classList.contains('collapsed')) return true
    parentId = parent.dataset.parentId
  }
  return false
}

const refreshOutline = () => {
  outlineRows.forEach((row) => {
    row.classList.toggle('hidden', isHiddenByParent(row))
  })
}

document.querySelectorAll('.outline-category').forEach((category) => {
  category.addEventListener('click', () => {
    category.classList.toggle('collapsed')
    refreshOutline()
  })
})

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    event.preventDefault()
    outlineRows.forEach((row) => row.classList.remove('active'))
    anchor.classList.add('active')
    document.querySelector(anchor.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' })
  })
})

document.querySelector('.outline-item')?.classList.add('active')
refreshOutline()`

// HTML ZIP 다운로드용 파일 묶음 생성
export const renderManual = (model: ManualModel): ManualExportBundle => {
  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(model.deliverableTitle)}</title>
  <link rel="stylesheet" href="./assets/manual.css" />
</head>
<body>
  <aside class="manual-outline">
    <h2>${escapeHtml(model.deliverableTitle)}</h2>
    <nav class="manual-outline-nav">${renderOutline(model.outlineRows)}</nav>
  </aside>
  <div class="manual-resizer" role="separator" aria-orientation="vertical" aria-label="목차 영역 크기 조절"></div>
  <main class="manual-main">${renderPages(model)}</main>
  <script src="./assets/manual.js"></scr${'ipt'}>
</body>
</html>`

  return {
    html,
    css: manualCss,
    js: manualJs
  }
}

// PDF 다운로드용 inline HTML 생성
export const renderManualInline = (model: ManualModel): string => {
  const bundle = renderManual(buildPdfModel(model))

  return bundle.html
    .replace('<link rel="stylesheet" href="./assets/manual.css" />', `<style>${bundle.css}</style>`)
    .replace(
      `<script src="./assets/manual.js"></scr${'ipt'}>`,
      `<script>${bundle.js}</scr${'ipt'}>`
    )
}
