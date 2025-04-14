import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'

function Task({ task, tags, onDelete, onUpdate, onStartTimer }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [showTagMenu, setShowTagMenu] = useState(false)
  
  const handleToggleComplete = async () => {
    const updatedTask = {
      ...task,
      completed: !task.completed
    }
    
    onUpdate(updatedTask)
  }
  
  const handleSaveEdit = async () => {
    if (title.trim() === '') return
    
    const updatedTask = {
      ...task,
      title: title.trim()
    }
    
    onUpdate(updatedTask)
    setIsEditing(false)
  }
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setTitle(task.title)
      setIsEditing(false)
    }
  }
  
  const handleAddTag = async (tagId) => {
    try {
      const { error } = await supabase
        .from('task_tags')
        .insert({ task_id: task.id, tag_id: tagId })
      
      if (error) throw error
      
      // Refresh the task to show the new tag
      onUpdate({ ...task })
      setShowTagMenu(false)
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }
  
  const handleRemoveTag = async (tagId) => {
    try {
      const { error } = await supabase
        .from('task_tags')
        .delete()
        .match({ task_id: task.id, tag_id: tagId })
      
      if (error) throw error
      
      // Refresh the task to remove the tag
      onUpdate({ ...task })
    } catch (error) {
      console.error('Error removing tag:', error)
    }
  }
  
  // Get the tags for this task
  const taskTags = tags.filter(tag => 
    task.tags && task.tags.includes(tag.id)
  )
  
  // Get available tags (tags not already assigned to this task)
  const availableTags = tags.filter(tag => 
    !task.tags || !task.tags.includes(tag.id)
  )
  
  return (
    <div className="card mb-3 transition-all hover:shadow-lg">
      <div className="flex items-start">
      {/* Custom Checkbox */}
      <label className="inline-flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleToggleComplete}
          className="hidden"
        />
        <span className={`w-5 h-5 flex items-center justify-center rounded border-2 
                          ${task.completed ? 'bg-primary' : 'bg-transparent'}
                          border-[var(--color-primary-dark)]`}>
          {task.completed && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </label>

        
        <div className="ml-3 flex-grow">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              className="input w-full"
              autoFocus
            />
          ) : (
            <div 
              className={`text-lg ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}
              onClick={() => setIsEditing(true)}
            >
              {task.title}
            </div>
          )}
          
          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1">
            {taskTags.map(tag => (
              <div 
                key={tag.id} 
                className="tag bg-opacity-10 text-primary border border-primary group"
              >
                {tag.name}
                <button 
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 text-primary opacity-0 group-hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            ))}
            
            <div className="relative">
              <button 
                onClick={() => setShowTagMenu(!showTagMenu)}
                className="tag bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                + Tag
              </button>
              
              {showTagMenu && availableTags.length > 0 && (
                <div className="absolute z-10 mt-1 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg">
                  <div className="py-1">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleAddTag(tag.id)}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-4 flex space-x-2">
          <button
            onClick={() => onStartTimer(task)}
            className="text-primary hover:text-accent"
            title="Start Timer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </button>
          
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Delete Task"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Task