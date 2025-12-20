let currentDeck = null;

async function login() {
    let name = document.getElementById('nameInput').value.trim().toLowerCase();
    const commander = document.getElementById('commanderInput').value.trim().toLowerCase();
    const errorMsg = document.getElementById('errorMessage');

    errorMsg.textContent = '';

    if (!name || !commander) {
        errorMsg.textContent = 'Please enter both your name and commander!';
        return;
    }

    try {
        if (name == "matthew" && commander == "secret") {
            console.log("Secret deck activated!");
            name = "matthew-partners";
        }
        const response = await fetch(`decks/${name}.json`);
        console.log("found the deck!")
        if (!response.ok) throw new Error('Deck not found');

        const deck = await response.json();

        if (deck.commander.name.toLowerCase() !== commander) {
            errorMsg.textContent = 'Commander name doesn\'t match! Try again.';
            return;
        }

        currentDeck = deck;
        loadDeck(deck);
    } catch (error) {
        errorMsg.textContent = 'Couldn\'t find your deck. Check your spelling!';
    }
}

function loadDeck(deck) {
    document.getElementById('loginScreen').style.display = 'none';
    //document.getElementById('giftDepartment').style.display = 'none';
    document.getElementById('deckScreen').style.display = 'block';

    // Apply custom colors if provided
    if (deck.customColors) {
        const header = document.getElementById('deckHeader');
        header.style.background = `linear-gradient(135deg, ${deck.customColors.primary} 0%, ${deck.customColors.secondary} 100%)`;
    }

    // Load basic info    
    document.getElementById('playerName').textContent = `${deck.playerName}'s Commander Deck`;
    document.getElementById('commanderName').textContent = deck.commander.name;
    document.getElementById('commanderType').textContent = deck.commander.type;
    document.getElementById('commanderImage').src = `img/commanders/${deck.commander.image}`;
    document.getElementById('deckTitle').textContent = deck.deckTitle;

    const commanderInfo = document.getElementById('commanderInfo');
    commanderInfo.innerHTML = '';

    if (deck.commanders) {
        // Partner commanders
        deck.commanders.forEach(cmd => {
            commanderInfo.innerHTML += `
                <img class="commander-image" src="img/commanders/${cmd.image}" alt="${cmd.name}">
                <div class="commander-details">
                    <h2>${cmd.name}</h2>
                    <p>${cmd.type}</p>
                </div>
            `;
        });
    } else {
        // Single commander
        commanderInfo.innerHTML = `
            <img class="commander-image" src="img/commanders/${deck.commander.image}" alt="${deck.commander.name}">
            <div class="commander-details">
                <h2>${deck.commander.name}</h2>
                <p>${deck.commander.type}</p>
            </div>
        `;
    }

    // Load stats
    document.getElementById('creatureCount').textContent = deck.stats.creatures;
    document.getElementById('spellCount').textContent = deck.stats.spells;
    document.getElementById('enchantmentCount').textContent = deck.stats.enchantmentsArtifacts;
    document.getElementById('landCount').textContent = deck.stats.lands;

    // Load strategy
    document.getElementById('strategyText').textContent = deck.strategy;

    // Load notable cards
    const notableContainer = document.getElementById('notableCards');
    notableContainer.innerHTML = '';
    deck.notableCards.forEach(card => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card-item';
        cardDiv.innerHTML = `
            <img src="img/notable/${card.image}" alt="${card.name}">
            <p><b>${card.name}</b></p>
            <p>${card.description}</p>
        `;
        notableContainer.appendChild(cardDiv);
    });

    // Load turn by turn guide
    if (deck.turnByTurnGuide) {
        const guideContainer = document.getElementById('turnGuide');
        guideContainer.innerHTML = '';
        
        deck.turnByTurnGuide.forEach((phase, index) => {
            const phaseDiv = document.createElement('div');
            phaseDiv.className = 'turn-phase';
            phaseDiv.innerHTML = `
                <div class="turn-number">${phase.turn}</div>
                <div class="turn-content">
                    <h4 class="turn-goal">${phase.goal}</h4>
                    <p class="turn-actions">${phase.actions}</p>
                </div>
            `;
            guideContainer.appendChild(phaseDiv);
        });
    }

    // Load card categories (lazy loading)
    loadCardCategories(deck.cardsByCategory);
    
    // Load FAQ
    loadFAQ();
}

function loadCardCategories(categories) {
    const container = document.getElementById('cardCategories');
    container.innerHTML = '';

    Object.entries(categories).forEach(([category, cards]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerHTML = `
            <h4>${category}</h4>
            <span class="category-count">${cards.length} cards</span>
        `;
        
        const content = document.createElement('div');
        content.className = 'category-content';
        
        header.onclick = () => {
            const isActive = content.classList.contains('active');
            content.classList.toggle('active');
            
            // Lazy load cards when first opened
            if (!isActive && content.children.length === 0) {
                const cardList = document.createElement('div');
                cardList.className = 'card-list';
                
                cards.forEach(card => {
                    const cardItem = document.createElement('div');
                    cardItem.className = 'card-list-item';
                    cardItem.innerHTML = `
                        <img src="${card.imageUrl || `https://gatherer.wizards.com/Handlers/Image.ashx?name=${encodeURIComponent(card.name)}&type=card`}" 
                             alt="${card.name}"
                             loading="lazy">
                        <div class="card-name">${card.name}</div>
                    `;
                    cardList.appendChild(cardItem);
                });
                
                content.appendChild(cardList);
            }
        };
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(content);
        container.appendChild(categoryDiv);
    });
}

// Allow Enter key to login
document.getElementById('commanderInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
});

async function loadFAQ() {
    try {
        const response = await fetch('decks/faq.json');
        const faq = await response.json();
        
        const container = document.getElementById('faqContent');
        
        // Playing Field
        const playingFieldHTML = createFAQItem(
            "🎲 The Playing Field",
            Object.entries(faq.playingField).map(([zone, desc]) => 
                `<div class="faq-subsection"><strong>${capitalize(zone)}:</strong> ${desc}</div>`
            ).join('')
        );
        
        // Card Types
        const cardTypesHTML = createFAQItem(
            "🃏 Card Types",
            `<p>${faq.cardTypes}</p>`
        );

        // Mulligans
        const mulliganHTML = createFAQItem(
            "🎰 The Mulligan",
            `<p>${faq.mulligan}</p>`
        );
        
        // Taking a Turn
        const turnHTML = createFAQItem(
            "⏰ Taking a Turn",
            `<ul>${faq.takingATurn.map(step => `<li>${step}</li>`).join('')}</ul>`
        );
        
        // Reading a Card
        const readingCardHTML = createFAQItem(
            "📖 Reading a Card",
            `<p>${faq.readingACard}</p>`
        );
        
        // Combat
        const combatHTML = createFAQItem(
            "⚔️ Combat",
            `<p>${faq.combat}</p>`
        );
        
        // Tips and Tricks (if provided)
        let tipsHTML = '';
        if (faq.tipsAndTricks) {
            tipsHTML = createFAQItem(
                "💡 Tips & Tricks",
                `<ul>${faq.tipsAndTricks.map(tip => `<li>${tip}</li>`).join('')}</ul>`
            );
        }
        
        container.innerHTML = playingFieldHTML + cardTypesHTML + mulliganHTML + turnHTML + readingCardHTML + combatHTML + tipsHTML;
        
        // Add click handlers
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', function() {
                this.classList.toggle('active');
                const answer = this.nextElementSibling;
                answer.classList.toggle('active');
            });
        });
        
    } catch (error) {
        console.log('FAQ not found or error loading:', error);
    }
}

function createFAQItem(question, answer) {
    return `
        <div class="faq-item">
            <div class="faq-question">
                <span>${question}</span>
                <span class="faq-toggle">▼</span>
            </div>
            <div class="faq-answer">
                ${answer}
            </div>
        </div>
    `;
}

function capitalize(str) {
    return str.replace(/([A-Z])/g, ' $1').trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}