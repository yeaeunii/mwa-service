export interface WorkspaceAnnotation {
  id: string
  number: number
  x: number
  y: number
  description: string
  toolType?: 'number' | 'box'
  width?: number
  height?: number
}

export interface WorkspaceScreenshot {
  id: string
  image: string
  filePath: string
  isSelected: boolean
  menuPath?: string
  screenDescription?: string
  functionalityDescription?: string
  writerName?: string
  pageNo?: number
  pageTitle?: string
  annotations: WorkspaceAnnotation[]
}

export interface WorkspaceFolder {
  id: string
  title: string
  path: string
  description: string
  screenshots: WorkspaceScreenshot[]
}

export type SelectedForManual = Record<string, string[]>

export const toFileImageSrc = (filePath: string): string => {
  const normalizedPath = filePath.replace(/\\/g, '/')
  const absolutePath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`
  return encodeURI(`file://${absolutePath}`)
}

export const createEmptySelection = (folders: WorkspaceFolder[]): SelectedForManual =>
  folders.reduce<SelectedForManual>((acc, folder) => {
    acc[folder.id] = []
    return acc
  }, {})

export const createSelectionFromFolders = (folders: WorkspaceFolder[]): SelectedForManual =>
  folders.reduce<SelectedForManual>((acc, folder) => {
    acc[folder.id] = folder.screenshots.filter((shot) => shot.isSelected).map((shot) => shot.id)
    return acc
  }, {})

export const getSelectedFolders = (
  folders: WorkspaceFolder[],
  selectedForManual: SelectedForManual
): WorkspaceFolder[] =>
  folders
    .map((folder) => ({
      ...folder,
      screenshots: folder.screenshots.filter((shot) => selectedForManual[folder.id]?.includes(shot.id))
    }))
    .filter((folder) => folder.screenshots.length > 0)

export const reindexNumberAnnotations = (items: WorkspaceAnnotation[]): WorkspaceAnnotation[] => {
  let currentNumber = 1

  return items.map((item) => {
    if (item.toolType === 'box') {
      return {
        ...item,
        number: 0
      }
    }

    const nextItem = {
      ...item,
      number: currentNumber
    }
    currentNumber += 1
    return nextItem
  })
}
