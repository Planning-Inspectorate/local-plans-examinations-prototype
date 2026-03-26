//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // Add JavaScript here
  window.filterCheckboxes = function(input) {
    const filter = input.value.toLowerCase();
    const checkboxes = input.parentNode.querySelectorAll('.govuk-checkboxes__item');
    checkboxes.forEach(item => {
      const label = item.querySelector('label');
      if (label && label.textContent.toLowerCase().indexOf(filter) > -1) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  };
})

// Multi file upload v5 
const initMultiDocumentUploadV5 = () => {
  const fileInput = document.getElementById('documents')
  const uploadArea = document.querySelector('.moj-multi-file-upload__upload')
  const tableBody = document.querySelector('#filesTable tbody')
  const filesTableGroup = document.getElementById('filesTableGroup')
  const filesTableError = document.getElementById('filesTableError')
  const form = uploadArea ? (uploadArea.closest('form') || document.querySelector('form')) : null

  if (!fileInput || !uploadArea || !tableBody || !form) {
    return
  }

  const uploadedFiles = []

  const showUploadingError = () => {
    const existingError = document.querySelector('.govuk-error-summary')
    if (existingError) {
      return
    }

    const errorSummary = document.createElement('div')
    errorSummary.className = 'govuk-error-summary'
    errorSummary.setAttribute('data-module', 'govuk-error-summary')
    errorSummary.setAttribute('role', 'alert')
    errorSummary.setAttribute('aria-labelledby', 'error-summary-title')
    errorSummary.style.cssText = 'border: 5px solid #d4351c; padding: 20px; margin-bottom: 20px; background-color: #f8f8f8;'

    errorSummary.innerHTML = `
      <h2 class="govuk-error-summary__title" id="error-summary-title" style="color: #d4351c; margin: 0 0 15px 0; font-size: 19px; font-weight: bold;">
        There is a problem
      </h2>
      <div class="govuk-error-summary__body">
        <ul class="govuk-list govuk-error-summary__list" style="margin: 0; padding-left: 20px;">
          <li><a href="#filesTable" style="color: #d4351c; text-decoration: underline;">Wait for all files to finish uploading</a></li>
        </ul>
      </div>
    `

    uploadArea.parentNode.insertBefore(errorSummary, uploadArea)
    errorSummary.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (filesTableGroup && filesTableError) {
      filesTableGroup.classList.add('govuk-form-group--error')
      filesTableError.style.display = 'block'
    }
  }

  const hideUploadingError = () => {
    const existingError = document.querySelector('.govuk-error-summary')
    if (existingError) {
      existingError.remove()
    }

    if (filesTableGroup && filesTableError) {
      filesTableGroup.classList.remove('govuk-form-group--error')
      filesTableError.style.display = 'none'
    }
  }

  const animateUpload = (row, index) => {
    let percent = 0
    const progressEl = row.querySelector('.progress-percent')

    const interval = setInterval(() => {
      percent++
      progressEl.textContent = percent + '%'

      if (percent >= 100) {
        clearInterval(interval)

        const fileName = row.dataset.file
        const fileId = row.dataset.fileId
        const fileSize = row.dataset.fileSize

        uploadedFiles.push({
          id: fileId,
          name: fileName,
          size: parseInt(fileSize, 10)
        })

        row.innerHTML = `
          <td class="govuk-table__cell">
            <a href="#" class="govuk-link">${fileName}</a>
          </td>
          <td class="govuk-table__cell">
            <strong class="govuk-tag govuk-tag--green">Uploaded</strong>
          </td>
          <td class="govuk-table__cell">
            <a href="#" class="govuk-link remove-link">Remove</a>
          </td>
        `

        const uploadingRows = document.querySelectorAll('.uploading-row')
        const stillUploading = Array.from(uploadingRows).some(r => {
          const progressEl = r.querySelector('.progress-percent')
          return progressEl && parseInt(progressEl.textContent, 10) < 100
        })

        if (!stillUploading) {
          hideUploadingError()
        }
      }
    }, 40 + index * 20)
  }

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files)

    if (files.length === 0) {
      return
    }

    const fixedNames = files.map(f => f.name)
    tableBody.innerHTML = ''
    uploadedFiles.length = 0

    fixedNames.forEach((fixedName, index) => {
      const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9)

      const row = document.createElement('tr')
      row.className = 'govuk-table__row uploading-row'
      row.dataset.file = fixedName
      row.dataset.fileId = fileId
      row.dataset.fileSize = 0

      row.innerHTML = `
        <td class="govuk-table__cell">
          ${fixedName}
        </td>
        <td class="govuk-table__cell">
          Uploading: <span class="progress-percent">0%</span>
        </td>
        <td class="govuk-table__cell">
          <a href="#" class="govuk-link">Cancel</a>
        </td>
      `

      tableBody.appendChild(row)
      animateUpload(row, index)
    })

    fileInput.value = ''
  })

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadArea.style.borderColor = '#0b0c0c'
    uploadArea.style.backgroundColor = '#f8f8f8'
  })

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault()
    uploadArea.style.borderColor = '#b1b4b6'
    uploadArea.style.backgroundColor = '#ffffff'
  })

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadArea.style.borderColor = '#b1b4b6'
    uploadArea.style.backgroundColor = '#ffffff'

    const files = Array.from(e.dataTransfer.files)

    if (files.length === 0) {
      return
    }

    const fixedNames = files.map(f => f.name)
    tableBody.innerHTML = ''
    uploadedFiles.length = 0

    fixedNames.forEach((fixedName, index) => {
      const fileId = Date.now() + '-' + Math.random().toString(36).substr(2, 9)

      const row = document.createElement('tr')
      row.className = 'govuk-table__row uploading-row'
      row.dataset.file = fixedName
      row.dataset.fileId = fileId
      row.dataset.fileSize = 0

      row.innerHTML = `
        <td class="govuk-table__cell">
          ${fixedName}
        </td>
        <td class="govuk-table__cell">
          Uploading: <span class="progress-percent">0%</span>
        </td>
        <td class="govuk-table__cell">
          <a href="#" class="govuk-link">Cancel</a>
        </td>
      `

      tableBody.appendChild(row)
      animateUpload(row, index)
    })
  })

  document.addEventListener('click', (e) => {
    const link = e.target.closest('.govuk-link')

    if (!link) return

    const text = link.textContent.trim()

    if (text === 'Cancel' || text === 'Remove') {
      e.preventDefault()

      const row = link.closest('.govuk-table__row')

      if (row) {
        const fileId = row.dataset.fileId
        const index = uploadedFiles.findIndex(f => f.id === fileId)
        if (index > -1) {
          uploadedFiles.splice(index, 1)
        }
        row.remove()

        const uploadingRows = document.querySelectorAll('.uploading-row')
        const stillUploading = Array.from(uploadingRows).some(r => {
          const progressEl = r.querySelector('.progress-percent')
          return progressEl && parseInt(progressEl.textContent, 10) < 100
        })

        if (!stillUploading) {
          hideUploadingError()
        }
      }
    }
  })

  form.addEventListener('submit', (e) => {
    const uploadingRows = document.querySelectorAll('.uploading-row')
    const uploadingCount = Array.from(uploadingRows).filter(row => {
      const progressEl = row.querySelector('.progress-percent')
      return progressEl && parseInt(progressEl.textContent, 10) < 100
    }).length

    if (uploadingCount > 0) {
      e.preventDefault()
      showUploadingError()
      return
    }

    hideUploadingError()

    const fileDataInput = document.createElement('input')
    fileDataInput.type = 'hidden'
    fileDataInput.name = 'fileData'
    fileDataInput.value = JSON.stringify(uploadedFiles)
    form.appendChild(fileDataInput)
  })
}

window.GOVUKPrototypeKit.documentReady(() => {
  initMultiDocumentUploadV5()
})
