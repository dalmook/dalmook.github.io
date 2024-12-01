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

// References to Firestore collections
const touchCountsRef = db.collection('touchCounts');
const totalTouchesRef = db.collection('gameData').doc('totalTouches');

// Initialize total touches if not exists
totalTouchesRef.get().then((doc) => {
  if (!doc.exists) {
    totalTouchesRef.set({ count: 0 });
  }
});

// Local touch count before saving
let localTouchCount = 0;

// Function to update tree image based on total touches
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

// Function to update contributors list
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

// Function to get total touches and update tree
function getTotalTouches() {
  totalTouchesRef.onSnapshot((doc) => {
    if (doc.exists) {
      const total = doc.data().count;
      totalTouchesElement.textContent = `총 터치 횟수: ${total}`;
      updateTreeImage(total);
    }
  });
}

// Function to animate tree image
function animateTree() {
  treeImage.classList.add('shake');
  setTimeout(() => {
    treeImage.classList.remove('shake');
  }, 500); // 애니메이션 지속 시간과 일치
}

// Function to handle saving touches
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

    // Reference to the user's touch count
    const userRef = touchCountsRef.doc(userName);

    db.runTransaction((transaction) => {
      return transaction.get(userRef).then((doc) => {
        if (!doc.exists) {
          transaction.set(userRef, { name: userName, count: localTouchCount });
        } else {
          transaction.update(userRef, { count: firebase.firestore.FieldValue.increment(localTouchCount) });
        }

        // Increment total touches
        transaction.update(totalTouchesRef, { count: firebase.firestore.FieldValue.increment(localTouchCount) });

        // Reset local touch count
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

// Handle tree image click
treeImage.addEventListener('click', () => {
  localTouchCount += 1;
  animateTree();

  if (localTouchCount >= 100) {
    alert('터치 횟수가 100회에 도달했습니다. 기록을 저장해주세요.');
    saveTouches();
  }
});

// Handle save button click
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
