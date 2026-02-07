window.onload = function(){
    var palco = document.getElementById('palco');
    var ctx = palco.getContext('2d');

    document.addEventListener('keydown', teclou);

    setInterval(game, 50);

    const vel = 1;
    var velx = vely = 0;
    var pontox = pontoy = 1;
    var tp = 20; //tamanho da peça
    var qtdpeca = 20; //qtd de peca = tamanho canva / tamanho peca
    var alvox = alvoy = 10;
    var rastro = [];
    var rabo = 3;
    var pontuacao = 0;
    var pontos = document.getElementById('score');
    var bestScore = document.getElementById('best-score');
    var historico = [0,0,0,0,0];
    var timerElement = document.getElementById('timer');
    var remainingTime = 10;
    var lastTickTime = Date.now();
    var isRunning = false;
    var comidasColetadas = 0;
    var obstaclex = 5;
    var obstacley = 5;
    var obstacleBias = 0.7;
    var obstacleSpeedFactor = 0.75;
    var obstacleMoveAccumulator = 0;
    var obstacleTrail = [];
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

    function resetGame(){
        rabo = 3;
        pontuacao = 0;
        velx = vely = 0;
        pontox = 1;
        pontoy = 1;
        rastro = [];
        alvox = Math.floor(Math.random()*qtdpeca);
        alvoy = Math.floor(Math.random()*qtdpeca);
        obstaclex = Math.floor(Math.random()*qtdpeca);
        obstacley = Math.floor(Math.random()*qtdpeca);
        obstacleMoveAccumulator = 0;
        obstacleTrail = [
            {x: obstaclex, y: obstacley},
            {x: obstaclex, y: obstacley},
            {x: obstaclex, y: obstacley}
        ];
        remainingTime = 10;
        isRunning = false;
        comidasColetadas = 0;
        lastTickTime = Date.now();
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
        historico.push(pontuacao);
        if(historico.length >5){
            historico.shift();
        }
        window.alert(message);
        resetGame();
    }

    function moveObstacle(){
        obstacleMoveAccumulator += obstacleSpeedFactor;
        if(obstacleMoveAccumulator < 1){
            return;
        }
        obstacleMoveAccumulator -= 1;
        var dx = 0;
        var dy = 0;
        var deltaX = alvox - obstaclex;
        var deltaY = alvoy - obstacley;
        if(Math.random() < obstacleBias){
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

        obstaclex += dx;
        obstacley += dy;

        if(obstaclex <0){
            obstaclex = qtdpeca-1;
        }
        if (obstaclex >=qtdpeca){
            obstaclex=0;
        }

        if(obstacley <0){
            obstacley = qtdpeca-1;
        }
        if (obstacley >=qtdpeca){
            obstacley=0;
        }
        obstacleTrail.push({x: obstaclex, y: obstacley});
        while(obstacleTrail.length > 3){
            obstacleTrail.shift();
        }
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
        if(alvox === obstaclex && alvoy === obstacley){
            alvox = Math.floor(Math.random()*qtdpeca);
            alvoy = Math.floor(Math.random()*qtdpeca);
        }

        ctx.drawImage(sprites.food, tp * alvox, tp*alvoy, tp, tp);

        //obstáculo
        moveObstacle();
        for(var j = 0; j < obstacleTrail.length; j++){
            if(j === obstacleTrail.length - 1){
                ctx.drawImage(rivalSprites.head, obstacleTrail[j].x*tp, obstacleTrail[j].y*tp, tp, tp);
            } else if(j === 0){
                ctx.drawImage(rivalSprites.tail, obstacleTrail[j].x*tp, obstacleTrail[j].y*tp, tp, tp);
            } else {
                ctx.drawImage(rivalSprites.body, obstacleTrail[j].x*tp, obstacleTrail[j].y*tp, tp, tp);
            }
        }

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
        if(alvox == pontox && alvoy == pontoy){
            pontuacao++
            rabo++;
            alvox = Math.floor(Math.random()*qtdpeca);
            alvoy = Math.floor(Math.random()*qtdpeca);
            comidasColetadas++;
            remainingTime = 10 + Math.floor(comidasColetadas / 7);
        }

        var obstaculoColisao = obstacleTrail.some(function(segmento){
            return segmento.x == pontox && segmento.y == pontoy;
        });
        if(obstaculoColisao && (velx != 0 || vely != 0)){
            registerGameOver('Perdeu! Você bateu no obstáculo.');
            return;
        }

         //Atualiza informações da pontuação

        pontos.innerHTML = (`${pontuacao}   <i class="far fa-star"></i>`);
        if(pontuacao > Number(bestScore.innerText)){
            bestScore.innerText = pontuacao;
        }
        if(timerElement){
            timerElement.innerText = `${remainingTime.toFixed(1)}s`;
        }
        var historicosElementos = document.getElementsByClassName('historico');
        for(var i= 0; i < historicosElementos.length; i++){
            var hist = historicosElementos[i];
            var valor = historico[historico.length - 1 - i];
            hist.innerHTML = (valor !== undefined ? `${valor}` : 'Sem Pontuação');
        }

    }

    function teclou(event){
        switch (event.keyCode){
            case 37: //left
                event.preventDefault();
                if (velx >0){break;}
                velx = -vel; 
                vely = 0;         
            break;
            
            case 38: //up
                event.preventDefault();
                if (vely >0){break;}
                velx = 0; 
                vely = -vel;         
            break;

            case 39://right
                event.preventDefault();
                if(velx <0){break;} 
                velx = +vel; 
                vely = 0;         
            break;

            case 40://down
                event.preventDefault();
                if(vely<0){break;}
                velx = 0; 
                vely = +vel;         
            break;

            default: break;
            
        }
    }
}
