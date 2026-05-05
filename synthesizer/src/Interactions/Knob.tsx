import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEventHandler, WheelEventHandler } from 'react'
import styled from 'styled-components'

const DRAGGING_DENOMINATOR = 200

interface KnobProps {
  label?: string
  max: number
  min: number
  onChange?: (value: number) => void
  size?: number
  step: number
  unit?: string
  value: number
  disabled?: boolean;
}

interface Coords {
  x: number
  y: number
}

interface KnobMainProps {
  position: number
}

const KnobWrapper = styled.div<{ $size: number }>`
  width: ${({ $size }) => `${$size}px`};
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  touch-action: none;
`
const KnobDial = styled.div<{ $size: number }>`
  width: ${({ $size }) => `${$size}px`};
  height: ${({ $size }) => `${$size}px`};
`
const KnobLabel = styled.div`
  text-align: center;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1rem;
`
const KnobMain: React.FC<KnobMainProps> = ({ position }) => {
  const angle = Math.min(Math.max(0, position * 270), 270)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      style={{
        fillRule: 'evenodd',
        clipRule: 'evenodd',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeMiterlimit: 1.5,
        width: '100%',
        height: '100%',
      }}
      viewBox="0 0 1024 1024"
    >
      <g>
        <path
          fill="none"
          d="M202.085 686.883C135.815 633.107 94.786 558.75 94.786 476.659c0-163.901 163.552-296.967 365.003-296.967 201.45 0 365.002 133.066 365.002 296.967 0 81.743-40.682 155.817-106.457 209.539"
          style={{
            fill: '#ebebeb',
            fillOpacity: 0,
            stroke: 'currentColor',
            strokeWidth: '18px',
          }}
          transform="matrix(1.35193 0 0 1.66166 -109.602 -280.045)"
        />
        <path
          d="m960 960-97.415-97.415"
          style={{
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 28,
          }}
        />
        <path
          d="M164.09 859.91 64 960"
          style={{
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 28,
          }}
          transform="matrix(.98664 .01336 .01336 .98664 -11.974 11.974)"
        />
      </g>
      <g style={{ cursor: 'pointer', rotate: `${angle}deg`, transformOrigin: '50%', transition: 'rotate 100ms' }}>
        <ellipse
          cx={459.789}
          cy={476.659}
          fill="none"
          rx={365.003}
          ry={296.967}
          style={{
            fill: '#ebebeb',
            fillOpacity: 0,
            stroke: 'currentColor',
            strokeWidth: '22px',
          }}
          transform="matrix(1.12427 0 0 1.38185 -4.929 -146.67)"
        />
        <path
          d="M512 512 223.86 800.14"
          style={{
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 28,
          }}
        />
      </g>
    </svg>
  )
}

const Knob: React.FC<KnobProps> = ({ label, onChange, value: inputValue, step, min, max, size = 40, unit, disabled = false}) => {
  const touchCoords = useRef<Coords | null>(null)
  const knobRef = useRef<HTMLDivElement | null>(null)

  const [value, setValue] = useState(inputValue)
  const [isDragging, setIsDragging] = useState(false)

  // for the input
  const [isEditing, setIsEditing] = useState(false)
  const [inputValueState, setInputValueState] = useState(String(inputValue))

  const displayValue = unit === 'dB' && value === min ? '-inf' : Math.round(value * 10) / 10
  const position = (value - min) / (max - min)
  const displayString = unit ? `${displayValue} ${unit}` : String(displayValue);

  const formatValue = (v: number) => String(Math.round(v * 10) / 10)

  useEffect(() => { // to chnage the actual value of the knob
    setValue(inputValue)
    setInputValueState(String(inputValue))
  }, [inputValue])

  const handleChange = useCallback(
    (v: number) => {
      if (!disabled) onChange?.(v)
    },
    [onChange, disabled]
  )

  const clampValue = useCallback(
    (v: number) => Math.max(min, Math.min(max, v)),
    [min, max]
  )

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (disabled) return

      e.preventDefault()

      setValue((prev) => {
        const newValue = clampValue(
          prev + -e.movementY * ((max - min) / DRAGGING_DENOMINATOR)
        )
        handleChange(newValue)
        return newValue
      })
    },
    [max, min, disabled, clampValue, handleChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)

    if (document.exitPointerLock) {
      document.exitPointerLock()
    }

    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('mouseleave', handleMouseUp)
    window.removeEventListener('blur', handleMouseUp)
  }, [handleDrag])

  const handleMouseDown = useCallback(() => {
    if (disabled || isEditing) return

    setIsDragging(true)

    if (knobRef.current?.requestPointerLock) {
      knobRef.current.requestPointerLock()
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseUp)
    window.addEventListener('blur', handleMouseUp)
  }, [handleDrag, handleMouseUp, disabled, isEditing])

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled) return

      if (!touchCoords.current) return

      const delta = touchCoords.current.y - e.touches[0].screenY

      touchCoords.current = {
        x: e.touches[0].screenX,
        y: e.touches[0].screenY,
      }

      setValue((prev) => {
        const newValue = clampValue(prev + delta * ((max - min) / DRAGGING_DENOMINATOR))
        handleChange(newValue)
        return newValue
      })
    },
    [max, min, disabled, clampValue, handleChange]
  )

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    touchCoords.current = null

    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }, [handleTouchMove])

  const handleTouchStart = useCallback<TouchEventHandler<HTMLDivElement>>(
    (e) => {
      if (disabled || isEditing) return

      setIsDragging(true)

      touchCoords.current = {
        x: e.touches[0].screenX,
        y: e.touches[0].screenY,
      }

      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    },
    [handleTouchEnd, handleTouchMove, disabled, isEditing]
  )

  const handleMouseWheel = useCallback<WheelEventHandler<HTMLDivElement>>(
    (e) => {
      if (disabled || isEditing) return

      const newValue = clampValue(
        e.deltaY < 0
          ? value - step
          : value + step
      )
      setValue(newValue)
      handleChange(newValue)
    },
    [step, value, disabled, isEditing, clampValue, handleChange]
  )

  const commitInputValue = useCallback(() => {
    const parsed = parseFloat(inputValueState)

    if (Number.isNaN(parsed)) {
      setInputValueState(formatValue(value))
      setIsEditing(false)
      return
    }

    const clamped = clampValue(Math.round(parsed * 10) / 10)

    setValue(clamped)
    setInputValueState(String(clamped))
    setIsEditing(false)
    handleChange(clamped)
  }, [inputValueState, clampValue, value, handleChange])

  return (
    <KnobContainer>
      <KnobWrapper
        ref={knobRef}
        $size={size}
        onWheel={disabled ? undefined : handleMouseWheel}
        onMouseDown={disabled ? undefined : handleMouseDown}
        onTouchStart={disabled ? undefined : handleTouchStart}
        style={
          disabled
            ? {
                opacity: 0.5,
                cursor: 'not-allowed',
                pointerEvents: 'auto',
              }
            : isDragging
            ? { cursor: 'none' }
            : {}
        }
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
      >
        <KnobDial $size={size} className={`active:scale-105 hover:scale-105 ease-in-out duration-100 ${isDragging ? 'scale-105' : ''}`}>
          <KnobMain position={position} />
        </KnobDial>
      </KnobWrapper>

      {isEditing ? (
        <KnobInput $size={size} autoFocus type="number" value={inputValueState} step={step}
            min={min} max={max} onChange={(e) => setInputValueState(e.target.value)} onBlur={commitInputValue} onKeyDown={(e) => {
            if (e.key === 'Enter')
              commitInputValue()

            if (e.key === 'Escape') {
              setInputValueState(formatValue(value))
              setIsEditing(false)
            }
          }}
        />) : (
        <KnobValueButton
          type="button"
          $size={size}
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setInputValueState(formatValue(value))
            setIsEditing(true)
          }}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {displayString}
        </KnobValueButton>
      )}

      {label ? <KnobLabel>{label}</KnobLabel> : null}
    </KnobContainer>
  )
}

const KnobContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const sharedValueStyles = `
  background: var(--background-color);
  text-align: center;
  border: 1px solid var(--border-color);
  white-space: nowrap;
  outline: none;
`

const KnobValueButton = styled.button<{ $size: number }>`
  ${sharedValueStyles};

  margin-top: ${({ $size }) =>
    `${Math.max(2, Math.round($size * 0.06))}px`};

  min-width: ${({ $size }) =>
    `${Math.max(28, Math.round($size * 0.7))}px`};

  padding: ${({ $size }) =>
    `${Math.max(2, Math.round($size * 0.05))}px`};

  font-size: ${({ $size }) =>
    `${Math.max(9, Math.round($size * 0.20))}px`};

  line-height: ${({ $size }) =>
    `${Math.max(12, Math.round($size * 0.28))}px`};

  width: ${({ $size }) =>
  `${Math.max(38, Math.round($size * 1.2))}px`};

  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: transform 120ms ease;
  &:hover {transform: scale(1.08); filter: brightness(0.9);}
`

const KnobInput = styled.input<{ $size: number }>`
  ${sharedValueStyles};

  margin-top: ${({ $size }) =>
    `${Math.max(2, Math.round($size * 0.06))}px`};

  width: ${({ $size }) =>
    `${Math.max(38, Math.round($size * 1))}px`};

  min-width: ${({ $size }) =>
    `${Math.max(28, Math.round($size * 0.7))}px`};

  padding: ${({ $size }) =>
    `${Math.max(2, Math.round($size * 0.05))}px`};

  font-size: ${({ $size }) =>
    `${Math.max(10, Math.round($size * 0.22))}px`};

  line-height: ${({ $size }) =>
    `${Math.max(12, Math.round($size * 0.28))}px`};
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

  -moz-appearance: textfield;
  appearance: textfield;
`

export default Knob;
