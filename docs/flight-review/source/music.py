import numpy as np, wave, subprocess
from pathlib import Path
sr=32000
for idx,(name,bpm) in enumerate([('orbital',132),('reactor',148),('vector',118)]):
    beat=60/bpm; dur=beat*32; n=int(sr*dur); mix=np.zeros((n,2),np.float64); rng=np.random.default_rng(46+idx)
    def add(at,sound,amp=1,pan=0):
        start=int(at*sr); count=min(len(sound),n-start)
        if count<=0:return
        mix[start:start+count,0]+=sound[:count]*amp*(1-pan*.55)
        mix[start:start+count,1]+=sound[:count]*amp*(1+pan*.55)
    def tone(freq,length,kind='bass'):
        t=np.arange(int(sr*length))/sr
        if kind=='bass': s=np.sin(2*np.pi*freq*t)+.25*np.sin(4*np.pi*freq*t)+(.2 if idx==1 else .08)*np.sin(6*np.pi*freq*t); env=(1-np.exp(-t*150))*np.exp(-t*7)
        elif kind=='pluck': s=np.sin(2*np.pi*freq*t)+.17*np.sin(2*np.pi*freq*2.003*t);env=(1-np.exp(-t*200))*np.exp(-t*9)
        else:s=np.sin(2*np.pi*freq*t)+.25*np.sin(2*np.pi*freq*1.004*t);env=np.sin(np.pi*np.minimum(1,t/length))**2
        return s*env
    roots=[41.203,36.708,32.703,38.891] # E minor / D / C / Eb tension
    for bar in range(8):
        root=roots[(bar//2)%4]; base=bar*4*beat
        # Chord bed, with restrained upper harmonics.
        for semi in [0,7,14]:add(base,tone(root*2*2**(semi/12),4*beat,'pad'),.037,(-.5 if semi==7 else .5))
        for step in range(16):
            at=base+step*beat/4
            # Bass rhythm differs by direction.
            active=step in ([0,3,6,8,10,14] if idx==0 else [0,2,4,6,8,11,12,14] if idx==1 else [0,3,7,8,11,14])
            if active:add(at,tone(root*(2 if step==14 else 1),beat*.7),.15)
            if step%2==0:
                t=np.arange(int(sr*.06))/sr;noise=rng.normal(0,1,len(t));noise=np.concatenate([[0],np.diff(noise)])*.4;add(at,noise*np.exp(-t*90),.035,.4 if step%4 else -.4)
            if step in [0,8] or (idx==1 and step==12) or (idx==2 and step==11):
                t=np.arange(int(sr*.3))/sr;phase=2*np.pi*(47*t+58*(1-np.exp(-t*30))/30);kick=np.sin(phase)*np.exp(-t*17);add(at,kick,.32)
            if step in [4,12]:
                t=np.arange(int(sr*.18))/sr;sn=rng.normal(0,1,len(t))*.38+np.sin(2*np.pi*180*t)*.3;add(at,sn*np.exp(-t*25),.16)
            if step in ([0,3,7,10,14] if idx!=2 else [2,6,9,14]):
                semi=[0,7,12,10,14][(step+bar)%5];add(at,tone(root*8*2**(semi/12),beat*.8,'pluck'),.06,(-.65 if step%2 else .65))
    # Short stereo delay and gentle saturation; output is an original sketch.
    delay=int(beat*.75*sr);mix[delay:,0]+=mix[:-delay,1]*.12;mix[delay:,1]+=mix[:-delay,0]*.12
    mix=np.tanh(mix*1.5); mix*=.86/max(.86,np.max(np.abs(mix)));fade=int(.025*sr);mix[:fade]*=np.linspace(0,1,fade)[:,None];mix[-fade:]*=np.linspace(1,0,fade)[:,None]
    path=Path('work/flight-review')/(name+'.wav')
    with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(sr);w.writeframes((mix*32767).astype('<i2').tobytes())
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(path),'-c:a','libmp3lame','-b:a','128k',f'docs/flight-review/assets/{name}.mp3'],check=True)
    print(name,round(dur,2),'seconds',round(float(np.max(np.abs(mix))),3),'peak')
