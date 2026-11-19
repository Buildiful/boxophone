/* Local note-event recording and Standard MIDI File export. No audio is recorded. */
(() => {
  'use strict';
  const programs={piano:0,violin:40,sax:65};
  class MidiRecorder {
    constructor(){this.recording=false;this.events=[];this.started=0;this.active=new Map();this.instrument='piano';}
    start(instrument){this.events=[];this.active.clear();this.started=performance.now();this.recording=true;this.instrument=instrument;this.event('program',programs[instrument]);}
    event(type,a,b=0){if(!this.recording)return;this.events.push({ms:Math.max(0,performance.now()-this.started),type,a,b});}
    noteOn(note,v){if(!this.recording)return; if(this.active.has(note))this.noteOff(note);this.event('on',note,v);this.active.set(note,true);}
    noteOff(note){if(!this.recording||!this.active.has(note))return;this.event('off',note,64);this.active.delete(note);}
    setInstrument(instrument){this.instrument=instrument;this.event('program',programs[instrument]);}
    sustain(enabled){this.event('sustain',64,enabled?127:0);}
    stop(){if(!this.recording)return;for(const n of [...this.active.keys()])this.noteOff(n);this.recording=false;}
    get elapsed(){return this.recording?performance.now()-this.started:(this.events.at(-1)?.ms||0);}
    get hasNotes(){return this.events.some(e=>e.type==='on');}
    exportMidi(){
      if(this.recording)this.stop();
      if(!this.hasNotes)throw new Error('Record a few notes first.');
      const bytes=[];
      const push=(...args)=>bytes.push(...args);
      const ascii=s=>[...s].map(c=>c.charCodeAt(0));
      const vlq=n=>{n=Math.max(0,Math.round(n));const a=[n&127];while((n>>=7)>0)a.unshift((n&127)|128);return a;};
      const evs=[{ms:0,order:0,data:[0xff,0x03,0x09,...ascii('Boxophone')]},{ms:0,order:0,data:[0xff,0x51,0x03,0x07,0xa1,0x20]}];
      for(const e of this.events){let data;if(e.type==='on')data=[0x90,e.a,e.b];else if(e.type==='off')data=[0x80,e.a,e.b];else if(e.type==='program')data=[0xc0,e.a];else if(e.type==='sustain')data=[0xb0,64,e.b];else continue;evs.push({ms:e.ms,order:e.type==='off'?1:e.type==='on'?3:2,data});}
      evs.sort((a,b)=>a.ms-b.ms||a.order-b.order);
      let last=0;
      for(const e of evs){const tick=Math.round(e.ms*.96);push(...vlq(Math.max(0,tick-last)),...e.data);last=tick;}
      push(0,0xff,0x2f,0);
      const trk=bytes;const size=trk.length;
      const header=[...ascii('MThd'),0,0,0,6,0,0,0,1,1,224];
      const full=[...header,...ascii('MTrk'),(size>>>24)&255,(size>>>16)&255,(size>>>8)&255,size&255,...trk];
      return new Blob([new Uint8Array(full)],{type:'audio/midi'});
    }
  }
  window.BoxophoneMidiRecorder=MidiRecorder;
})();
