/* FAAAB — microinterações institucionais opcionais, sem rastreamento. */
(()=>{
 "use strict";
 const reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
 const nav=document.querySelector(".nav");
 const updateNav=()=>nav?.classList.toggle("is-scrolled",window.scrollY>25);
 updateNav();
 window.addEventListener("scroll",updateNav,{passive:true});
 if(reduce.matches||!("IntersectionObserver" in window))return;
 const targets=[...document.querySelectorAll(".section-heading,.force-card,.mini-story,.study-card,.news-aside,.stat,.entry")];
 if(!targets.length)return;
 document.documentElement.classList.add("motion-ready");
 targets.forEach((item,index)=>{
  item.classList.add("reveal");
  item.style.transitionDelay=(index%3)*65+"ms";
 });
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting){entry.target.classList.add("is-visible");observer.unobserve(entry.target)}
  }
 },{threshold:0.07,rootMargin:"0px 0px 40px 0px"});
 targets.forEach(item=>observer.observe(item));
})();
