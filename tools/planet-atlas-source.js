// Offline deterministic atlas generator. Used by tests/planet-atlas.cjs.
      var PLANET_ATLAS = null;
      function planetAtlas() {
        if (PLANET_ATLAS) return PLANET_ATLAS;
        var cv=document.createElement("canvas");cv.width=512;cv.height=256;
        var c=cv.getContext("2d"),im=c.createImageData(512,256),d=im.data;
        function hash(x,y,z){var h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(z,2147483647);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
        function noise(x,y,z){var ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz;fx*=fx*(3-2*fx);fy*=fy*(3-2*fy);fz*=fz*(3-2*fz);var sum=0;for(var k=0;k<2;k++)for(var j=0;j<2;j++)for(var i=0;i<2;i++)sum+=hash(ix+i,iy+j,iz+k)*(i?fx:1-fx)*(j?fy:1-fy)*(k?fz:1-fz);return sum;}
        function fbm(x,y,z){return noise(x,y,z)*.54+noise(x*2.03,y*2.03,z*2.03)*.27+noise(x*4.09,y*4.09,z*4.09)*.13+noise(x*8.17,y*8.17,z*8.17)*.06;}
        for(var y=0;y<256;y++){var lat=(y/255-.5)*Math.PI,cy=Math.cos(lat),sy=Math.sin(lat);for(var x=0;x<512;x++){var lon=x/511*Math.PI*2,nx=Math.sin(lon)*cy,nz=Math.cos(lon)*cy,i=(y*512+x)*4;
          d[i]=fbm(nx*3.2+12,sy*3.2+7,nz*3.2+3)*255;
          d[i+1]=fbm(nx*5.5+37,sy*7+4,nz*5.5+17)*255;
          d[i+2]=noise(nx*45+5,sy*45+2,nz*45+9)*255;d[i+3]=255;
        }}c.putImageData(im,0,0);return PLANET_ATLAS=cv;
      }
