window.onload = function(){
    var palco = document.getElementById('palco');
    var ctx = palco.getContext('2d');

    document.addEventListener('keydown', teclou);

    var tickInterval = 62.5;
    setInterval(game, tickInterval);

    const vel = 1;
    var velx = vely = 0;
    var pontox = pontoy = 1;
    var tp = 20; //tamanho da peça
    var baseGrid = 20; //tamanho base do grid
    var qtdpeca = baseGrid; //qtd de peca = tamanho canva / tamanho peca
    var expansionLevel = 0;
    var alvox = alvoy = 10;
    var rastro = [];
    var rabo = 3;
    var pontuacao = 0;
    var pontos = document.getElementById('score');
    var bestScore = document.getElementById('best-score');
    var historico = [0,0,0,0,0];
    var timerElement = document.getElementById('timer');
    var feedbackElement = document.getElementById('feedback');
    var initialTime = 20;
    var remainingTime = initialTime;
    var lastTickTime = Date.now();
    var isRunning = false;
    var comidasColetadas = 0;
    var obstacleBias = 0.7;
    var obstacleSpeedFactor = 0.75;
    var rivals = [];
    var sprites = createSprites(tp);
    var playerSprites = createSnakeSprites(tp, {
        head: 'rgb(0, 255, 100)',
        body: 'rgb(0, 200, 80)',
        tail: 'rgb(0, 180, 70)'
    });
    var rivalSprites = createSnakeSprites(tp, {
        head: 'rgb(255, 153, 0)',
        body: 'rgb(220, 120, 0)',
        tail: 'rgb(200, 100, 0)'
    });
    var rivalPalettes = [
        { head: 'rgb(255, 153, 0)', body: 'rgb(220, 120, 0)', tail: 'rgb(200, 100, 0)' },
        { head: 'rgb(0, 180, 255)', body: 'rgb(0, 130, 210)', tail: 'rgb(0, 110, 180)' },
        { head: 'rgb(255, 90, 200)', body: 'rgb(210, 70, 170)', tail: 'rgb(180, 60, 140)' },
        { head: 'rgb(255, 200, 0)', body: 'rgb(210, 160, 0)', tail: 'rgb(180, 130, 0)' },
        { head: 'rgb(140, 255, 120)', body: 'rgb(90, 210, 90)', tail: 'rgb(70, 180, 70)' },
        { head: 'rgb(200, 160, 255)', body: 'rgb(160, 120, 210)', tail: 'rgb(130, 100, 180)' }
    ];
    var foodScale = 1;
    var levelSelect = document.getElementById('nivel-select');
    var levelDetails = document.getElementById('nivel-detalhes');
    var leaderboardList = document.getElementById('leaderboard-list');
    var levels = [
        {
            id: 1,
            name: 'Treino',
            foodScale: 3,
            rivalSpeed: 0.5,
            bias: 0.4,
            details: [
                'Comida 3x maior.',
                'Cobra rival em 40% da velocidade.',
                'Movimento rival mais aleatório.'
            ]
        },
        {
            id: 2,
            name: 'Rápido',
            foodScale: 3,
            rivalSpeed: 0.6,
            bias: 0.55,
            details: [
                'Comida 3x maior.',
                'Cobra rival em 48% da velocidade.',
                'Menos aleatoriedade no movimento.'
            ]
        },
        {
            id: 3,
            name: 'Moderado',
            foodScale: 2,
            rivalSpeed: 0.6,
            bias: 0.55,
            details: [
                'Comida 2x maior.',
                'Cobra rival em 48% da velocidade.',
                'Menos aleatoriedade no movimento.'
            ]
        },
        {
            id: 4,
            name: 'Intenso',
            foodScale: 2,
            rivalSpeed: 0.75,
            bias: 0.7,
            details: [
                'Comida 2x maior.',
                'Cobra rival em 60% da velocidade.',
                'Movimento rival com padrão atual.'
            ]
        },
        {
            id: 5,
            name: 'Insano',
            foodScale: 1.25,
            rivalSpeed: 0.75,
            bias: 0.7,
            details: [
                'Comida 1,25x maior.',
                'Cobra rival em 60% da velocidade.',
                'Movimento rival com padrão atual.'
            ]
        }
    ];
    var audioContext = null;
    var audioUnlocked = false;
    var currentLevelId = 1;
    var sessionBest = 0;
    var leaderboard = loadLeaderboard();
    var supabaseUrl = 'https://skcjwdbbgcshzynvhtte.supabase.co';
    var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2p3ZGJiZ2NzaHp5bnZodHRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDk5OTcsImV4cCI6MjA4NjA4NTk5N30.xLU2ehpjxocX61XlL6V1D-MO_4JcfPdnlbH0dxDoY00';
    var supabaseClient = null;

    function applyLevel(levelId){
        var selected = levels.find(function(level){
            return level.id === levelId;
        }) || levels[0];
        currentLevelId = selected.id;
        foodScale = selected.foodScale;
        obstacleSpeedFactor = selected.rivalSpeed * 0.8;
        obstacleBias = selected.bias;
        rivals.forEach(function(rival){
            rival.speedFactor = obstacleSpeedFactor;
            rival.bias = obstacleBias;
        });
        if(levelDetails){
            levelDetails.innerHTML = '';
            selected.details.forEach(function(texto){
                var item = document.createElement('li');
                item.textContent = texto;
                levelDetails.appendChild(item);
            });
        }
        resetGame();
        renderLeaderboard();
    }

    function loadLeaderboard(){
        var stored = window.localStorage.getItem('snakeLeaderboard');
        if(stored){
            try{
                return JSON.parse(stored);
            } catch (e){
                return createEmptyLeaderboard();
            }
        }
        return createEmptyLeaderboard();
    }

    function getSupabaseClient(){
        if(supabaseClient){
            return supabaseClient;
        }
        if(window.supabase && window.supabase.createClient){
            supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
            return supabaseClient;
        }
        return null;
    }

    function createEmptyLeaderboard(){
        return {
            levels: {
                1: [],
                2: [],
                3: [],
                4: [],
                5: []
            }
        };
    }

    function saveLeaderboard(){
        window.localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
    }

    function recordScore(name, score, levelId){
        if(score > sessionBest){
            sessionBest = score;
            if(bestScore){
                bestScore.innerText = sessionBest;
            }
        }
        var entry = {
            nome: name,
            score: score,
            level: levelId,
            timestamp: Date.now()
        };
        var bucket = leaderboard.levels[levelId] || [];
        bucket.push(entry);
        bucket.sort(function(a, b){
            return b.score - a.score;
        });
        leaderboard.levels[levelId] = bucket.slice(0, 10);
        saveLeaderboard();

        var client = getSupabaseClient();
        if(client){
            client
                .from('snake_scores')
                .insert([{ player_name: name, score: score, level: levelId }])
                .then(function(){
                    renderLeaderboard();
                })
                .catch(function(){
                    renderLeaderboard();
                });
        } else {
            renderLeaderboard();
        }
    }

    function renderLeaderboard(){
        if(!leaderboardList){
            return;
        }
        leaderboardList.innerHTML = '';
        var loadingItem = document.createElement('li');
        loadingItem.className = 'leaderboard-item';
        loadingItem.textContent = 'Carregando leaderboard...';
        leaderboardList.appendChild(loadingItem);

        var client = getSupabaseClient();
        if(!client){
            renderLeaderboardFallback();
            return;
        }

        client
            .from('snake_scores')
            .select('player_name, score, level')
            .eq('level', currentLevelId)
            .order('score', { ascending: false })
            .limit(10)
            .then(function(result){
                if(result.error){
                    renderLeaderboardFallback();
                    return;
                }
                renderLeaderboardEntries(result.data || []);
            })
            .catch(function(){
                renderLeaderboardFallback();
            });
    }

    function renderLeaderboardFallback(){
        var bucket = leaderboard.levels[currentLevelId] || [];
        renderLeaderboardEntries(bucket.map(function(entry){
            return {
                player_name: entry.nome,
                score: entry.score,
                level: currentLevelId
            };
        }));
    }

    function renderLeaderboardEntries(entries){
        leaderboardList.innerHTML = '';
        if(entries.length === 0){
            var emptyItem = document.createElement('li');
            emptyItem.className = 'leaderboard-item';
            emptyItem.textContent = 'Nenhuma pontuação registrada ainda.';
            leaderboardList.appendChild(emptyItem);
            return;
        }
        entries.forEach(function(entry, index){
            var item = document.createElement('li');
            item.className = 'leaderboard-item';
            var rank = document.createElement('span');
            rank.textContent = `#${index + 1}`;
            var name = document.createElement('span');
            name.textContent = entry.player_name || 'Jogador';
            var score = document.createElement('span');
            score.innerHTML = `${entry.score} <i class="fas fa-apple-alt"></i>`;
            item.appendChild(rank);
            item.appendChild(name);
            item.appendChild(score);
            leaderboardList.appendChild(item);
        });
    }

    function getAudioContext(){
        if(!audioContext){
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if(AudioContext){
                audioContext = new AudioContext();
            }
        }
        return audioContext;
    }

    function unlockAudio(){
        if(audioUnlocked){
            return;
        }
        var context = getAudioContext();
        if(context && context.state === 'suspended'){
            context.resume();
        }
        audioUnlocked = true;
    }

    function playTone(frequency, duration, type, volume){
        var context = getAudioContext();
        if(!context){
            return;
        }
        var oscillator = context.createOscillator();
        var gainNode = context.createGain();
        oscillator.type = type || 'sine';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gainNode.gain.setValueAtTime(volume || 0.15, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + duration);
    }

    function triggerFeedback(kind, message){
        if(feedbackElement){
            feedbackElement.textContent = message;
            feedbackElement.classList.remove('food', 'death');
            feedbackElement.classList.add(kind);
        }
        if(palco){
            palco.classList.remove('palco-hit', 'palco-death');
            void palco.offsetWidth;
            palco.classList.add(kind === 'food' ? 'palco-hit' : 'palco-death');
            setTimeout(function(){
                palco.classList.remove('palco-hit', 'palco-death');
            }, 250);
        }
        if(kind === 'food'){
            playTone(660, 0.18, 'triangle', 0.12);
        } else if(kind === 'death'){
            playTone(180, 0.4, 'sawtooth', 0.18);
        }
    }

    function resetGame(){
        rabo = 3;
        pontuacao = 0;
        velx = vely = 0;
        pontox = 1;
        pontoy = 1;
        rastro = [];
        expansionLevel = 0;
        qtdpeca = baseGrid;
        palco.width = qtdpeca * tp;
        palco.height = qtdpeca * tp;
        alvox = Math.floor(Math.random()*qtdpeca);
        alvoy = Math.floor(Math.random()*qtdpeca);
        rivals = [createRival(0)];
        remainingTime = initialTime;
        isRunning = false;
        comidasColetadas = 0;
        lastTickTime = Date.now();
        if(feedbackElement){
            feedbackElement.textContent = 'Pronto para a próxima comida.';
            feedbackElement.classList.remove('food', 'death');
        }
        if(bestScore){
            bestScore.innerText = sessionBest;
        }
    }

    function createSprite(size, drawFn){
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var context = canvas.getContext('2d');
        drawFn(context, size);
        return canvas;
    }

    function createSprites(size){
        return {
            food: createSprite(size, function(ctx, s){
                ctx.fillStyle = 'rgba(255, 70, 70, 0.95)';
                ctx.beginPath();
                ctx.arc(s/2, s/2, s/2 - 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 220, 220, 0.7)';
                ctx.beginPath();
                ctx.arc(s/2 + 3, s/2 - 3, 3, 0, Math.PI * 2);
                ctx.fill();
            })
        };
    }

    function createSnakeSprites(size, palette){
        return {
            head: createSprite(size, function(ctx, s){
                ctx.fillStyle = palette.head;
                ctx.fillRect(0, 0, s, s);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                ctx.fillRect(2, 2, s - 4, s - 4);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s - 6, 6, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(s - 6, 6, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }),
            body: createSprite(size, function(ctx, s){
                ctx.fillStyle = palette.body;
                ctx.fillRect(0, 0, s, s);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
                ctx.fillRect(3, 3, s - 6, s - 6);
            }),
            tail: createSprite(size, function(ctx, s){
                ctx.fillStyle = palette.tail;
                ctx.fillRect(0, 0, s, s);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.moveTo(4, s - 4);
                ctx.lineTo(s / 2, 4);
                ctx.lineTo(s - 4, s - 4);
                ctx.closePath();
                ctx.fill();
            })
        };
    }

    function registerGameOver(message){
        triggerFeedback('death', 'Fim de jogo! Reiniciando a caçada...');
        window.alert(message);
        var nome = window.prompt('Digite seu nome para registrar a pontuação:', 'Jogador');
        if(!nome){
            nome = 'Anônimo';
        }
        recordScore(nome, pontuacao, currentLevelId);
        historico.push({nome: nome, score: pontuacao});
        if(historico.length >5){
            historico.shift();
        }
        resetGame();
    }

    function createRival(index){
        var palette = rivalPalettes[index % rivalPalettes.length];
        var sprites = createSnakeSprites(tp, palette);
        var startX = Math.floor(Math.random()*qtdpeca);
        var startY = Math.floor(Math.random()*qtdpeca);
        return {
            x: startX,
            y: startY,
            trail: [
                {x: startX, y: startY},
                {x: startX, y: startY},
                {x: startX, y: startY}
            ],
            accumulator: 0,
            speedFactor: obstacleSpeedFactor,
            bias: obstacleBias,
            sprites: sprites
        };
    }

    function moveRival(rival){
        rival.accumulator += rival.speedFactor;
        if(rival.accumulator < 1){
            return;
        }
        rival.accumulator -= 1;
        var dx = 0;
        var dy = 0;
        var deltaX = alvox - rival.x;
        var deltaY = alvoy - rival.y;
        if(Math.random() < rival.bias){
            if(Math.abs(deltaX) > Math.abs(deltaY)){
                dx = deltaX > 0 ? 1 : -1;
            } else if(deltaY !== 0){
                dy = deltaY > 0 ? 1 : -1;
            }
        }

        if(dx === 0 && dy === 0){
            var direcoes = [
                {x: 1, y: 0},
                {x: -1, y: 0},
                {x: 0, y: 1},
                {x: 0, y: -1}
            ];
            var escolha = direcoes[Math.floor(Math.random()*direcoes.length)];
            dx = escolha.x;
            dy = escolha.y;
        }

        rival.x += dx;
        rival.y += dy;

        if(rival.x <0){
            rival.x = qtdpeca-1;
        }
        if (rival.x >=qtdpeca){
            rival.x=0;
        }

        if(rival.y <0){
            rival.y = qtdpeca-1;
        }
        if (rival.y >=qtdpeca){
            rival.y=0;
        }
        rival.trail.push({x: rival.x, y: rival.y});
        while(rival.trail.length > 3){
            rival.trail.shift();
        }
    }

    function updateProgression(){
        var targetLevel = Math.min(Math.floor(pontuacao / 35), 5);
        if(targetLevel !== expansionLevel){
            expansionLevel = targetLevel;
            qtdpeca = baseGrid + expansionLevel * 2;
            palco.width = qtdpeca * tp;
            palco.height = qtdpeca * tp;
        }

        var targetRivals = 1 + expansionLevel;
        while(rivals.length < targetRivals){
            rivals.push(createRival(rivals.length));
        }
    }

    function isColliding(ax, ay, aw, ah, bx, by, bw, bh){
        return ax < bx + bw &&
            ax + aw > bx &&
            ay < by + bh &&
            ay + ah > by;
    }

    function game(){
        var agora = Date.now();
        var delta = (agora - lastTickTime) / 1000;
        lastTickTime = agora;

        ctx.fillStyle = 'black';
        ctx.fillRect(0,0, palco.width, palco.height);
        // tratando para chegada nas bordas

        pontox += velx;
        pontoy += vely;

        if((velx !== 0 || vely !== 0) && !isRunning){
            isRunning = true;
        }

        if(isRunning){
            remainingTime -= delta;
            if(remainingTime <= 0){
                registerGameOver('Perdeu! O tempo acabou.');
                return;
            }
        }

        if(pontox <0){
            pontox = qtdpeca-1;
        }
        if (pontox >=qtdpeca){
            pontox=0;
        }

        if(pontoy <0){
            pontoy = qtdpeca-1;
        }
        if (pontoy >=qtdpeca){
            pontoy=0;
        }
        //gerando alvo
        var rivalOnFood = rivals.some(function(rival){
            return rival.x === alvox && rival.y === alvoy;
        });
        if(rivalOnFood){
            alvox = Math.floor(Math.random()*qtdpeca);
            alvoy = Math.floor(Math.random()*qtdpeca);
        }

        var foodSize = tp * foodScale;
        var foodOffset = (foodSize - tp) / 2;
        var foodX = tp * alvox - foodOffset;
        var foodY = tp * alvoy - foodOffset;
        ctx.drawImage(
            sprites.food,
            foodX,
            foodY,
            foodSize,
            foodSize
        );

        //cobras rivais
        rivals.forEach(function(rival){
            moveRival(rival);
            for(var j = 0; j < rival.trail.length; j++){
                if(j === rival.trail.length - 1){
                    ctx.drawImage(rival.sprites.head, rival.trail[j].x*tp, rival.trail[j].y*tp, tp, tp);
                } else if(j === 0){
                    ctx.drawImage(rival.sprites.tail, rival.trail[j].x*tp, rival.trail[j].y*tp, tp, tp);
                } else {
                    ctx.drawImage(rival.sprites.body, rival.trail[j].x*tp, rival.trail[j].y*tp, tp, tp);
                }
            }
        });

        //plotando o rastro da cobra
        
        for(var i =0; i<rastro.length;i++){
            if (i==rastro.length-1){ //pinta a cabeça da cobra
                ctx.drawImage(playerSprites.head, rastro[i].x*tp, rastro[i].y*tp, tp, tp);
            } else if (i==0){
                ctx.drawImage(playerSprites.tail, rastro[i].x*tp, rastro[i].y*tp, tp, tp);
            } else { // pinta o corpo da cobra ou seja, o resto de rastro
                ctx.drawImage(playerSprites.body, rastro[i].x*tp, rastro[i].y*tp, tp, tp);
            }

            //verificando se a cobra se comeu
            if(rastro[i].x == pontox && rastro[i].y == pontoy  && (velx != 0 || vely != 0)){
                registerGameOver('Perdeu! A cobra se mordeu.');
                return;
            }
        }
        rastro.push({x:pontox, y:pontoy}); //inserindo a nova posição da cobra no rastro
        
        //apagando o rastro que passou - ocorre quando o rabo é menor que o rastro
        while(rastro.length > rabo){
            rastro.shift();
        }
        //caso a cobra encontre o alvo, aumenta o tamanho do rabo
        //posiciona o alvo em um lugar novo
        var headX = pontox * tp;
        var headY = pontoy * tp;
        if(isColliding(headX, headY, tp, tp, foodX, foodY, foodSize, foodSize)){
            pontuacao++
            rabo++;
            alvox = Math.floor(Math.random()*qtdpeca);
            alvoy = Math.floor(Math.random()*qtdpeca);
            comidasColetadas++;
            remainingTime = initialTime + Math.floor(comidasColetadas / 7);
            triggerFeedback('food', 'Boa! Comida capturada.');
            updateProgression();
        }

         //Atualiza informações da pontuação

        pontos.innerHTML = (`${pontuacao}   <i class="fas fa-apple-alt"></i>`);
        if(pontuacao > sessionBest){
            sessionBest = pontuacao;
            if(bestScore){
                bestScore.innerText = sessionBest;
            }
        }
        if(timerElement){
            timerElement.innerText = `${remainingTime.toFixed(1)}s`;
        }
        var historicosElementos = document.getElementsByClassName('historico');
        for(var i= 0; i < historicosElementos.length; i++){
            var hist = historicosElementos[i];
            var valor = historico[historico.length - 1 - i];
            if(valor){
                hist.innerHTML = `${valor.nome}: ${valor.score}`;
            } else {
                hist.innerHTML = 'Sem Pontuação';
            }
        }

    }

    if(levelSelect){
        levelSelect.addEventListener('change', function(event){
            var nivel = Number(event.target.value);
            applyLevel(nivel);
        });
        applyLevel(Number(levelSelect.value));
    } else {
        applyLevel(1);
    }

    function teclou(event){
        unlockAudio();
        switch (event.keyCode){
            case 37: //left
            case 65: //A
                event.preventDefault();
                if (velx >0){break;}
                velx = -vel; 
                vely = 0;         
            break;
            
            case 38: //up
            case 87: //W
                event.preventDefault();
                if (vely >0){break;}
                velx = 0; 
                vely = -vel;         
            break;

            case 39://right
            case 68: //D
                event.preventDefault();
                if(velx <0){break;} 
                velx = +vel; 
                vely = 0;         
            break;

            case 40://down
            case 83: //S
                event.preventDefault();
                if(vely<0){break;}
                velx = 0; 
                vely = +vel;         
            break;

            default: break;
            
        }
    }
}
