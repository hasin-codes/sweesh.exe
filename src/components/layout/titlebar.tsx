"use client"
export function Titlebar() {
  return (
    <div className="native-titlebar">
      <div className="flex items-center justify-between w-full px-4">
        {/* Left side - App info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="icons/logo.svg"
              alt="Sweesh"
              width={18}
              height={18}
              className="rounded-sm"
            />
            <span className="text-sm font-semibold text-white tracking-tight">Sweesh</span>
          </div>
          <div className="h-4 w-px bg-gray-600" />
          <span className="text-xs text-gray-300 font-medium">v1.3.0</span>
        </div>
        {/* Right side - Window controls */}
        <div className="flex items-center gap-2 window-controls">
          {/* Minimize Button */}
          <button
            className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors duration-200 flex items-center justify-center group"
            onClick={async () => {
              if (window.electronAPI) {
                await window.electronAPI.minimizeWindow();
              }
            }}
          >
            <div className="w-2 h-0.5 bg-gray-300 group-hover:bg-white transition-colors duration-200"></div>
          </button>
         
          {/* Maximize/Restore Button */}
          <button
            className="w-4 h-4 rounded-full bg-gray-600 hover:bg-gray-500 transition-colors duration-200 flex items-center justify-center group"
            onClick={async () => {
              if (window.electronAPI) {
                await window.electronAPI.toggleMaximizeWindow();
              }
            }}
          >
            <div className="w-2 h-2 border border-gray-300 group-hover:border-white transition-colors duration-200 relative">
              <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border border-gray-300 group-hover:border-white transition-colors duration-200"></div>
            </div>
          </button>
         
          {/* Close Button */}
          <button
            className="w-4 h-4 rounded-full bg-red-600 hover:bg-red-500 transition-colors duration-200 flex items-center justify-center group"
            onClick={async () => {
              if (window.electronAPI) {
                await window.electronAPI.closeWindow();
              }
            }}
          >
            <div className="w-2 h-2 flex items-center justify-center">
              <div className="w-1.5 h-0.5 bg-red-200 group-hover:bg-white transition-colors duration-200 transform rotate-45 relative">
                <div className="absolute w-1.5 h-0.5 bg-red-200 group-hover:bg-white transition-colors duration-200 transform -rotate-90"></div>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}