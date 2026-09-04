import {
  BarChart3,
  LogOut,
  Target,
  Hammer,
  TrendingUp,
  History,
  Moon,
  Sun,
  ChevronsLeft,
  ChevronsRight,
  Lock,
} from "lucide-react";
import { useAppStore } from "../store/useAppStore";

// Sidebar surfaces phase navigation, active session context, and user actions.
// AI Boardroom only ships Phase 1 (Idea Validation) for now — the other two
// phases show as locked entries so the roadmap is visible without being usable.
const PHASE_ITEMS = [
  { id: "boardroom", label: "Idea Validation", icon: Target, available: true },
  { id: "implementation", label: "Implementation", icon: Hammer, available: false },
  { id: "scaling", label: "Scaling & Expansion", icon: TrendingUp, available: false },
];

const TOOL_ITEMS = [{ id: "analytics", label: "Live Analytics", icon: BarChart3 }];

// Render left rail navigation plus current session summary.
// `collapsed` shows an icon-only rail instead of the full 256px sidebar.
function Sidebar({
  activeTab,
  onTabChange,
  currentMode,
  currentTopic,
  currentMembers,
  onNewSession,
  onSignOut,
  onOpenProfile,
  theme,
  onThemeToggle,
  collapsed = false,
  onToggleCollapsed,
}) {
  const { user } = useAppStore();
  const width = collapsed ? "w-[72px]" : "w-64";

  return (
    <div
      className={`${width} h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-700 flex flex-col fixed left-0 top-0 z-10 transition-all duration-200`}
    >
      {/* Logo Area */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 dark:bg-slate-900">
        <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "justify-between"}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "flex-col" : ""}`}>
            <div className="w-8 h-8 bg-slate-900 dark:bg-white rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white dark:text-slate-900 font-bold font-mono text-xs">AB</span>
            </div>
            {!collapsed ? (
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">BOARDROOM</h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider">PLATFORM v1.0</p>
              </div>
            ) : null}
          </div>
          <button
            onClick={onThemeToggle}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            ) : (
              <Sun className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            )}
          </button>
        </div>
        <button
          onClick={onToggleCollapsed}
          className="mt-2 w-full flex items-center justify-center gap-1 p-1.5 rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Current Session Info */}
      {currentMode && !collapsed && (currentTopic || (currentMembers && currentMembers.length > 0)) ? (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 dark:bg-slate-900 space-y-3">
          {currentTopic ? (
            <div className="bg-white dark:bg-slate-800 rounded-md border border-dashed border-slate-200 dark:border-slate-700 p-3">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-1">Topic</span>
              <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-snug line-clamp-2">{currentTopic}</p>
            </div>
          ) : null}
          {currentMembers && currentMembers.length > 0 ? (
            <div>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase block mb-2">Council</span>
              <div className="flex -space-x-1.5">
                {currentMembers.map((member) => (
                  <div
                    key={member.id}
                    className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-50 dark:border-slate-900 flex items-center justify-center font-mono text-[9px] font-bold text-slate-600 dark:text-slate-300"
                    title={member.name}
                  >
                    {member.avatarInitials}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Unified Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto dark:bg-slate-900">
        <div>
          {!collapsed ? (
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 px-1">
              Phases
            </span>
          ) : null}
          <div className="space-y-1">
            {PHASE_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => item.available && onTabChange(item.id)}
                  disabled={!item.available}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : item.available
                      ? "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      : "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed ? <span className="flex-1 text-left">{item.label}</span> : null}
                  {!collapsed && isActive ? <span className="w-2 h-2 rounded-full bg-green-400" /> : null}
                  {!collapsed && !item.available ? <Lock className="w-3.5 h-3.5" /> : null}
                </button>
              );
            })}
            <button
              onClick={() => onTabChange("history")}
              title={collapsed ? "Past Discussions" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                activeTab === "history"
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <History className="w-5 h-5 flex-shrink-0" />
              {!collapsed ? <span className="flex-1 text-left">Past Discussions</span> : null}
            </button>
          </div>
        </div>

        <div>
          {!collapsed ? (
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 px-1">
              Tools
            </span>
          ) : null}
          <div className="space-y-1">
            {TOOL_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed ? item.label : null}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 dark:bg-slate-900 space-y-2">
        {onNewSession && !collapsed ? (
          <button
            onClick={onNewSession}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
          >
            New Session
          </button>
        ) : null}
        <button
          onClick={onOpenProfile}
          title="Profile"
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-mono text-xs font-bold flex-shrink-0">
            {(user?.username || "U").slice(0, 2).toUpperCase()}
          </div>
          {!collapsed ? (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.username || "User"}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">View Profile</p>
            </div>
          ) : null}
        </button>
        <button
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          onClick={onSignOut}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed ? "Sign Out" : null}
        </button>
      </div>
    </div>
  );
}

export { Sidebar };
