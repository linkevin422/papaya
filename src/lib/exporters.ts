// src/lib/exporters.ts
'use client'

import * as htmlToImage from 'html-to-image'
import { jsPDF } from 'jspdf'

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const filterNode = (node: HTMLElement) => {
  // Hide export menu or any element with this marker
  if (node?.dataset?.exportIgnore === 'true') return false
  // Hide React Flow UI chrome
  if (node?.classList?.contains('react-flow__minimap')) return false
  if (node?.classList?.contains('react-flow__controls')) return false
  if (node?.classList?.contains('react-flow__attribution')) return false
  return true
}

async function addWatermark(basePngDataUrl: string, text: string): Promise<string> {
  const img = new Image()
  img.src = basePngDataUrl
  await img.decode()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight

  ctx.drawImage(img, 0, 0)

  // Single diagonal watermark
  ctx.save()
  ctx.globalAlpha = 0.08
  ctx.fillStyle = '#ffffff'
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate((-30 * Math.PI) / 180)

  const fontSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.1)
  ctx.font = `bold ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)

  ctx.restore()

  return canvas.toDataURL('image/png')
}

export async function exportPNG(
  element: HTMLElement,
  { filename = 'flow.png', watermarkText }: { filename?: string; watermarkText?: string } = {}
) {
  // Fix missing font shorthand for html-to-image
  element.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = getComputedStyle(el)
    // Firefox: style.font may be "" or undefined
    if (!style.font || style.font.trim() === '') {
      const family = style.fontFamily || 'sans-serif'
      const size = style.fontSize || '14px'
      const weight = style.fontWeight || '400'
      el.style.font = `${weight} ${size} ${family}`
    }
  })
  
  const dataUrl = await htmlToImage.toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#0a0a0a',
    cacheBust: true,
    filter: (node: HTMLElement) => filterNode(node),
  })

  const finalUrl = watermarkText ? await addWatermark(dataUrl, watermarkText) : dataUrl
  downloadDataUrl(finalUrl, filename)
}

export async function exportPDF(
  element: HTMLElement,
  { filename = 'flow.pdf', watermarkText }: { filename?: string; watermarkText?: string } = {}
) {
  const pngUrl = await htmlToImage.toPng(element, {
    pixelRatio: 2,
    backgroundColor: '#0a0a0a',
    cacheBust: true,
    filter: (node) => filterNode(node as HTMLElement),
  })
  const finalPng = watermarkText ? await addWatermark(pngUrl, watermarkText) : pngUrl

  const img = new Image()
  img.src = finalPng
  await img.decode()

  const w = img.naturalWidth
  const h = img.naturalHeight
  const landscape = w > h
  const pdf = new jsPDF(landscape ? 'l' : 'p', 'pt', 'a4')

  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const scale = Math.min(pageW / w, pageH / h) * 0.95
  const drawW = w * scale
  const drawH = h * scale
  const x = (pageW - drawW) / 2
  const y = (pageH - drawH) / 2

  pdf.addImage(finalPng, 'PNG', x, y, drawW, drawH)
  pdf.save(filename)
}

export function exportJSON(nodes: any[], edges: any[], filename = 'flow.json') {
  const payload = {
    version: 1,
    exported_at: new Date().toISOString(),
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? null,
      position: n.position ?? null,
      data: n.data ?? null,
    })),
  edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type ?? null,
      label: e.data?.label ?? null,
      data: e.data ?? null,
    })),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  downloadBlob(blob, filename)
}

function toCsvRow(fields: (string | number | null | undefined)[]) {
  return fields
    .map((v) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    })
    .join(',')
}

export function exportCSV(nodes: any[], edges: any[], basename = 'flow') {
  const nodeHeader = ['id', 'type', 'x', 'y', 'label']
  const nodeLines = [nodeHeader.join(',')]
  nodes.forEach((n) => {
    nodeLines.push(
      toCsvRow([
        n.id,
        n.type ?? '',
        n.position?.x ?? '',
        n.position?.y ?? '',
        n.data?.label ?? n.data?.name ?? '',
      ])
    )
  })
  const nodeBlob = new Blob([nodeLines.join('\n')], { type: 'text/csv;charset=utf-8' })

  const edgeHeader = ['id', 'source', 'target', 'type', 'label']
  const edgeLines = [edgeHeader.join(',')]
  edges.forEach((e) => {
    edgeLines.push(toCsvRow([e.id, e.source, e.target, e.type ?? '', e.data?.label ?? '']))
  })
  const edgeBlob = new Blob([edgeLines.join('\n')], { type: 'text/csv;charset=utf-8' })

  // Trigger two downloads
  const a1 = document.createElement('a')
  a1.href = URL.createObjectURL(nodeBlob)
  a1.download = `${basename}_nodes.csv`
  document.body.appendChild(a1)
  a1.click()
  a1.remove()

  const a2 = document.createElement('a')
  a2.href = URL.createObjectURL(edgeBlob)
  a2.download = `${basename}_edges.csv`
  document.body.appendChild(a2)
  a2.click()
  a2.remove()
}
