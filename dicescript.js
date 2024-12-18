// dicescript.js

document.addEventListener('DOMContentLoaded', () => {
    const rollButton = document.getElementById('rollButton');
    const numDiceInput = document.getElementById('numDice');
    const diceContainer = document.getElementById('diceContainer');
    const totalDisplay = document.getElementById('total');

    // Array of dice face images URLs (replace with your own if needed)
    const diceFaces = [
        'https://i.imgur.com/OdL0XPt.png', // 1
        'https://i.imgur.com/3aVQn6Z.png', // 2
        'https://i.imgur.com/Lh1Q0LW.png', // 3
        'https://i.imgur.com/Q3S2W7D.png', // 4
        'https://i.imgur.com/7C5Q6KV.png', // 5
        'https://i.imgur.com/Qb6t7Eo.png'  // 6
    ];

    rollButton.addEventListener('click', () => {
        let numDice = parseInt(numDiceInput.value);
        if (isNaN(numDice) || numDice < 1) {
            numDice = 1;
            numDiceInput.value = 1;
        } else if (numDice > 10) {
            numDice = 10;
            numDiceInput.value = 10;
        }

        // Clear previous dice
        diceContainer.innerHTML = '';
        let total = 0;

        for (let i = 0; i < numDice; i++) {
            const die = document.createElement('div');
            die.classList.add('die');

            // Generate random number between 1 and 6
            const roll = Math.floor(Math.random() * 6) + 1;
            total += roll;

            // Set the background image based on the roll
            die.style.backgroundImage = `url('${diceFaces[roll - 1]}')`;

            // Append the die to the container
            diceContainer.appendChild(die);
        }

        // Update the total
        totalDisplay.textContent = total;
    });

    // Optional: Trigger roll on Enter key
    numDiceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            rollButton.click();
        }
    });

    // Initial roll on page load
    rollButton.click();
});
