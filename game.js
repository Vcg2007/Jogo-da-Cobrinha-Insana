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
    var obstaclex = 5;
    var obstacley = 5;
    var obstacleTick = 0;
    var obstacleSpeed = 6;

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
        var direcoes = [
            {x: 1, y: 0},
            {x: -1, y: 0},
            {x: 0, y: 1},
            {x: 0, y: -1}
        ];
        var escolha = direcoes[Math.floor(Math.random()*direcoes.length)];
        obstaclex += escolha.x;
        obstacley += escolha.y;

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
            
        ctx.fillStyle = 'black';
        ctx.fillRect(0,0, palco.width, palco.height);
        // tratando para chegada nas bordas

        pontox += velx;
        pontoy += vely;

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

        ctx.fillStyle = 'red';
        ctx.fillRect(tp * alvox, tp*alvoy, tp, tp);

        //obstáculo
        moveObstacle();
        ctx.fillStyle = 'rgb(255, 153, 0)';
        ctx.fillRect(tp * obstaclex, tp * obstacley, tp, tp);

        //plotando o rastro da cobra
        
        for(var i =0; i<rastro.length;i++){
            if (i==rastro.length-1){ //pinta o olhinho da cobra
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.fillRect(rastro[i].x*tp, rastro[i].y*tp, tp-10, tp-10);
            }
            if (i==rastro.length-2){ //pinta a cabeça da cobra
                ctx.fillStyle = 'rgb(0, 255, 100)';
                ctx.fillRect(rastro[i].x*tp, rastro[i].y*tp, tp, tp);
            }
            if(i!=rastro.length-1 && i!= rastro.length-2){ // pinta o corpo da cobra ou seja, o resto de rastro
                ctx.fillStyle = 'green';
                ctx.fillRect(rastro[i].x*tp, rastro[i].y*tp, tp, tp);
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
                if (velx >0){break;}
                velx = -vel; 
                vely = 0;         
            break;
            
            case 38: //up
                if (vely >0){break;}
                velx = 0; 
                vely = -vel;         
            break;

            case 39://right
                if(velx <0){break;} 
                velx = +vel; 
                vely = 0;         
            break;

            case 40://down
                if(vely<0){break;}
                velx = 0; 
                vely = +vel;         
            break;

            default: break;
            
        }
    }
}
