/* Boxophone — browser instrument engine. No audio data leaves the browser.
 * The timbres are original procedural Web Audio synthesis, not sampled recordings
 * or a replacement for the Raspberry Pi edition's FluidR3 SoundFont.
 */
(() => {
  'use strict';
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.compressor = null;
      this.analyser = null;
      this.voices = new Map();
      this.instrument = 'piano';
      this.volume = 0.78;
      this.waveforms = {};
      this.noiseBuffer = null;
      this.maxVoices = 28;
    }
    async unlock() {
      if (!this.ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) throw new Error('Web Audio is unavailable in this browser.');
        const ctx = this.ctx = new Ctor({ latencyHint: 'interactive' });
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -13;
        this.compressor.knee.value = 22;
        this.compressor.ratio.value = 3;
        this.compressor.attack.value = 0.007;
        this.compressor.release.value = 0.2;
        this.master = ctx.createGain();
        this.master.gain.value = this.volume * 0.76;
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.65;
        this.master.connect(this.compressor);
        this.compressor.connect(this.analyser);
        this.analyser.connect(ctx.destination);
        this.waveforms.piano = this.makeWave([1, .60, .23, .145, .11, .085, .060, .037, .028, .02]);
        this.waveforms.violin = this.makeWave([1, .78, .57, .48, .37, .31, .25, .19, .14, .11, .09, .07]);
        this.waveforms.sax = this.makeWave([1, .36, .66, .25, .48, .22, .31, .14, .16, .09, .06]);
        const len = Math.floor(ctx.sampleRate * 0.11);
        this.noiseBuffer = ctx.createBuffer(1,len,ctx.sampleRate);
        let prev=0; const data=this.noiseBuffer.getChannelData(0);
        for(let i=0;i<len;i++){ const white=Math.random()*2-1; prev=(prev+white*.35)/1.35; data[i]=prev; }
      }
      if (this.ctx.state !== 'running') await this.ctx.resume();
    }
    makeWave(harmonics) {
      const real = new Float32Array(harmonics.length+1);
      const imag = new Float32Array(harmonics.length+1);
      harmonics.forEach((v,i) => { imag[i+1]=v; });
      return this.ctx.createPeriodicWave(real,imag);
    }
    noteOn(note, velocity=100) {
      if (!this.ctx || this.ctx.state!=='running' || note<21 || note>127) return false;
      if (this.voices.has(note)) this.noteOff(note,0.035);
      if (this.voices.size>=this.maxVoices) this.noteOff(this.voices.keys().next().value,0.04);
      const ctx=this.ctx, t=ctx.currentTime, hz=440*Math.pow(2,(note-69)/12);
      const instrument=this.instrument, strength=Math.max(.06,Math.min(1,velocity/127));
      const gain=ctx.createGain();
      gain.gain.setValueAtTime(.0001,t);
      gain.connect(this.master);
      const filter=ctx.createBiquadFilter();
      filter.type='lowpass';
      filter.frequency.value = instrument==='piano' ? Math.min(11000,2700+strength*7500) : instrument==='violin' ? Math.min(9200,2200+strength*5200) : Math.min(6000,1300+strength*3200);
      filter.Q.value = instrument==='sax' ? .83 : .42;
      filter.connect(gain);
      const oscillators=[];
      const makeOsc=(frequency,periodic,detune=0,level=1) => {
        const osc=ctx.createOscillator();osc.setPeriodicWave(periodic);osc.frequency.value=frequency;osc.detune.value=detune;
        const g=ctx.createGain();g.gain.value=level;osc.connect(g);g.connect(filter);osc.start(t);
        oscillators.push(osc);return osc;
      };
      let vibrato=null;
      if(instrument==='piano') {
        makeOsc(hz,this.waveforms.piano,-1.5,.72);
        makeOsc(hz,this.waveforms.piano,1.2,.42);
        const a=(.19+.16*strength)*Math.pow(440/hz,.07);
        gain.gain.linearRampToValueAtTime(a,t+.007);
        gain.gain.exponentialRampToValueAtTime(Math.max(.0002,a*.42),t+.48);
        gain.gain.exponentialRampToValueAtTime(.0001,t+9.1);
        // Short damped hammer/breath transient at the start of each piano key.
        if(this.noiseBuffer){const n=ctx.createBufferSource(),ng=ctx.createGain(),nf=ctx.createBiquadFilter();n.buffer=this.noiseBuffer;nf.type='bandpass';nf.frequency.value=Math.min(4500,hz*5);nf.Q.value=.8;ng.gain.setValueAtTime(.0001,t);ng.gain.linearRampToValueAtTime(.016*strength,t+.002);ng.gain.exponentialRampToValueAtTime(.0001,t+.033);n.connect(nf);nf.connect(ng);ng.connect(this.master);n.start(t);n.stop(t+.045);}
      } else {
        const wave=this.waveforms[instrument];
        const a=makeOsc(hz,wave,-1.5,.63);
        const b=makeOsc(hz,wave,2,.43);
        const v=ctx.createOscillator();v.frequency.value=instrument==='violin'?5.15:5.0;
        const vg=ctx.createGain();vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(instrument==='violin'?7:4,t+.32);
        v.connect(vg);vg.connect(a.frequency);vg.connect(b.frequency);v.start(t);oscillators.push(v);vibrato=vg;
        if(instrument==='sax') {
          const mid=ctx.createWaveShaper();const curve=new Float32Array(1024);for(let i=0;i<1024;i++){const x=i/511.5-1;curve[i]=Math.tanh(x*1.85)/Math.tanh(1.85);}mid.curve=curve;
          // Add a soft reed edge before the output filter.
          const reed=ctx.createOscillator(),rg=ctx.createGain();reed.type='triangle';reed.frequency.value=hz*2;rg.gain.value=.075*strength;reed.connect(rg);rg.connect(filter);reed.start(t);oscillators.push(reed);
        }
        const peak=(instrument==='violin'?.31:.34)*(.38+strength*.74);
        gain.gain.linearRampToValueAtTime(peak,t+(instrument==='violin'?.085:.038));
        gain.gain.setTargetAtTime(peak*.77,t+(instrument==='violin'?.085:.038),.24);
      }
      const voice={note,filter,gain,oscillators,ended:false,release:(duration=.19)=>{
        if(voice.ended)return;voice.ended=true;
        const at=ctx.currentTime;
        gain.gain.cancelScheduledValues(at);
        gain.gain.setValueAtTime(Math.max(.0001,gain.gain.value),at);
        gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
        oscillators.forEach(o=>{try{o.stop(at+duration+.04)}catch{}});
        setTimeout(()=>{try{filter.disconnect();gain.disconnect();}catch{}},Math.ceil((duration+.12)*1000));
      }};
      this.voices.set(note,voice);
      if(instrument==='piano') {
        setTimeout(()=>{if(this.voices.get(note)===voice){voice.release(.04);this.voices.delete(note);}},9300);
      }
      return true;
    }
    noteOff(note,duration) {
      const voice=this.voices.get(note);if(!voice)return;
      voice.release(duration??(this.instrument==='piano'?.27:this.instrument==='violin'?.22:.18));
      this.voices.delete(note);
    }
    allNotesOff() { for(const note of [...this.voices.keys()]) this.noteOff(note,.055); }
    setInstrument(name){if(!['piano','violin','sax'].includes(name))return;this.allNotesOff();this.instrument=name;}
    setVolume(v){this.volume=Math.max(0,Math.min(1,v));if(this.master)this.master.gain.setTargetAtTime(this.volume*.76,this.ctx.currentTime,.035);}
    getLevel(){if(!this.analyser||!this.voices.size)return 0;const a=new Uint8Array(this.analyser.frequencyBinCount);this.analyser.getByteFrequencyData(a);return a.reduce((v,x)=>v+x,0)/a.length/255;}
  }
  window.BoxophoneAudio=AudioEngine;
})();
