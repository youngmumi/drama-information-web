// 전역 변수
let allDramas = [];
let swiperInstance = null;

// 디바운스 함수 (검색 성능 향상)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 로딩 상태 관리
function showLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.display = 'flex';
    loading.style.opacity = '1';
  }
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => {
      loading.style.display = 'none';
    }, 300);
  }
}


// 에러 처리를 포함한 드라마 데이터 로드
async function loadDramas() {
  try {
    console.log('드라마 데이터 로드 시작');
    showLoading();
    
    const res = await fetch('./dramas.json');
    console.log('fetch 응답:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('JSON 데이터 파싱 완료:', data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format - not an array');
    }
    
    console.log(`${data.length}개의 드라마 데이터 로드 성공`);
    return data;
    
  } catch (error) {
    console.error('드라마 데이터 로드 실패:', error);
    showErrorMessage(`드라마 정보를 불러오는데 실패했습니다: ${error.message}`);
  } finally {
    hideLoading();
  }
}

// 에러 메시지 표시
function showErrorMessage(message) {
  const container = document.getElementById('dramaList');
  if (container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #ef4444; grid-column: 1 / -1;">
        <h3>알림</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
          새로고침
        </button>
      </div>
    `;
  }
}

// 결과 카운트 업데이트
function updateResultsCount(count, isFiltered = false) {
  const resultsCount = document.getElementById('resultsCount');
  if (resultsCount) {
    if (isFiltered) {
      resultsCount.textContent = `검색 결과: ${count}개`;
    } else {
      resultsCount.textContent = `전체 드라마: ${count}개`;
    }
  }
}

// HTML 이스케이프 함수 (XSS 방지)
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 드라마 그리드 렌더링 (개선된 버전)
function renderDramas(list, isFiltered = false) {
  console.log('renderDramas 호출됨:', list.length, '개 드라마');
  
  const container = document.getElementById('dramaList');
  const noResults = document.getElementById('noResults');
  
  if (!container) {
    console.error('dramaList 컨테이너를 찾을 수 없습니다.');
    return;
  }
  
  updateResultsCount(list.length, isFiltered);
  
  if (!list.length) {
    container.style.display = 'none';
    if (noResults) noResults.style.display = 'block';
    return;
  }
  
  if (noResults) noResults.style.display = 'none';
  container.style.display = 'grid';
  
  // 이미지 로드 에러 처리를 포함한 카드 생성
  container.innerHTML = list.map(drama => {
    console.log('카드 생성 중:', drama.title);
    
    const safeTitle = escapeHtml(drama.title || '제목 없음');
    const safeDescription = escapeHtml(drama.description || '설명 없음');
    const safeYear = drama.year ? String(drama.year) : '연도 정보 없음';
    const safeGenre = escapeHtml(drama.genre || '장르 정보 없음');
    const posterUrl = drama.poster || 'https://via.placeholder.com/300x450/f0f0f0/666?text=No+Image';
    const detailUrl = `./detail.html?id=${drama.id}`;
    
    return `
      <a href="${detailUrl}" class="drama-card-link">
        <div class="drama-card">
          <div class="drama-poster" 
               style="background-image:url('${posterUrl}')">
          </div>
          <div class="drama-content">
            <h2>${safeTitle}</h2>
            <div class="drama-meta">${safeYear} · ${safeGenre}</div>
            <p class="drama-desc">${safeDescription}</p>
          </div>
        </div>
      </a>
    `;
  }).join('');
  
  console.log('카드 HTML 생성 완료');
  
  // 카드 애니메이션 효과
  setTimeout(() => animateCards(), 50);
}

// 카드 애니메이션
function animateCards() {
  const cards = document.querySelectorAll('.drama-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 50);
  });
}

// Swiper 캐러셀 초기화 (개선된 버전)
function initCarousel(list) {
  const wrapper = document.querySelector('#dramaCarousel .swiper-wrapper');
  
  if (!wrapper) {
    console.warn('Swiper wrapper를 찾을 수 없습니다.');
    return;
  }
  
  // 기존 Swiper 인스턴스 정리
  if (swiperInstance) {
    swiperInstance.destroy(true, true);
    swiperInstance = null;
  }
  
  // 슬라이드 생성 (최대 8개로 제한)
  const featuredDramas = list.slice(0, 8);
  wrapper.innerHTML = featuredDramas.map(drama => {
    const safeTitle = escapeHtml(drama.title);
    const posterUrl = drama.poster || 'https://via.placeholder.com/400x600/f0f0f0/666?text=No+Image';
    return `
      <div class="swiper-slide">
        <img src="${posterUrl}" 
             alt="${safeTitle}"
             onerror="this.src='https://via.placeholder.com/400x600/f0f0f0/666?text=No+Image'"/>
        <div class="slide-caption">
          <h3>${safeTitle}</h3>
        </div>
      </div>
    `;
  }).join('');

  // Swiper가 로드되었는지 확인
  if (typeof Swiper === 'undefined') {
    console.warn('Swiper 라이브러리가 로드되지 않았습니다.');
    return;
  }

  // Swiper 초기화
  try {
    swiperInstance = new Swiper('.swiper-container', {
      slidesPerView: 1,
      spaceBetween: 30,
      loop: featuredDramas.length > 1,
      autoplay: {
        delay: 4000,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        type: 'fraction',
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      effect: 'slide',
      speed: 600,
      grabCursor: true,
    });
    console.log('Swiper 초기화 성공');
  } catch (error) {
    console.error('Swiper 초기화 실패:', error);
  }
}

// 검색 기능 (개선된 버전)
function performSearch(keyword) {
  const kw = keyword.trim().toLowerCase();
  
  if (!kw) {
    renderDramas(allDramas, false);
    return;
  }
  
  const filtered = allDramas.filter(drama => 
    (drama.title && drama.title.toLowerCase().includes(kw)) ||
    (drama.genre && drama.genre.toLowerCase().includes(kw)) ||
    (drama.description && drama.description.toLowerCase().includes(kw))
  );
  
  renderDramas(filtered, true);
}

// 검색 입력 이벤트 핸들러 (디바운스 적용)
const debouncedSearch = debounce(performSearch, 300);

// 검색어 지우기 버튼 관리
function updateClearButton() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearch');
  
  if (searchInput && clearBtn) {
    if (searchInput.value.trim()) {
      clearBtn.classList.add('visible');
    } else {
      clearBtn.classList.remove('visible');
    }
  }
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM 로드 완료');
  console.log('현재 URL:', window.location.href);
  console.log('현재 디렉토리:', window.location.pathname);
  
  // 필수 DOM 요소들이 존재하는지 확인
  const requiredElements = ['loading', 'dramaList', 'searchInput'];
  const missingElements = requiredElements.filter(id => !document.getElementById(id));
  
  if (missingElements.length > 0) {
    console.error('필수 DOM 요소가 없습니다:', missingElements);
    hideLoading();
    return;
  }
  
  try {
    // 드라마 데이터 로드
    console.log('데이터 로드 시작...');
    allDramas = await loadDramas();
    console.log('로드된 드라마 데이터:', allDramas);
    
    if (allDramas.length === 0) {
      console.error('드라마 데이터가 없습니다.');
      showErrorMessage('드라마 데이터를 불러올 수 없습니다.');
      return;
    }
    
    // 초기 렌더링
    console.log('드라마 렌더링 시작');
    renderDramas(allDramas);
    
    // 캐러셀 초기화 (약간의 지연을 두어 DOM이 완전히 준비된 후 실행)
    setTimeout(() => {
      console.log('캐러셀 초기화 시작');
      initCarousel(allDramas);
    }, 100);
    
    // 검색 이벤트 리스너
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
        updateClearButton();
      });
      
      // 엔터 키 검색
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          performSearch(searchInput.value);
        }
      });
      
      // 초기 포커스
      searchInput.focus();
    }
    
    // 검색어 지우기 버튼
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
          updateClearButton();
          renderDramas(allDramas, false);
        }
      });
    }
    
    console.log('초기화 완료');
    
  } catch (error) {
    console.error('초기화 중 오류 발생:', error);
    hideLoading();
    showErrorMessage('페이지 초기화 중 오류가 발생했습니다.');
  }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  if (swiperInstance) {
    swiperInstance.destroy(true, true);
  }
});