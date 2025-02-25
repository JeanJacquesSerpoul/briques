// Configuration du jeu
const config = {
    ballRadius: 10,
    paddleHeight: 15,
    paddleWidth: 80,
    brickRowCount: 5,
    brickColumnCount: 8,
    brickWidth: 75,
    brickHeight: 20,
    brickPadding: 10,
    brickOffsetTop: 30,
    brickOffsetLeft: 30,
    ballSpeed: 4,
    paddleSpeed: 7
};

// Variables du jeu
let canvas, ctx;
let ballX, ballY, ballDX, ballDY;
let paddleX;
let bricks = [];
let score = 0;
let lives = 3;
let gameStarted = false;
let gameOver = false;
let canvasWidth, canvasHeight;

// Variables du jeu (ajouter au début du script)
let paddleWidthModified = config.paddleWidth; // Largeur actuelle de la raquette
let ballSpeedModified = config.ballSpeed;     // Vitesse actuelle de la balle
let effectTimer = null;                       // Minuterie pour les effets temporaires

// Initialisation du jeu
function initGame() {
    // Configurer le canvas
    canvas = document.getElementById("gameCanvas");
    ctx = canvas.getContext("2d");

    // Ajuster la taille du canvas en fonction de la fenêtre
    resizeCanvas();

    // Initialiser la position de la balle et de la raquette
    ballX = canvasWidth / 2;
    ballY = canvasHeight - 30;
    ballDX = config.ballSpeed;
    ballDY = -config.ballSpeed;
    paddleX = (canvasWidth - config.paddleWidth) / 2;

    // Créer les briques
    createBricks();

    // Redessiner tout
    draw();

    // Ajouter les événements pour déplacer la raquette
    addEventListeners();

    // Réinitialiser le score et les vies
    score = 0;
    lives = 3;
    updateScoreDisplay();

    // Cacher le message de fin de jeu
    document.getElementById("gameOver").style.display = "none";

    // Indiquer que le jeu est prêt mais pas encore démarré
    gameStarted = false;
    gameOver = false;
}

// Ajuster la taille du canvas
function resizeCanvas() {
    // Limiter la largeur à 90% de la fenêtre ou 800px maximum
    canvasWidth = Math.min(window.innerWidth * 0.9, 800);

    // Hauteur proportionnelle à la largeur (aspect ratio 4:3)
    canvasHeight = canvasWidth * 0.75;

    // Mettre à jour les dimensions du canvas
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Mettre à jour la largeur des briques en fonction de la taille du canvas
    config.brickWidth = (canvasWidth - 2 * config.brickOffsetLeft - (config.brickColumnCount - 1) * config.brickPadding) / config.brickColumnCount;
}

// Créer les briques
function createBricks() {
    bricks = [];
    for (let c = 0; c < config.brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < config.brickRowCount; r++) {
            // Probabilité de 10% pour une brique spéciale
            const isSpecial = Math.random() < 0.1;
            let brickType = 0; // Par défaut : brique normale
            if (isSpecial) {
                // Choisir un type aléatoire entre 1 et 6
                brickType = Math.floor(Math.random() * 6) + 1;
            }
            bricks[c][r] = { x: 0, y: 0, status: 1, type: brickType };
        }
    }
}

// Dessiner une brique
function drawBricks() {
    const colors = ["#FF4136", "#FF851B", "#FFDC00", "#2ECC40", "#0074D9"];
    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = c * (config.brickWidth + config.brickPadding) + config.brickOffsetLeft;
                const brickY = r * (config.brickHeight + config.brickPadding) + config.brickOffsetTop;

                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, config.brickWidth, config.brickHeight);

                // Couleurs selon le type
                const typeColors = [
                    colors[r],       // 0: normale (couleur par rangée)
                    "#FFD700",       // 1: bonus - agrandir raquette (doré)
                    "#00CED1",       // 2: bonus - ralentir balle (turquoise)
                    "#ADFF2F",       // 3: bonus - ajouter vie (vert clair)
                    "#FF69B4",       // 4: malus - rétrécir raquette (rose)
                    "#FF4500",       // 5: malus - accélérer balle (orange vif)
                    "#8B0000"        // 6: malus - perdre vie (rouge foncé)
                ];
                ctx.fillStyle = typeColors[bricks[c][r].type];

                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

// Dessiner la balle
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, config.ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.closePath();
}

// Dessiner la raquette
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvasHeight - config.paddleHeight, paddleWidthModified, config.paddleHeight);
    ctx.fillStyle = "#4CAF50";
    ctx.fill();
    ctx.closePath();
}

// Dessiner le jeu
function draw() {
    // Effacer le canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Dessiner les éléments
    drawBricks();
    drawBall();
    drawPaddle();

    // Vérifier les collisions avec les briques
    collisionDetection();

    // Mettre à jour la position de la balle si le jeu est en cours
    if (gameStarted && !gameOver) {
        // Collision avec les bords latéraux
        if (ballX + ballDX > canvasWidth - config.ballRadius || ballX + ballDX < config.ballRadius) {
            ballDX = -ballDX;
        }

        // Collision avec le bord supérieur
        if (ballY + ballDY < config.ballRadius) {
            ballDY = -ballDY;
        } else if (ballY + ballDY > canvasHeight - config.ballRadius) {
            // Collision avec la raquette
            if (ballX > paddleX && ballX < paddleX + config.paddleWidth) {
                // Modifier la direction en fonction de l'endroit où la balle a touché la raquette
                const hitPosition = (ballX - paddleX) / config.paddleWidth;
                const angle = (hitPosition - 0.5) * Math.PI / 2; // Entre -PI/4 et PI/4
                const speed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);

                ballDX = speed * Math.sin(angle);
                ballDY = -speed * Math.cos(angle);
            } else {
                // Balle perdue
                lives--;
                updateScoreDisplay();

                if (lives === 0) {
                    // Fin de la partie
                    endGame();
                } else {
                    // Réinitialiser la position de la balle
                    ballX = canvasWidth / 2;
                    ballY = canvasHeight - 30;
                    ballDX = config.ballSpeed;
                    ballDY = -config.ballSpeed;
                    paddleX = (canvasWidth - config.paddleWidth) / 2;
                }
            }
        }

        // Mettre à jour la position de la balle
        ballX += ballDX;
        ballY += ballDY;
    }

    // Continuer l'animation
    if (!gameOver) {
        requestAnimationFrame(draw);
    }
}

// Détecter les collisions avec les briques
function collisionDetection() {
    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            const brick = bricks[c][r];

            if (brick.status === 1) {
                if (ballX > brick.x && ballX < brick.x + config.brickWidth &&
                    ballY > brick.y && ballY < brick.y + config.brickHeight) {
                    ballDY = -ballDY;
                    brick.status = 0;
                    score += 10;
                    updateScoreDisplay();

                    // Appliquer l'effet selon le type de brique
                    applyBrickEffect(brick.type);

                    checkWin();
                }
            }
        }
    }
}

function applyBrickEffect(type) {
    switch (type) {
        case 1: // Bonus - Agrandir la raquette
            paddleWidthModified = config.paddleWidth * 1.5;
            resetEffectAfterDelay(() => paddleWidthModified = config.paddleWidth);
            break;
        case 2: // Bonus - Ralentir la balle
            ballSpeedModified = config.ballSpeed * 0.8;
            updateBallSpeed();
            resetEffectAfterDelay(() => {
                ballSpeedModified = config.ballSpeed;
                updateBallSpeed();
            });
            break;
        case 3: // Bonus - Ajouter une vie
            lives++;
            updateScoreDisplay();
            break;
        case 4: // Malus - Rétrécir la raquette
            paddleWidthModified = config.paddleWidth * 0.5;
            resetEffectAfterDelay(() => paddleWidthModified = config.paddleWidth);
            break;
        case 5: // Malus - Accélérer la balle
            ballSpeedModified = config.ballSpeed * 1.2;
            updateBallSpeed();
            resetEffectAfterDelay(() => {
                ballSpeedModified = config.ballSpeed;
                updateBallSpeed();
            });
            break;
        case 6: // Malus - Perdre une vie
            lives--;
            updateScoreDisplay();
            if (lives === 0) endGame();
            break;
        default:
            break; // Brique normale (type 0), aucun effet
    }
}

// Mettre à jour la vitesse de la balle en conservant la direction
function updateBallSpeed() {
    const currentSpeed = Math.sqrt(ballDX * ballDX + ballDY * ballDY);
    const newSpeed = ballSpeedModified;
    ballDX = (ballDX / currentSpeed) * newSpeed;
    ballDY = (ballDY / currentSpeed) * newSpeed;
}

// Réinitialiser un effet après 5 secondes
function resetEffectAfterDelay(callback) {
    if (effectTimer) clearTimeout(effectTimer);
    effectTimer = setTimeout(callback, 5000); // 5000 ms = 5 secondes
}

// Vérifier si le joueur a gagné
function checkWin() {
    let remainingBricks = 0;

    for (let c = 0; c < config.brickColumnCount; c++) {
        for (let r = 0; r < config.brickRowCount; r++) {
            if (bricks[c][r].status === 1) {
                remainingBricks++;
            }
        }
    }

    if (remainingBricks === 0) {
        // Victoire!
        gameStarted = false;
        gameOver = true;

        document.getElementById("gameOver").style.display = "block";
        document.getElementById("finalScore").textContent = score;
    }
}

function showEffectMessage(message) {
    ctx.font = "20px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(message, canvasWidth / 2, canvasHeight / 2);
    setTimeout(() => draw(), 1000); // Efface après 1 seconde
}

function applyBrickEffect(type) {
    switch (type) {
        case 1:
            paddleWidthModified = config.paddleWidth * 1.5;
            showEffectMessage("Raquette agrandie !");
            resetEffectAfterDelay(() => paddleWidthModified = config.paddleWidth);
            break;
        case 2:
            ballSpeedModified = config.ballSpeed * 0.8;
            updateBallSpeed();
            showEffectMessage("Balle ralentie !");
            resetEffectAfterDelay(() => {
                ballSpeedModified = config.ballSpeed;
                updateBallSpeed();
            });
            break;
        case 3:
            lives++;
            updateScoreDisplay();
            showEffectMessage("+1 Vie !");
            break;
        case 4:
            paddleWidthModified = config.paddleWidth * 0.5;
            showEffectMessage("Raquette rétrécie !");
            resetEffectAfterDelay(() => paddleWidthModified = config.paddleWidth);
            break;
        case 5:
            ballSpeedModified = config.ballSpeed * 1.2;
            updateBallSpeed();
            showEffectMessage("Balle accélérée !");
            resetEffectAfterDelay(() => {
                ballSpeedModified = config.ballSpeed;
                updateBallSpeed();
            });
            break;
        case 6:
            lives--;
            updateScoreDisplay();
            showEffectMessage("-1 Vie !");
            if (lives === 0) endGame();
            break;
        default:
            break;
    }
}

// Mettre à jour l'affichage du score et des vies
function updateScoreDisplay() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
}

// Fin de la partie
function endGame() {
    gameStarted = false;
    gameOver = true;

    document.getElementById("gameOver").style.display = "block";
    document.getElementById("finalScore").textContent = score;
}

// Ajouter les événements
function addEventListeners() {
    // Événements pour le clavier
    document.addEventListener("keydown", keyDownHandler);
    document.addEventListener("keyup", keyUpHandler);

    // Événements pour le tactile/mobile
    canvas.addEventListener("touchmove", touchMoveHandler);

    // Événements pour la souris
    canvas.addEventListener("mousemove", mouseMoveHandler);

    // Boutons
    document.getElementById("startButton").addEventListener("click", startGame);
    document.getElementById("resetButton").addEventListener("click", initGame);
    document.getElementById("restartButton").addEventListener("click", initGame);

    // Redimensionnement de la fenêtre
    window.addEventListener("resize", function () {
        resizeCanvas();
        if (!gameStarted) {
            draw();
        }
    });
}

// Gérer les touches du clavier (appui)
let rightPressed = false;
let leftPressed = false;

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    } else if (e.key === " " || e.key === "Spacebar") {
        if (!gameStarted && !gameOver) {
            startGame();
        }
    }
}

// Gérer les touches du clavier (relâchement)
function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

// Gérer le mouvement de la souris
function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvasWidth) {
        paddleX = relativeX - config.paddleWidth / 2;

        // Limiter la position de la raquette
        if (paddleX < 0) {
            paddleX = 0;
        } else if (paddleX > canvasWidth - config.paddleWidth) {
            paddleX = canvasWidth - config.paddleWidth;
        }
    }
}

// Gérer le mouvement tactile
function touchMoveHandler(e) {
    e.preventDefault();
    const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvasWidth) {
        paddleX = relativeX - config.paddleWidth / 2;

        // Limiter la position de la raquette
        if (paddleX < 0) {
            paddleX = 0;
        } else if (paddleX > canvasWidth - config.paddleWidth) {
            paddleX = canvasWidth - config.paddleWidth;
        }
    }
}

// Démarrer le jeu
function startGame() {
    if (!gameStarted && !gameOver) {
        gameStarted = true;

        // Mettre à jour la raquette selon les touches
        function updatePaddle() {
            if (rightPressed && paddleX < canvasWidth - config.paddleWidth) {
                paddleX += config.paddleSpeed;
            } else if (leftPressed && paddleX > 0) {
                paddleX -= config.paddleSpeed;
            }

            // Continuer la mise à jour si le jeu est en cours
            if (gameStarted && !gameOver) {
                requestAnimationFrame(updatePaddle);
            }
        }

        // Démarrer la mise à jour de la raquette
        updatePaddle();
    }
}

// Initialiser le jeu au chargement
window.onload = function () {
    initGame();
};
