(() => {
  const MAX_ITEMS = 8

  const renderDropdown = (dropdown, items, input) => {
    dropdown.innerHTML = ''
    if (!items.length) {
      dropdown.hidden = true
      return
    }
    items.slice(0, MAX_ITEMS).forEach((item, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'search-autocomplete-item'
      button.dataset.index = String(index)
      button.textContent = item
      button.addEventListener('click', () => {
        input.value = item
        dropdown.hidden = true
        input.form?.requestSubmit()
      })
      dropdown.appendChild(button)
    })
    dropdown.hidden = false
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('[data-search-autocomplete-input]')
    const dropdown = document.querySelector('[data-search-autocomplete-dropdown]')
    const saveButton = document.querySelector('[data-save-search]')
    const form = document.querySelector('[data-search-form]')
    if (!(input instanceof HTMLInputElement) || !(dropdown instanceof HTMLElement) || !(form instanceof HTMLFormElement)) return

    let activeIndex = -1
    let suggestions = []

    const loadSuggestions = async () => {
      const query = input.value.trim()
      if (query.length < 2) {
        renderDropdown(dropdown, [], input)
        suggestions = []
        activeIndex = -1
        return
      }
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`)
      const payload = await response.json()
      suggestions = Array.isArray(payload.items) ? payload.items : []
      activeIndex = -1
      renderDropdown(dropdown, suggestions, input)
    }

    input.addEventListener('input', () => { void loadSuggestions() })
    input.addEventListener('keydown', (event) => {
      if (dropdown.hidden || !suggestions.length) return
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        activeIndex = Math.min(activeIndex + 1, suggestions.length - 1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        activeIndex = Math.max(activeIndex - 1, 0)
      } else if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault()
        input.value = suggestions[activeIndex]
        dropdown.hidden = true
        form.requestSubmit()
        return
      } else if (event.key === 'Escape') {
        dropdown.hidden = true
        return
      }
      dropdown.querySelectorAll('.search-autocomplete-item').forEach((element, index) => {
        element.classList.toggle('is-active', index === activeIndex)
      })
    })

    form.addEventListener('submit', async () => {
      const params = new FormData(form)
      const query = String(params.get('q') || '').trim()
      if (!query) return
      try {
        await fetch('/api/search/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })
      } catch (error) {
        console.error('[search.js] log failed', error)
      }
    })

    if (saveButton instanceof HTMLButtonElement) {
      saveButton.addEventListener('click', async () => {
        const params = new FormData(form)
        const query = String(params.get('q') || '').trim()
        if (!query) return
        const filters = Object.fromEntries(params.entries())
        try {
          const response = await fetch('/api/search/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, filters }),
          })
          if (response.ok) saveButton.textContent = 'Zapisano'
        } catch (error) {
          console.error('[search.js] save failed', error)
        }
      })
    }

    document.addEventListener('click', (event) => {
      if (!dropdown.contains(event.target) && event.target !== input) dropdown.hidden = true
    })
  })
})()
