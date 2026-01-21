import { useTheme, useThemeClasses } from '../../contexts/ThemeContext'

// Progress Ring for season progress
export function ProgressRing({ progress, size = 64, color }) {
  const { accent } = useTheme()
  const tc = useThemeClasses()
  const radius = (size - 6) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={tc.colors.border} 
          strokeWidth="6" 
          fill="none" 
        />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={color || accent?.primary} 
          strokeWidth="6" 
          fill="none" 
          strokeLinecap="round" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          className="transition-all duration-500" 
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${tc.text}`}>
        {progress}%
      </span>
    </div>
  )
}
