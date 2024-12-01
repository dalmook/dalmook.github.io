// treescript.js

const treeImage = document.getElementById('tree-image');
const contributorsList = document.getElementById('contributors-list');
const totalTouchesElement = document.getElementById('total-touches');
const saveButton = document.getElementById('save-button');

const TREE_STAGES = [
  { max: 10, src: 'images/sapling.png' },
  { max: 50, src: 'images/small_tree.png' },
  { max: 100, src: 'images/medium_tree.png' },
  { max: 200, src: 'images/large_tree.png' },
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

// 나무 이미지 업데이트 함수
function updateTreeImage(total) {
  for (let stage of TREE_STAGES) {
    if (total < stage.max) {
      if (!treeImage.src.includes(stage.src)) {
        // 부드러운 전환을 위해 클래스 추가
        treeImage.classList.add('growing');
        setTimeout(() => {
          treeImage.src = stage.src;
          treeImage.classList.remove('growing');
        }, 250); // 전환 중간에 이미지 변경
      }
      break;
    }
  }
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
      const total = doc.data().count;
      totalTouchesElement.textContent = `총 터치 횟수: ${total}`;
      updateTreeImage(total);
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

// 나무 이미지 클릭(터치) 이벤트 핸들러
treeImage.addEventListener('click', (event) => {
  // 터치 위치 계산
  const rect = treeImage.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 플로팅 숫자 생성
  createFloatingNumber(x, y, 1);

  // 로컬 터치 카운트 증가
  localTouchCount += 1;

  // 애니메이션 적용
  animateTree();

  // 총 터치 횟수 업데이트
  totalTouchesRef.get().then((doc) => {
    if (doc.exists) {
      const total = doc.data().count + localTouchCount;
      // 터치 횟수 제한을 없앴으므로, 더 이상 100회 도달 시 자동 저장을 유도하지 않습니다.
      // 따라서 아래 조건문을 제거하거나 주석 처리합니다.
      /*
      if (total >= 100) {
        alert('터치 횟수가 100회에 도달했습니다. 기록을 저장해주세요.');
        saveTouches();
      }
      */
    }
  });
});

// "기록 저장" 버튼 클릭 이벤트 핸들러
saveButton.addEventListener('click', () => {
  saveTouches();
});

// 초기화 함수
function init() {
  getTotalTouches();
  updateContributors();
}

// 페이지 로드 시 초기화
window.onload = init;
