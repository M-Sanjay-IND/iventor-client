/* eslint-disable */
import type { QrLabel } from '../types'

interface PrintPreviewProps {
  labels: QrLabel[]
  layout?: 'a4-grid' | 'thermal'
}

/**
 * Renders a printable label grid.
 * A4 grid: 4 columns × 8 rows = 32 labels per page.
 * Uses CSS @media print to hide screen-only chrome and control page breaks.
 */
export function PrintPreview({ labels, layout = 'a4-grid' }: PrintPreviewProps) {
  if (labels.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No labels to display.
      </div>
    )
  }

  const labelsPerPage = layout === 'a4-grid' ? 32 : 10
  const pages: QrLabel[][] = []
  for (let i = 0; i < labels.length; i += labelsPerPage) {
    pages.push(labels.slice(i, i + labelsPerPage))
  }

  return (
    <div className="print-preview">
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-preview, .print-preview * { visibility: visible; }
          .print-preview { position: absolute; top: 0; left: 0; width: 100%; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      {pages.map((pageLabels, pageIdx) => (
        <div
          key={pageIdx}
          className="print-page mx-auto mb-6 rounded-lg border border-dashed border-border bg-white p-4 last:mb-0"
          style={{ maxWidth: '210mm' }}
        >
          <div
            className={
              layout === 'a4-grid'
                ? 'grid grid-cols-4 gap-2'
                : 'flex flex-col gap-2'
            }
          >
            {pageLabels.map((label, labelIdx) => (
              <LabelCell key={`${pageIdx}-${labelIdx}`} label={label} layout={layout} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface LabelCellProps {
  label: QrLabel
  layout: 'a4-grid' | 'thermal'
}

function LabelCell({ label, layout }: LabelCellProps) {
  return (
    <div
      className={`flex items-center gap-2 rounded border border-gray-200 bg-white p-2 ${
        layout === 'thermal' ? 'flex-row' : 'flex-col text-center'
      }`}
      style={
        layout === 'a4-grid'
          ? { minHeight: '28mm' }
          : { height: '25mm', maxWidth: '50mm' }
      }
    >
      {/* QR Image */}
      <img
        src={label.qr_image_url}
        alt={label.qr_uid}
        className={layout === 'a4-grid' ? 'size-14' : 'size-10'}
        loading="lazy"
      />

      {/* Text */}
      <div className={`min-w-0 ${layout === 'a4-grid' ? '' : 'flex-1'}`}>
        <p className="truncate font-mono text-[9px] font-bold leading-tight text-black">
          {label.qr_uid}
        </p>
        <p className="truncate text-[8px] leading-tight text-gray-700">
          {label.item_name}
        </p>
        {label.category_name && (
          <p className="truncate text-[7px] leading-tight text-gray-500">
            {label.category_name}
          </p>
        )}
        {label.location_name && (
          <p className="truncate text-[7px] leading-tight text-gray-500">
            {label.location_name}
          </p>
        )}
      </div>
    </div>
  )
}
