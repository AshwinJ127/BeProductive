import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'

function Timer({ task, onTimerComplete }) {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30 * 60)
  const [initialTime, setInitialTime] = useState(25 * 60)
  const [startTime, setStartTime] = useState(null)
  const [customMinutes, setCustomMinutes] = useState(30)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [showVisualAlert, setShowVisualAlert] = useState(false)
  const intervalRef = useRef(null)

  const [editingTitle, setEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task?.title || 'Countdown Timer');

  useEffect(() => {
    setEditedTitle(task?.title || 'Countdown Timer');
  }, [task]);

  const updateTaskTitle = async () => {
    if (task && (editedTitle.trim() === '' || editedTitle === task.title)) return;
    if (!task && editedTitle.trim() === 'Countdown Timer') return;

    try {
      if (task) {
        const { error } = await supabase
          .from('tasks')
          .update({ title: editedTitle.trim() })
          .eq('id', task.id);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };


  useEffect(() => {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }, [])

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const setCustomTimer = () => {
    if (customMinutes) {
      const newTimeInSeconds = Math.max(1, Math.min(999, customMinutes)) * 60
      setTimeLeft(newTimeInSeconds)
      setInitialTime(newTimeInSeconds)
      setShowCustomInput(false)
    }
  }
  
  const handleCustomInputKeyDown = (e) => {
    if (e.key === 'Enter' && customMinutes) {
      setCustomTimer()
    }
  }

  const presetTimes = [
    { label: '5 min', value: 5 * 60 },
    { label: '15 min', value: 15 * 60 },
    { label: '30 min', value: 30 * 60 },
    { label: '60 min', value: 60 * 60 },
  ]

  const setPresetTime = (seconds) => {
    setTimeLeft(seconds)
    setInitialTime(seconds)
  }

  const startTimer = () => {
    if (!isRunning && timeLeft > 0) {
      setIsRunning(true)
      setStartTime(new Date())

      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            timerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const timerComplete = async () => {
    setIsRunning(false)
    setShowVisualAlert(true)

    if (Notification.permission === 'granted') {
      new Notification("Time's up!", {
        body: task ? `Task "${task.title}" is complete.` : "Your timer has finished.",
        icon: '/path/to/icon.png'
      })
    }

    if (task) {
      const endTime = new Date()
      try {
        const { error } = await supabase
          .from('timer_sessions')
          .insert({
            task_id: task.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            duration_seconds: initialTime
          })

        if (error) throw error
        onTimerComplete(task.id, initialTime)
      } catch (error) {
        console.error('Error saving timer session:', error)
      }
    }
  }

  const pauseTimer = () => {
    if (isRunning) {
      clearInterval(intervalRef.current)
      setIsRunning(false)
    }
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setTimeLeft(initialTime)
    setStartTime(null)
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Define a consistent icon width for spacing
  // The pencil icon is wider than the 'x' character. Let's base it on the pencil.
  // You might need to adjust this value (e.g., '24px', '1.5rem')
  // based on the actual rendered size of your pencil icon.
  const iconWidth = '24px'; // Estimate the width of your pencil icon for spacing

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4 text-text"
          style={{ paddingBottom: '10px' }}> {/* Removed absolute positioning from h2 for this approach */}
        <div className="flex items-center justify-center"> {/* This flex container centers its content */}
          {editingTitle ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                setEditingTitle(false);
                updateTaskTitle();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditingTitle(false);
                  updateTaskTitle();
                } else if (e.key === 'Escape') {
                  setEditedTitle(task?.title || 'Countdown Timer');
                  setEditingTitle(false);
                }
              }}
              className="input text-lg px-2 py-1 border rounded w-full text-center"
              autoFocus
            />
          ) : (
            <>
              {/* Spacer on the left to visually balance the icon on the right */}
              <div style={{ width: iconWidth, flexShrink: 0, height: '1px' }}></div> {/* Add height to prevent collapse */}

              {/* The main title text, centered */}
              <span className="flex-grow text-center">
                {task ? `Timer: ${task.title}` : editedTitle}
              </span>

              {/* Conditionally render pencil or X based on 'task' prop */}
              {!task && ( // Show pencil only if no task is associated
                <button
                  onClick={() => setEditingTitle(true)}
                  className="text-gray-500 hover:text-gray-800 flex-shrink-0"
                  style={{ width: iconWidth, transform: 'translateY(-2px)' }} // Maintain icon width and vertical adjust
                >
                  ✎
                </button>
              )}
              {task && ( // Show 'x' only if a task is associated
                <button
                  onClick={() => onTimerComplete(task.id, 0)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  title="Remove Task From Timer"
                  style={{ width: iconWidth, transform: 'translateY(-2px)' }} // Maintain icon width and vertical adjust
                >
                  &times;
                </button>
              )}
            </>
          )}
        </div>
      </h2>

      <div className="flex flex-col items-center">
        <div className="w-40 h-20 bg-gradient-to-r from-red-700 to-red-800 dark:from-gray-900 dark:to-black rounded-lg flex items-center justify-center mb-6 shadow-lg border border-red-300 dark:border-red-800">
          <span className="text-4xl text-white font-oxanium font-semibold">
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex space-x-2 mb-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="btn btn-primary"
              disabled={timeLeft === 0}
            >
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="btn btn-secondary"
            >
              Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="btn btn-secondary"
            disabled={timeLeft === initialTime && !isRunning}
          >
            Reset
          </button>
        </div>

        {!isRunning && (
          <div className="w-full">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {presetTimes.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setPresetTime(preset.value)}
                  className={`px-3 py-1 text-sm rounded-full ${initialTime === preset.value
                    ? 'bg-primary text-text'
                    : 'bg-card text-text-muted'}`}
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="px-3 py-1 text-sm rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                Custom
              </button>
            </div>

            {showCustomInput && (
              <div className="flex items-center justify-center space-x-2 mb-2">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customMinutes === 0 ? '' : customMinutes}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomMinutes(value === '' ? 0 : parseInt(value) || 0);
                  }}
                  onKeyDown={handleCustomInputKeyDown}
                  className="input w-24 text-center"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
                <button
                  onClick={setCustomTimer}
                  disabled={!customMinutes}
                  className={`btn text-white ${customMinutes ? 'bg-primary' : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  Set
                </button>
              </div>
            )}
          </div>
        )}

        {showVisualAlert && timeLeft === 0 && (
          <div className="flex flex-col items-center mt-4">
            <div className="text-accent text-lg font-bold  mb-2">
              Time's up!
            </div>
            <button
              onClick={() => {
                setShowVisualAlert(false);
              }}
              className="btn btn-secondary"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Timer