import type { Capture, Doc, Project, Workspace } from '@database/dto'

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


export const createWorkspace = async (workspace: Record<string, unknown>): Promise<number | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createWorkspace', workspace)) as number
  } catch (error) {
    console.error(error)
    return null
  }
}

export const updateProject = async (project: Record<string, unknown>): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'updateProject', project)
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

export const getWorkspaceDetail = async (id: string): Promise<WorkspaceDetail | null> => {
  try {
    return (await window.api.invoke('dao:call', 'getWorkspaceDetail', id)) as WorkspaceDetail | null
  } catch (error) {
    console.error(error)
    return null
  }

}

export const getCaptureList = async (params: {
  workspaceId: number
}): Promise<Capture[]> => {
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

export const updateCaptureName = async (capture: {
  id: number
  name: string
}): Promise<void> => {
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
}): Promise<number | null> => {
  try {
    return (await window.api.invoke('dao:call', 'createDoc', doc)) as number
  } catch (error) {
    console.error(error)
    return null
  }
}

export const getDocList = async (params: {
  workspaceId: number
}): Promise<Doc[]> => {
  try {
    return (await window.api.invoke('dao:call', 'getDocList', params)) as Doc[]
  } catch (error) {
    console.error(error)
    return []
  }
}

export const deleteDoc = async (id: number): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'deleteDoc', id)
  } catch (error) {
    console.error(error)
  }
}
