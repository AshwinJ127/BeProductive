import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import Task from './Task'
import Dropdown from './Dropdown'
import TagDropdown from './TagDropdown'

function TodoList({ session, onStartTimer }) {
  const [tasks, setTasks] = useState([])
  const [tags, setTags] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active') // 'all', 'active', 'completed'
  const [tagFilter, setTagFilter] = useState(null)
  const [showTagForm, setShowTagForm] = useState(false)
  const [selectedTags, setSelectedTags] = useState([])
  const [showNewTaskTagMenu, setShowNewTaskTagMenu] = useState(false)
  const newTaskTagMenuRef = useRef(null)
  
  // Fetch tasks and tags on component mount
  useEffect(() => {
    fetchTasks()
    fetchTags()
  }, [session])
  
  // Handle click outside for tag menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (newTaskTagMenuRef.current && !newTaskTagMenuRef.current.contains(event.target)) {
        setShowNewTaskTagMenu(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [newTaskTagMenuRef])
  
  // Fetch tasks from Supabase
  const fetchTasks = async () => {
    try {
      setLoading(true)
      
      // Get tasks for the current user
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_tags(tag_id)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Process tasks to include tags array
      const processedTasks = tasks.map(task => ({
        ...task,
        tags: task.task_tags ? task.task_tags.map(tt => tt.tag_id) : []
      }))
      
      setTasks(processedTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch tags from Supabase
  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')
      
      if (error) throw error
      
      setTags(data || [])
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }
  
  // Add a new task
  const addTask = async (e) => {
    e.preventDefault()
    
    if (newTaskTitle.trim() === '') return
    
    try {
      // First, insert the task
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskTitle.trim(),
          user_id: session.user.id,
          completed: false
        })
        .select()
      
      if (error) throw error
      
      // Create a new task object with empty tags array by default
      const newTask = { ...data[0], tags: selectedTags.length > 0 ? [...selectedTags] : [] }
      
      // Then, if there are selected tags, associate them with the task
      if (selectedTags.length > 0) {
        const tagAssociations = selectedTags.map(tagId => ({
          task_id: newTask.id,
          tag_id: tagId
        }))
        
        const { error: tagError } = await supabase
          .from('task_tags')
          .insert(tagAssociations)
        
        if (tagError) throw tagError
      }
      // If no tags are selected, that's fine - the task will be created without tags
      
      // Add the new task to the state
      setTasks([newTask, ...tasks])
      setNewTaskTitle('')
      setSelectedTags([]) // Clear selected tags after adding task
      setShowNewTaskTagMenu(false)
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }
  
  // Toggle tag selection for new task
  const toggleTagSelection = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }
  
  // Delete a task
  const deleteTask = async (id) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Remove the task from the state
      setTasks(tasks.filter(task => task.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }
  
  // Update a task
  const updateTask = async (updatedTask) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updatedTask.title,
          completed: updatedTask.completed
        })
        .eq('id', updatedTask.id)
      
      if (error) throw error
      
      // Update the task in the state
      setTasks(tasks.map(task => 
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      ))
      
      // Refresh tasks to get updated tags
      fetchTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }
  
  // Add a new tag
  const addTag = async (e) => {
    e.preventDefault()
    
    if (newTagName.trim() === '') return
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: newTagName.trim(),
          user_id: session.user.id
        })
        .select()
      
      if (error) throw error
      
      // Add the new tag to the state
      setTags([...tags, data[0]])
      setNewTagName('')
      setShowTagForm(false)
    } catch (error) {
      console.error('Error adding tag:', error)
    }
  }
  
  // Delete a tag
  const deleteTag = async (id) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Remove the tag from the state
      setTags(tags.filter(tag => tag.id !== id))
      
      // Clear tag filter if the deleted tag was selected
      if (tagFilter === id) {
        setTagFilter(null)
      }
      
      // Refresh tasks to update tag associations
      fetchTasks()
    } catch (error) {
      console.error('Error deleting tag:', error)
    }
  }
  
  // Filter tasks based on current filter settings
  const filteredTasks = tasks.filter(task => {
    // First apply completion filter
    const completionFilter = 
      filter === 'all' ? true :
      filter === 'active' ? !task.completed :
      task.completed
    
    // Then apply tag filter if one is selected
    let tagFilterMatch = true
    
    if (tagFilter === 'no-tags') {
      // Show tasks with no tags
      tagFilterMatch = !task.tags || task.tags.length === 0
    } else if (tagFilter) {
      // Show tasks with the selected tag
      tagFilterMatch = task.tags && task.tags.includes(tagFilter)
    }
    
    return completionFilter && tagFilterMatch
  })
  
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Tasks</h2>
        
        <div className="flex space-x-2">
        <Dropdown value={filter} onChange={setFilter} />
          
        <TagDropdown value={tagFilter} onChange={setTagFilter} tags={tags} />

        </div>
      </div>
      
      {/* Add task form */}
      <form onSubmit={addTask} className="mb-6">
        <div className="flex flex-col space-y-2">
          <div className="flex">
            <input
              type="text"
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="input flex-grow"
            />
            <button
              type="submit"
              className="btn btn-primary ml-2"
              disabled={newTaskTitle.trim() === ''}
            >
              Add
            </button>
          </div>
          
          {/* Tag selection for new task */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <div 
                      key={tag.id} 
                      className="tag bg-opacity-10 text-primary border border-primary group"
                    >
                      {tag.name}
                      <button 
                        type="button"
                        onClick={() => toggleTagSelection(tag.id)}
                        className="ml-1 text-primary"
                      >
                        &times;
                      </button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
            
            <div className="relative" ref={newTaskTagMenuRef}>
              <button 
                type="button"
                onClick={() => setShowNewTaskTagMenu(!showNewTaskTagMenu)}
                className="tag bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                + Tag
              </button>
              
              {showNewTaskTagMenu && (
                <div className="absolute z-10 mt-1 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg">
                  <div className="py-1 max-h-48 overflow-y-auto">
                    {/* Option to clear all tags */}
                    {selectedTags.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTags([])}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                      >
                        Clear All Tags
                      </button>
                    )}
                    
                    {/* Available tags */}
                    {tags
                      .filter(tag => !selectedTags.includes(tag.id))
                      .map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTagSelection(tag.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {tag.name}
                        </button>
                      ))}
                    
                    {/* Message when all tags are selected */}
                    {tags.length > 0 && tags.filter(tag => !selectedTags.includes(tag.id)).length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        All tags selected
                      </div>
                    )}
                    
                    {/* Message when no tags exist */}
                    {tags.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No tags available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
      
      {/* Tags section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Tags</h3>
          <button
            onClick={() => setShowTagForm(!showTagForm)}
            className="text-sm text-primary hover:text-accent"
          >
            {showTagForm ? 'Cancel' : '+ Create Tag'}
          </button>
        </div>
        
        {showTagForm && (
          <form onSubmit={addTag} className="mb-4">
            <div className="flex">
              <input
                type="text"
                placeholder="New tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="input flex-grow"
              />
              <button
                type="submit"
                className="btn btn-primary ml-2"
                disabled={newTagName.trim() === ''}
              >
                Add
              </button>
            </div>
          </form>
        )}
        
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div 
              key={tag.id} 
              className="tag bg-primary text-text dark:bg-primary-dark dark:text-text group"
            >
              {tag.name}
              <button 
                onClick={() => deleteTag(tag.id)}
                className="ml-1 text-text-muted opacity-0 group-hover:opacity-100"
              >
                &times;
              </button>
            </div>
          ))}
          
          {tags.length === 0 && (
            <p className="text-sm text-muted">
              No tags yet. Create some tags to organize your tasks.
            </p>
          )}
        </div>
      </div>
      
      {/* Tasks list */}
      <div>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <Task
              key={task.id}
              task={task}
              tags={tags}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onStartTimer={onStartTimer}
            />
          ))
        ) : (
          <p className="text-center py-4 text-text-muted">
            No tasks found. {filter !== 'all' && 'Try changing your filters.'}
          </p>
        )}
      </div>
    </div>
  )
}

export default TodoList