// detail.js

// URL에서 id 파싱
function getId() {
  const params = new URLSearchParams(location.search);
  const raw = params.get('id');
  return raw ? Number(raw) : null;
}

// 에러 시 화면 교체
function showError(msg) {
  document.body.innerHTML = `
    <main style="padding:2rem; text-align:center; color:#c00;">
      <h2>오류</h2>
      <p>${msg}</p>
      <p><a href="index.html">← 목록으로 돌아가기</a></p>
    </main>`;
}

async function loadDetail() {
  try {
    const id = getId();
    if (!id) throw new Error('유효한 드라마 ID가 없습니다.');

    const res = await fetch('./dramas.json');
    if (!res.ok) throw new Error(`데이터를 불러올 수 없습니다 (status ${res.status})`);

    const list = await res.json();
    const drama = list.find(d => d.id === id);
    if (!drama) throw new Error('해당하는 드라마 정보를 찾을 수 없습니다.');

    // 데이터가 준비되었으니 “Loading…” 을 지우고 렌더링
    document.getElementById('detailTitle').textContent = drama.title;
    document.getElementById('detailPoster').style.backgroundImage = `url('${drama.poster}')`;
    document.getElementById('detailMeta').textContent = `${drama.year} · ${drama.genre}`;
    document.getElementById('detailDesc').textContent = drama.description;

  } catch (e) {
    console.error(e);
    showError(e.message);
  }
}

// DOM이 완전히 로드된 뒤 실행
window.addEventListener('DOMContentLoaded', loadDetail);

