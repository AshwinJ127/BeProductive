import { useState } from 'react'
import TodoList from '../components/TodoList'
import Timer from '../components/Timer'

function Home({ session }) {
  const [currentTask, setCurrentTask] = useState(null)
  
  const handleStartTimer = (task) => {
    setCurrentTask(task)
  }
  
  const handleTimerComplete = (taskId, duration) => {
    // You could update UI to show the completed timer session
    console.log(`Timer completed for task ${taskId} with duration ${duration} seconds`)
    setCurrentTask(null)
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <TodoList 
          session={session} 
          onStartTimer={handleStartTimer} 
        />
      </div>
      
      <div>
        <Timer 
          task={currentTask} 
          onTimerComplete={handleTimerComplete} 
        />
      </div>
    </div>
  )
}

export default Home