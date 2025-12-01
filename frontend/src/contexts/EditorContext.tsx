import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Project, ReportSummary } from '../types';
import type { EnhancedCanvasItem } from '../components/EnhancedCanvas';

interface EditorContextValue {
  projectContext: Project | undefined;
  setProjectContext: (project: Project | undefined) => void;
  reportContext: ReportSummary | undefined;
  setReportContext: (report: ReportSummary | undefined) => void;
  reportTitle: string;
  setReportTitle: (title: string) => void;
  language: 'zh-CN' | 'en-US';
  setLanguage: (lang: 'zh-CN' | 'en-US') => void;
  canvasItems: EnhancedCanvasItem[];
  setCanvasItems: (items: EnhancedCanvasItem[]) => void;
  canvasWidth: number;
  setCanvasWidth: (width: number) => void;
  canvasHeight: number;
  setCanvasHeight: (height: number) => void;
  canvasBackgroundColor: string;
  setCanvasBackgroundColor: (color: string) => void;
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
  const [canvasItems, setCanvasItems] = useState<EnhancedCanvasItem[]>([]);
  const [canvasWidth, setCanvasWidth] = useState<number>(1920);
  const [canvasHeight, setCanvasHeight] = useState<number>(1080);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState<string>('#fafafa');

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
        canvasItems,
        setCanvasItems,
        canvasWidth,
        setCanvasWidth,
        canvasHeight,
        setCanvasHeight,
        canvasBackgroundColor,
        setCanvasBackgroundColor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};


