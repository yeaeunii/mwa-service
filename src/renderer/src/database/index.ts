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
    console.error(error)
    return []
  }
}

export const getProject = async (id: string): Promise<Project> => {
  try {
    return (await window.api.invoke('dao:call', 'getProject', id)) as Project
  } catch (error) {
    console.error(error)
    return null as unknown as Project
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
