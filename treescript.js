// treescript.js

const treeImage = document.getElementById('tree-image');
const contributorsList = document.getElementById('contributors-list');
const totalTouchesElement = document.getElementById('total-touches');

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

// Handle tree image click
treeImage.addEventListener('click', () => {
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
          transaction.set(userRef, { name: userName, count: 1 });
        } else {
          transaction.update(userRef, { count: firebase.firestore.FieldValue.increment(1) });
        }

        // Increment total touches
        transaction.update(totalTouchesRef, { count: firebase.firestore.FieldValue.increment(1) });
      });
    }).then(() => {
      console.log('터치 기록이 성공적으로 업데이트되었습니다.');
    }).catch((error) => {
      console.error('터치 기록 업데이트 중 오류 발생: ', error);
    });
  }
});

// 초기화 함수
function init() {
  getTotalTouches();
  updateContributors();
}

// 페이지 로드 시 초기화
window.onload = init;
