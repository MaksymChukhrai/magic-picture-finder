import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.getElementById('search-form');
const gallery = document.querySelector('.gallery');
const loadMoreBtn = document.querySelector('.load-more');
// const messageContainer = document.querySelector('.message');

let currentPage = 1;
const perPage = 40;

// Инициализируем переменную для хранения экземпляра лайтбокса
window.galleryLightbox = null;

// Оптимизированное создание lightbox с правильными настройками
function initLightbox() {
  return new SimpleLightbox('.photo-link', {
    sourceAttr: 'href',
    overlay: true,
    overlayOpacity: 0.7,
    closeOnClick: true, // Убедимся, что клик на оверлее закрывает лайтбокс
    animationSpeed: 250,
    alertError: false, // Отключаем встроенные сообщения об ошибках
    captionPosition: 'bottom',
    enableKeyboard: true, // Позволяет закрывать с помощью ESC
    navText: ['‹', '›'], // Текст для навигационных кнопок
    closeText: '×', // Текст для кнопки закрытия
    showCounter: true,
    disableScroll: false // Не отключаем прокрутку, чтобы избежать проблем с размерами
  });
}

async function fetchImages(query, page = 1) {
  const apiKey = '36686199-3af1daf12518f9079ef45ad7e';
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${query}&image_type=photo&orientation=horizontal&safesearch=true&page=${page}&per_page=${perPage}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching images:', error);
    Notiflix.Notify.failure('An error occurred when loading images.');
    return null;
  }
}

function createCardHTML(image) {
  return `
    <div class="photo-card">
      <a href="${image.largeImageURL}" class="photo-link" data-lightbox="gallery">
        <img src="${image.webformatURL}" alt="${image.tags}" loading="lazy" />
      </a>
      <div class="info">
        <div class="info-item">
          <b>Likes:</b> <span>${image.likes}</span>
        </div>
        <div class="info-item">
          <b>Views:</b> <span>${image.views}</span>
        </div>
        <div class="info-item">
          <b>Comments:</b> <span>${image.comments}</span>
        </div>
        <div class="info-item">
          <b>Downloads:</b> <span>${image.downloads}</span>
        </div>
      </div>
    </div>
  `;
}

function displayImages(images) {
  const cardsHTML = images.hits.map((image) => createCardHTML(image)).join('');
  gallery.insertAdjacentHTML('beforeend', cardsHTML);

  // Используем requestAnimationFrame для уверенности, что DOM полностью обновился
  requestAnimationFrame(() => {
    // Инициализируем или обновляем лайтбокс
    if (window.galleryLightbox) {
      window.galleryLightbox.refresh();
    } else {
      window.galleryLightbox = initLightbox();
    }
    
    // Плавная прокрутка к последнему добавленному элементу
    setTimeout(() => {
      const lastCard = gallery.lastElementChild;
      if (lastCard) {
        lastCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 500);
  });
}

function clearGallery() {
  gallery.innerHTML = '';
}

async function handleSearchFormSubmit(event) {
  event.preventDefault();

  const searchQuery = event.target.elements.searchQuery.value.trim();

  if (searchQuery === '') {
    Notiflix.Notify.warning('Please enter your search query');
    return;
  }

  clearGallery();
  currentPage = 1;

  // Закрываем лайтбокс, если он открыт
  if (window.galleryLightbox) {
    window.galleryLightbox.close();
  }

  const data = await fetchImages(searchQuery);
  if (data && data.hits.length > 0) {
    displayImages(data);
    if (data.hits.length === perPage) {
      loadMoreBtn.classList.remove('is-hidden');
    } else {
      loadMoreBtn.classList.add('is-hidden');
      if (data.hits.length > 0) {
        Notiflix.Notify.warning("You have reached the end of the search results.");
      }
    }

    showMessage(data.totalHits);
  } else {
    Notiflix.Notify.failure('Sorry, nothing found for your query.');
    loadMoreBtn.classList.add('is-hidden');
  }
}

// При выполнении запроса и получении новых изображений
// Удаляем класс is-hidden у кнопки, чтобы она стала видимой
const loadMoreButton = document.querySelector('.load-more');
loadMoreButton.classList.add('is-hidden');

function showMessage(totalHits) {
  if (totalHits > 0) {
    Notiflix.Notify.success(`Yay! We found ${totalHits} images.`);
  }
}

async function loadMoreImages() {
  currentPage += 1;

  const searchQuery = searchForm.elements.searchQuery.value.trim();
  const data = await fetchImages(searchQuery, currentPage);

  if (data && data.hits.length > 0) {
    displayImages(data);
    if (data.hits.length < perPage) {
      loadMoreBtn.classList.add('is-hidden');
      Notiflix.Notify.warning("You have reached the end of the search results.");
    }
  } else {
    loadMoreBtn.classList.add('is-hidden');
    Notiflix.Notify.warning("You have reached the end of the search results.");
  }
}

// Добавляем слушатель события для закрытия лайтбокса при нажатии Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && window.galleryLightbox) {
    window.galleryLightbox.close();
  }
});

searchForm.addEventListener('submit', handleSearchFormSubmit);
loadMoreBtn.addEventListener('click', loadMoreImages);