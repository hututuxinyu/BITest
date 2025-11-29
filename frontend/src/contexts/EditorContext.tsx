import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Project, ReportSummary } from '../types';

interface EditorContextValue {
  projectContext: Project | undefined;
  setProjectContext: (project: Project | undefined) => void;
  reportContext: ReportSummary | undefined;
  setReportContext: (report: ReportSummary | undefined) => void;
  reportTitle: string;
  setReportTitle: (title: string) => void;
  language: 'zh-CN' | 'en-US';
  setLanguage: (lang: 'zh-CN' | 'en-US') => void;
}

const EditorContext = createContext<EditorContextValue | undefined>(undefined);

export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorContextProvider');
  }
  return context;
};

interface EditorContextProviderProps {
  children: ReactNode;
}

export const EditorContextProvider: React.FC<EditorContextProviderProps> = ({ children }) => {
  const [projectContext, setProjectContext] = useState<Project | undefined>(undefined);
  const [reportContext, setReportContext] = useState<ReportSummary | undefined>(undefined);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [language, setLanguage] = useState<'zh-CN' | 'en-US'>('zh-CN');

  return (
    <EditorContext.Provider
      value={{
        projectContext,
        setProjectContext,
        reportContext,
        setReportContext,
        reportTitle,
        setReportTitle,
        language,
        setLanguage,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};


