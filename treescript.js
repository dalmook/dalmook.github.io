// treescript.js

const treeImage = document.getElementById('tree-image');
const contributorsList = document.getElementById('contributors-list');
const totalTouchesElement = document.getElementById('total-touches');
const saveButton = document.getElementById('save-button');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');

const TREE_STAGES = [
  { max: 1000, src: 'images/sapling.png' },
  { max: 5000, src: 'images/small_tree.png' },
  { max: 10000, src: 'images/medium_tree.png' },
  { max: 15000, src: 'images/large_tree.png' },
  { max: Infinity, src: 'images/mature_tree.png' }
];

// Firestore 컬렉션 참조
const touchCountsRef = db.collection('touchCounts');
const totalTouchesRef = db.collection('gameData').doc('totalTouches');

// 총 터치 횟수가 존재하지 않으면 초기화
totalTouchesRef.get().then((doc) => {
  if (!doc.exists) {
    totalTouchesRef.set({ count: 0 });
  }
});

// 로컬 터치 카운트 (저장 전)
let localTouchCount = 0;

// 현재 표시되고 있는 나무 단계 인덱스
let currentStageIndex = 0;

// 터치 횟수 전체 카운트
let totalTouches = 0;

// 스로틀링 함수
function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function(...args) {
    const context = this;
    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  }
}

// 다음 목표를 현재 단계의 max 값으로 설정하는 함수
function getNextGoal() {
  if (currentStageIndex < TREE_STAGES.length - 1) {
    return TREE_STAGES[currentStageIndex].max;
  } else {
    return 'N/A'; // 마지막 단계인 경우 다음 목표가 없음을 표시
  }
}

// 나무 이미지 업데이트 함수
function updateTreeImage() {
  treeImage.classList.add('growing');
  setTimeout(() => {
    treeImage.src = TREE_STAGES[currentStageIndex].src;
    treeImage.classList.remove('growing');
  }, 250); // 전환 중간에 이미지 변경
  updateNavigationButtons();
}

// 기여자 목록 업데이트 함수
function updateContributors() {
  touchCountsRef.orderBy('count', 'desc').onSnapshot((snapshot) => {
    contributorsList.innerHTML = '';
    snapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.name}: ${data.count}회`;
      contributorsList.appendChild(li);
    });
  });
}

// 총 터치 횟수 가져오기 및 나무 이미지 업데이트
function getTotalTouches() {
  totalTouchesRef.onSnapshot((doc) => {
    if (doc.exists) {
      totalTouches = doc.data().count;
      const nextGoal = getNextGoal();
      totalTouchesElement.textContent = `총 터치 횟수: ${totalTouches}/${nextGoal}`;
      
      // totalTouches에 기반하여 currentStageIndex 설정
      let newStageIndex = 0;
      for (let i = 0; i < TREE_STAGES.length; i++) {
        if (totalTouches < TREE_STAGES[i].max) {
          newStageIndex = i;
          break;
        }
      }

      if (currentStageIndex !== newStageIndex) {
        currentStageIndex = newStageIndex;
        updateTreeImage();
      } else {
        // currentStageIndex가 이미 올바른 경우 버튼 상태만 업데이트
        updateNavigationButtons();
      }
    }
  });
}

// 나무 이미지 애니메이션 함수 (떨림 효과)
function animateTree() {
  treeImage.classList.add('shake');
  setTimeout(() => {
    treeImage.classList.remove('shake');
  }, 500); // 애니메이션 지속 시간과 일치
}

// 플로팅 숫자 생성 함수
function createFloatingNumber(x, y, value) {
  const floatingNumber = document.createElement('div');
  floatingNumber.classList.add('floating-number');
  floatingNumber.textContent = `+${value}`;
  floatingNumber.style.left = `${x}px`;
  floatingNumber.style.top = `${y}px`;
  document.getElementById('tree-container').appendChild(floatingNumber);

  // 애니메이션이 끝난 후 요소 제거
  floatingNumber.addEventListener('animationend', () => {
    floatingNumber.remove();
  });
}

// 터치 기록 저장 함수
function saveTouches() {
  if (localTouchCount === 0) {
    alert('터치한 횟수가 없습니다.');
    return;
  }

  let userName = prompt('이름을 입력하세요:');
  if (userName) {
    userName = userName.trim();
    if (userName === '') {
      alert('유효한 이름을 입력해주세요.');
      return;
    }

    // 사용자의 터치 카운트 문서 참조
    const userRef = touchCountsRef.doc(userName);

    db.runTransaction((transaction) => {
      return transaction.get(userRef).then((doc) => {
        if (!doc.exists) {
          transaction.set(userRef, { name: userName, count: localTouchCount });
        } else {
          transaction.update(userRef, { count: firebase.firestore.FieldValue.increment(localTouchCount) });
        }

        // 총 터치 횟수 증가
        transaction.update(totalTouchesRef, { count: firebase.firestore.FieldValue.increment(localTouchCount) });

        // 로컬 터치 카운트 초기화
        localTouchCount = 0;

        // 로컬 스토리지 초기화 (선택 사항)
        localStorage.removeItem('localTouchCount');
      });
    }).then(() => {
      console.log('터치 기록이 성공적으로 업데이트되었습니다.');
      alert('기록이 저장되었습니다!');
    }).catch((error) => {
      console.error('터치 기록 업데이트 중 오류 발생: ', error);
      alert('기록 저장 중 오류가 발생했습니다.');
    });
  }
}

// 이전 및 다음 버튼 업데이트 함수
function updateNavigationButtons() {
  // 이전 버튼 상태
  if (currentStageIndex <= 0) {
    prevButton.disabled = true;
  } else {
    prevButton.disabled = false;
  }

  // 다음 버튼 상태
  if (currentStageIndex < TREE_STAGES.length - 1) {
    const requiredTouches = TREE_STAGES[currentStageIndex].max; // 현재 단계의 max 값 사용
    if (totalTouches >= requiredTouches) {
      nextButton.disabled = false;
    } else {
      nextButton.disabled = true;
    }
  } else {
    nextButton.disabled = true; // 마지막 단계에서는 다음 버튼 비활성화
  }
}

// 이전 버튼 클릭 이벤트 핸들러
function showPreviousStage() {
  if (currentStageIndex > 0) {
    currentStageIndex -= 1;
    updateTreeImage();
  }
}

// 다음 버튼 클릭 이벤트 핸들러
function showNextStage() {
  if (currentStageIndex < TREE_STAGES.length - 1) {
    const requiredTouches = TREE_STAGES[currentStageIndex].max; // 현재 단계의 max 값 사용
    if (totalTouches >= requiredTouches) {
      currentStageIndex += 1;
      updateTreeImage();
    } else {
      alert(`다음 단계에 도달하려면 총 터치 횟수가 ${requiredTouches} 이상이어야 합니다.`);
    }
  }
}

// 터치 이벤트 핸들러 함수
function handleTouch(event) {
  // 터치 위치 계산
  const rect = treeImage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 로컬 터치 카운트 증가
  localTouchCount += 1;

  // 플로팅 숫자 생성 (누적된 터치 카운트)
  createFloatingNumber(x, y, localTouchCount);

  // 애니메이션 적용
  animateTree();

  // 스로틀링 피드백 적용
  treeImage.classList.add('throttled');
  setTimeout(() => {
    treeImage.classList.remove('throttled');
  }, 200);

  // 로컬 스토리지에 터치 카운트 저장 (선택 사항)
  localStorage.setItem('localTouchCount', localTouchCount);
}

// 스로틀링된 터치 이벤트 핸들러 생성 (500ms 간격)
const throttledHandleTouch = throttle(handleTouch, 500);

// 터치 이벤트 리스너 추가
treeImage.addEventListener('click', throttledHandleTouch);

// 키보드 이벤트 핸들러 추가
treeImage.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    throttledHandleTouch(event);
  }
});

// 이전 및 다음 버튼 이벤트 리스너 추가
prevButton.addEventListener('click', showPreviousStage);
nextButton.addEventListener('click', showNextStage);

// "기록 저장" 버튼 클릭 이벤트 핸들러
saveButton.addEventListener('click', () => {
  saveTouches();
});

// 초기화 함수
function init() {
  // 로컬 스토리지에서 터치 카운트 복구 (선택 사항)
  const storedCount = localStorage.getItem('localTouchCount');
  if (storedCount) {
    localTouchCount = parseInt(storedCount, 10);
  }

  getTotalTouches();
  updateContributors();
  updateNavigationButtons(); // 초기 버튼 상태 설정
}

// 페이지 로드 시 초기화
window.onload = init;
