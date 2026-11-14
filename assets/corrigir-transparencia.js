(()=>{
"use strict";
const cache=new Map();
function clean(img){
 const original=img.getAttribute('src');
 if(!original||img.dataset.transparentized)return;
 if(cache.has(original)){img.dataset.transparentized='1';if(cache.get(original))img.src=cache.get(original);return;}
 if(!img.naturalWidth||!img.naturalHeight)return;
 const w=img.naturalWidth,h=img.naturalHeight;if(w*h>2500000)return;
 const cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;
 let ctx,pixels;try{ctx=cvs.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);pixels=ctx.getImageData(0,0,w,h);}catch{return;}
 const data=pixels.data,white=i=>{const p=i*4;return data[p+3]>225&&data[p]>232&&data[p+1]>232&&data[p+2]>232;},black=i=>{const p=i*4;return data[p+3]>225&&data[p]<24&&data[p+1]<24&&data[p+2]<24;};
 const corners=[0,w-1,(h-1)*w,h*w-1];
 let pick=corners.filter(white).length>=2?white:corners.filter(black).length>=2?black:null;
 if(!pick){cache.set(original,null);img.dataset.transparentized='1';return;}
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let first=0,last=0;
 const push=i=>{if(!seen[i]&&pick(i)){seen[i]=1;queue[last++]=i;}};
 for(let j=0;j<w;j++){push(j);push((h-1)*w+j);}
 for(let j=0;j<h;j++){push(j*w);push(j*w+w-1);}
 while(first<last){const i=queue[first++],x=i%w,y=(i/w)|0;
 if(x>0)push(i-1);if(x<w-1)push(i+1);if(y>0)push(i-w);if(y<h-1)push(i+w);}
 if(last===0){cache.set(original,null);img.dataset.transparentized='1';return;}
 for(let i=0;i<last;i++)data[queue[i]*4+3]=0;
 ctx.putImageData(pixels,0,0);
 const png=cvs.toDataURL('image/png');cache.set(original,png);img.dataset.transparentized='1';img.src=png;
}
document.querySelectorAll('img[src*="/insignias/"]').forEach(img=>{
 if(img.complete&&img.naturalWidth)clean(img);
 else img.addEventListener('load',()=>clean(img),{once:true});
});
})();