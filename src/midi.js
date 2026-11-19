/* Web MIDI input mapping. Each device's original note is retained for reliable note-off.
 * The first two connected devices may use independently adjustable octave
 * offsets. Any additional devices keep their original MIDI note pitches.
 * Web MIDI remains permission-gated and works only in supported browsers.
 */
(() => {
  'use strict';
  class MidiInputs {
    constructor(callbacks){this.cb=callbacks;this.access=null;this.inputs=[];this.swapped=false;this.held=new Map();this.onMidi=this.onMidi.bind(this);}
    async connect(){
      if(!navigator.requestMIDIAccess)throw Error('This browser does not offer Web MIDI. Use Chrome or Edge on desktop.');
      if(!window.isSecureContext)throw Error('MIDI requires HTTPS or localhost. Open the published GitHub Pages URL.');
      this.access=await navigator.requestMIDIAccess({sysex:false});
      this.access.onstatechange=()=>this.refresh();
      this.refresh();
    }
    refresh(){
      if(!this.access)return;
      const next=[...this.access.inputs.values()].filter(p=>p.state==='connected');
      const removed=new Set(this.inputs.filter(x=>!next.some(n=>n.id===x.id)).map(x=>x.id));
      for(const [key,note] of [...this.held])if([...removed].some(id=>key.startsWith(id+'|'))){this.cb.noteOff(note,key);this.held.delete(key);}
      for(const id of removed)this.cb.sustain(false,id);
      this.inputs.forEach(p=>p.onmidimessage=null);
      this.inputs=next;
      this.inputs.forEach(p=>p.onmidimessage=e=>this.onMidi(p,e));
      this.cb.update(this.inputs,this.swapped);
    }
    swap(){this.releaseHeld();this.swapped=!this.swapped;this.cb.update(this.inputs,this.swapped);}
    releaseHeld(){for(const [key,note] of this.held)this.cb.noteOff(note,key);this.held.clear();}
    isNano(port){return /nanokey2/i.test(port.name||'');}
    role(port){const idx=this.inputs.findIndex(p=>p.id===port.id);if(idx<0||idx>1)return 'other';return (idx===0) !== this.swapped?'low':'high';}
    map(port,note){const role=this.role(port);const split=this.cb.getSplit();
      if(!split||role==='other')return note;
      const octave=this.cb.getOctave(role);
      return note+(octave-3)*12;
    }
    onMidi(port,event){const data=event.data||[];if(data.length<2)return;
      const status=data[0]&0xf0,channel=data[0]&0x0f, key=port.id+'|'+channel+'|'+data[1];
      if(status===0x90&&data[2]>0){
        if(this.held.has(key))this.cb.noteOff(this.held.get(key),key);
        const mapped=this.map(port,data[1]);if(mapped<21||mapped>127)return;
        this.held.set(key,mapped);this.cb.noteOn(mapped,data[2],key);
      }else if(status===0x80||(status===0x90&&data[2]===0)){
        if(!this.held.has(key))return;this.cb.noteOff(this.held.get(key),key);this.held.delete(key);
      }else if(status===0xb0){
        if(data[1]===64)this.cb.sustain(data[2]>=64,port.id);
        if(data[1]===123||data[1]===120){this.releaseHeld();this.cb.allOff();}
      }
    }
  }
  window.BoxophoneMidiInputs=MidiInputs;
})();
