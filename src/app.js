/* Boxophone — keyboard, touch, MIDI, recording, and practice UI. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const notes=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
  const noteName=n=>notes[n%12]+(Math.floor(n/12)-1);
  // A–G always play natural notes within the selected octave (C4 = middle C).
  const naturalKeySemitones={KeyC:0,KeyD:2,KeyE:4,KeyF:5,KeyG:7,KeyA:9,KeyB:11};
  const minComputerOctave=1, maxComputerOctave=7;
  const songs={
    twinkle:[60,60,67,67,69,69,67,65,65,64,64,62,62,60,67,67,65,65,64,64,62,67,67,65,65,64,64,62,60,60,67,67,69,69,67],
    ode:[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60],
    frere:[60,62,64,60,60,62,64,60,64,65,67,64,65,67,67,69,67,65,64,60,67,69,67,65,64,60,60,55,60,60,55,60]
  };
  const engine=new window.BoxophoneAudio();
  const recorder=new window.BoxophoneMidiRecorder();
  let octaveBase=4;
  // Only instruments with production-ready timbres may be selected.
  const availableInstruments=new Set(['piano']);
  let instrument='piano';
  const held=new Map(); // unique physical input IDs => MIDI note
  const velocities=new Map(); // original velocity per input, for mono expression
  const active=new Set(); // currently audible notes
  const sustainedBy=new Set();
  const pointerNotes=new Map();
  const codeNotes=new Map();
  let midi=null;
  let demoTimers=[];
  let demoPlaying=false;
  let practice=null;
  let timerInterval=null;
  let lastNote=null;
  const activeKeys=()=>[...held.values()];
  const sustainOn=()=>sustainedBy.size>0;
  const track=(name,parameters={})=>{if(typeof window.gtag==='function'&&window.BoxophoneAnalyticsAllowed===true)window.gtag('event',name,parameters);};

  function status(text){$('audioStatus').textContent=text;}
  function updateKeyHighlights(){
    const playing=new Set([...active,...held.values()]);
    for(const el of $('keybed').querySelectorAll('[data-note]'))el.classList.toggle('active',playing.has(Number(el.dataset.note)));
  }
  function showNote(note){
    lastNote=note;
    $('noteDisplay').textContent=noteName(note);
    const hz=440*Math.pow(2,(note-69)/12);
    $('noteFrequency').textContent=Math.round(hz*10)/10+' Hz  ·  '+(instrument==='piano'?'Piano':instrument==='violin'?'Violin':'Alto saxophone');
    status('Audio ready');
  }
  async function soundNote(note,velocity){
    try{await engine.unlock();
      if(!active.has(note) || (!held.size&&!sustainOn())) return;
      engine.noteOn(note,velocity);
    }catch(err){status(err.message);}
  }
  function playActive(note,velocity){
    if(active.has(note))return;
    active.add(note);
    recorder.noteOn(note,velocity);
    soundNote(note,velocity);
  }
  function stopActive(note){
    if(!active.has(note))return;
    active.delete(note);engine.noteOff(note);recorder.noteOff(note);
  }
  function updateMono(){
    if(instrument==='piano')return;
    const values=activeKeys();
    const target=values.at(-1);
    if(target===undefined){if(!sustainOn())for(const n of [...active])stopActive(n);return;}
    for(const n of [...active])if(n!==target)stopActive(n);
    if(!active.has(target)){const lastSource=[...held.keys()].at(-1);playActive(target,velocities.get(lastSource)||100);}
  }
  function noteOn(note,velocity=100,source='unknown'){
    if(!Number.isInteger(note)||note<21||note>127)return;
    if(held.has(source))noteOff(held.get(source),source);
    held.set(source,note);velocities.set(source,velocity);
    if(instrument==='piano')playActive(note,velocity);
    else updateMono();
    showNote(note);
    if(!source.startsWith('demo:'))onPracticeNote(note);
    updateKeyHighlights();
  }
  function noteOff(_note,source){
    if(!held.has(source))return;
    const note=held.get(source);held.delete(source);velocities.delete(source);
    if(instrument==='piano'){
      if(!activeKeys().includes(note)&&!sustainOn())stopActive(note);
    }else updateMono();
    updateKeyHighlights();
  }
  function sustain(source,enable){
    if(enable)sustainedBy.add(source);else sustainedBy.delete(source);
    const isOn=sustainOn();
    $('sustainBtn').setAttribute('aria-pressed',String(isOn));
    $('sustainState').textContent=isOn?'On':'Off';
    recorder.sustain(isOn);
    if(!isOn){
      if(instrument==='piano'){for(const n of [...active])if(!activeKeys().includes(n))stopActive(n);}
      else updateMono();
    }
    updateKeyHighlights();
  }
  function stopDemo(){demoTimers.forEach(clearTimeout);demoTimers=[];demoPlaying=false;$('demoBtn').textContent='♪ Hear a demo';for(const source of [...held.keys()])if(source.startsWith('demo:'))noteOff(held.get(source),source);}
  function allOff(){stopDemo();if(sustainOn())recorder.sustain(false);held.clear();velocities.clear();pointerNotes.clear();codeNotes.clear();sustainedBy.clear();for(const n of [...active])stopActive(n);engine.allNotesOff();$('sustainBtn').setAttribute('aria-pressed','false');$('sustainState').textContent='Off';updateKeyHighlights();}
  function setInstrument(name){
    if(!availableInstruments.has(name)||name===instrument)return;
    allOff();instrument=name;engine.setInstrument(name);
    recorder.setInstrument(name);
    document.querySelectorAll('.instrument').forEach(btn=>{const current=btn.dataset.instrument===name;btn.classList.toggle('active',current);btn.setAttribute('aria-pressed',String(current));});
    if(lastNote!==null)$('noteFrequency').textContent=(instrument==='piano'?'Piano':instrument==='violin'?'Violin':'Alto saxophone')+' selected';
    track('instrument_change',{instrument:name});
  }
  function renderKeyboard(){
    const el=$('keybed');el.replaceChildren();
    const first=12*(octaveBase+1), compact=window.matchMedia('(max-width:680px)').matches;
    const nkeys=compact?13:25, whiteCount=compact?8:15;
    const whites=[],blacks=[];
    let wi=0;
    for(let i=0;i<nkeys;i++){
      const note=first+i;
      const black=[1,3,6,8,10].includes(note%12);
      if(!black) {
        const x=wi*100/whiteCount;
        whites.push({note,i,x,width:100/whiteCount});wi++;
      } else {const bw=100/whiteCount*.63;blacks.push({note,i,x:(wi*100/whiteCount)-bw/2,width:bw});}
    }
    for(const k of [...whites,...blacks]){
      const b=document.createElement('button');
      b.className='key '+(blacks.includes(k)?'black':'white');
      b.type='button';b.style.left=k.x+'%';b.style.width=k.width+'%';
      b.dataset.note=k.note;
      b.setAttribute('aria-label','Play '+noteName(k.note));
      const s=document.createElement('span');s.className='key-label';
      // Show the pitch on each white key, with keyboard shortcuts only
      // on the first (selected) octave to avoid ambiguous duplicate labels.
      if(!blacks.includes(k)) {
        const name=notes[k.note%12];
        s.textContent=k.i<12 ? (name==='C'?noteName(k.note):name) : noteName(k.note);
        if(k.i<12) s.title='Computer key '+name;
      }
      b.append(s);el.append(b);
    }
    $('rangeLabel').textContent='Octave '+octaveBase+' · '+noteName(first)+' – '+noteName(first+nkeys-1);
    updateKeyHighlights();
  }
  function changeOctave(shift){
    const next=Math.max(minComputerOctave,Math.min(maxComputerOctave,octaveBase+shift));
    if(next===octaveBase)return;
    allOff();octaveBase=next;renderKeyboard();saveSettings();track('keyboard_octave_change',{octave:octaveBase});
  }
  function bindTouch(){
    const el=$('keybed');
    const hitAt=(x,y)=>{const hit=document.elementFromPoint(x,y)?.closest('[data-note]');return hit&&el.contains(hit)?Number(hit.dataset.note):null;};
    const down=(pid,note)=>{
      const source='pointer:'+pid;
      const prev=pointerNotes.get(pid);
      if(prev===note)return;
      if(prev!==undefined)noteOff(prev,source);
      pointerNotes.delete(pid);
      if(note!==null){pointerNotes.set(pid,note);noteOn(note,105,source);}
    };
    el.addEventListener('pointerdown',e=>{
      if(e.button!==0&&e.pointerType==='mouse')return;
      const target=e.target.closest('[data-note]');if(!target)return;
      e.preventDefault();el.setPointerCapture?.(e.pointerId);down(e.pointerId,Number(target.dataset.note));
    });
    el.addEventListener('pointermove',e=>{if(!pointerNotes.has(e.pointerId))return; e.preventDefault();down(e.pointerId,hitAt(e.clientX,e.clientY));});
    const up=e=>{if(!pointerNotes.has(e.pointerId))return;const note=pointerNotes.get(e.pointerId);noteOff(note,'pointer:'+e.pointerId);pointerNotes.delete(e.pointerId);};
    el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  }
  function bindComputer(){
    document.addEventListener('keydown',e=>{
      if(e.target.closest('input,select,textarea,[contenteditable="true"]'))return;
      if(e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.code==='Space'){e.preventDefault();if(!e.repeat)sustain('space',true);return;}
      if(e.code==='BracketLeft'||e.code==='BracketRight'){e.preventDefault();if(!e.repeat)changeOctave(e.code==='BracketLeft'?-1:1);return;}
      const digit=/^(?:Digit|Numpad)([0-9])$/.exec(e.code);
      if(digit){
        const selected=Number(digit[1]);
        if(selected>=minComputerOctave&&selected<=maxComputerOctave){
          e.preventDefault();
          if(!e.repeat)changeOctave(selected-octaveBase);
        }
        return;
      }
      const semitone=naturalKeySemitones[e.code];
      if(semitone!==undefined){
        e.preventDefault();
        if(e.repeat||codeNotes.has(e.code))return;
        const note=12*(octaveBase+1)+semitone;
        codeNotes.set(e.code,note);
        noteOn(note,105,'computer:'+e.code);
      }
    });
    document.addEventListener('keyup',e=>{
      if(e.code==='Space'){sustain('space',false);return;}
      if(codeNotes.has(e.code)){noteOff(codeNotes.get(e.code),'computer:'+e.code);codeNotes.delete(e.code);}
    });
    window.addEventListener('blur',()=>{for(const [code,note] of codeNotes)noteOff(note,'computer:'+code);codeNotes.clear();sustain('space',false);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)allOff();});
  }
  function loadSettings(){
    try{const s=JSON.parse(localStorage.getItem('boxophone_settings_v1')||'{}');
      if(availableInstruments.has(s.instrument))setInstrument(s.instrument);
      if(Number.isInteger(s.octave)&&s.octave>=minComputerOctave&&s.octave<=maxComputerOctave)octaveBase=s.octave;
      if(Number.isInteger(s.low)&&s.low>=1&&s.low<=6)$('lowOctave').value=String(s.low);
      if(Number.isInteger(s.high)&&s.high>=1&&s.high<=6)$('highOctave').value=String(s.high);
      if(typeof s.split==='boolean')$('splitMidi').checked=s.split;
      if(Number.isInteger(s.volume)&&s.volume>=0&&s.volume<=100){$('volume').value=String(s.volume);engine.setVolume(s.volume/100);}
    }catch{}
    $('volumeValue').textContent=$('volume').value+'%';
  }
  function saveSettings(){
    try{localStorage.setItem('boxophone_settings_v1',JSON.stringify({instrument,octave:octaveBase,volume:Number($('volume').value),low:Number($('lowOctave').value),high:Number($('highOctave').value),split:$('splitMidi').checked}));}catch{}
  }
  function updateMidi(inputs,swapped){
    const a=swapped?inputs[1]:inputs[0], b=swapped?inputs[0]:inputs[1];
    $('lowDevice').textContent=a?.name||'Waiting for first controller';
    $('highDevice').textContent=b?.name||'Waiting for second controller';
    const count=inputs.length;
    $('midiStatus').className='midi-status '+(count?'good':'warn');
    $('midiStatus').textContent=count?count+(count===1?' controller connected.':' controllers connected.')+(count>2?' The first two have octave controls; others keep their original notes.':' Notes are ready.'): 'MIDI access granted. Connect a USB MIDI keyboard and refresh devices if needed.';
    $('connectMidiBtn').textContent='Refresh MIDI';
  }
  async function connectMidi(){
    try{
      await engine.unlock();
      if(midi?.access){midi.refresh();return;}
      midi=new window.BoxophoneMidiInputs({
        noteOn:(note,v,source)=>noteOn(note,v,source),noteOff:(note,source)=>noteOff(note,source),
        sustain:(v,source)=>sustain('midi:'+source,v),allOff:()=>allOff(),
        update:updateMidi,
        getOctave:role=>Number($(role+'Octave').value),
        getSplit:()=>$('splitMidi').checked
      });
      await midi.connect();
      track('midi_connected',{controller_count:Math.min(8,midi.inputs.length)});
    }catch(err){$('midiStatus').className='midi-status warn';$('midiStatus').textContent=err.message||'MIDI access denied or unavailable.';}
  }
  function setRecording(on){
    if(on){
      if(recorder.recording)return;
      allOff();recorder.start(instrument);
      $('recordBtn').classList.add('recording');$('recordButtonLabel').textContent='Stop';$('recordStatus').textContent='Recording notes…';$('exportBtn').disabled=true;
      clearInterval(timerInterval);timerInterval=setInterval(()=>{const s=Math.floor(recorder.elapsed/1000);$('recordTime').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');},150);
      track('record_start',{instrument});
    }else {
      if(!recorder.recording)return;
      allOff();recorder.stop();clearInterval(timerInterval);
      $('recordBtn').classList.remove('recording');$('recordButtonLabel').textContent='Record';$('recordStatus').textContent=recorder.hasNotes?'Performance captured':'No notes captured';$('exportBtn').disabled=!recorder.hasNotes;
      track('record_stop',{has_notes:recorder.hasNotes});
    }
  }
  function exportMidi(){
    try{
      const blob=recorder.exportMidi(),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='boxophone-'+new Date().toISOString().slice(0,10)+'.mid';
      a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
      $('recordStatus').textContent='MIDI exported';track('midi_export',{file_type:'mid',instrument});
    }catch(e){$('recordStatus').textContent=e.message;}
  }
  function playDemo(){
    if(demoPlaying){stopDemo();return;}
    stopDemo();demoPlaying=true;$('demoBtn').textContent='■ Stop demo';
    track('demo_play',{instrument});
    const melody=[60,60,67,67,69,69,67,65,65,64,64,62,62,60];
    melody.forEach((n,i)=>{
      const s='demo:'+i;
      demoTimers.push(setTimeout(()=>noteOn(n,88,s),i*350));
      demoTimers.push(setTimeout(()=>noteOff(n,s),i*350+275));
    });
    demoTimers.push(setTimeout(stopDemo,melody.length*350+40));
  }
  function practiceUI(){
    if(!practice){$('practiceProgress').textContent='0 / 0';$('practiceStreak').textContent='0';$('targetNote').textContent='♪';$('practiceFeedback').textContent='Start a song to see your first note.';return;}
    $('practiceProgress').textContent=practice.step+' / '+practice.seq.length;
    $('practiceStreak').textContent=practice.streak;
    $('targetNote').textContent=practice.step<practice.seq.length?noteName(practice.seq[practice.step]):'★';
  }
  function togglePractice(){
    if(practice){practice=null;$('practiceBtn').textContent='Start practice →';$('songSelect').disabled=false;practiceUI();return;}
    const song=$('songSelect').value;
    practice={song,seq:songs[song],step:0,streak:0};
    $('practiceBtn').textContent='End practice';$('songSelect').disabled=true;
    $('practiceFeedback').textContent='Find the highlighted note and play it.';
    practiceUI();track('practice_start',{song});
  }
  function onPracticeNote(note){
    if(!practice)return;
    if(note!==practice.seq[practice.step]){practice.streak=0;$('practiceFeedback').textContent='Not quite — try '+noteName(practice.seq[practice.step]);practiceUI();return;}
    practice.step++;practice.streak++;
    if(practice.step>=practice.seq.length){
      const song=practice.song;
      $('practiceFeedback').textContent='Bravo! You finished the melody.';practiceUI();
      $('practiceBtn').textContent='Play again →';$('songSelect').disabled=false;
      practice=null;track('practice_complete',{song});return;
    }
    $('practiceFeedback').textContent='Nice! Keep going.';practiceUI();
  }
  function startVisualization(){
    const el=$('visualizer');for(let i=0;i<27;i++)el.append(document.createElement('span'));
    const spans=[...el.children];
    function frame(){const level=engine.getLevel();const now=performance.now()/270;
      for(let i=0;i<spans.length;i++){
        const bell=Math.exp(-Math.pow((i-13)/10,2));
        spans[i].style.height=Math.round(5+(level*90*bell*(.50+.5*Math.abs(Math.sin(now+i*.5)))))+'px';
      }
      requestAnimationFrame(frame);
    }
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)requestAnimationFrame(frame);
  }
  function init(){
    loadSettings();renderKeyboard();bindTouch();bindComputer();startVisualization();
    let compactLayout=window.matchMedia('(max-width:680px)').matches;
    window.addEventListener('resize',()=>{const next=window.matchMedia('(max-width:680px)').matches;if(next!==compactLayout){compactLayout=next;allOff();renderKeyboard();}});
    document.querySelectorAll('.instrument:not(:disabled)').forEach(b=>b.addEventListener('click',()=>{setInstrument(b.dataset.instrument);saveSettings();}));
    $('volume').addEventListener('input',e=>{engine.setVolume(e.target.value/100);$('volumeValue').textContent=e.target.value+'%';saveSettings();});
    $('octaveDown').addEventListener('click',()=>{changeOctave(-1);saveSettings();});
    $('octaveUp').addEventListener('click',()=>{changeOctave(1);saveSettings();});
    $('sustainBtn').addEventListener('click',()=>sustain('onscreen',!sustainedBy.has('onscreen')));
    $('panicBtn').addEventListener('click',allOff);
    $('demoBtn').addEventListener('click',playDemo);
    $('connectMidiBtn').addEventListener('click',connectMidi);
    $('swapMidiBtn').addEventListener('click',()=>midi?.swap());
    for(const id of ['lowOctave','highOctave','splitMidi'])$(id).addEventListener('change',()=>{midi?.releaseHeld();allOff();saveSettings();});
    $('recordBtn').addEventListener('click',()=>setRecording(!recorder.recording));
    $('exportBtn').addEventListener('click',exportMidi);
    $('practiceBtn').addEventListener('click',togglePractice);
    $('songSelect').addEventListener('change',()=>{if(practice){practice=null;togglePractice();}});
    $('helpBtn').addEventListener('click',()=>{const open=$('helpPanel').hidden;$('helpPanel').hidden=!open;$('helpBtn').setAttribute('aria-expanded',String(open));});
    window.addEventListener('pagehide',()=>{allOff();if(recorder.recording)recorder.stop();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
