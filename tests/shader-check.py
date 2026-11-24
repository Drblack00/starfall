"""Compile shipping shaders with surfaceless Mesa GLES, not browser/iPhone QA."""
import ctypes as C,re,json,pathlib
E=C.CDLL('libEGL.so.1');E.eglGetProcAddress.restype=C.c_void_p
def fn(name,restype,args):return C.CFUNCTYPE(restype,*args)(E.eglGetProcAddress(name.encode()))
I=C.c_int;P=C.c_void_p
get=fn('eglGetPlatformDisplayEXT',P,[C.c_uint,P,C.POINTER(I)]);d=get(0x31DD,None,None)
init=fn('eglInitialize',C.c_uint,[P,C.POINTER(I),C.POINTER(I)]);a=I();b=I();assert init(d,C.byref(a),C.byref(b))
assert fn('eglBindAPI',C.c_uint,[C.c_uint])(0x30A0)
attrs=(I*9)(0x3033,1,0x3040,0x40,0x3024,8,0x3025,0,0x3038);cfg=P();n=I()
assert fn('eglChooseConfig',C.c_uint,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(d,attrs,C.byref(cfg),1,C.byref(n)) and n.value
ctx=fn('eglCreateContext',P,[P,P,P,C.POINTER(I)])(d,cfg,None,(I*3)(0x3098,3,0x3038));assert ctx
surf=fn('eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(d,cfg,(I*5)(0x3057,1,0x3056,1,0x3038));assert surf
assert fn('eglMakeCurrent',C.c_uint,[P,P,P,P])(d,surf,surf,ctx)
print('GLES renderer:',fn('glGetString',C.c_char_p,[C.c_uint])(0x1F01).decode())
src=pathlib.Path('index.html').read_text();sources={}
for name in ['vertex','fragment','effectVertex','effectFragment','toonVertex','toonFragment']:
 m=re.search(r'\b'+name+r'\s*=\s*`([\s\S]*?)`',src);assert m,name;sources[name]=m[1]
create=fn('glCreateShader',C.c_uint,[C.c_uint]);shaderSource=fn('glShaderSource',None,[C.c_uint,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compile=fn('glCompileShader',None,[C.c_uint]);getStatus=fn('glGetShaderiv',None,[C.c_uint,C.c_uint,C.POINTER(I)]);log=fn('glGetShaderInfoLog',None,[C.c_uint,I,C.POINTER(I),C.c_char_p])
for cinematic in [False,True]:
 for vertex,fragment in [('vertex','fragment'),('effectVertex','effectFragment'),('toonVertex','toonFragment')]:
  shaders=[]
  for name,kind in [(vertex,0x8B31),(fragment,0x8B30)]:
   text=sources[name]
   if cinematic:text=text.replace('#version 300 es','#version 300 es\n#define SF_CINEMATIC')
   sh=create(kind);data=C.c_char_p(text.encode());shaderSource(sh,1,C.byref(data),None);compile(sh);ok=I();getStatus(sh,0x8B81,C.byref(ok));buf=C.create_string_buffer(8192);log(sh,8192,None,buf);assert ok.value,(name,buf.value.decode());shaders.append(sh)
  p=fn('glCreateProgram',C.c_uint,[])()
  for sh in shaders:fn('glAttachShader',None,[C.c_uint,C.c_uint])(p,sh)
  fn('glLinkProgram',None,[C.c_uint])(p);ok=I();fn('glGetProgramiv',None,[C.c_uint,C.c_uint,C.POINTER(I)])(p,0x8B82,C.byref(ok));buf=C.create_string_buffer(8192);fn('glGetProgramInfoLog',None,[C.c_uint,I,C.POINTER(I),C.c_char_p])(p,8192,None,buf);assert ok.value,buf.value.decode()
  print('PASS',vertex,fragment,'HD' if cinematic else 'Smooth')
