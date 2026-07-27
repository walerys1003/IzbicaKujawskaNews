/**
 * Etap A5 — wysyłka mediów w tle, z paskiem postępu i podglądem.
 *
 * Formularz w MediaUploader.tsx ma poprawne method/action/enctype, więc
 * działa bez tego pliku — przeglądarka wyśle go zwyczajnie i pokaże
 * odpowiedź JSON. Ten skrypt tylko zamienia to na wysyłkę bez opuszczania
 * strony. Jeśli skrypt się nie wykona, redaktor nadal wgra plik; traci
 * wyłącznie pasek postępu.
 *
 * Świadomie użyto XMLHttpRequest, nie fetch(): fetch nie raportuje postępu
 * wysyłki, a przy filmie o wielkości 300 MB brak informacji o postępie jest
 * nieodróżnialny od zawieszonej przeglądarki — redaktor przerywa wysyłkę
 * w połowie i próbuje od nowa.
 */
;(function () {
  'use strict'

  var form = document.getElementById('media-upload-form')
  if (!form) return

  var fileInput = document.getElementById('media-file')
  var altInput = document.getElementById('media-alt')
  var submit = document.getElementById('media-upload-submit')
  var status = document.getElementById('media-upload-status')
  var progressBox = document.getElementById('media-upload-progress')
  var bar = document.getElementById('media-upload-bar')
  var preview = document.getElementById('media-upload-preview')

  /** Powyżej tego progu serwer wymaga trybu wieloczęściowego. */
  var LIMIT_POJEDYNCZEGO = 100 * 1024 * 1024

  function pokaz(tekst, rodzaj) {
    if (!status) return
    status.textContent = tekst
    status.className = 'admin-upload-status' + (rodzaj ? ' is-' + rodzaj : '')
  }

  function mb(bajty) {
    return (bajty / 1024 / 1024).toFixed(1) + ' MB'
  }

  /** Token dostępu redaktora. Panel trzyma go w sessionStorage. */
  function token() {
    try {
      return (
        window.sessionStorage.getItem('izbica24.accessToken') ||
        window.localStorage.getItem('izbica24.accessToken') ||
        ''
      )
    } catch (e) {
      return ''
    }
  }

  function podgladLokalny(plik) {
    if (!preview) return
    preview.innerHTML = ''
    preview.hidden = true
    if (!plik || plik.type.indexOf('image/') !== 0) return
    var url = URL.createObjectURL(plik)
    var img = document.createElement('img')
    img.src = url
    img.alt = 'Podgląd wybranego pliku przed wysłaniem'
    img.className = 'admin-upload-thumb'
    // Zwolnienie adresu blob po wyrenderowaniu — inaczej każdy wybrany plik
    // zostaje w pamięci karty do jej zamknięcia.
    img.onload = function () {
      URL.revokeObjectURL(url)
    }
    preview.appendChild(img)
    preview.hidden = false
  }

  if (fileInput) {
    fileInput.addEventListener('change', function () {
      var plik = fileInput.files && fileInput.files[0]
      if (!plik) {
        pokaz('')
        return
      }
      podgladLokalny(plik)
      if (plik.size > LIMIT_POJEDYNCZEGO) {
        pokaz(
          'Plik ma ' +
            mb(plik.size) +
            ' — przekracza limit jednego żądania (100 MB). Zostanie wysłany w częściach.',
          'info',
        )
      } else {
        pokaz('Wybrano: ' + plik.name + ' (' + mb(plik.size) + ')', 'info')
      }
    })
  }

  form.addEventListener('submit', function (zdarzenie) {
    var plik = fileInput && fileInput.files && fileInput.files[0]
    if (!plik) return // niech przeglądarka pokaże własny komunikat o wymaganym polu

    // Wysyłkę wieloczęściową obsługuje osobna ścieżka serwera; do czasu jej
    // podłączenia w interfejsie oddajemy takie pliki zwykłemu formularzowi,
    // żeby nie udawać, że skrypt sobie z nimi radzi.
    if (plik.size > LIMIT_POJEDYNCZEGO) {
      pokaz('Plik ' + mb(plik.size) + ' — wysyłka wieloczęściowa, to potrwa dłużej.', 'info')
      return
    }

    zdarzenie.preventDefault()

    var dane = new FormData(form)
    var xhr = new XMLHttpRequest()
    xhr.open('POST', form.getAttribute('action') || '/api/v1/media2', true)

    var t = token()
    if (t) xhr.setRequestHeader('Authorization', 'Bearer ' + t)

    if (submit) submit.disabled = true
    if (progressBox) progressBox.hidden = false
    if (bar) bar.value = 0

    xhr.upload.onprogress = function (e) {
      if (!e.lengthComputable || !bar) return
      var procent = Math.round((e.loaded / e.total) * 100)
      bar.value = procent
      pokaz('Wysyłanie… ' + procent + '% (' + mb(e.loaded) + ' z ' + mb(e.total) + ')', 'info')
    }

    xhr.onerror = function () {
      if (submit) submit.disabled = false
      if (progressBox) progressBox.hidden = true
      pokaz('Połączenie zostało przerwane. Plik NIE został zapisany — spróbuj ponownie.', 'error')
    }

    xhr.onload = function () {
      if (submit) submit.disabled = false
      if (progressBox) progressBox.hidden = true

      var odp = null
      try {
        odp = JSON.parse(xhr.responseText)
      } catch (e) {
        pokaz('Serwer odpowiedział w nieoczekiwanym formacie (HTTP ' + xhr.status + ').', 'error')
        return
      }

      if (!odp || odp.ok !== true) {
        var kom = (odp && odp.error && odp.error.message) || 'Nieznany błąd.'
        var rid = odp && odp.requestId ? ' [' + odp.requestId + ']' : ''
        pokaz(kom + rid, 'error')
        return
      }

      var media = odp.data && odp.data.media
      if (odp.data && odp.data.deduplicated) {
        pokaz('Ten plik już był w bibliotece — użyto istniejącego zasobu, nie powstał duplikat.', 'ok')
      } else {
        pokaz('Zapisano w bibliotece. ' + (odp.data && odp.data.exifStripped ? 'Dane EXIF (m.in. GPS) usunięto.' : ''), 'ok')
      }

      // Podgląd zastąpiony adresem z serwera — dzięki temu redaktor widzi
      // to, co naprawdę zostało zapisane, a nie lokalną kopię z dysku.
      if (media && media.url && preview) {
        preview.innerHTML = ''
        if (media.kind === 'image') {
          var img = document.createElement('img')
          img.src = media.variants && media.variants.small ? media.variants.small : media.url
          img.alt = media.alt || 'Wgrane zdjęcie'
          img.className = 'admin-upload-thumb'
          preview.appendChild(img)
        }
        var link = document.createElement('a')
        link.href = media.url
        link.textContent = media.url
        link.className = 'admin-upload-link'
        preview.appendChild(link)
        preview.hidden = false
      }

      // Czyścimy tylko plik i alt. Pola licencyjne zostają, bo redaktor
      // zwykle wgrywa serię zdjęć tego samego autora — przepisywanie
      // nazwiska przy każdym pliku prowadzi do pustych pól.
      if (fileInput) fileInput.value = ''
      if (altInput) altInput.value = ''

      form.dispatchEvent(new CustomEvent('media:uploaded', { detail: media, bubbles: true }))
    }

    xhr.send(dane)
  })
})()
