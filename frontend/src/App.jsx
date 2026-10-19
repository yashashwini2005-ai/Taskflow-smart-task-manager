
import { useState, useEffect } from 'react'
import api from './api'
import './App.css'

function App() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Personal')
  const [priority, setPriority] = useState('Medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load saved tasks from Django when the app opens.
  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await api.get('tasks/')
        setTasks(response.data)
      } catch (err) {
        console.error(err)
        setError('Could not load tasks. Check whether Django is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  const completed = tasks.filter(task => task.completed).length
  const pending = tasks.length - completed

  const visibleTasks = tasks.filter(task => {
    if (filter === 'Completed') return task.completed
    if (filter === 'Pending') return !task.completed
    return true
  })

  // Save a new task in the Django database.
  async function addTask(event) {
    event.preventDefault()
    if (!title.trim()) return

    try {
      setError('')

      const response = await api.post('tasks/', {
        title: title.trim(),
        category,
        priority,
        due_date: dueDate || null,
        completed: false,
      })

      setTasks(current => [...current, response.data])
      setTitle('')
      setCategory('Personal')
      setPriority('Medium')
      setDueDate('')
      setShowForm(false)
    } catch (err) {
      console.error(err.response?.data || err)
      setError('Could not save task. Check your Django API and field settings.')
    }
  }

  // Save completion changes in the database.
  async function toggleTask(id) {
    const task = tasks.find(item => item.id === id)
    if (!task) return

    try {
      setError('')

      const response = await api.patch(`tasks/${id}/`, {
        completed: !task.completed,
      })

      setTasks(current =>
        current.map(item => item.id === id ? response.data : item)
      )
    } catch (err) {
      console.error(err.response?.data || err)
      setError('Could not update task. Please try again.')
    }
  }

  // Delete the task from the database.
  async function deleteTask(id) {
    try {
      setError('')
      await api.delete(`tasks/${id}/`)
      setTasks(current => current.filter(task => task.id !== id))
    } catch (err) {
      console.error(err.response?.data || err)
      setError('Could not delete task. Please try again.')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">✓</span> TaskFlow
        </div>

        <p className="nav-heading">WORKSPACE</p>

        <button
          className={`nav-item ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          ▦ &nbsp; My Tasks
        </button>

        <button
          className={`nav-item ${filter === 'Pending' ? 'active' : ''}`}
          onClick={() => setFilter('Pending')}
        >
          ◷ &nbsp; Pending
        </button>

        <button
          className={`nav-item ${filter === 'Completed' ? 'active' : ''}`}
          onClick={() => setFilter('Completed')}
        >
          ✓ &nbsp; Completed
        </button>

        <div className="sidebar-bottom">
          <div className="profile-avatar">Y</div>
          <div>
            <strong>My Workspace</strong>
            <p>TaskFlow account</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Workspace / My Tasks</span>
          <span className="today-label">● Your productivity space</span>
        </header>

        <section className="welcome">
          <div>
            <p className="eyebrow">YOUR PERSONAL WORKSPACE</p>
            <h1>Get things done.</h1>
            <p className="subtitle">
              Plan your day, focus on what matters, and make progress.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowForm(!showForm)}
          >
            + Add new task
          </button>
        </section>

        {error && (
          <p role="alert" style={{ color: '#c0392b' }}>
            {error}
          </p>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
            <small>All your tasks</small>
          </div>

          <div className="stat-card">
            <span>Completed</span>
            <strong>{completed}</strong>
            <small>Tasks finished</small>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{pending}</strong>
            <small>Still in progress</small>
          </div>

          <div className="stat-card">
            <span>Completion</span>
            <strong>
              {tasks.length
                ? Math.round((completed / tasks.length) * 100)
                : 0}%
            </strong>
            <small>Overall progress</small>
          </div>
        </section>

        {showForm && (
          <form className="task-form" onSubmit={addTask}>
            <h2>Create a new task</h2>

            <label>
              Task name
              <input
                value={title}
                onChange={event => setTitle(event.target.value)}
                placeholder="What do you need to do?"
                required
              />
            </label>

            <div className="form-row">
              <label>
                Category
                <select
                  value={category}
                  onChange={event => setCategory(event.target.value)}
                >
                  <option>Personal</option>
                  <option>Learning</option>
                  <option>Career</option>
                  <option>Work</option>
                </select>
              </label>

              <label>
                Priority
                <select
                  value={priority}
                  onChange={event => setPriority(event.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

              <label>
                Due date
                <input
                  type="date"
                  value={dueDate}
                  onChange={event => setDueDate(event.target.value)}
                />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button className="primary-button" type="submit">
                Save task
              </button>
            </div>
          </form>
        )}

        <section className="task-section">
          <div className="section-header">
            <div>
              <h2>Your tasks</h2>
              <p>Keep moving forward, one task at a time.</p>
            </div>

            <select
              className="filter-select"
              value={filter}
              onChange={event => setFilter(event.target.value)}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>

          <div className="task-list">
            {loading ? (
              <p>Loading tasks...</p>
            ) : (
              <>
                {visibleTasks.map(task => (
                  <article
                    className={`task-card ${
                      task.completed ? 'is-completed' : ''
                    }`}
                    key={task.id}
                  >
                    <button
                      className={`check-button ${
                        task.completed ? 'checked' : ''
                      }`}
                      onClick={() => toggleTask(task.id)}
                      aria-label="Toggle task completion"
                    >
                      {task.completed ? '✓' : ''}
                    </button>

                    <div className="task-info">
                      <h3>{task.title}</h3>
                      <p>
                        {task.category}
                        {task.due_date
                          ? ` · Due ${task.due_date}`
                          : ''}
                      </p>
                    </div>

                    <span
                      className={`priority priority-${(
                        task.priority || 'Medium'
                      ).toLowerCase()}`}
                    >
                      {task.priority}
                    </span>

                    <button
                      className="delete-button"
                      onClick={() => deleteTask(task.id)}
                      aria-label="Delete task"
                    >
                      ×
                    </button>
                  </article>
                ))}

                {visibleTasks.length === 0 && (
                  <p className="empty-state">
                    No tasks here yet. Add a task to get started!
                  </p>
                )}
              </>
            )}
          </div>
        </section>

        <footer>Small steps every day lead to big results.</footer>
      </main>
    </div>
  )
}

export default App
