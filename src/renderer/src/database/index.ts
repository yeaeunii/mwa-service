import type { Project } from '@database/dto'
import type { Workspace } from '@database/dto'


export const createProject = async (project: Record<string, unknown>): Promise<void> => {
  try {
    await window.api.invoke('dao:call', 'createProject', project)
  } catch (error) {
    console.error(error)
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
