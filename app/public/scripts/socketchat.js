let socket = io.connect();
let localStream = new MediaStream()
let localPeerConnection, remotePeerConnection, x, y, remoteStream;
let globalVideo, globalStream, globalClose;
let REMOTE_CHAT_COUNT = 0;
let ESC_COUNT = 0;
let main_width;
let elem;
let camera_true = true;
let toolsIcons = {
  "camera": true,
  "audio": true,
  "phone": true,
  "fullscreen": true
}
let icontop;
let fff;
let FULL_SCREEN_BUTTON_CLICKED = false;
let ESC_BUTTON_PRESSED = false;
let screenSharedHeight;





$(window).load(function() {

  let video = $('#local-video');
  let width = 1 * window.innerWidth;
  main_width = width;
  let heightmain = window.outerHeight;
  let height = width;
  let left = window.innerWidth / 2 - width / 2;
  let top = window.outerHeight - window.innerHeight - 25;
  let sh = window.innerHeight - 81;
  icontop = heightmain - 74;
  elem = video.find('video')[0];
  elem.muted = true;
  x = top;
  y = height;
  let oldHeight;
  fff = height;

  // alertify
  alertify.defaults.glossary.title = 'video walls alert';

  // Setting toolobar
  setToolbar();

  $('#icons-tools').css({
    'width': .6*height
  });

  //Setting ends..
  $('#local-chat-arrow').css({
    'top': sh / 2 - 16
  });

  screenSharedHeight = sh;

  //FULL SCREEN MODE
  let globalClose = function() {
    socket.emit('remote-disconnected');
    if(localStream != undefined){
      localStream.stop();
    }
    if (remoteStream != undefined) {
      remoteStream.stop();
    }
    localPeerConnection = null;
    remotePeerConnection = null;
  };
  //FULL SCREEN MODE ENDS
  //REMOTE VIDEO STOP
  $(document).on('click', '#icons-tools div:eq(0)', function(e) {
    toggleFunction("camera", $(this), "main-camera-icon", "main-camera-icon-active");
    globalStream.getVideoTracks()[0].enabled = !(globalStream.getVideoTracks()[0].enabled);
  });
  //REMOTE VIDEO STOP ENDS
  //REMOTE AUDIO STOP
  $(document).on('click', '#icons-tools div:eq(1)', function(e) {
    toggleFunction("audio", $(this), "main-audio-icon", "main-audio-icon-active");
    localStream.getAudioTracks()[0].enabled = !(localStream.getAudioTracks()[0].enabled);
  });
  //REMOTE AUDIO STOP ENDS
  //4th Button is clicked
  $(document).on('click', '#icons-tools div:eq(4)', function(e) {
    toggleFunction("phone", $(this), "main-phone-drop-icon", ".main-phone-drop-icon-active");
    // console.log('drop call clicked!!');
    globalClose();

  });
  //4th button is clicked --ENDS
  video.find('video').css({
    'width': width
  });
  video.css({
    'width': width,
    'height': heightmain,
    'left': left,
    'bottom': 0
  });
  setUserName();
  let constraints = {
    video: true,
    audio: true
  };
  socket.on('available-for-offer', function() {
    console.log('Creating Offer!!!');
    console.log("LocalStream is " + localStream);
    createOffer(localStream);
    showBlackOverlay();
  });
  socket.on('available-for-answer', function(sdp) {
    // console.log('Creating Answer!!!!');
    createAnswer(localStream, sdp);
    showBlackOverlay();
  });
  socket.on('available-for-stream', function(sdp) {
    // console.log('In final stages...');
    localPeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  });
  socket.on('local-candidate-broadcast', function(candidate) {
    // console.log('Inside local-candidate-broadcast');
    remotePeerConnection.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    }));

  });

  socket.on('remote-candidate-broadcast', function(candidate) {
    // console.log('Inside remote-candidate-broadcast');
    localPeerConnection.addIceCandidate(new RTCIceCandidate({
      sdpMLineIndex: candidate.sdpMLineIndex,
      candidate: candidate.candidate
    }));
  });

  socket.on('users-final', function(data) {
    // console.log('User available for offer is ---> ' + JSON.stringify(data));
    $('#first-speaker').html(data[0]);
    $('#second-speaker').html('with ' + data[1]);
  });

  socket.on('disconnected-user-reset', function() {
    // console.log('Resetting!!');
    $('#second-speaker').empty();
    $('#first-speaker').html(socket.username);
    removeRemoteVideo();
  });
  socket.on('remote-candidate-disconnect', function() {
    removeRemoteVideo();
  });
  socket.on('remote-chat-data', function(data) {
    $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble">' + data + '</div></div></div></div>');
    animateChatData();
    incrementBuffer();
  });

  socket.on('different-remote-chat-data', function(file) {

    if (/image/.test(file.type)) {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><div class="file-progress-bar" style="width: 100%; background: none;"><a target="_blank" href="' + file.url + '" id="chat-image-data"><img src="' + file.thumbnailUrl + '" width="160" height="160" style="opacity: 1; display: flex; margin-top: 13px; margin-bottom: 13px;" /></a></div></div></div></div></div>');
    } else if (/video/.test(file.type)) {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><div class="file-progress-bar" style="width: 100%; background: none;"><a target="_blank" href="' + file.url + '" id="chat-video-data"><video src="' + file.url + '" controls="" style="width: 179px; opacity: 1; display: flex; margin-top: 13px; margin-bottom: 13px;"></video></a></div></div></div></div></div>');
    } else if (/audio/.test(file.type)) {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><a target="_blank" href="' + file.url + '"><audio src="' + file.url + '" controls="" style="width: 179px; opacity: 1; display: flex; margin-top: 13px; margin-bottom: 13px;"></audio></a></div></div></div></div>');
    } else {
      $('#second-section').append('<div id="remote-user-chat"><div id="remote-chat-data"><div id="remote-user-bubble"><div class="bubble"><div class="file-progress-bar" style="width: 100%; background: none;"><a target="_blank" href="' + file.url + '"><div id="file-name" style="opacity: 1; display: inline-block; color: rgb(0, 0, 0); padding: 10px 13px 9px;">' + file.name + '</div></a></div></div></div></div></div>');
    }
    animateChatData();
    incrementBuffer();

  });

  socket.on('checking-for-screen-share', function(key, users) {
    socket.key = key;
    socket.users = users;
  });

  socket.on('other-guy-screen-share-on', function() {
    socket.screenSharedByRemote = true;
  });

  socket.on('other-guy-screen-share-off', function() {
    socket.screenSharedByRemote = false;
    resetScreenShareByRemote();
  });
  //FUNCTIONS START
  function failure() {
    // console.log('Sorry...Could not get the video !!!');
    alertify.alert("Sorry...Could not get the video");
  }

  function success(stream) {
    //THESE VALUES WILL BE CHANGED!!!
    globalVideo = elem;
    globalStream = stream;
    //THESE VALUES WILL BE CHANGED!!!
    localStream = stream;
    //NEW CODE//
    if (window.URL) {
      elem.src = window.URL.createObjectURL(stream);
    } else {
      elem.src = stream;
    }
    //NEW CODE//
    window.xstream = stream;
    // console.log('Got Video!!');
    setTimeout(function() {
      // console.log("Check my stream");
      socket.emit('checked-stream', true);
    }, 1000);
    setTimeout(function() {
      $('#toolbar').fadeIn(200, function() {
        $('#sidebar-chat-right').animate({
          'height': sh
        }, 400, function() {
          $('#local-chat-arrow').show();
          $('#local-chat-arrow').addClass('zoomIn');
        });
      });
      let iconToolsHeight = 90;
      $('#icons-tools').clone().css({
        'background': 'rgba(42, 56, 143, 0.5)',
        'height': iconToolsHeight,
        'position': 'relative',
        'top': -iconToolsHeight,
        'z-index': -1
      }).empty().appendTo($('#toolbar'));
    }, 1000);
  }

  function getUser() {
    navigator.getUserMedia(constraints, success, failure);
  }



  function setUserName() {
    let userName = generateName();
    setTimeout(function() {
      getUser();
    }, 4000);
    $('#first-speaker').html(userName);
    socket.username = userName;
    socket.emit('username', userName);
  }

});

function addRemoteVideo(top, height, stream) {
  if (!socket.screenSharedByRemote && !socket.screenShared) {
    // console.log('INSIDE addRemoteVideo...width is ' + main_width);
    let left = (window.innerWidth - main_width) / 2 + 7;
    $('#remote-video').append($('#my-video'));
    $('#remote-video').find('video').eq(0).addClass('remote-video-right').css({
      'position': 'absolute',
      'height': 150,
      'width': 190,
      'left': left
    }).hide();
    $('#local-video').prepend('<video autoplay style="width: ' + main_width + '"></video>');
    $('#local-video').find('video')[0].src = stream;
    $('#remote-video').find('video')[0].play();
    globalVideo = $('#local-video').find('video')[0];
    setTimeout(function() {
      removeBlackOverlay();
      $('#remote-video').find('video').eq(0).show();
    }, 2000);
  } else if (socket.screenSharedByRemote) {
    //Other guy must have shared the screen..
    // console.log('NOW SHOWING OTHER PERSONS SCREEN AS HE HAS SHARED IT');
    globalVideo = $('#my-screen-share')[0];
    window.abc = stream;
    $('#my-screen-share').hide()[0].src = stream;
    $('#local-video video').hide();
    $('#screen-share').css({
      'height': screenSharedHeight
    });
    $('#my-screen-share').css({
      'position': 'relative',
      'height': 'auto',
      'width': main_width,
      'left': 0,
      'z-index': 0,
      'top': 0
    }).parent().css({
      'position': 'absolute',
      'top': 660 - screenSharedHeight
    }).prependTo('#local-video');
    $('#my-screen-share')[0].play();

    setTimeout(function() {
      removeBlackOverlay();
      $('#my-screen-share').show();
    }, 2000);
  }

}

function removeRemoteVideo() {
  if (!socket.screenShared) {
    // console.log('INSIDE removeRemoteVideo...width is ' + main_width);
    $('#local-video').find('video').remove();
    $('#local-video').prepend($('#remote-video').find('video').eq(0).removeClass('remote-video-right').css({
      'position': 'absolute',
      'height': 'auto',
      'width': main_width,
      'left': 0
    }));
    $('#remote-video').find('video').remove();
    $('#local-video').find('video')[0].play();
    globalVideo = $('#local-video').find('video')[0];
    globalStream = localStream;
    console.log('FUNCTION ENDED !!!!');
    REMOTE_VIDEO_ON = false;
  } else {
    //Screen must be shared by the user..
    $('#local-video').find('video').remove();
    $('#my-screen-share').hide();
    $('#screen-share').css({
      'height': screenSharedHeight
    });
    $('#my-screen-share').css({
      'position': 'relative',
      'height': 'auto',
      'width': main_width,
      'left': 0,
      'z-index': 0,
      'top': 0
    }).parent().css({
      'position': 'absolute',
      'left': 0,
      'top': 660 - screenSharedHeight,
      'width': 'initial'
    }).prependTo('#local-video');
    $('#my-screen-share').show().addClass('animated fadeInLeft');
    $('#my-screen-share')[0].play();
    globalVideo = $('#my-screen-share')[0];
    //NOW doing the first if condition things...
    $('#local-video').prepend($('#remote-video').find('video').eq(0).removeClass('remote-video-right').css({
      'position': 'absolute',
      'height': 'auto',
      'width': main_width,
      'left': 0
    }));
    $('#remote-video').find('video').remove();
    $('#local-video').find('video')[0].play();
    //ENDS--
    setTimeout(function() {
      socket.screenStream.stop();

    }, 1000);

  }


  // goes back to the previous screen
  setTimeout(function() {
    window.history.back();
  }, 2000);

}

//FUNCTIONS ENDS
//WEBRTC FUNCTIONS --- START
function createOffer(localStream) {
  // console.log('Inside createOffer()....');
  let isChrome = !!navigator.webkitGetUserMedia;

  let STUN = {
    url: isChrome ?
      'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
  };

  let iceServers = {
    iceServers: [STUN]
  };
  localPeerConnection = new RTCPeerConnection(iceServers);
  localPeerConnection.onicecandidate = gotLocalIceCandidate;
  localPeerConnection.onaddstream = gotLocalVideo;
  console.log(typeof(localStream));
  console.log("LocalStream is " + localStream);
  localPeerConnection.addStream(localStream);
  localPeerConnection.createOffer(gotLocalDescription, handleError);
  if (socket.screenSharedByRemote) {
    socket.localScreenPeerConnection = localPeerConnection;
  }
}

function gotLocalDescription(sdp) {
  // console.log('Inside gotLocalDescription()....');
  localPeerConnection.setLocalDescription(sdp);
  socket.emit('got-local-description', sdp);
}

function handleError() {
  // console.log('Some error has occured during createOffer()');
  alertify.alert('Some error has occured');
}

function gotLocalIceCandidate(event) {
  // console.log('Got Local Ice Candidate!!!');
  if (event.candidate != null) {
    // console.log(event.candidate);
    socket.emit('local-candidate', event.candidate);
  }
}

function gotLocalVideo(stream) {
  // console.log('Inside got LocalVideo!!');
  // console.log(stream);
  remoteStream = stream.stream;
  let objstream;
  //NEW CODE//
  if (window.URL) {
    objstream = window.URL.createObjectURL(stream.stream)
  } else {
    objstream = stream.stream;
  }
  //NEW CODE//
  addRemoteVideo(x, y, objstream);
  if (socket.screenSharedByRemote) {
    socket.remoteScreenStream = stream.stream;
  }
  //THESE VALUES WILL BE CHANGED!!!
  //globalStream = remoteStream;
  //THESE VALUES WILL BE CHANGED!!!
}

function createAnswer(localStream, sdp) {
  // console.log('Inside createAnswer()....');
  let isChrome = !!navigator.webkitGetUserMedia;

  let STUN = {
    url: isChrome ?
      'stun:stun.l.google.com:19302' : 'stun:23.21.150.121'
  };

  let TURN = {
    url: 'turn:homeo@turn.bistri.com:80',
    credential: 'homeo'
  };

  let iceServers = {
    iceServers: [STUN]
  };
  remotePeerConnection = new RTCPeerConnection(iceServers);
  remotePeerConnection.addStream(localStream);
  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.onaddstream = gotRemoteVideo;
  remotePeerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  remotePeerConnection.createAnswer(gotRemoteDescription, handleError);
  if (socket.screenSharedByRemote) {
    socket.remoteScreenPeerConnection = remotePeerConnection;
  }
}

function gotRemoteDescription(sdp) {
  // console.log('sdp is ' + sdp);
  remotePeerConnection.setLocalDescription(sdp);
  socket.emit('got-remote-description', sdp);
}

function gotRemoteIceCandidate(event) {
  // console.log('Got Remote Ice Candidate!!!');
  if (event.candidate != null) {
    // console.log(event.candidate);
    socket.emit('remote-candidate', event.candidate);
  }

}

function gotRemoteVideo(stream) {
  // console.log('Inside got RemoteVideo!!');
  // console.log(stream);
  remoteStream = stream.stream;
  //NEW CODE//
  if (window.URL) {
    objstream = window.URL.createObjectURL(stream.stream)
  } else {
    objstream = stream.stream;
  }
  //NEW CODE//
  addRemoteVideo(x, y, objstream);
  if (socket.screenSharedByRemote) {
    socket.remoteScreenStream = stream.stream;
  }
  //THESE VALUES WILL BE CHANGED!!!
  //THESE VALUES WILL BE CHANGED!!!
}

//WEBRTC FUNCTIONS --- START

//CHAT FUNCTIONALITY ---START

function animateChatData() {
  $('#second-section').scrollTop(oldHeight);
  oldHeight = oldHeight + 270;
}

function recursiveAnimateChatData() {
  $('#second-section').scrollTop(oldHeight);
}

function incrementBuffer() {
  REMOTE_CHAT_COUNT++;
  $('#local-chat-arrow').html('<span id="super-chat-count">' + REMOTE_CHAT_COUNT + '</span>');
  if (REMOTE_CHAT_COUNT === 1) {
    $('#local-chat-arrow').find('#super-chat-count').addClass('shake animated');
    $('#local-chat-arrow').find('#super-chat-count').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
      $(this).removeClass();
    });
  }
  // console.log('Incremented...REMOTE_CHAT_COUNT is-->' + REMOTE_CHAT_COUNT);
}


function toggleFunction(name, elem, first, second) {
  if (toolsIcons[name]) {
    elem.removeClass();
    elem.addClass(second);
    toolsIcons[name] = !toolsIcons[name];
  } else {
    elem.removeClass();
    elem.addClass(first);
    toolsIcons[name] = !toolsIcons[name];
  }
}


function setToolbar() {
  // console.log('Called setToolbar');
  $('#toolbar').css({
    'position': 'relative',
    'top': icontop,
    'width': 'initial'
  });
}



function exitFullscreen() {
  // console.log('exitFullscreen called !');
  FULL_SCREEN_BUTTON_CLICKED = true;
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }

}
//CHAT FUNCTIONALITY ---ENDS

//CHECKING IF SCREEN

function resetScreenShareByRemote() {
  socket.remoteScreenStream.stop();
  socket.localScreenPeerConnection = null;
  socket.remoteScreenPeerConnection = null;
  socket.remoteScreenStream = null;
  let hide = $('#screen-share').find('#my-screen-share').hide();
  hide[0].src = '';
  hide.parent().appendTo('body');
  globalVideo = elem;
  $('#local-video video').show().removeClass('animated fadeInLeft').addClass('animated fadeInLeft');
  resetLocalShareScreenDiv();
}

function resetLocalShareScreenDiv() {
  $('#screen-share').css({
    'position': 'initial',
    'height': 'initial',
    'width': 'initial',
    'left': 'initial',
    'top': 'initial'
  });

  $('#screen-share').find('#my-screen-share').css({
    'display': 'initial',
    'position': 'initial',
    'height': 'initial',
    'width': 'initial',
    'z-index': 'initial'
  });
}


// joeydash included function
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function generateName() {
  let name_list = ["abandoned","able","absolute","adorable","adventurous","academic","acceptable","acclaimed","accomplished","accurate","aching","acidic","acrobatic","active","actual","adept","admirable","admired","adolescent","adorable","adored","advanced","afraid","affectionate","aged","aggravating","aggressive","agile","agitated","agonizing","agreeable","ajar","alarmed","alarming","alert","alienated","alive","all","altruistic","amazing","ambitious","ample","amused","amusing","anchored","ancient","angelic","angry","anguished","animated","annual","another","antique","anxious","any","apprehensive","appropriate","apt","arctic","arid","aromatic","artistic","ashamed","assured","astonishing","athletic","attached","attentive","attractive","austere","authentic","authorized","automatic","avaricious","average","aware","awesome","awful","awkward","babyish","bad","back","baggy","bare","barren","basic","beautiful","belated","beloved","beneficial","better","best","bewitched","big","big-hearted","biodegradable","bite-sized","bitter","black","black-and-white","bland","blank","blaring","bleak","blind","blissful","blond","blue","blushing","bogus","boiling","bold","bony","boring","bossy","both","bouncy","bountiful","bowed","brave","breakable","brief","bright","brilliant","brisk","broken","bronze","brown","bruised","bubbly","bulky","bumpy","buoyant","burdensome","burly","bustling","busy","buttery","buzzing","calculating","calm","candid","canine","capital","carefree","careful","careless","caring","cautious","cavernous","celebrated","charming","cheap","cheerful","cheery","chief","chilly","chubby","circular","classic","clean","clear","clear-cut","clever","close","closed","cloudy","clueless","clumsy","cluttered","coarse","cold","colorful","colorless","colossal","comfortable","common","compassionate","competent","complete","complex","complicated","composed","concerned","concrete","confused","conscious","considerate","constant","content","conventional","cooked","cool","cooperative","coordinated","corny","corrupt","costly","courageous","courteous","crafty","crazy","creamy","creative","creepy","criminal","crisp","critical","crooked","crowded","cruel","crushing","cuddly","cultivated","cultured","cumbersome","curly","curvy","cute","cylindrical","damaged","damp","dangerous","dapper","daring","darling","dark","dazzling","dead","deadly","deafening","dear","dearest","decent","decimal","decisive","deep","defenseless","defensive","defiant","deficient","definite","definitive","delayed","delectable","delicious","delightful","delirious","demanding","dense","dental","dependable","dependent","descriptive","deserted","detailed","determined","devoted","different","difficult","digital","diligent","dim","dimpled","dimwitted","direct","disastrous","discrete","disfigured","disgusting","disloyal","dismal","distant","downright","dreary","dirty","disguised","dishonest","dismal","distant","distinct","distorted","dizzy","dopey","doting","double","downright","drab","drafty","dramatic","dreary","droopy","dry","dual","dull","dutiful","each","eager","earnest","early","easy","easy-going","ecstatic","edible","educated","elaborate","elastic","elated","elderly","electric","elegant","elementary","elliptical","embarrassed","embellished","eminent","emotional","empty","enchanted","enchanting","energetic","enlightened","enormous","enraged","entire","envious","equal","equatorial","essential","esteemed","ethical","euphoric","even","evergreen","everlasting","every","evil","exalted","excellent","exemplary","exhausted","excitable","excited","exciting","exotic","expensive","experienced","expert","extraneous","extroverted","extra-large","extra-small","fabulous","failing","faint","fair","faithful","fake","false","familiar","famous","fancy","fantastic","far","faraway","far-flung","far-off","fast","fat","fatal","fatherly","favorable","favorite","fearful","fearless","feisty","feline","female","feminine","few","fickle","filthy","fine","finished","firm","first","firsthand","fitting","fixed","flaky","flamboyant","flashy","flat","flawed","flawless","flickering","flimsy","flippant","flowery","fluffy","fluid","flustered","focused","fond","foolhardy","foolish","forceful","forked","formal","forsaken","forthright","fortunate","fragrant","frail","frank","frayed","free","French","fresh","frequent","friendly","frightened","frightening","frigid","frilly","frizzy","frivolous","front","frosty","frozen","frugal","fruitful","full","fumbling","functional","funny","fussy","fuzzy","gargantuan","gaseous","general","generous","gentle","genuine","giant","giddy","gigantic","gifted","giving","glamorous","glaring","glass","gleaming","gleeful","glistening","glittering","gloomy","glorious","glossy","glum","golden","good","good-natured","gorgeous","graceful","gracious","grand","grandiose","granular","grateful","grave","gray","great","greedy","green","gregarious","grim","grimy","gripping","grizzled","gross","grotesque","grouchy","grounded","growing","growling","grown","grubby","gruesome","grumpy","guilty","gullible","gummy","hairy","half","handmade","handsome","handy","happy","happy-go-lucky","hard","hard-to-find","harmful","harmless","harmonious","harsh","hasty","hateful","haunting","healthy","heartfelt","hearty","heavenly","heavy","hefty","helpful","helpless","hidden","hideous","high","high-level","hilarious","hoarse","hollow","homely","honest","honorable","honored","hopeful","horrible","hospitable","hot","huge","humble","humiliating","humming","humongous","hungry","hurtful","husky","icky","icy","ideal","idealistic","identical","idle","idiotic","idolized","ignorant","ill","illegal","ill-fated","ill-informed","illiterate","illustrious","imaginary","imaginative","immaculate","immaterial","immediate","immense","impassioned","impeccable","impartial","imperfect","imperturbable","impish","impolite","important","impossible","impractical","impressionable","impressive","improbable","impure","inborn","incomparable","incompatible","incomplete","inconsequential","incredible","indelible","inexperienced","indolent","infamous","infantile","infatuated","inferior","infinite","informal","innocent","insecure","insidious","insignificant","insistent","instructive","insubstantial","intelligent","intent","intentional","interesting","internal","international","intrepid","ironclad","irresponsible","irritating","itchy","jaded","jagged","jam-packed","jaunty","jealous","jittery","joint","jolly","jovial","joyful","joyous","jubilant","judicious","juicy","jumbo","junior","jumpy","juvenile","kaleidoscopic","keen","key","kind","kindhearted","kindly","klutzy","knobby","knotty","knowledgeable","knowing","known","kooky","kosher","lame","lanky","large","last","lasting","late","lavish","lawful","lazy","leading","lean","leafy","left","legal","legitimate","light","lighthearted","likable","likely","limited","limp","limping","linear","lined","liquid","little","live","lively","livid","loathsome","lone","lonely","long","long-term","loose","lopsided","lost","loud","lovable","lovely","loving","low","loyal","lucky","lumbering","luminous","lumpy","lustrous","luxurious","mad","made-up","magnificent","majestic","major","male","mammoth","married","marvelous","masculine","massive","mature","meager","mealy","mean","measly","meaty","medical","mediocre","medium","meek","mellow","melodic","memorable","menacing","merry","messy","metallic","mild","milky","mindless","miniature","minor","minty","miserable","miserly","misguided","misty","mixed","modern","modest","moist","monstrous","monthly","monumental","moral","mortified","motherly","motionless","mountainous","muddy","muffled","multicolored","mundane","murky","mushy","musty","muted","mysterious","naive","narrow","nasty","natural","naughty","nautical","near","neat","necessary","needy","negative","neglected","negligible","neighboring","nervous","new","next","nice","nifty","nimble","nippy","nocturnal","noisy","nonstop","normal","notable","noted","noteworthy","novel","noxious","numb","nutritious","nutty","obedient","obese","oblong","oily","oblong","obvious","occasional","odd","oddball","offbeat","offensive","official","old","old-fashioned","only","open","optimal","optimistic","opulent","orange","orderly","organic","ornate","ornery","ordinary","original","other","our","outlying","outgoing","outlandish","outrageous","outstanding","oval","overcooked","overdue","overjoyed","overlooked","palatable","pale","paltry","parallel","parched","partial","passionate","past","pastel","peaceful","peppery","perfect","perfumed","periodic","perky","personal","pertinent","pesky","pessimistic","petty","phony","physical","piercing","pink","pitiful","plain","plaintive","plastic","playful","pleasant","pleased","pleasing","plump","plush","polished","polite","political","pointed","pointless","poised","poor","popular","portly","posh","positive","possible","potable","powerful","powerless","practical","precious","present","prestigious","pretty","precious","previous","pricey","prickly","primary","prime","pristine","private","prize","probable","productive","profitable","profuse","proper","proud","prudent","punctual","pungent","puny","pure","purple","pushy","putrid","puzzled","puzzling","quaint","qualified","quarrelsome","quarterly","queasy","querulous","questionable","quick","quick-witted","quiet","quintessential","quirky","quixotic","quizzical","radiant","ragged","rapid","rare","rash","raw","recent","reckless","rectangular","ready","real","realistic","reasonable","red","reflecting","regal","regular","reliable","relieved","remarkable","remorseful","remote","repentant","required","respectful","responsible","repulsive","revolving","rewarding","rich","rigid","right","ringed","ripe","roasted","robust","rosy","rotating","rotten","rough","round","rowdy","royal","rubbery","rundown","ruddy","rude","runny","rural","rusty","sad","safe","salty","same","sandy","sane","sarcastic","sardonic","satisfied","scaly","scarce","scared","scary","scented","scholarly","scientific","scornful","scratchy","scrawny","second","secondary","second-hand","secret","self-assured","self-reliant","selfish","sentimental","separate","serene","serious","serpentine","several","severe","shabby","shadowy","shady","shallow","shameful","shameless","sharp","shimmering","shiny","shocked","shocking","shoddy","short","short-term","showy","shrill","shy","sick","silent","silky","silly","silver","similar","simple","simplistic","sinful","single","sizzling","skeletal","skinny","sleepy","slight","slim","slimy","slippery","slow","slushy","small","smart","smoggy","smooth","smug","snappy","snarling","sneaky","sniveling","snoopy","sociable","soft","soggy","solid","somber","some","spherical","sophisticated","sore","sorrowful","soulful","soupy","sour","Spanish","sparkling","sparse","specific","spectacular","speedy","spicy","spiffy","spirited","spiteful","splendid","spotless","spotted","spry","square","squeaky","squiggly","stable","staid","stained","stale","standard","starchy","stark","starry","steep","sticky","stiff","stimulating","stingy","stormy","straight","strange","steel","strict","strident","striking","striped","strong","studious","stunning","stupendous","stupid","sturdy","stylish","subdued","submissive","substantial","subtle","suburban","sudden","sugary","sunny","super","superb","superficial","superior","supportive","sure-footed","surprised","suspicious","svelte","sweaty","sweet","sweltering","swift","sympathetic","tall","talkative","tame","tan","tangible","tart","tasty","tattered","taut","tedious","teeming","tempting","tender","tense","tepid","terrible","terrific","testy","thankful","that","these","thick","thin","third","thirsty","this","thorough","thorny","those","thoughtful","threadbare","thrifty","thunderous","tidy","tight","timely","tinted","tiny","tired","torn","total","tough","traumatic","treasured","tremendous","tragic","trained","tremendous","triangular","tricky","trifling","trim","trivial","troubled","true","trusting","trustworthy","trusty","truthful","tubby","turbulent","twin","ugly","ultimate","unacceptable","unaware","uncomfortable","uncommon","unconscious","understated","unequaled","uneven","unfinished","unfit","unfolded","unfortunate","unhappy","unhealthy","uniform","unimportant","unique","united","unkempt","unknown","unlawful","unlined","unlucky","unnatural","unpleasant","unrealistic","unripe","unruly","unselfish","unsightly","unsteady","unsung","untidy","untimely","untried","untrue","unused","unusual","unwelcome","unwieldy","unwilling","unwitting","unwritten","upbeat","upright","upset","urban","usable","used","useful","useless","utilized","utter","vacant","vague","vain","valid","valuable","vapid","variable","vast","velvety","venerated","vengeful","verifiable","vibrant","vicious","victorious","vigilant","vigorous","villainous","violet","violent","virtual","virtuous","visible","vital","vivacious","vivid","voluminous","wan","warlike","warm","warmhearted","warped","wary","wasteful","watchful","waterlogged","watery","wavy","wealthy","weak","weary","webbed","wee","weekly","weepy","weighty","weird","welcome","well-documented","well-groomed","well-informed","well-lit","well-made","well-off","well-to-do","well-worn","wet","which","whimsical","whirlwind","whispered","white","whole","whopping","wicked","wide","wide-eyed","wiggly","wild","willing","wilted","winding","windy","winged","wiry","wise","witty","wobbly","woeful","wonderful","wooden","woozy","wordy","worldly","worn","worried","worrisome","worse","worst","worthless","worthwhile","worthy","wrathful","wretched","writhing","wrong","wry","yawning","yearly","yellow","yellowish","young","youthful","yummy","zany","zealous","zesty","zigzag","rocky","people","history","way","art","world","information","map","family","government","health","system","computer","meat","year","thanks","music","person","reading","method","data","food","understanding","theory","law","bird","literature","problem","software","control","knowledge","power","ability","economics","love","internet","television","science","library","nature","fact","product","idea","temperature","investment","area","society","activity","story","industry","media","thing","oven","community","definition","safety","quality","development","language","management","player","variety","video","week","security","country","exam","movie","organization","equipment","physics","analysis","policy","series","thought","basis","boyfriend","direction","strategy","technology","army","camera","freedom","paper","environment","child","instance","month","truth","marketing","university","writing","article","department","difference","goal","news","audience","fishing","growth","income","marriage","user","combination","failure","meaning","medicine","philosophy","teacher","communication","night","chemistry","disease","disk","energy","nation","road","role","soup","advertising","location","success","addition","apartment","education","math","moment","painting","politics","attention","decision","event","property","shopping","student","wood","competition","distribution","entertainment","office","population","president","unit","category","cigarette","context","introduction","opportunity","performance","driver","flight","length","magazine","newspaper","relationship","teaching","cell","dealer","debate","finding","lake","member","message","phone","scene","appearance","association","concept","customer","death","discussion","housing","inflation","insurance","mood","woman","advice","blood","effort","expression","importance","opinion","payment","reality","responsibility","situation","skill","statement","wealth","application","city","county","depth","estate","foundation","grandmother","heart","perspective","photo","recipe","studio","topic","collection","depression","imagination","passion","percentage","resource","setting","ad","agency","college","connection","criticism","debt","description","memory","patience","secretary","solution","administration","aspect","attitude","director","personality","psychology","recommendation","response","selection","storage","version","alcohol","argument","complaint","contract","emphasis","highway","loss","membership","possession","preparation","steak","union","agreement","cancer","currency","employment","engineering","entry","interaction","limit","mixture","preference","region","republic","seat","tradition","virus","actor","classroom","delivery","device","difficulty","drama","election","engine","football","guidance","hotel","match","owner","priority","protection","suggestion","tension","variation","anxiety","atmosphere","awareness","bread","climate","comparison","confusion","construction","elevator","emotion","employee","employer","guest","height","leadership","mall","manager","operation","recording","respect","sample","transportation","boring","charity","cousin","disaster","editor","efficiency","excitement","extent","feedback","guitar","homework","leader","mom","outcome","permission","presentation","promotion","reflection","refrigerator","resolution","revenue","session","singer","tennis","basket","bonus","cabinet","childhood","church","clothes","coffee","dinner","drawing","hair","hearing","initiative","judgment","lab","measurement","mode","mud","orange","poetry","police","possibility","procedure","queen","ratio","relation","restaurant","satisfaction","sector","signature","significance","song","tooth","town","vehicle","volume","wife","accident","airport","appointment","arrival","assumption","baseball","chapter","committee","conversation","database","enthusiasm","error","explanation","farmer","gate","girl","hall","historian","hospital","injury","instruction","maintenance","manufacturer","meal","perception","pie","poem","presence","proposal","reception","replacement","revolution","river","son","speech","tea","village","warning","winner","worker","writer","assistance","breath","buyer","chest","chocolate","conclusion","contribution","cookie","courage","desk","drawer","establishment","examination","garbage","grocery","honey","impression","improvement","independence","insect","inspection","inspector","king","ladder","menu","penalty","piano","potato","profession","professor","quantity","reaction","requirement","salad","sister","supermarket","tongue","weakness","wedding","affair","ambition","analyst","apple","assignment","assistant","bathroom","bedroom","beer","birthday","celebration","championship","cheek","client","consequence","departure","diamond","dirt","ear","fortune","friendship","funeral","gene","girlfriend","hat","indication","intention","lady","midnight","negotiation","obligation","passenger","pizza","platform","poet","pollution","recognition","reputation","shirt","speaker","stranger","surgery","sympathy","tale","throat","trainer","uncle","youth","time","work","film","water","money","example","while","business","study","game","life","form","air","day","place","number","part","field","fish","back","process","heat","hand","experience","job","book","end","point","type","home","economy","value","body","market","guide","interest","state","radio","course","company","price","size","card","list","mind","trade","line","care","group","risk","word","fat","force","key","light","training","name","school","top","amount","level","order","practice","research","sense","service","piece","web","boss","sport","fun","house","page","term","test","answer","sound","focus","matter","kind","soil","board","oil","picture","access","garden","range","rate","reason","future","site","demand","exercise","image","case","cause","coast","action","age","bad","boat","record","result","section","building","mouse","cash","class","period","plan","store","tax","side","subject","space","rule","stock","weather","chance","figure","man","model","source","beginning","earth","program","chicken","design","feature","head","material","purpose","question","rock","salt","act","birth","car","dog","object","scale","sun","note","profit","rent","speed","style","war","bank","craft","half","inside","outside","standard","bus","exchange","eye","fire","position","pressure","stress","advantage","benefit","box","frame","issue","step","cycle","face","item","metal","paint","review","room","screen","structure","view","account","ball","discipline","medium","share","balance","bit","black","bottom","choice","gift","impact","machine","shape","tool","wind","address","average","career","culture","morning","pot","sign","table","task","condition","contact","credit","egg","hope","ice","network","north","square","attempt","date","effect","link","post","star","voice","capital","challenge","friend","self","shot","brush","couple","exit","front","function","lack","living","plant","plastic","spot","summer","taste","theme","track","wing","brain","button","click","desire","foot","gas","influence","notice","rain","wall","base","damage","distance","feeling","pair","savings","staff","sugar","target","text","animal","author","budget","discount","file","ground","lesson","minute","officer","phase","reference","register","sky","stage","stick","title","trouble","bowl","bridge","campaign","character","club","edge","evidence","fan","letter","lock","maximum","novel","option","pack","park","quarter","skin","sort","weight","baby","background","carry","dish","factor","fruit","glass","joint","master","muscle","red","strength","traffic","trip","vegetable","appeal","chart","gear","ideal","kitchen","land","log","mother","net","party","principle","relative","sale","season","signal","spirit","street","tree","wave","belt","bench","commission","copy","drop","minimum","path","progress","project","sea","south","status","stuff","ticket","tour","angle","blue","breakfast","confidence","daughter","degree","doctor","dot","dream","duty","essay","father","fee","finance","hour","juice","luck","milk","mouth","peace","pipe","stable","storm","substance","team","trick","afternoon","bat","beach","blank","catch","chain","consideration","cream","crew","detail","gold","interview","kid","mark","mission","pain","pleasure","score","screw","sex","shop","shower","suit","tone","window","agent","band","bath","block","bone","calendar","candidate","cap","coat","contest","corner","court","cup","district","door","east","finger","garage","guarantee","hole","hook","implement","layer","lecture","lie","manner","meeting","nose","parking","partner","profile","rice","routine","schedule","swimming","telephone","tip","winter","airline","bag","battle","bed","bill","bother","cake","code","curve","designer","dimension","dress","ease","emergency","evening","extension","farm","fight","gap","grade","holiday","horror","horse","host","husband","loan","mistake","mountain","nail","noise","occasion","package","patient","pause","phrase","proof","race","relief","sand","sentence","shoulder","smoke","stomach","string","tourist","towel","vacation","west","wheel","wine","arm","aside","associate","bet","blow","border","branch","breast","brother","buddy","bunch","chip","coach","cross","document","draft","dust","expert","floor","god","golf","habit","iron","judge","knife","landscape","league","mail","mess","native","opening","parent","pattern","pin","pool","pound","request","salary","shame","shelter","shoe","silver","tackle","tank","trust","assist","bake","bar","bell","bike","blame","boy","brick","chair","closet","clue","collar","comment","conference","devil","diet","fear","fuel","glove","jacket","lunch","monitor","mortgage","nurse","pace","panic","peak","plane","reward","row","sandwich","shock","spite","spray","surprise","till","transition","weekend","welcome","yard","alarm","bend","bicycle","bite","blind","bottle","cable","candle","clerk","cloud","concert","counter","flower","grandfather","harm","knee","lawyer","leather","load","mirror","neck","pension","plate","purple","ruin","ship","skirt","slice","snow","specialist","stroke","switch","trash","tune","zone","anger","award","bid","bitter","boot","bug","camp","candy","carpet","cat","champion","channel","clock","comfort","cow","crack","engineer","entrance","fault","grass","guy","hell","highlight","incident","island","joke","jury","leg","lip","mate","motor","nerve","passage","pen","pride","priest","prize","promise","resident","resort","ring","roof","rope","sail","scheme","script","sock","station","toe","tower","truck","witness","can","will","other","use","make","good","look","help","go","great","being","still","public","read","keep","start","give","human","local","general","specific","long","play","feel","high","put","common","set","change","simple","past","big","possible","particular","major","personal","current","national","cut","natural","physical","show","try","check","second","call","move","pay","let","increase","single","individual","turn","ask","buy","guard","hold","main","offer","potential","professional","international","travel","cook","alternative","special","working","whole","dance","excuse","cold","commercial","low","purchase","deal","primary","worth","fall","necessary","positive","produce","search","present","spend","talk","creative","tell","cost","drive","green","support","glad","remove","return","run","complex","due","effective","middle","regular","reserve","independent","leave","original","reach","rest","serve","watch","beautiful","charge","active","break","negative","safe","stay","visit","visual","affect","cover","report","rise","walk","white","junior","pick","unique","classic","final","lift","mix","private","stop","teach","western","concern","familiar","fly","official","broad","comfortable","gain","rich","save","stand","young","heavy","lead","listen","valuable","worry","handle","leading","meet","release","sell","finish","normal","press","ride","secret","spread","spring","tough","wait","brown","deep","display","flow","hit","objective","shoot","touch","cancel","chemical","cry","dump","extreme","push","conflict","eat","fill","formal","jump","kick","opposite","pass","pitch","remote","total","treat","vast","abuse","beat","burn","deposit","print","raise","sleep","somewhere","advance","consist","dark","double","draw","equal","fix","hire","internal","join","kill","sensitive","tap","win","attack","claim","constant","drag","drink","guess","minor","pull","raw","soft","solid","wear","weird","wonder","annual","count","dead","doubt","feed","forever","impress","repeat","round","sing","slide","strip","wish","combine","command","dig","divide","equivalent","hang","hunt","initial","march","mention","spiritual","survey","tie","adult","brief","crazy","escape","gather","hate","prior","repair","rough","sad","scratch","sick","strike","employ","external","hurt","illegal","laugh","lay","mobile","nasty","ordinary","respond","royal","senior","split","strain","struggle","swim","train","upper","wash","yellow","convert","crash","dependent","fold","funny","grab","hide","miss","permit","quote","recover","resolve","roll","sink","slip","spare","suspect","sweet","swing","twist","upstairs","usual","abroad","brave","calm","concentrate","estimate","grand","male","mine","prompt","quiet","refuse","regret","reveal","rush","shake","shift","shine","steal","suck","surround","bear","brilliant","dare","dear","delay","drunk","female","hurry","inevitable","invite","kiss","neat","pop","punch","quit","reply","representative","resist","rip","rub","silly","smile","spell","stretch","stupid","tear","temporary","tomorrow","wake","wrap","yesterday","Thomas","Tom","Lieuwe"];
  let name = name_list[getRandomInt(0, name_list.length + 1)];
  return name;
}
