import type {
  Capture,
  Deliverable,
  DeliverableStructureResponse,
  Doc,
  Project,
  SectionTreeInput,
  Workspace
} from '@database/dto'

export type {
  Capture,
  Deliverable,
  DeliverableSection,
  DeliverableSectionDoc,
  DeliverableStructureResponse,
  Doc,
  Project,
  SectionDocInput,
  SectionTreeInput,
  Workspace
} from '@database/dto'

export interface WorkspaceDetail extends Workspace {
  project_name: string
}

export const createProject = async (project: Record<string, unknown>): Promise<number | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createProject', project)) as number
  } catch (error) {
    console.error(error)
    return null
  }
}

export const getProjects = async (params: Record<string, unknown>): Promise<Project[]> => {
  try {
    return (await window.api.invoke('dao:call', 'getProjectList', params)) as Project[]
  } catch (error) {
    console.error('getProjects error:', error)
    return []
  }
}

export const getWorkspaces = async (params: Record<string, unknown>): Promise<Workspace[]> => {
  try {
    return (await window.api.invoke('dao:call', 'getWorkspaceList', params)) as Workspace[]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const createWorkspace = async (
  workspace: Record<string, unknown>
): Promise<number | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createWorkspace', workspace)) as number
  } catch (error) {
    console.error(error)
    return null
  }
}

export const updateWorkspace = async (workspace: Record<string, unknown>): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'updateWorkspace', workspace)
  } catch (error) {
    console.error(error)
  }
}

export const updateProject = async (project: Record<string, unknown>): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'updateProject', project)
  } catch (error) {
    console.error(error)
  }
}

export const updateProjectStatus = async (project: {
  id: string | number
  status: string
}): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'updateProjectStatus', project)
  } catch (error) {
    console.error(error)
  }
}

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'deleteProject', id)
  } catch (error) {
    console.error(error)
  }
}

export const deleteWorkspace = async (id: string | number): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'deleteWorkspace', id)
  } catch (error) {
    console.error(error)
  }
}

export const getWorkspaceDetail = async (id: string): Promise<WorkspaceDetail | null> => {
  try {
    return (await window.api.invoke('dao:call', 'getWorkspaceDetail', id)) as WorkspaceDetail | null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const getCaptureList = async (params: { workspaceId: number }): Promise<Capture[]> => {
  try {
    return (await window.api.invoke('dao:call', 'getCaptureList', params)) as Capture[]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const createCaptureWithImage = async (capture: {
  workspaceId: string
  name: string
  dataUrl: string
  currentUrl: string
}): Promise<{ id: number; imgPath: string } | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createCaptureWithImage', capture)) as {
      id: number
      imgPath: string
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export const updateCaptureName = async (capture: { id: number; name: string }): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'updateCaptureName', capture)
  } catch (error) {
    console.error(error)
  }
}

export const deleteCapture = async (capture: {
  id: number
  imgPath?: string | null
}): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'deleteCapture', capture)
  } catch (error) {
    console.error(error)
  }
}

export const createDoc = async (doc: {
  workspaceId: number
  title: string
  description?: string
  status?: string
  docMetaJson?: string
  contentJson?: string
  annotationJson?: string
  orgnImgPath?: string
  drawImgPath?: string
  sortOrder?: number
}): Promise<{ id: number; orgnImgPath: string } | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createDoc', doc)) as {
      id: number
      orgnImgPath: string
    }
  } catch (error) {
    console.error(error)
    return null
  }
}

export const getDocList = async (params: {
  workspaceId?: number | null
  id?: number | null
}): Promise<Doc[]> => {
  try {
    return (await window.api.invoke('dao:call', 'getDocList', params)) as Doc[]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const updateDoc = async (doc: {
  id: number
  title: string
  description: string
  docMetaJson: string
}): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'updateDoc', doc)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const updateDocAnnotation = async (doc: {
  id: number
  contentJson: string
  annotationJson: string
  drawDataUrl?: string | null
}): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'updateDocAnnotation', doc)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const updateDocStatus = async (doc: { id: number; status: string }): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'updateDocStatus', doc)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const deleteDoc = async (id: number): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'deleteDoc', id)
  } catch (error) {
    console.error(error)
  }
}

export const updateDocSortOrders = async (
  docs: Array<{
    id: number
    sortOrder: number
  }>
): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'updateDocSortOrders', docs)
  } catch (error) {
    console.error(error)
  }
}

export const moveDocs = async (params: {
  docIds: number[]
  workspaceId: number
}): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'moveDocs', params)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const copyDocs = async (params: {
  docIds: number[]
  workspaceId: number
}): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'copyDocs', params)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const getDeliverables = async (params: { projectId: number }): Promise<Deliverable[]> => {
  try {
    return (await window.api.invoke('dao:call', 'getDeliverableList', params)) as Deliverable[]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const getDeliverableDetail = async (id: number): Promise<Deliverable | null> => {
  try {
    return (await window.api.invoke('dao:call', 'getDeliverableDetail', id)) as Deliverable | null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const createDeliverable = async (params: {
  projectId: number
  title: string
  sourceDeliverableId?: number
}): Promise<number | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createDeliverable', params)) as number
  } catch (error) {
    console.error(error)
    return null
  }
}

export const updateDeliverableTitle = async (params: {
  id: number
  title: string
}): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'updateDeliverableTitle', params)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const deleteDeliverable = async (id: number): Promise<boolean> => {
  try {
    await window.api.invoke('dao:call', 'deleteDeliverable', id)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}

export const getDeliverableStructure = async (
  deliverableId: number
): Promise<DeliverableStructureResponse> => {
  try {
    return (await window.api.invoke('dao:call', 'getDeliverableStructure', {
      deliverableId
    })) as DeliverableStructureResponse
  } catch (error) {
    console.error(error)
    return { sections: [], sectionDocs: [] }
  }
}

export const saveDeliverableStructure = async (params: {
  deliverableId: number
  sections: SectionTreeInput[]
}): Promise<boolean> => {
  try {
    const payload = JSON.parse(JSON.stringify(params)) as typeof params
    await window.api.invoke('dao:call', 'saveDeliverableStructure', payload)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
