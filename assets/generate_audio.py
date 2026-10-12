"""Original algorithmic instrumental studies, generated for SURCO; not YouTube audio."""
import numpy as np, wave, subprocess, os
SR=22050
outdir=os.path.dirname(__file__)
def track(name,seed,bpm,chords):
 rng=np.random.default_rng(seed);beat=60/bpm;length=beat*48+2;N=int(length*SR);mix=np.zeros((N,2),np.float32)
 def add(signal,start,pan=0,gain=1):
  k=int(start*SR);n=min(len(signal),N-k)
  if n<=0:return
  mix[k:k+n,0]+=signal[:n]*gain*np.sqrt((1-pan)/2);mix[k:k+n,1]+=signal[:n]*gain*np.sqrt((1+pan)/2)
 def note(midi,duration,voice='rhodes'):
  f=440*2**((midi-69)/12);t=np.arange(int(SR*duration))/SR
  if voice=='rhodes':s=(np.sin(2*np.pi*f*t+1.7*np.exp(-t*4)*np.sin(2*np.pi*2*f*t))+.18*np.sin(2*np.pi*f*3*t))*np.exp(-t*1.1)
  elif voice=='bass':s=(np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t))*np.exp(-t*2.4)
  else:s=(np.sin(2*np.pi*f*t)+.12*np.sin(2*np.pi*2*f*t))*np.exp(-t*1.7)
  return s*np.minimum(t/.012,1)*np.minimum((duration-t)/.18,1)
 for bar in range(12):
  chord=chords[bar%len(chords)];time=bar*4*beat
  for off,g in [(0,.095),(1.55,.060),(2.8,.070)]:
   for j,midi in enumerate(chord):add(note(midi,2.4*beat),time+(off+j*.026)*beat,pan=(j-1.5)*.24,gain=g)
  for off,midi in [(0,chord[0]-24),(1.75,chord[0]-12),(2.5,chord[0]-24),(3.5,chord[0]-17)]:add(note(midi,.9*beat,'bass'),time+off*beat,gain=.21)
  if bar>1:
   for off in [.5,1.25,2.5,3.25]:
    midi=chord[int(rng.integers(len(chord)))]+12
    add(note(midi,.75*beat,'bell'),time+off*beat,pan=float(rng.uniform(-.5,.5)),gain=.055)
  for off in [0,2,3.5]:
   t=np.arange(int(.24*SR))/SR;phase=2*np.pi*(45*t+5*(1-np.exp(-t*35)));s=np.sin(phase)*np.exp(-t*20)
   add(s,time+off*beat,gain=.24)
  for off in [1,3]:
   t=np.arange(int(.20*SR))/SR;noise=rng.standard_normal(t.size);noise=np.convolve(noise,[1,-.7],mode='same');s=(noise*.32+np.sin(2*np.pi*170*t)*.2)*np.exp(-t*30)
   add(s,time+off*beat,pan=.12,gain=.12)
  for j in range(8):
   t=np.arange(int(.09*SR))/SR;noise=rng.standard_normal(t.size);noise=np.convolve(noise,[1,-1],mode='same')*np.exp(-t*70)
   add(noise,time+(j*.5+(.04 if j%2 else 0))*beat,pan=-.25,gain=.016 if j%2 else .023)
 # small stereo room; no copyrighted samples
 dry=mix.copy()
 for delay,gain in [(.12,.15),(.24,.10),(.36,.07)]:
  d=int(delay*SR);mix[d:]+=dry[:-d,::-1]*gain
 mix=np.tanh(mix*1.35);mix/=max(float(np.abs(mix).max()),1)*1.08
 fade=int(1.7*SR);mix[-fade:]*=np.linspace(1,0,fade)[:,None];mix[:int(.08*SR)]*=np.linspace(0,1,int(.08*SR))[:,None]
 wav=os.path.join(outdir,name+'.wav')
 with wave.open(wav,'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-v','error','-y','-i',wav,'-codec:a','libmp3lame','-b:a','96k',os.path.join(outdir,name+'.mp3')],check=True)
 os.remove(wav)
track('luz-de-tarde',4,84,[[57,60,64,67],[53,57,60,64],[55,59,62,65],[52,56,59,62]])
track('hora-azul',18,76,[[55,58,62,65],[51,55,58,62],[53,57,60,63],[50,54,57,60]])
track('orbita',27,96,[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,69]])
