import React, { createContext, useContext, useState } from 'react';
import { Project as ApiProject } from '@src/api/projects';

export interface Project extends ApiProject {
  created_at: Date;
  updated_at: Date;
}

type ProjectsContextType = {
  projects: Project[];
  updateProject: (project: Project) => void;
  addProject: (project: Omit<Project, 'project_id' | 'created_at' | 'updated_at'>) => void;
};

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

const mockProjects: Project[] = [
  {
    project_id: '1',
    project_name: 'Mock Project 1',
    project_description: 'Описание проекта 1',
    start_date: new Date(),
    end_date: new Date(),
    status: 'В работе',
    author_id: 'user1',
    tags: [],
    project_goal_id: 'g1',
    goal_name: 'Цель 1',
    goal_description: 'Описание цели',
    target_date: new Date(),
    goal_status: 'В работе',
    project_assignment_id: 'a1',
    user_id: 'user1',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    project_id: '2',
    project_name: 'Mock Project 2',
    project_description: 'Описание проекта 2',
    start_date: new Date(),
    end_date: new Date(),
    status: 'Выполнена',
    author_id: 'user2',
    tags: [],
    project_goal_id: 'g2',
    goal_name: 'Цель 2',
    goal_description: 'Описание цели 2',
    target_date: new Date(),
    goal_status: 'Выполнена',
    project_assignment_id: 'a2',
    user_id: 'user2',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export const ProjectsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const updateProject = (updated: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.project_id === updated.project_id ? { ...p, ...updated, updated_at: new Date() } : p))
    );
  };

  const addProject = (project: Omit<Project, 'project_id' | 'created_at' | 'updated_at'>) => {
    const newProject: Project = {
      ...project,
      project_id: (Date.now() + Math.random()).toString(),
      created_at: new Date(),
      updated_at: new Date(),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <ProjectsContext.Provider value={{ projects, updateProject, addProject }}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjects = () => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}; 