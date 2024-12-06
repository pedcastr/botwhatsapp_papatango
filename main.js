const venom = require('venom-bot'); // biblioteca venom
const natural = require('natural'); // biblioteca de aproximação de palavras -> responsável quando o usuário não digita a opção correta, porém envia algo se assemelha a sua dúvida a opção que de fato ele deveria ter digitado
const { getCustomerData } = require('./airtable'); // banco de dados online 

venom
  .create({
    session: 'session-name' // Nome da sessão
  })
  .then((client) => start(client))
  .catch((erro) => {
    console.log(erro);
  });

function start(client) {
  let userState = {}; // Objeto para armazenar o estado do usuário

  const options = {
    2: ['1', '2', 'já sou cliente', 'cliente', 'quero consultar preços', 'consultar preços', 'preços', 'catálogos', 'fazer parte', 'melhor empresa'],
    4: ['1', 'pagar semana', '2', 'problemas com o veículo', 'problemas', '3', 'emergência', '4', 'falar com atendente', '5', 'encerrar atendimento'],
    5: ['1', 'motos disponíveis', 'motos', '2', 'anúncio', '3', 'falar com atendente'],
    6: ['1', 'sim', '2', 'não']
  };

  const optionHandler = {
    2: handleStep2,     // Etapa -> decisão if (Cliente || Futuro Cliente)
    4: handleStep4,     // Etapa -> Cliente
    5: handleStep5,     // Etapa -> Futuro cliente
    6: handleStep6      // Etapa -> (Precisa de mais ajuda || Encerrar atendimento)
  };

  function findClosestOption(step, input) {
    const optionList = options[step];
    let bestMatch = null;
    let bestDistance = -1;

    optionList.forEach(option => {
      const distance = natural.JaroWinklerDistance(input, option);
      if (distance > bestDistance) {
        bestDistance = distance;
        bestMatch = option;
      }
    });

    return bestMatch;
  }
// ------------------------------------Etapa -> decisão if (Cliente || Futuro Cliente)-----------------------------------
  function handleStep2(client, from, msg, user) {
    if (msg === '1' || msg.includes('cliente')) {
      client.sendText(from, 'Por favor, digite seu *CPF/CNPJ* para continuar');
      user.step++; // Enviando o processo para a próxima etapa 
      startInactivityTimer(client, from, user);
    } else if (msg === '2' || msg.includes('preços') || msg.includes('catálogos') || msg.includes('melhor empresa') || msg.includes('não sou cliente')) {
      client.sendText(from, 'Ficamos felizes em saber do seu interesse 😍\n\nDigite a opção desejada:\n\n*1* - Motos disponíveis\n*2* - Vi o anúncio de vocês em alguma plataforma, já estou com o print do anúncio e quero fechar negócio\n*3* - Falar com atendente');
      user.step = 5; // Vai para a etapa de interesse
      startInactivityTimer(client, from, user);
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }
// --------------------------------------------------Etapa -> Cliente----------------------------------------------------
  function handleStep4(client, from, msg, user) {
    if (msg === '1' || msg.includes('pagar semana')) {
      client.sendText(from, 'Clique no link abaixo para ser direcionado ao site de pagamentos:\n*https://nubank.com.br/cobrar/5hiuf/66816b96-7614-418c-bc0a-ee918e7d45f7*\n\nApós clicar, adicione o valor da semana conforme acordado ❤️');
      client.sendText(from, 'Após realizar o pagamento, por favor, *envie o comprovante bancário*');
      client.sendText(from, 'Podemos lhe ajudar em algo mais?\n\nDigite a opção desejada:\n\n*1* - Sim\n*2* - Não');
      user.step = 6; // Envia para a etapa -> Escolher se precisa de mais ajuda ou não
      startInactivityTimer(client, from, user); // Inicia o temporizador de inatividade
    } else if (msg === '2' || msg.includes('problemas')) {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*\n\nCaso *não* estejamos *dentro do nosso horário de atendimento*, *entre em contato novamente* dentro do nosso horário de expediente que lhe *responderemos...*');
      notifyAdmin(client, from, user.nome, 'problemas com o veículo'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '3' || msg.includes('emergência')) {
      client.sendText(from, 'Lembre-se é de suma importância entrar imediatamente em contato com as autoridades competentes.\n\n*190 - Polícia Militar*\n*191 - PRF*\n*192 - SAMU*\n*193 - Bombeiros*\n\nPor favor, aguarde...\nVamos passar o seu contato para alguém do nosso time.');
      client.sendText(from, `*Atenção*\n\nO nosso horário de atendimento é de *Segunda à Domingo* de *7h às 21h*\n\nCaso *não* estejamos *dentro do nosso horário de atendimento*, *pode ligar* em caso de *emergência*`);
      notifyAdmin(client, from, user.nome, 'emergência'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '4' || msg.includes('atendente')) {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*\n\nCaso *não* estejamos *dentro do nosso horário de atendimento*, *entre em contato novamente* dentro do nosso horário de expediente que lhe *responderemos...*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> já é cliente'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '5' || msg.includes('encerrar')) {
      client.sendText(from, `Papa Tango Aluguel de Motos agradece o seu contato! Volte sempre ❤️🙏`);
      endSession(from, true); // Encerrar atendimento e reiniciar
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }
// ----------------------------------------------Etapa -> Futuro cliente-------------------------------------------------
  function handleStep5(client, from, msg, user) {
    if (msg === '1' || msg.includes('motos')) {
      client.sendText(from, 'Que maravilha 🤩\nSegue link do nosso catálogo:\n*https://wa.me/c/558592684035*\n\n*Você ficou interessado?*\n\nDigite a opção desejada:\n\n*1* - Sim\n*2* - Não');
      client.sendText(from, '*OBS*: Pode ser que a moto selecionada não esteja disponível, digite 1 para falar com um de nossos atendentes.');
      user.step = 6; // Envia para a etapa -> Escolher se precisa de mais ajuda ou não
      startInactivityTimer(client, from, user); // Inicia o temporizador de inatividade
    } else if (msg === '2' || msg.includes('anúncio')) {
      client.sendText(from, 'Que maravilha 🤩\n\nVamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*\n\nCaso *não* estejamos *dentro do nosso horário de atendimento*, *envie sua mensagem* que dentro do nosso expediente lhe *responderemos...*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> ainda não é cliente e está na etapa em que já tem o print do anúncio'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '3' || msg.includes('atendente')) {
      client.sendText(from, 'Que maravilha 🤩\n\nVamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*\n\nCaso *não* estejamos *dentro do nosso horário de atendimento*, *envie sua mensagem* que dentro do nosso expediente lhe *responderemos...*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> ainda não é cliente e escolheu falar com atendente'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    } 
  }
// -------------------------------Etapa -> (Precisa de mais ajuda || Encerrar atendimento)-------------------------------
  function handleStep6(client, from, msg, user) {
    if (msg === '1') {
      client.sendText(from, 'Vamos passar o seu contato para alguém do nosso time.\n\n*Por favor, aguarde...*\n\n*Atenção*\nO nosso horário de atendimento é *todos os dias* de *7h às 21h*\n\nCaso *não* estejamos *dentro do nosso horário de atendimento*, *entre em contato novamente* dentro do nosso horário de expediente que lhe *responderemos...*');
      notifyAdmin(client, from, user.nome, 'solicitou atendimento -> Já é cliente e está na etapa de pagamento da semana'); // Notificar o administrador
      endSession(from); // Encerrar atendimento
    } else if (msg === '2') {
      client.sendText(from, `Papa Tango - Aluguel de Motos agradece o seu contato!\n\nVolte sempre ❤️🙏`);
      endSession(from, true); // Encerrar atendimento e reiniciar
    } else {
      client.sendText(from, '*Por favor, digite uma opção válida.*');
    }
  }

  function endSession(from, restart = false) {
    if (userState[from].timer) {
      clearTimeout(userState[from].timer); // Cancela o temporizador se ele existir
    }
    if (restart) {
      userState[from] = { step: 0, nome: '', cpf: '', timer: null, paused: false, pauseTime: null }; // Reinicia o estado
    } else {
      delete userState[from];
      userState[from] = { step: 'paused' };
      userState[from].timer = setTimeout(() => {
        delete userState[from];
      }, 5 * 60 * 60 * 1000); // Após o bot enviar para o atendimento humano, ele ficará sem responder por 5h após isso, ele retornará a responder normalmente
    }
  }

  function notifyAdmin(client, from, userName, reason) {
    const adminNumber = '5585992010562@c.us'; // Substitua pelo seu número de telefone
    client.sendText(adminNumber, `(número: ${from}) precisa de mais ajuda devido a: ${reason}.`);
  }

  function startInactivityTimer(client, from, user) {
    if (user.timer) {
      clearTimeout(user.timer); // Cancela o temporizador anterior se existir
    }

    user.timer = setTimeout(() => {
      client.sendText(from, `Estamos encerrando o seu atendimento eletrônico por tempo de inatividade.\n\nCaso precise entre em contato novamente.\n\n*Papa Tango Aluguel de Motos agradece o seu contato! Volte sempre* ❤️🙏`);
      endSession(from);
    }, 10 * 60 * 1000); // 10 minutos em milissegundos
  }

  client.onMessage(async (message) => {
    const from = message.from;
    const msg = message.body.trim().toLowerCase();
    const quotedMsg = message.quotedMsg ? message.quotedMsg.body.trim().toLowerCase() : null;

    if (!userState[from]) {
      userState[from] = { step: 0, nome: '', cpf: '', timer: null, paused: false, pauseTime: null };
    }

    const user = userState[from];
//----------------------------------Etapa 0 = Início (Após enviar qualquer mensagem) ------------------------------------
    if (user.step === 0) {
      client.sendText(from, 'Olá! Eu sou o *Papaleguas*, seu atendente virtual. Seja bem vindo(a) a Papa Tango Aluguel de Motos! É um prazer ter você aqui 😁😍\n\nMe conta, você já é nosso cliente?\n*1* - Já sou cliente Papa Tango\n*2* - Quero consultar preços, catálogos e fazer parte da melhor empresa de locação de motos 😎');
      user.step = 2;
      startInactivityTimer(client, from, user);
//--------------------------------- Etapa 2 = Decisão if (Cliente || Futuro Cliente) ------------------------------------
    } else if (user.step === 2) {
      const closestOption = findClosestOption(2, msg) || (quotedMsg && findClosestOption(2, quotedMsg));
      optionHandler[2](client, from, closestOption, user);
    } else if (user.step === 3) {
      user.cpf = message.body;

      try {
        const customerData = await getCustomerData(user.cpf);

        if (customerData) {
          // Salva o nome do cliente retornado do banco
          user.nome = customerData.nome;

          // Pergunta ao usuário se ele confirma que é a pessoa encontrada
          client.sendText(from, `Localizamos o nome *${user.nome}* com o CPF informado.\n\nVocê confirma que é esta pessoa?\n\n*1* - Sim\n*2* - Não`);
          user.step = 'confirm_name'; // Nova etapa de confirmação
        } else {
          client.sendText(from, '*CPF/CNPJ não encontrado.*\n\nPor favor, digite corretamente seu *CPF/CNPJ* para continuar');
          startInactivityTimer(client, from, user);
        }
      } catch (error) {
        console.error(error);
        client.sendText(from, 'Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.');
      }
    } else if (user.step === 'confirm_name') {
      if (msg === '1' || msg.includes('sim')) {
        client.sendText(from, `Ótimo, *${user.nome}*! Vamos prosseguir com o atendimento.\n\nDigite uma das opções:\n\n*1* - Pagar semana\n*2* - Problemas com o veículo\n*3* - Emergência\n*4* - Falar com atendente\n*5* - Encerrar atendimento`);
        user.step = 4; // Próxima etapa
        startInactivityTimer(client, from, user);
      } else if (msg === '2' || msg.includes('não')) {
        client.sendText(from, 'Por favor, digite novamente seu CPF/CNPJ para buscarmos os dados corretos.');
        user.step = 3; // Retorna à etapa de entrada do CPF
        startInactivityTimer(client, from, user);
      } else {
        client.sendText(from, '*Por favor, digite uma opção válida.*\n\n*1* - Sim\n*2* - Não');
        startInactivityTimer(client, from, user);
      }

      //console.log('Dados do cliente retornados:', customerData);
      //console.log('Nome capturado:', customerData ? customerData.nome : 'Não encontrado');
    
// --------------------------------------------------Etapa -> Cliente----------------------------------------------------
    } else if (user.step === 4) {
      const closestOption = findClosestOption(4, msg) || (quotedMsg && findClosestOption(4, quotedMsg));
      optionHandler[4](client, from, closestOption, user);
// ----------------------------------------------Etapa -> Futuro cliente-------------------------------------------------
    } else if (user.step === 5) {
      const closestOption = findClosestOption(5, msg) || (quotedMsg && findClosestOption(5, quotedMsg));
      optionHandler[5](client, from, closestOption, user);
// -------------------------------Etapa -> (Precisa de mais ajuda || Encerrar atendimento)-------------------------------
    } else if (user.step === 6) {
      const closestOption = findClosestOption(6, msg) || (quotedMsg && findClosestOption(6, quotedMsg));
      optionHandler[6](client, from, closestOption, user);
    } // else if (user.step === 'paused') {
      //client.sendText(from, 'Atendimento encerrado. Para iniciar um novo atendimento, envie qualquer mensagem ❤️');
      //user.step = 0; // Reinicia o atendimento
    //}
  });
}