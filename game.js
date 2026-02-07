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
    var obstacleTick = 0;
    var obstacleSpeed = 2;
    var obstacleBias = 0.7;
    var sprites = createSprites(tp);

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
        obstacleTick = 0;
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
            }),
            head: createSprite(size, function(ctx, s){
                ctx.fillStyle = 'rgb(0, 255, 100)';
                ctx.fillRect(0, 0, s, s);
                ctx.fillStyle = 'rgba(0, 150, 60, 0.8)';
                ctx.fillRect(2, 2, s - 4, s - 4);
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s - 6, 6, 3, 0, Math.PI * 2);
                ctx.fill();
            }),
            body: createSprite(size, function(ctx, s){
                ctx.fillStyle = 'rgb(0, 200, 80)';
                ctx.fillRect(0, 0, s, s);
                ctx.fillStyle = 'rgba(0, 120, 50, 0.7)';
                ctx.fillRect(3, 3, s - 6, s - 6);
            }),
            obstacle: createSprite(size, function(ctx, s){
                ctx.fillStyle = 'rgb(255, 153, 0)';
                ctx.fillRect(0, 0, s, s);
                ctx.strokeStyle = 'rgba(120, 60, 0, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(2, 2, s - 4, s - 4);
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
        obstacleTick++;
        if(obstacleTick % obstacleSpeed !== 0){
            return;
        }
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
        ctx.drawImage(sprites.obstacle, tp * obstaclex, tp * obstacley, tp, tp);

        //obstáculo
        moveObstacle();
        ctx.fillStyle = 'rgb(255, 153, 0)';
        ctx.fillRect(tp * obstaclex, tp * obstacley, tp, tp);

        //plotando o rastro da cobra
        
        for(var i =0; i<rastro.length;i++){
            if (i==rastro.length-2){ //pinta a cabeça da cobra
                ctx.drawImage(sprites.head, rastro[i].x*tp, rastro[i].y*tp, tp, tp);
            } else { // pinta o corpo da cobra ou seja, o resto de rastro
                ctx.drawImage(sprites.body, rastro[i].x*tp, rastro[i].y*tp, tp, tp);
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

        if(pontox == obstaclex && pontoy == obstacley && (velx != 0 || vely != 0)){
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
