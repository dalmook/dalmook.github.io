from pathlib import Path
import numpy as np, wave, subprocess
p=Path(__file__).resolve().parents[1]/'public/audio';p.mkdir(exist_ok=True)
sr=22050
# Original eight-bar themes, repeated with a melodic variation, authored for this game.
themes=[('forest',96,[[60,64,67,71],[57,60,64,69],[53,57,60,64],[55,59,62,67]],[76,79,81,79,76,74,72,74]),('moon',84,[[57,60,64,71],[53,57,60,67],[60,64,67,74],[55,59,62,69]],[76,71,72,76,79,76,74,71]),('castle',104,[[62,66,69,73],[59,62,66,69],[55,59,62,66],[57,61,64,69]],[78,81,85,81,78,76,74,78])]
for name,bpm,chords,melody in themes:
 beat=60/bpm;duration=64*beat;N=int(sr*duration);out=np.zeros((N,2))
 def note(midi,start,dur,amp,kind,pan=0):
  t=np.arange(int(sr*dur))/sr;f=440*2**((midi-69)/12)
  if kind=='bell':
   y=np.sin(2*np.pi*f*t)*np.exp(-t*2.8)+.28*np.sin(2*np.pi*f*2*t)*np.exp(-t*5)+.10*np.sin(2*np.pi*f*3*t)*np.exp(-t*8)
   env=np.minimum(t/.008,1)*np.minimum((dur-t)/.08,1)
  elif kind=='pad':
   y=(np.sin(2*np.pi*f*t)+.25*np.sin(2*np.pi*f*1.002*t)+.14*np.sin(2*np.pi*f*2*t));env=np.sin(np.pi*t/dur)**2
  else:y=np.sin(2*np.pi*f*t);env=np.minimum(t/.02,1)*np.exp(-t*2)*np.minimum((dur-t)/.08,1)
  y=y*env*amp;start=int(start*sr)
  for delay,gain in [(0,1),(.21,.20),(.43,.10)]:
   idx=(np.arange(len(y))+start+int(delay*sr))%N
   out[idx,0]+=y*gain*(.7-pan*.3);out[idx,1]+=y*gain*(.7+pan*.3)
 for bar in range(16):
  chord=chords[bar%4];at=bar*4*beat
  for n in chord:note(n-12,at,4*beat,.035,'pad')
  note(chord[0]-24,at,1.8*beat,.11,'bass');note(chord[0]-24,at+2*beat,1.5*beat,.075,'bass')
  pattern=[0,1,2,3,2,1,3,2]
  for k,ix in enumerate(pattern):note(chord[ix]+12,at+k*.5*beat,1.5*beat,.075,'bell',(-1 if k%2 else 1)*.6)
  for k in range(2):note(melody[(bar*2+k)%8]+(0 if bar<8 else -12),at+k*2*beat,2.3*beat,.10,'bell',.2)
 peak=np.max(abs(out));out=np.tanh(out/max(peak, .6)*.72)*.72
 wav=p/(name+'.wav')
 with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((out*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-c:a','libvorbis','-q:a','1',str(p/(name+'.ogg'))],check=True);wav.unlink()
 print(name,round(duration,1),(p/(name+'.ogg')).stat().st_size)
