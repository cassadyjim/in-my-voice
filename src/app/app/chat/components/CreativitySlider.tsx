'use client'

interface CreativitySliderProps {
  value: number
  onChange: (value: number) => void
}

const CREATIVITY_LABELS = [
  { value: 0.3, label: 'Precise', description: 'Consistent, focused' },
  { value: 0.5, label: 'Balanced', description: 'Good mix' },
  { value: 0.7, label: 'Creative', description: 'More varied' },
  { value: 0.9, label: 'Adventurous', description: 'Surprising' },
  { value: 1.0, label: 'Wild', description: 'Unpredictable' },
]

export function CreativitySlider({ value, onChange }: CreativitySliderProps) {
  const currentLabel = CREATIVITY_LABELS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  )

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-500 flex-shrink-0">Creativity:</span>
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <span className="text-sm font-medium text-purple-600 min-w-[80px]">
          {currentLabel.label}
        </span>
      </div>
    </div>
  )
}
