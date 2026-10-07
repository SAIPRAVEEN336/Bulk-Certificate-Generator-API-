import React from 'react';
import { Award, Database, Cpu, CheckCircle2, FileArchive } from 'lucide-react';

interface HeaderProps {
  activeTab: 'generator' | 'inspector' | 'template' | 'tests' | 'api' | 'architecture';
  setActiveTab: (tab: 'generator' | 'inspector' | 'template' | 'tests' | 'api' | 'architecture') => void;
  selectedJobId: string | null;
  totalJobs: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedJobId,
  totalJobs,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Award className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">CertiFlow</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Bulk Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                High-Performance Relational Certificate Generator & API
              </p>
            </div>
          </div>

          {/* Engine & Database Status Badges */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Relational Jobs Store</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>Vector PDF & ZIP Engine</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{totalJobs} Jobs Stored</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-800/60 py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'generator'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Dashboard & Generator
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Output & Job Inspector</span>
            {selectedJobId && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('template')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'template'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Template Studio
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tests'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Automated Tests</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              6/6
            </span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'api'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            REST API & Python Code
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === 'architecture'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Architecture & Interview Guide
          </button>
        </div>
      </div>
    </header>
  );
};
